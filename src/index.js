const express = require('express');
const logger = require('./logger'); 

const { fetchOrganizations } = require('./apiCalls/fetchOrganization');
const { fetchVdcs } = require('./apiCalls/fetchVdcs');
const { fetchVdcDetails } = require('./apiCalls/fetchVdcDetails');
const { fetchVappDetails } = require('./apiCalls/fetchVappDetails');
const { fetchVmDetails } = require('./apiCalls/fetchVmsDetails');
const fetchAccessToken = require('./apiCalls/fetchAccessToken');
const {fetchAllEdgeGateways} = require('./apiCalls/fetchAllEdgeGateways')
const {fetchAllOrgVdcNetworks} = require('./apiCalls/fetchAllOrgVdcNetworks')
const config = require('./config');
const {fetchFirewallRulesForGateways} = require('./apiCalls/fetchFirewallRules');


logger.info(`*****************************************Starting vMatrix Server*****************************************`);

const app = express();
const PORT = 3000;

logger.info(`---- Express started at port: ${PORT} successfully ----`);

(async () => {
  try {
    await fetchAccessToken();
    logger.info(`---- Access Token fetched successfully ----`);
    logger.info(`Token is:\n${config.accessToken}`);
  } catch (error) {
    logger.error(`Error fetching access token: ${error.message} . Are you on Correct Network?`);
  }
})();

app.use(express.json());// Musi byt tento Parser !!!
app.use((req, res, next) => { // Ipcky do logov
  req.ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  next();
});


app.get('/api/orgs', async (req, res) => {
  try {
    const orgs = await fetchOrganizations();
    logger.info(`Fetched organizations successfully from IP: ${req.ipAddress}`);
    res.json(orgs);
  } catch (error) {
    logger.error(`Error fetching organizations from IP ${req.ipAddress}: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

// Endpoint to get full topology information
app.post('/api/topology', async (req, res) => {
  const orgDetailArray = req.body.orgs;
  console.log(orgDetailArray)
  if (!Array.isArray(orgDetailArray) || orgDetailArray.length === 0) {
    logger.error(`Invalid or missing 'orgs' array in request body from IP: ${req.ipAddress}`)
    return res.status(400).json({ error: "Invalid or missing 'orgs' array in request body." });
  }

  try {
    // Log the incoming request
    logger.info(`Fetching topology for specified orgs from IP: ${req.ipAddress}`);

    // Process the array of organizations
    const orgsWithVdc = await fetchVdcs(orgDetailArray);
    logger.info(`Fetched VDCs successfully from IP: ${req.ipAddress}`);
    
    const vdcWithVapp = await fetchVdcDetails(orgsWithVdc);
    logger.info(`Fetched VDC details successfully from IP: ${req.ipAddress}`);
    
    const vappWithVm = await fetchVappDetails(vdcWithVapp);
    logger.info(`Fetched vApp details successfully from IP: ${req.ipAddress}`);
    
    const topology = await fetchVmDetails(vappWithVm);
    logger.info(`Fetched VM details successfully from IP: ${req.ipAddress}`);

    res.json(topology);
  } catch (error) {
    logger.error(`Error fetching topology from IP ${req.ipAddress}: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch topology' });
  }
});


app.get('/api/updateNetworkData', async (req, res) => {
  try {
      logger.info('Fetching network data...');

      const gatewaysData = await fetchAllEdgeGateways();
      logger.info('Fetched Edge Gateways data successfully.');

      // Fetch Org VDC Networks data
      const orgVdcNetworksData = await fetchAllOrgVdcNetworks(gatewaysData);
      const edgeFirewalls = await fetchFirewallRulesForGateways(gatewaysData)
   //  console.log(JSON.stringify(edgeFirewalls))
      logger.info('Fetched Org VDC Networks data successfully.');
      // Send combined data as a response
      const networkData = {
          gateways: gatewaysData,
          orgVdcNetworks: orgVdcNetworksData
      };

      res.status(200).json(networkData);
      logger.info('Network data sent successfully.');
  } catch (error) {
      logger.error('Error fetching network data:', error.message);
      res.status(500).json({ message: 'Failed to fetch network data.', error: error.message });
  }
});

// Start the Express server
app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
  
});
