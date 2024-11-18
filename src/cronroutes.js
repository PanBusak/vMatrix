const express = require('express');
const router = express.Router();
const TopologyJob = require("./data/schemas/Topologyjob_Schema");
const logger = require('./logger');

// Add a new cron job
router.post('/add-cron-jobs', async (req, res) => {
  const { name, schedule, topology } = req.body;

  if (!name || !schedule || !topology) {
    return res.status(400).json({ error: 'Name, schedule, and topology are required' });
  }

  try {
    const newJob = new TopologyJob({ name, topology });
    newJob._savedBy = "Stevko";
    await newJob.save();

    res.status(201).json({ message: 'Cron job added successfully', job: newJob });
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
  const { name, topology, schedule } = req.body;

  try {
    const job = await TopologyJob.findById(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (name) job.name = name;
    if (topology) job.topology = topology;
    if (schedule) job.schedule = schedule;

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
