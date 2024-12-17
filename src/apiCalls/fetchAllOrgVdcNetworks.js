const axios = require('axios');
const fileUtils = require('../utils/fileUtils');
const config = require('../config');
const logger = require('../logger'); // Assuming you have a Winston logger set up

async function fetchAllOrgVdcNetworks() {
  try {
    // Initial request to get pageSize and pageCount
    const initialUrl = `${config.apiUrl}/cloudapi/1.0.0/orgVdcNetworks?pageSize=32&page=1`;
    const initialResponse = await axios({
      method: 'get',
      url: initialUrl,
      headers: {
        'Accept': 'application/json;version=36.0',
        'Authorization': `Bearer ${config.accessToken}`
      }
    });

    logger.info("Initial request done!");
    const { pageSize, pageCount } = initialResponse.data;
    
    logger.info(`Making ${pageCount} orgVDCNetworks requests`);

    // Generate an array of requests for each page
    const requests = Array.from({ length: pageCount }, (_, i) => {
      const url = `${config.apiUrl}/cloudapi/1.0.0/orgVdcNetworks?&pageSize=32&page=${i + 1}`;
      return axios({
        method: 'get',
        url: url,
        headers: {
          'Accept': 'application/json;version=36.0',
          'Authorization': `Bearer ${config.accessToken}`
        }
      });
    });

    // Fetch all pages concurrently
    const responses = await axios.all(requests);

    // Extract and combine data from each page
    const allNetworks = responses.flatMap(response =>
      response.data.values.map(network => ({
        id: network.id,
        name: network.name,
        backingNetworkType: network.backingNetworkType,
        parentNetworkId: network.parentNetworkId || null,
        networkType: network.networkType,
        orgVdc: network.orgVdc,
        ownerRef: {
          name: network.ownerRef?.name,
          id: network.ownerRef?.id
        },
        connection: {
          data: network.connection
        },
        usedIpCount: network.subnets?.values?.reduce((acc, subnet) => acc + (subnet.usedIpCount || 0), 0)
      }))
    );

    logger.info(`Fetched all orgVdcNetworks successfully  from ${config.apiUrl}.`);
    fileUtils.saveToFile(allNetworks, `orgVdcNetworks.json`);
   
    return allNetworks;
  } catch (error) {
    logger.error(`Error fetching orgVdcNetworks  from ${config.apiUrl}:`, error.response ? error.response.data : error.message);
    throw new Error(`Failed to fetch all orgVdcNetworks  from ${config.apiUrl}.`);
    
  }
}

// Call the function if needed for testing or execution
//fetchAllOrgVdcNetworks();

module.exports = { fetchAllOrgVdcNetworks };
