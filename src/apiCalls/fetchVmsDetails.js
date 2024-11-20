const axios = require('axios');
const fs = require('fs');
const fileUtils = require('../utils/fileUtils');
const config = require('../config');
const logger = require('../logger'); // Assuming you have a Winston logger set up

const path = require('path');

const orgVdcNetworksPath = path.resolve(__dirname, '../data/orgVdcNetworks.json');
let orgVdcNetworks = [];

if (fs.existsSync(orgVdcNetworksPath)) {
  logger.info(`orgVdcNetworks.json found at path: ${orgVdcNetworksPath}`);
  try {
    const data = fs.readFileSync(orgVdcNetworksPath, 'utf-8');
    orgVdcNetworks = JSON.parse(data);
    logger.info('Parsed orgVdcNetworks.json successfully.');
  } catch (error) {
    logger.error(`Failed to read or parse orgVdcNetworks.json: ${error.message}`);
  }
} else {
  logger.warn(`orgVdcNetworks.json not found at path: ${orgVdcNetworksPath}`);
}

// Create an array of network-edgeGateway pairs
const networkToEdgeGatewayArray = orgVdcNetworks.map(network => {
  const networkName = network.name;
  const edgeGatewayName = network.connection?.data?.routerRef?.name;

 
  return { networkName, edgeGateway: edgeGatewayName || "neni" };
});

function getEdgeGateway(networkName) {
  logger.debug(`Looking up edgeGateway for network "${networkName}".`);
  const network = networkToEdgeGatewayArray.find(item => item.networkName === networkName);
  if (network) {
    logger.debug(`Found edgeGateway "${network.edgeGateway}" for network "${networkName}".`);
  } else {
    logger.warn(`No edgeGateway found for network "${networkName}".`);
  }
  return network?.edgeGateway;
}

async function fetchVmDetails(orgsData) {
  try {
    const vmRequests = orgsData.flatMap(org =>
      org.vdcs.flatMap(vdc =>
        vdc.vapps.flatMap(vapp =>
          vapp.details.VirtualMachines.map(vm => {
            const vmId = vm.id.split(':').pop();
            const url = `https://vcloud-ffm-private.t-systems.de/api/vApp/vm-${vmId}`;
            logger.debug(`Prepared VM request for VM ID: ${vmId}, URL: ${url}`);
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
        logger.error(`Error fetching VM at ${req.url}: ${error.response?.data || error.message}`);
        throw error; // Stop processing on error to avoid partial updates.
      })
    ));

    responses.forEach((response, index) => {
      const vmData = response.data;
      const { vm } = vmRequests[index];

      logger.debug(`Processing VM data for VM ID: ${vm.id}`);

      vm.details = {
        RAM: vmData.section[0]?.memoryResourceMb?.configured,
        numCpu: vmData.section[0]?.numCpus
      };

      logger.debug(`VM details updated: RAM=${vm.details.RAM}, numCpu=${vm.details.numCpu}`);

      vm.networks = (vmData.section[3]?.networkConnection || []).map(network => {
        const edgeGateway = getEdgeGateway(network.network);
        logger.debug(`Network details: networkName=${network.network}, ipAddress=${network.ipAddress}, MAC=${network.macAddress}, edgeGateway=${edgeGateway}`);
        return {
          networkName: network.network,
          ipAddress: network.ipAddress,
          MAC: network.macAddress,
          adapter: network.networkAdapterType,
          isConnected: network.isConnected,
          edgeGateway
        };
      });

      if (vm.networks.length === 0) {
        logger.warn(`No networks found for VM ID: ${vm.id}`);
      }
    });

    logger.info('Fetched and updated all VM details successfully.');
    return orgsData;
  } catch (error) {
    logger.error(`Error fetching VM details: ${error.response ? error.response.data : error.message}`);
    throw new Error('Failed to fetch VM details.');
  }
}

module.exports = { fetchVmDetails };
