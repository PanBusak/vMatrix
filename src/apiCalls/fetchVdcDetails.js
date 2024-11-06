const axios = require('axios');
const fileUtils = require('../utils/fileUtils');
const config = require('../config');
const logger = require('../logger');

/**
 * Fetch firewall rules for multiple edge gateways.
 * @param {Object[]} gateways - Array of gateway objects, each containing `id`, `name`, and `type` properties.
 * @returns {Promise<Object[]>} - An array of firewall rules for each gateway.
 */
async function fetchFirewallRulesForGateways(gateways) {
  const firewallRulesData = [];
  const token = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJsb2NhbC1qYnVkemFrIiwiaXNzIjoiYTkzYzlkYjktNzQ3MS0zMTkyLThkMDktYThmN2VlZGE4NWY5QDc1OTdiZjc5LTE2ZDItNDJkNC04ZGQ1LTg4YzRhMWEzZTU5MCIsInJlZnJlc2hfdG9rZW5faWQiOiI0YzUxYmZhMS1kNTVhLTQ4ZTctYmI0NS1mNzRmY2Y0OWIyZDciLCJleHAiOjE3MzExNTcxMjIsInZlcnNpb24iOiJ2Y2xvdWRfMS4wIiwianRpIjoiODA3NGQwNjZjZmUzNGRlZmE2NWU3NzVkYzI2Yzk0ODUifQ.Eya18rhCT7XjgKxPSXBCdITVsfHm6FETZJ1sdb_8-h8tnJK_SrODjDVqUvLbvqTP6Xey1XHSnLBPR_PoFKba0y5UeIynI0m5rfpI3pTifuvMkZr6_JhQEywLJ5m0yFtvxNK4ZpzxB67SiEU3hv_w86GW08KrDJpS_NvUxkv0LYDhGVrXc_pjvVtoiJZed4VOubLJ3SYyvSYZ8v50O1YQsbr38-DtE0hunuI7moGOtImycH8yVrlN7W2k1Tpj0Rrjw3rNzpW49c4hOSkos2zSW0eym9v6_4LDVxPeJNCFgd3hoUYu3RhhGoNXFsoBjgzxFcXNxuEouPj0cUv3LUN3Qg";

  try {
    logger.info(`Fetching firewall rules for ${gateways.length} gateways`);

    // Create an array of requests for each gateway's firewall rules, skipping NSXV_BACKED types
    const gatewayRequests = gateways
      .filter(gateway => gateway.type !== "NSXV_BACKED")
      .map(gateway => {
        const fullGatewayId = gateway.id;
        const requestUrl = `${config.apiUrl}/cloudapi/2.0.0/edgeGateways/${fullGatewayId}/firewall/rules`;

        logger.info(`Creating request for gateway: ${gateway.name}`);
        return axios.get(requestUrl, {
          headers: {
            'Accept': 'application/json;version=39.0.0-alpha',
            'Authorization': `Bearer ${token}`,
          }
        }).then(response => ({
          gatewayName: gateway.name,
          firewallRules: response.data.userDefinedRules || []
        })).catch(error => {
          logger.error(`Error fetching firewall rules for gateway ${gateway.name}: ${error.message}`);
          return null; // Return null if there's an error, so we can filter it out later
        });
      });

    // Execute all requests concurrently
    const results = await axios.all(gatewayRequests);

    // Filter out any null results due to errors and collect data
    const firewallRulesData = results.filter(result => result !== null);

    // Save the firewall rules data to a JSON file
    fileUtils.saveToFile(firewallRulesData, 'firewallRules.json');
    logger.info('Fetched and saved firewall rules for all gateways successfully.');

    return firewallRulesData;
  } catch (error) {
    logger.error(`Error fetching firewall rules for gateways: ${error.message}`);
    throw new Error('Failed to fetch firewall rules for gateways.');
  }
}

// Example usage with gateway JSON
const gateways = require('../data/edgeGateways.json'); // Load the array of gateway data
fetchFirewallRulesForGateways(gateways)
  .then(results => {
    console.log(results);
  })
  .catch(error => {
    logger.error(`Error in fetching firewall rules: ${error.message}`);
  });

module.exports = { fetchFirewallRulesForGateways };
