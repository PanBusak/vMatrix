const axios = require('axios');
const qs = require('qs'); // Import qs for URL-encoding
const config = require('../config');
const logger = require('../logger'); 

async function fetchAccessToken() {
    logger.info("Starting to fetch access token");
  try {
    const response = await axios({
      method: 'post',
      url: `${config.apiUrl}/oauth/provider/token`, // Replace with the actual token endpoint
      headers: { // Corrected from body to headers
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: qs.stringify({ // Use qs.stringify to format the data correctly
        grant_type: 'refresh_token',
        refresh_token: config.refresh_token // Use refreshToken from config
      })
    });

    const accessToken = response.data.access_token;
    config.accessToken = accessToken; // Update the access token in config.js
    logger.info('Access token fetch script successfull.', accessToken);
  ;
    return accessToken;
  } catch (error) {
    logger.error('Error fetching access token:', error.response ? error.response.data : error.message);
    throw new Error('Failed to fetch access token.');
  }
}



module.exports = fetchAccessToken;
