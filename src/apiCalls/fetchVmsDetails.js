const logger = require('../logger'); // Logger setup
const Gateway_Schema = require('../data/schemas/Gateway_Schema.js'); // MongoDB Model for gateways
const OrgsVdcNetwork_Schema = require('../data/schemas/OrgVdcNetwork_Schema'); // MongoDB Model
const config = require('../config');
const axios = require('axios');

let networkToEdgeGatewayArray = []; // Network-to-edgeGateway mappings
let gatewayDetails = []; // Gateways with firewall and NAT rules

// Load the latest gateways with firewall and NAT rules
async function loadLatestGateways() {
  try {
    logger.info('Fetching the latest Gateway records with firewall and NAT rules...');
    const latestGatewayRecord = await Gateway_Schema.findOne()
      .sort({ createdAt: -1 })
      .exec();

    if (latestGatewayRecord && latestGatewayRecord.data) {
      gatewayDetails = latestGatewayRecord.data.map(gateway => ({
        edgeGatewayName: gateway.name,
        firewallRules: gateway.firewallRules || [],
        natRules: gateway.natRules || []
      }));
      logger.info(`Loaded ${gatewayDetails.length} gateways with rules.`);
    } else {
      logger.warn('No gateway data found in the database.');
    }
  } catch (error) {
    logger.error(`Error fetching latest gateways: ${error.message}`);
  }
}

// Load OrgVdcNetworks and map networks to edgeGateways
async function loadLatestOrgVdcNetworks() {
  try {
    logger.info('Fetching the latest OrgVdcNetworks data from MongoDB...');
    const latestRecord = await OrgsVdcNetwork_Schema.findOne()
      .sort({ createdAt: -1 })
      .exec();

    if (latestRecord && latestRecord.data) {
      networkToEdgeGatewayArray = latestRecord.data.map(network => ({
        networkName: network.name,
        edgeGateway: network.connection?.data?.routerRef?.name || 'neni'
      }));
      logger.info(`Loaded ${networkToEdgeGatewayArray.length} networks.`);
    } else {
      logger.warn('No OrgVdcNetworks data found in MongoDB.');
    }
  } catch (error) {
    logger.error(`Error fetching latest OrgVdcNetworks data: ${error.message}`);
  }
}

// Get edge gateway details by name
function getEdgeGatewayDetails(edgeGatewayName) {
  return gatewayDetails.find(gateway => gateway.edgeGatewayName === edgeGatewayName) || {
    edgeGatewayName,
    firewallRules: [],
    natRules: []
  };
}

// Main function to fetch VM details
async function fetchVmDetails(orgsData) {
  try {
    // Load gateways and networks
    await loadLatestGateways();
    await loadLatestOrgVdcNetworks();

    const vmRequests = orgsData.flatMap(org =>
      org.vdcs.flatMap(vdc =>
        vdc.vapps.flatMap(vapp =>
          vapp.details.VirtualMachines.map(vm => {
            const vmId = vm.id.split(':').pop();
            const url = `https://vcloud-ffm-private.t-systems.de/api/vApp/vm-${vmId}`;
            return { url, vm };
          })
        )
      )
    );

    logger.info(`Making requests for ${vmRequests.length} VMs.`);

    const responses = await axios.all(vmRequests.map(req =>
      axios.get(req.url, {
        headers: {
          'Accept': 'application/*+json;version=36.0',
          'Authorization': `Bearer ${config.accessToken}`
        }
      }).catch(error => {
        logger.error(`Error fetching VM at ${req.url}: ${error.message}`);
        return null;
      })
    ));

    for (const [index, response] of responses.entries()) {
      const vmData = response?.data;
      const { vm } = vmRequests[index];
      if (!vmData) continue;

      vm.details = {
        RAM: vmData.section[0]?.memoryResourceMb?.configured,
        numCpu: vmData.section[0]?.numCpus
      };

      // Map network connections with edge gateway, firewall, and NAT rules
      vm.networks = (vmData.section[3]?.networkConnection || []).map(network => {
        const edgeGatewayName = networkToEdgeGatewayArray.find(
          item => item.networkName === network.network
        )?.edgeGateway;

        const edgeGatewayDetails = getEdgeGatewayDetails(edgeGatewayName);

        return {
          networkName: network.network,
          ipAddress: network.ipAddress,
          MAC: network.macAddress,
          adapter: network.networkAdapterType,
          isConnected: network.isConnected,
          edgeGateway: {
            edgeGatewayName: edgeGatewayDetails.edgeGatewayName,
            firewallRules: edgeGatewayDetails.firewallRules,
            natRules: edgeGatewayDetails.natRules
          }
        };
      });

      logger.debug(`Processed VM ID ${vm.id}:`, vm.networks);
    }

    logger.info('Fetched and updated all VM details successfully.');
    return orgsData;
  } catch (error) {
    logger.error(`Error fetching VM details: ${error.message}`);
    throw new Error('Failed to fetch VM details.');
  }
}

module.exports = { fetchVmDetails };
