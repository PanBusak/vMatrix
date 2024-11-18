const express = require('express');
const router = express.Router();
const TopologyJob = require("./data/schemas/Topologyjob_Schema");
const logger = require('./logger');

// Utility function to generate dynamic name and UID
const generateDynamicNameAndUid = (topology) => {
  const dynamicName = topology.map(t => t.name).join('-');
  const dynamicUid = topology.map(t => t.uuid).join('/');
  return { dynamicName, dynamicUid };
};

// Add a new cron job
router.post('/add-cron-jobs', async (req, res) => {
  const { name, topology } = req.body;

  if (!topology || !Array.isArray(topology) || topology.length === 0) {
    return res.status(400).json({ error: 'A non-empty topology array is required' });
  }

  const { dynamicName, dynamicUid } = generateDynamicNameAndUid(topology);
  const jobName = name || dynamicName;

  try {
    const newJob = new TopologyJob({
      name: jobName,
      uuid: dynamicUid,
      topology,
    });

    newJob._savedBy = "Stevko";
    await newJob.save();

    res.status(201).json({ 
        message: 'Cron job added successfully', 
        job: {
          id: savedJob._id, // Include the MongoDB ID
          name: savedJob.name,
          uuid: savedJob.uuid,
          topology: savedJob.topology,
        } 
      });
  } catch (error) {
    logger.error(`Error adding cron job: ${error.message}`);
    res.status(500).json({ error: 'Failed to add cron job' });
  }
});

// Get all jobs
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await TopologyJob.find();
    res.json(jobs);
  } catch (error) {
    logger.error(`Error fetching jobs: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get a specific job by ID
router.get('/jobs/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const job = await TopologyJob.findById(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    logger.error(`Error fetching job with ID ${id}: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Update a cron job
router.put('/jobs/:id', async (req, res) => {
  const { id } = req.params;
  const { name, topology } = req.body;

  try {
    const job = await TopologyJob.findById(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (topology && Array.isArray(topology) && topology.length > 0) {
      const { dynamicName, dynamicUid } = generateDynamicNameAndUid(topology);
      job.topology = topology;
      job.name = name || dynamicName;
      job.uid = dynamicUid;
    } else if (name) {
      job.name = name;
    }

    await job.save();
    res.json({ message: 'Cron job updated successfully', job });
  } catch (error) {
    logger.error(`Error updating job with ID ${id}: ${error.message}`);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// Delete a cron job
router.delete('/jobs/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const job = await TopologyJob.findByIdAndDelete(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ message: 'Cron job deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting job with ID ${id}: ${error.message}`);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

module.exports = router;
