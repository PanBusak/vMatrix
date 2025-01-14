const express = require('express');
const logger = require('./logger');
const mongoose = require('./db');
const cron = require("node-cron")
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import Routes
const cronRoutes = require('./cronroutes');
const authRouter = require("./authRoutes");
const sessionRoutes = require("./session");
const authMiddleware = require('./auth');
const TopologyJob = require("./data/schemas/Topologyjob_Schema");

// Schemas
const OrgsVdcVm = require("./data/schemas/OrgsVdcVm_Schema");

const Gateway_Schema = require("./data/schemas/Gateway_Schema")
const OrgsVdcVm_Schema = require("./data/schemas/OrgVdcNetwork_Schema")
const ExternalNetworks_Schema = require("./data/schemas/ExternalNetworks_Schema")


// API Calls
const { fetchOrganizations } = require('./apiCalls/fetchOrganization');
const { fetchVdcs } = require('./apiCalls/fetchVdcs');
const { fetchVdcDetails } = require('./apiCalls/fetchVdcDetails');
const { fetchVappDetails } = require('./apiCalls/fetchVappDetails');
const { fetchVmDetails } = require('./apiCalls/fetchVmsDetails');
const fetchAccessToken = require('./apiCalls/fetchAccessToken');
const { fetchAllEdgeGateways } = require('./apiCalls/fetchAllEdgeGateways');
const { fetchAllOrgVdcNetworks } = require('./apiCalls/fetchAllOrgVdcNetworks');
const { fetchAllExternalNetworks } = require('./apiCalls/fetchAllExternalNetworks');
const { fetchFirewallRulesForGateways } = require('./apiCalls/fetchFirewallRules');
const config = require('./config');

logger.info(`*****************************************Starting vMatrix Server*****************************************`);

const app = express();
const PORT = 3000;

// Fetch Access Token at Startup
(async () => {
  try {
    await fetchAccessToken();
    logger.info(`Access Token fetched successfully`);
    logger.info(`Token is: ${config.accessToken}`);
  } catch (error) {
    logger.error(`Error fetching access token: ${error.message} . Are you on Correct Network?`);
  }
})();

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  req.ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  next();
});

app.use(
  cors({
    origin: function (origin, callback) {
      
      callback(null, true);
    },
    credentials: true, 
  })
);
app.use(cookieParser()); 



app.use('/auth', authRouter);
app.use('/api/cron', authMiddleware, cronRoutes);
app.use('/session',authMiddleware ,sessionRoutes);
//*********Cron jobs service *********/



const startCronJobs = async () => {
  try {
    const jobs = await TopologyJob.find();

    if (jobs.length === 0) {
      logger.info('[CRON_JOB] No cron jobs found in the database.');
      return;
    }

    logger.info(`[CRON_JOB] Found ${jobs.length} cron job(s). Executing them...`);

    await Promise.all(
      jobs.map(async (job) => {
        logger.info(`[CRON_JOB] Executing Job: ${job.name}`);

        const orgDetailArray = job.topology;

        if (!Array.isArray(orgDetailArray) || orgDetailArray.length === 0) {
          logger.info('[CRON_JOB] No valid topology found for the job.');
          return;
        }

        try {
          logger.info('[CRON_JOB] Fetching topology for specified organizations.');

          const orgsWithVdc = await fetchVdcs(orgDetailArray);
          logger.info(`[CRON_JOB] Fetched VDCs for Job: ${job.name}`);

          const vdcWithVapp = await fetchVdcDetails(orgsWithVdc);
          logger.info(`[CRON_JOB] Fetched VDC details for Job: ${job.name}`);

          const vappWithVm = await fetchVappDetails(vdcWithVapp);
          logger.info(`[CRON_JOB] Fetched vApp details for Job: ${job.name}`);

          const topology = await fetchVmDetails(vappWithVm);
          logger.info(`[CRON_JOB] Fetched VM details for Job: ${job.name}`);

          const combinedName = topology.map((item) => item.name).join('-');
          const combinedUuid = topology.map((item) => item.uuid).join('/');

          const existingTopology = await OrgsVdcVm.findOne({ uuid: combinedUuid });

          if (existingTopology) {
            logger.info(`Existing topology found for UUID: ${combinedUuid}. Appending new version.`);
            existingTopology.topology.push({ timeStamp: new Date(), data: topology });
            existingTopology._savedBy = req.user.username; // Save the username
            await existingTopology.save();
          } else {
            logger.info(`No existing topology found for UUID: ${combinedUuid}. Creating a new entry.`);
            const newTopology = new OrgsVdcVm({
              name: combinedName,
              uuid: combinedUuid,
              topology: [{ timeStamp: new Date(), data: topology }],
              _savedBy: req.user.username, // Save the username
            });
            await newTopology.save();
          }

          logger.info(`[CRON_JOB] Successfully executed and saved job: ${job.name}`);
        } catch (jobError) {
          logger.error(`[CRON_JOB] Error processing job ${job.name}: ${jobError.message}`);
        }
      })
    );

    logger.info('[CRON_JOB] All jobs processed successfully.');
  } catch (error) {
    logger.error(`[CRON_JOB] Error fetching jobs from the database: ${error.message}`);
  }
};

if(1 == 2) {
  cron.schedule('*/10 * * * * *', () => {
    logger.info('Starting scheduled cron jobs...');
    startCronJobs();
  });
}




// Topology Endpoints





app.get('/api/orgs', authMiddleware, async (req, res) => {
  try {
    const orgs = await fetchOrganizations();
    logger.info(`Fetched organizations successfully from IP: ${req.ipAddress}`);
    res.json({
      id: req.user.id, 
      username: req.user.username, 
      data: orgs
    });
  } catch (error) {
    logger.error(`Error fetching organizations from IP ${req.ipAddress}: ${error.message}`);
    res.status(500).json({ 
      id: req.user.id,
      username: req.user.username, 
      error: 'Failed to fetch organizations' 
    });
  }
});



app.post('/api/topology',authMiddleware ,async (req, res) => {
  const orgDetailArray = req.body.orgs;

  if (!Array.isArray(orgDetailArray) || orgDetailArray.length === 0) {
    logger.error(`Invalid or missing 'orgs' array in request body from IP: ${req.ipAddress}`);
    return res.status(400).json({
      id: req.user.id, 
      username: req.user.username, 
      error: "Invalid or missing 'orgs' array in request body."
    });
  }

  try {
    logger.info(`Fetching topology for specified orgs from IP: ${req.ipAddress}`);
    const orgsWithVdc = await fetchVdcs(orgDetailArray);
    logger.info(`Fetched VDCs successfully from IP: ${req.ipAddress}`);
    
    const vdcWithVapp = await fetchVdcDetails(orgsWithVdc);
    logger.info(`Fetched VDC details successfully from IP: ${req.ipAddress}`);
    
    const vappWithVm = await fetchVappDetails(vdcWithVapp);
    logger.info(`Fetched vApp details successfully from IP: ${req.ipAddress}`);
    
    const topology = await fetchVmDetails(vappWithVm);
    logger.info(`Fetched VM details successfully from IP: ${req.ipAddress}`);

    const combinedName = topology.map(item => item.name).join('-');
    const combinedUuid = topology.map(item => item.uuid).join('');

    const existingTopology = await OrgsVdcVm.findOne({ uuid: combinedUuid });

    if (existingTopology) {
      logger.info(`Existing topology found for UUID: ${combinedUuid}. Appending new version.`);
      existingTopology.topology.push({ timeStamp: new Date(), data: topology });
      existingTopology._savedBy = req.user.username; // Save the username
      await existingTopology.save();
    } else {
      logger.info(`No existing topology found for UUID: ${combinedUuid}. Creating a new entry.`);
      const newTopology = new OrgsVdcVm({
        name: combinedName,
        uuid: combinedUuid,
        topology: [{ timeStamp: new Date(), data: topology }],
       
      });
      newTopology._savedBy = req.user.username
      await newTopology.save();
    }

    res.json({
      id: req.user.id,
      username: req.user.username,
      data: topology
    });
  } catch (error) {
    logger.error(`Error fetching topology from IP ${req.ipAddress}: ${error.message}`);
    res.status(500).json({ 
      id: req.user.id,
      username: req.user.username, 
      error: 'Failed to fetch topology' 
    });
  }
});

app.get('/api/updateNetworkData', authMiddleware, async (req, res) => {
  try {
    logger.info('Fetching network data...');
    const gatewaysData = await fetchAllEdgeGateways();

    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16); // e.g., "2024-12-16 13:00"

    const GWRecord = new Gateway_Schema({
      name: `Gateway ${timestamp}`,
      data: gatewaysData
    });
    await GWRecord.save();

    logger.info('Fetched Edge Gateways data successfully.');


    logger.info('Fetching External networks...');
    const ExternalNetData = await fetchAllExternalNetworks();

       const ExternalNetRecord = new ExternalNetworks_Schema({
      name: `External Networks ${timestamp}`,
      data: ExternalNetData
    });
    await ExternalNetRecord.save();



    logger.info('Fetched External Networks data successfully.');

    const orgVdcNetworksData = await fetchAllOrgVdcNetworks(gatewaysData);

    const VdcNetworksRecord = new OrgsVdcVm_Schema({
      name: `OrgVdcNetwork ${timestamp}`,
      data: orgVdcNetworksData
    });
    await VdcNetworksRecord.save();

    

    logger.info('Fetched Org VDC Networks data successfully.');

    res.status(200).json({
      id: req.user.id,
      username: req.user.username
    });

    logger.info('Network data sent successfully.');
  } catch (error) {
    logger.error('Error fetching network data:', error.message);
    res.status(500).json({
      id: req.user.id,
      username: req.user.username,
      message: 'Failed to fetch network data.',
      error: error.message
    });
  }
});

app.get('/api/gatewayRules', authMiddleware, async (req, res) => {
  const { gatewayName } = req.query; // Extract gateway name from query parameter

  try {
    // Fetch the latest record from GatewaySchema
    const latestRecord = await GatewaySchema.findOne()
      .sort({ createdAt: -1 }) // Get the latest record
      .exec();

    if (!latestRecord || !latestRecord.data) {
      return res.status(404).json({ error: 'No gateway data found.' });
    }

    const gateways = latestRecord.data; // Array of gateways with firewall and NAT rules

    if (gatewayName) {
      // Find the specific gateway by name
      const specificGateway = gateways.find(gateway => gateway.name === gatewayName);

      if (!specificGateway) {
        return res.status(404).json({ error: `Gateway '${gatewayName}' not found.` });
      }

      return res.status(200).json({
        gatewayName: specificGateway.name,
        firewallRules: specificGateway.firewallRules || [],
        natRules: specificGateway.natRules || []
      });
    }

    // If no gatewayName is provided, return all gateways
    return res.status(200).json({
      gateways: gateways.map(gateway => ({
        gatewayName: gateway.name,
        firewallRules: gateway.firewallRules || [],
        natRules: gateway.natRules || []
      }))
    });

  } catch (error) {
    logger.error(`Error fetching gateway rules: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Start the Server;
app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
