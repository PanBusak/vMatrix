const axios = require('axios');

// Specify the firewall rule endpoint and token directly
const endpointUrl = 'https://vcloud-ffm-private.t-systems.de/cloudapi/2.0.0/edgeGateways/urn:vcloud:gateway:4a458032-f3c4-4562-9302-b44583272a9e/firewall/rules';
const token = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJsb2NhbC1qYnVkemFrIiwiaXNzIjoiYTkzYzlkYjktNzQ3MS0zMTkyLThkMDktYThmN2VlZGE4NWY5QDc1OTdiZjc5LTE2ZDItNDJkNC04ZGQ1LTg4YzRhMWEzZTU5MCIsInJlZnJlc2hfdG9rZW5faWQiOiI0YzUxYmZhMS1kNTVhLTQ4ZTctYmI0NS1mNzRmY2Y0OWIyZDciLCJleHAiOjE3MzExNTQ1NjMsInZlcnNpb24iOiJ2Y2xvdWRfMS4wIiwianRpIjoiMTdiNmQyNDY5NzBlNGE0M2IwMmQwNGFjOGZiM2RmOTMifQ.Ym2AFLC8UBCalm2qk3n2UBOi42tTjGbFf_MnGiYtFM0eTnILughmkp7J6Qyl250L2rf4GU15uggAxM5KrfGOoB2gtROgzdSA4b5n1t2eJOsA1SuV_W2mWQmW5S81A6-2GkPml4mqjm6ZzymHw-g2dj83E2E-8CtPKpMdQrcJyaC6aiqYFLtuVpWCIrLq_NFPdRLKYo5nYaCNQu5rmKtz3dVreUUjBTnUuhRFSX-M14SgwW3CbtnZpX0siP5TDqfXu15d-F7-sGXlMEfX6xFA7vaYV6QCJp_XZ13jwFzwQQf1T_mH_x4WMGpwzFIFUO-Vc5vy6YqldP4YVpvmB_O7aA';  // Replace with your actual token

/**
 * Fetch firewall rule from the specified static endpoint.
 */
async function fetchFirewallRule() {
  try {
    console.log(`Fetching firewall rule from endpoint: ${endpointUrl}`);

    // Make the GET request to the specified endpoint
    const response = await axios.get(endpointUrl, {
      headers: {
        'Accept': 'application/json;version=39.0.0-alpha', // Adjust version as needed
        'Authorization': `Bearer ${token}`,
      }
    });

    // Log the response data
    console.log('Firewall Rule Response:', response.data);
  } catch (error) {
    // Basic error logging
    if (error.response) {
      console.error(`Error fetching firewall rule: ${error.response.status} - ${error.response.statusText}`);
      console.error('Response data:', error.response.data);
    } else {
      console.error(`Error fetching firewall rule: ${error.message}`);
    }
  }
}

// Run the function to fetch the firewall rule
fetchFirewallRule();
