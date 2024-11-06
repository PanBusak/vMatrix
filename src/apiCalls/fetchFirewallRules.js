const axios = require('axios');
const fileUtils = require('../utils/fileUtils');
const config = require('../config');
const logger = require('../logger');

/**
 * Fetch firewall and NAT rules for multiple edge gateways.
 * @param {Object[]} gateways - Array of gateway objects, each containing `id`, `name`, and `type` properties.
 * @returns {Promise<Object>} - An object containing arrays of firewall rules and NAT rules for each gateway.
 */
async function fetchFirewallRulesForGateways(gateways) {
  const firewallRulesData = [];
  const natRulesData = [];
  const token = "eyJhbGciOiJSUzI1NiJ9...";  // Replace with your actual token

  try {
    logger.info(`Fetching firewall and NAT rules for ${gateways.length} gateways`);

    // Create requests for each gateway's firewall and NAT rules, skipping NSXV_BACKED types
    const gatewayRequests = gateways
      .filter(gateway => gateway.type !== "NSXV_BACKED")
      .map(gateway => {
        const fullGatewayId = gateway.id;

        // Firewall rules request
        const firewallRequestUrl = `${config.apiUrl}/cloudapi/2.0.0/edgeGateways/${fullGatewayId}/firewall/rules`;
        const firewallRequest = axios.get(firewallRequestUrl, {
          headers: {
            'Accept': 'application/json;version=39.0.0-alpha',
            'Authorization': `Bearer ${token}`,
          }
        }).then(response => ({
          gatewayName: gateway.name,
          firewallRules: response.data.userDefinedRules || []
        })).catch(error => {
          logger.error(`Error fetching firewall rules for gateway ${gateway.name}: ${error.message}`);
          return null;
        });

        // NAT rules request
        const natRequestUrl = `${config.apiUrl}/cloudapi/2.0.0/edgeGateways/${fullGatewayId}/nat/rules`;
        const natRequest = axios.get(natRequestUrl, {
          headers: {
            'Accept': 'application/json;version=39.0.0-alpha',
            'Authorization': `Bearer ${token}`,
          }
        }).then(response => ({
          gatewayName: gateway.name,
          natRules: response.data.natRules || []
        })).catch(error => {
          logger.error(`Error fetching NAT rules for gateway ${gateway.name}: ${error.message}`);
          return null;
        });

        return { firewallRequest, natRequest };
      });

    // Execute all firewall and NAT requests concurrently
    const firewallResults = await axios.all(gatewayRequests.map(g => g.firewallRequest));
    const natResults = await axios.all(gatewayRequests.map(g => g.natRequest));

    // Collect successful firewall rules responses
    firewallResults.filter(result => result !== null).forEach(result => {
      firewallRulesData.push(result);
    });

    // Collect successful NAT rules responses
    natResults.filter(result => result !== null).forEach(result => {
      natRulesData.push(result);
    });

    // Save the firewall and NAT rules data to a JSON file
    const outputData = {
      firewallRules: firewallRulesData,
      natRules: natRulesData
    };
    fileUtils.saveToFile(outputData, 'firewallRules.json');
    logger.info('Fetched and saved firewall and NAT rules for all gateways successfully.');

    return outputData;
  } catch (error) {
    logger.error(`Error fetching rules for gateways: ${error.message}`);
    throw new Error('Failed to fetch rules for gateways.');
  }
}

// Example usage with gateway JSON
const gateways = require('../data/edgeGateways.json'); // Load the array of gateway data
fetchFirewallRulesForGateways(gateways)
  .then(results => {
    console.log(results);
  })
  .catch(error => {
    logger.error(`Error in fetching rules: ${error.message}`);
  });

module.exports = { fetchFirewallRulesForGateways };
