const axios = require('axios');
const fileUtils = require('../utils/fileUtils');
const config = require('../config');

const orgsDetails = [];

async function fetchOrganizations() {
  try {
    
    const response = await axios({
      method: 'get',
      url: `${config.apiUrl}/cloudapi/1.0.0/orgs`,
      headers: {
        'Accept': 'application/json;version=36.0',
        'Authorization': `Bearer ${config.accessToken}`
      },
    });

    const orgsArray = response.data.values;

    orgsArray.forEach(org => {
      const uuid = org.id.split(':').pop();
      orgsDetails.push({
        name: org.name,
        uuid: uuid,
      });
    });

    console.log('Fetched organization details successfully.');
    fileUtils.saveToFile(orgsDetails, 'orgDetails.json');
    
    return orgsDetails;
  } catch (error) {
    console.error('Error fetching organizations:', error.response ? error.response.data : error.message);
    throw new Error('Failed to fetch organizations.');
  }
}

module.exports = { fetchOrganizations };
