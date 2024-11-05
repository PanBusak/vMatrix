const axios = require('axios');
const fileUtils = require('../utils/fileUtils');
const config = require('../config');
const logger = require('../logger'); // Assuming you have a Winston logger set up

async function fetchAllExternalNetworks() {
  try {
    // Initial request to get pageSize and pageCount
    const initialUrl = `${config.apiUrl}/cloudapi/1.0.0/externalNetworks?pageSize=1&page=1`;
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

    logger.info(`Making ${pageCount} externalNetworks requests`);

    // Generate an array of requests for each page
    const requests = Array.from({ length: pageCount }, (_, i) => {
      const url = `${config.apiUrl}/cloudapi/1.0.0/externalNetworks?pageSize=32&page=${i + 1}`;
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
    const allExternalNetworks = responses.flatMap(response =>
      response.data.values.map(network => ({
        id: network.id,
        name: network.name,
        backingNetworkType: network.networkBackings?.values[0]?.backingType || null,
        backingId: network.networkBackings?.values[0]?.backingId || null,
        networkType: network.networkBackings?.values[0]?.backingTypeValue || null,
        usedIpCount: network.subnets?.values?.reduce((acc, subnet) => acc + (subnet.usedIpCount || 0), 0)
      }))
    );

    logger.info('Fetched all externalNetworks successfully.');
    fileUtils.saveToFile(allExternalNetworks, 'externalNetworks.json');

    return allExternalNetworks;
  } catch (error) {
    logger.error('Error fetching externalNetworks:', error.response ? error.response.data : error.message);
    throw new Error('Failed to fetch all externalNetworks.');
  }
}

module.exports = { fetchAllExternalNetworks };
