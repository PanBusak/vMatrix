const axios = require('axios');
const qs = require('qs');

const url = 'https://vcloud-ffm-private.t-systems.de/oauth/provider/token';

async function createSession() {
  try {
    const data = qs.stringify({
      grant_type: 'refresh_token',
      refresh_token: 'fHDnD86okK9PU8Dd3BADzcWYJZ02nMBH'  // Ensure this token is valid
    });

    console.log('Sending request with data:', data);  // Log the request data

    const response = await axios({
      method: 'POST',
      url: url,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      data: data
    });

    console.log('Session created successfully:', response.data);
    return response.data.access_token;

  } catch (error) {
    console.error('Error creating session:', error.response ? error.response.data : error.message);
    throw new Error('Failed to create session.');
  }
}

module.exports = { createSession };
