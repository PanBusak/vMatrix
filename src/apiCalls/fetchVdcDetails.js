const axios = require('axios');
const fileUtils = require('../utils/fileUtils');
const config = require('../config');
const logger = require('../logger'); // Assuming you have a Winston logger set up

async function fetchVdcDetails(orgsDetails) {
  try {
    const vappRequests = orgsDetails.flatMap(org => 
      org.vdcs.flatMap(vdc => ({
        vdcName: vdc.name,
        orgName: org.name,
        request: axios({
          method: 'get',
          url: vdc.href, // Assuming vdc.href contains the API endpoint
          headers: {
            'Accept': 'application/*+json;version=36.0',
            'Authorization': `Bearer ${config.accessToken}`
          }
        })
      }))
    );

    const vappResponses = await axios.all(vappRequests.map(v => v.request));

    vappResponses.forEach((response, index) => {
      const vappData = response.data;
      const vappInfo = vappRequests[index];

      const org = orgsDetails.find(o => o.name === vappInfo.orgName);
      const vdc = org.vdcs.find(v => v.name === vappInfo.vdcName);
      if (!vdc.vapps) vdc.vapps = [];

      // Extract the name and href from resourceEntity array
      const vapps = (vappData.resourceEntities && Array.isArray(vappData.resourceEntities.resourceEntity))
        ? vappData.resourceEntities.resourceEntity
            .filter(entity => entity.type === "application/vnd.vmware.vcloud.vApp+xml")
            .map(entity => ({
              name: entity.name,
              href: entity.href
            }))
        : [];

      org.compute = vappData.computeCapacity;
      
      vdc.vapps.push(...vapps); // Append all vApp objects to the vapps array in the VDC
    });

    logger.info('Fetched VDCs and their vApps successfully.');
   // fileUtils.saveToFile(orgsDetails);
    return orgsDetails;
  } catch (error) {
    logger.error('Error fetching VDCs and vApps:', error.response ? error.response.data : error.message);
    throw new Error('Failed to fetch VDCs and vApps.');
  }
}

module.exports = { fetchVdcDetails };