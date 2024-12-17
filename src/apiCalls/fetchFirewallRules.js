const axios = require('axios');
const fileUtils = require('../utils/fileUtils');
const config = require('../config');
const logger = require('../logger'); // Assuming you have a Winston logger set up

async function fetchAllEdgeGateways() {
  try {
    logger.info("Initial request for Edge Gateways started");
    const initialUrl = `${config.apiUrl}/cloudapi/1.0.0/edgeGateways?pageSize=1&page=1`;
    const initialResponse = await axios({
      method: 'get',
      url: initialUrl,
      headers: {
        'Accept': 'application/json;version=36.0',
        'Authorization': `Bearer ${config.accessToken}`
      }
    });

    logger.info("Initial request for Edge Gateways done!");

    const { pageCount } = initialResponse.data;

    logger.info(`Making ${pageCount} edgeGateways requests`);

    // Generate an array of requests for each page
    const gatewayRequests = Array.from({ length: pageCount }, (_, i) => {
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
    const responses = await axios.all(gatewayRequests);

    // Extract and combine data from each page
    const allEdgeGateways = responses.flatMap(response =>
      response.data.values.map(gateway => ({
        id: gateway.id,
        name: gateway.name,
        type: gateway.gatewayBacking.gatewayType,
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
        })) || [],
        firewallRules: [], // Placeholder for firewall rules
        natRules: []       // Placeholder for NAT rules
      }))
    );

    logger.info(`Fetched all Edge Gateways successfully from ${config.apiUrl}.`);

    // Fetch firewall rules and NAT rules for each gateway
    const rulesRequests = allEdgeGateways.map(gateway => {
      const firewallRequestUrl = `${config.apiUrl}/cloudapi/2.0.0/edgeGateways/${gateway.id}/firewall/rules`;
      const natRequestUrl = `${config.apiUrl}/cloudapi/2.0.0/edgeGateways/${gateway.id}/nat/rules`;

      // Firewall rules request
      const firewallRequest = axios.get(firewallRequestUrl, {
        headers: {
          'Accept': 'application/json;version=39.0.0-alpha',
          'Authorization': `Bearer ${config.accessToken}`
        }
      }).then(response => {
        gateway.firewallRules = response.data.userDefinedRules || [];
      }).catch(error => {
        logger.info(`Empty orError fetching firewall rules for gateway ${gateway.name}: ${error.message}`);
        gateway.firewallRules = []; // Default to empty rules
      });

      // NAT rules request
      const natRequest = axios.get(natRequestUrl, {
        headers: {
          'Accept': 'application/json;version=39.0.0-alpha',
          'Authorization': `Bearer ${config.accessToken}`
        }
      }).then(response => {
        gateway.natRules = response.data.values || [];
      }).catch(error => {
        logger.info(`Empty or Error fetching NAT rules for gateway ${gateway.name}: ${error.message}`);
        gateway.natRules = []; // Default to empty rules
      });

      return { firewallRequest, natRequest };
    });

    // Wait for all firewall and NAT rules requests to complete
    const allFirewallRequests = rulesRequests.map(req => req.firewallRequest);
    const allNatRequests = rulesRequests.map(req => req.natRequest);

    await Promise.all([...allFirewallRequests, ...allNatRequests]);

    // Save the combined data to a file
    fileUtils.saveToFile(allEdgeGateways, 'AllEdgeGatewaysWithFirewallAndNat.json');
    logger.info('Fetched all Edge Gateways along with firewall and NAT rules successfully.');

    return allEdgeGateways;
  } catch (error) {
    logger.error(`Error fetching Edge Gateways:`, error.response ? error.response.data : error.message);
    throw new Error('Failed to fetch all Edge Gateways.');
  }
}

module.exports = { fetchAllEdgeGateways };
