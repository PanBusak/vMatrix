const axios = require('axios');
const fileUtils = require('../utils/fileUtils');
const config = require('../config');
const orgVdcNetworks = require('../data/orgVdcNetworks.json'); // Replace with the actual path

// Create an array of network-edgeGateway pairs
const networkToEdgeGatewayArray = orgVdcNetworks.map(network => {
  const networkName = network.name; // Use network.name to match network names
  const edgeGatewayName = network.connection?.data?.routerRef?.name;

  return { networkName, edgeGateway: edgeGatewayName || "neni" };
});


function getEdgeGateway(networkName) {
  const network = networkToEdgeGatewayArray.find(item => item.networkName === networkName);
  return network?.edgeGateway ;
}





async function fetchVmDetails(orgsData) {
  try {
    // Collect all VM details as { url, vm } to allow easy mapping of responses
    const vmRequests = orgsData.flatMap(org =>
      org.vdcs.flatMap(vdc =>
        vdc.vapps.flatMap(vapp =>
          vapp.details.VirtualMachines.map(vm => {
            const vmId = vm.id.split(':').pop(); // Extract the last part of the ID
            const url = `https://vcloud-ffm-private.t-systems.de/api/vApp/vm-${vmId}`;
            return { url, vm }; // Store both URL and VM object for later reference
          })
        )
      )
    );

    console.log(`Making requests for ${vmRequests.length} VMs`);

    // Make concurrent requests for all VMs
    const responses = await axios.all(vmRequests.map(req =>
      axios.get(req.url, {
        headers: {
          'Accept': 'application/*+json;version=36.0',
          'Authorization': `Bearer ${config.accessToken}`
        }
      })
    ));

    responses.forEach((response, index) => {
      const vmData = response.data; // Data from VM API response
      const { vm } = vmRequests[index]; // Original VM object in orgsData

      // Extract only the required fields and update the vm object
      vm.details = {
        RAM: vmData.section[0]?.memoryResourceMb?.configured,
        numCpu: vmData.section[0]?.numCpus
      };

      // Extract network information
      vm.networks = (vmData.section[3]?.networkConnection || []).map(network => ({
        networkName: network.network,
        ipAddress: network.ipAddress,
        MAC:network.macAddress,
        adapter: network.networkAdapterType,
        isConnected: network.isConnected,
        edgeGateway:  getEdgeGateway(network.network)
      }));
    });


    console.log('Fetched and updated all VM details successfully.');
    fileUtils.saveToFile(orgsData, 'updatedOrgsDataWithVmDetails.json'); // Save the enriched orgsData

    return orgsData;
  } catch (error) {
    console.error('Error fetching VM details:', error.response ? error.response.data : error.message);
    throw new Error('Failed to fetch VM details.');
  }
}


module.exports = { fetchVmDetails };
