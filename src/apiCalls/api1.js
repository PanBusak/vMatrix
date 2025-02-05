const axios = require('axios');
const { createSession } = require('../fetchService');  // Import the session function

// Function to make an authenticated API request
async function callSomeApi() {
  try {
    // Get the session token (access token) from the session module
    const accessToken = await createSession();

    const apiResponse = await axios({
      method: 'GET',  // Adjust based on your API method (GET, POST, etc.)
      url: 'https://your-api-endpoint.com/resource',  // Replace with actual API endpoint
      headers: {
        'Authorization': `Bearer ${accessToken}`,  // Use the token for authentication
        'Accept': 'application/json'
      }
    });

   
    return apiResponse.data;

  } catch (error) {
    console.error('Error in API call:', error.response ? error.response.data : error.message);
    throw new Error('API call failed.');
  }
}

module.exports = { callSomeApi };
