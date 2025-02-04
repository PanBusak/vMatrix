const axios = require('axios');
const fileUtils = require('../utils/fileUtils');
const config = require('../config');
const logger = require('../logger');

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

    const responses = await axios.all(gatewayRequests);

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
        firewallRules: [],
        natRules: [],
        routeAdvertisement: []
      }))
    );

    logger.info(`Fetched all Edge Gateways successfully from ${config.apiUrl}.`);

    const rulesRequests = allEdgeGateways.map(async (gateway) => {
      const firewallRequestUrl = `${config.apiUrl}/cloudapi/2.0.0/edgeGateways/${gateway.id}/firewall/rules`;
      const natRequestUrl = `${config.apiUrl}/cloudapi/2.0.0/edgeGateways/${gateway.id}/nat/rules`;
      const routeAdvertisementUrl = `${config.apiUrl}/cloudapi/1.0.0/edgeGateways/${gateway.id}/routing/advertisement`;
      
https://vcloud-ffm-private.t-systems.de/cloudapi/1.0.0/edgeGateways/urn:vcloud:gateway:630e1fc9-4c28-4bc4-abea-a21270047d54/routing/advertisement

      try {
        const firewallResponse = await axios.get(firewallRequestUrl, {
          headers: {
            'Accept': 'application/json;version=39.0.0-alpha',
            'Authorization': `Bearer ${config.accessToken}`
          }
        });
        gateway.firewallRules = firewallResponse.data.userDefinedRules || [];
      } catch (error) {
        logger.error(`Error fetching firewall rules for gateway ${gateway.name}: ${error.message}`);
        gateway.firewallRules = [];
      }

      try {
        const natResponse = await axios.get(natRequestUrl, {
          headers: {
            'Accept': 'application/json;version=39.0.0-alpha',
            'Authorization': `Bearer ${config.accessToken}`
          }
        });
        gateway.natRules = natResponse.data.values || [];
      } catch (error) {
        logger.error(`Error fetching NAT rules for gateway ${gateway.name}: ${error.message}`);
        gateway.natRules = [];
      }

      try {
        const advertisementResponse = await axios.get(routeAdvertisementUrl, {
          headers: {
            'Accept': 'application/json;version=39.0.0-alpha',
            'Authorization': `Bearer ${config.accessToken}`
          }
        });
        gateway.routeAdvertisement = advertisementResponse.data || [];
      } catch (error) {
        logger.error(`Error fetching route advertisement for gateway ${gateway.name}: ${error.message}`);
        gateway.routeAdvertisement = [];
      }
    });

    await Promise.all(rulesRequests);

    fileUtils.saveToFile(allEdgeGateways, 'AllEdgeGatewaysWithFirewallAndNat.json');
    logger.info('Fetched all Edge Gateways along with firewall, NAT rules, and route advertisement successfully.');

    return allEdgeGateways;
  } catch (error) {
    logger.error(`Error fetching Edge Gateways:`, error.response ? error.response.data : error.message);
    throw new Error('Failed to fetch all Edge Gateways.');
  }
}

module.exports = { fetchAllEdgeGateways };
