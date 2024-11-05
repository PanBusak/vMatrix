const axios = require('axios');
const fileUtils = require('../utils/fileUtils');
const config = require('../config');
const logger = require('../logger'); // Assuming you have a Winston logger set up

async function fetchVdcs(orgsDetails) {
  try {
    const vdcRequests = orgsDetails.map(org => {
      return axios({
        method: 'get',
        url: `${config.apiUrl}/api/admin/org/${org.uuid}`, 
        headers: {
          'Accept': 'application/*+json;version=36.0',
          'Authorization': `Bearer ${config.accessToken}`
        },
      });
    });

    const responses = await axios.all(vdcRequests);

    responses.forEach((response, index) => {
      const vdcs = response.data.vdcs.vdc.map(vdc => ({
        name: vdc.name,
        href: vdc.href,
        urn: vdc.id
      }));

      orgsDetails[index].vdcs = vdcs;
    });

    logger.info('Fetched VDCs fpr successfully.');
    fileUtils.saveToFile(orgsDetails);
    
    return orgsDetails;
  } catch (error) {
    logger.error('Error fetching VDC:', error.response ? error.response.data : error.message);
    throw new Error('Failed to fetch VDC.');
  }
}

module.exports = { fetchVdcs };
