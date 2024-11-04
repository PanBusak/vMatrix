const axios = require('axios');
const fileUtils = require('../utils/fileUtils');
const config = require('../config');

async function fetchAllEdgeGateways() {
  try {
    // Initial request to get pageSize and pageCount
    const initialUrl = `${config.apiUrl}/cloudapi/1.0.0/edgeGateways?pageSize=1&page=1`;
    const initialResponse = await axios({
      method: 'get',
      url: initialUrl,
      headers: {
        'Accept': 'application/json;version=36.0',
        'Authorization': `Bearer ${config.accessToken}`
      }
    });
    console.log("Initial request for Edge Gateways done!");

    const { pageSize, pageCount } = initialResponse.data;

    console.log(`Making ${pageCount} edgeGateways requests`);

    // Generate an array of requests for each page
    const requests = Array.from({ length: pageCount }, (_, i) => {
      const url = `${config.apiUrl}/cloudapi/1.0.0/edgeGateways?pageSize=32&page=${i + 1}`;
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
    const allEdgeGateways = responses.flatMap(response =>
      response.data.values.map(gateway => ({
        id: gateway.id,
        name: gateway.name,
        description: gateway.description || '',
        externalNetworkRefs: gateway.externalNetworkRefs?.map(ref => ({
          name: ref.name,
          id: ref.id
        })) || [],
        orgVdcId: gateway.orgVdc?.id || null,
        ownerRef: {
          name: gateway.ownerRef?.name,
          id: gateway.ownerRef?.id
        },
        edgeClusterName: gateway.edgeCluster?.name || '',
        edgeClusterId: gateway.edgeCluster?.id || '',
        haEnabled: gateway.haEnabled,
        interfaces: gateway.interfaces?.map(iface => ({
          name: iface.name,
          id: iface.id,
          type: iface.type,
          subnet: iface.subnet
        })) || []
      }))
    );

    console.log('Fetched all Edge Gateways successfully.');
    fileUtils.saveToFile(allEdgeGateways, 'edgeGateways.json');

    return allEdgeGateways;
  } catch (error) {
    console.error('Error fetching Edge Gateways:', error.response ? error.response.data : error.message);
    throw new Error('Failed to fetch all Edge Gateways.');
  }
}

module.exports = { fetchAllEdgeGateways };
