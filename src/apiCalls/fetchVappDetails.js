const axios = require('axios');
const fileUtils = require('../utils/fileUtils');
const config = require('../config');
const logger = require('../logger'); // Assuming you have a Winston logger set up

async function fetchVappDetails(orgsDetails) {
  try {
    
    const vappRequests = orgsDetails.flatMap(org =>
      org.vdcs.flatMap(vdc =>
        vdc.vapps.map(vapp => ({
          orgName: org.name,
          vdcName: vdc.name,
          vappName: vapp.name,
          request: axios({
            method: 'get',
            url: vapp.href, // Using the 'href' of the vApp to get its details
            headers: {
              'Accept': 'application/*+json;version=36.0',
              'Authorization': `Bearer ${config.accessToken}`
            }
          })
        }))
      )
    );

    const vappResponses = await axios.all(vappRequests.map(v => v.request));

  
    vappResponses.forEach((response, index) => {
      const vappData = response.data;
      const vappRequest = vappRequests[index];

      const org = orgsDetails.find(o => o.name === vappRequest.orgName);
      const vdc = org.vdcs.find(v => v.name === vappRequest.vdcName);
      const vapp = vdc.vapps.find(v => v.name === vappRequest.vappName);

      const vms = [];

      
      if (vappData.children && vappData.children.vm) {
        vappData.children.vm.forEach(vm => {
          if (vm.name && vm.id) {
            vms.push({
              name: vm.name, // VM name
              id: vm.id      // VM ID
            });
          }
        });
      }

      vapp.details = {
        vAppName: vappData.name,  // vApp name from the response
        VirtualMachines: vms      // Array of VM objects with name and id
      };
    });

  
    logger.info('Fetched and filtered vApp details successfully.');

    return orgsDetails;
  } catch (error) {
    logger.error('Error fetching vApp details:', error.response ? error.response.data : error.message);
    throw new Error('Failed to fetch vApp details.');
  }
}

module.exports = { fetchVappDetails };
