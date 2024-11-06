const axios = require('axios');
const fs = require('fs');
const fileUtils = require('../utils/fileUtils');
const config = require('../config');
const logger = require('../logger'); // Assuming you have a Winston logger set up

// Load orgVdcNetworks.json if it exists, otherwise initialize an empty array
let orgVdcNetworks = [];
const orgVdcNetworksPath = '../data/orgVdcNetworks.json';

if (fs.existsSync(orgVdcNetworksPath)) {
  orgVdcNetworks = require(orgVdcNetworksPath);
} else {
  logger.warn('orgVdcNetworks.json not found. Proceeding without network-edgeGateway data.');
}

// Create an array of network-edgeGateway pairs
const networkToEdgeGatewayArray = orgVdcNetworks.map(network => {
  const networkName = network.name;
  const edgeGatewayName = network.connection?.data?.routerRef?.name;

  return { networkName, edgeGateway: edgeGatewayName || "neni" };
});

function getEdgeGateway(networkName) {
  const network = networkToEdgeGatewayArray.find(item => item.networkName === networkName);
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
            return { url, vm };
          })
        )
      )
    );

    logger.info(`Making requests for ${vmRequests.length} VMs`);

    const responses = await axios.all(vmRequests.map(req =>
      axios.get(req.url, {
        headers: {
          'Accept': 'application/*+json;version=36.0',
          'Authorization': `Bearer ${config.accessToken}`
        }
      })
    ));

    responses.forEach((response, index) => {
      const vmData = response.data;
      const { vm } = vmRequests[index];

      vm.details = {
        RAM: vmData.section[0]?.memoryResourceMb?.configured,
        numCpu: vmData.section[0]?.numCpus
      };

      vm.networks = (vmData.section[3]?.networkConnection || []).map(network => ({
        networkName: network.network,
        ipAddress: network.ipAddress,
        MAC: network.macAddress,
        adapter: network.networkAdapterType,
        isConnected: network.isConnected,
        edgeGateway: getEdgeGateway(network.network)
      }));
    });

    logger.info('Fetched and updated all VM details successfully.');
    fileUtils.saveToFile(orgsData, 'updatedOrgsDataWithVmDetails.json');

    return orgsData;
  } catch (error) {
    logger.error(`Error fetching VM details: ${error.response ? error.response.data : error.message}`);
    throw new Error('Failed to fetch VM details.');
  }
}

module.exports = { fetchVmDetails };
