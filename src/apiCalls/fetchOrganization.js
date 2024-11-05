const axios = require('axios');
const fileUtils = require('../utils/fileUtils');
const config = require('../config');
const logger = require('../logger'); // Assuming you have a Winston logger set up

const orgsDetails = [];

async function fetchOrganizations() {
  try {
    const response = await axios({
      method: 'get',
      url: `${config.apiUrl}/cloudapi/1.0.0/orgs?pageSize=128`,
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

    // Save to file
    fileUtils.saveToFile(orgsDetails, 'orgDetails.json');
    
    logger.info('Fetched organizations successfully and saved to orgDetails.json.');

    return orgsDetails;
  } catch (error) {
    logger.error('Error fetching organizations:', error.response ? error.response.data : error.message);
    throw new Error('Failed to fetch organizations.');
  }
}

module.exports = { fetchOrganizations };
