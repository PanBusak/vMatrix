const axios = require('axios');
const fileUtils = require('../utils/fileUtils');
const config = require('../config');

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
        urn:vdc.id
      }));

      orgsDetails[index].vdcs = vdcs;
    });

    console.log('1.Fetched VDC  successfully.');
    fileUtils.saveToFile(orgsDetails);
    
    return orgsDetails;
  } catch (error) {
    console.error('Error fetching VDC :', error.response ? error.response.data : error.message);
    throw new Error('Failed to fetch VDC .');
  }
}

module.exports = { fetchVdcs };
