const mongoose = require('mongoose');
const config = require('./config'); // Adjust the path if necessary
const logger = require('./logger');

const mongoUri = config.mongoUri || 'mongodb://localhost:27017/vMatrixDB'; // Update the URI as needed

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

// Event listeners for logging connection status
db.on('connected', () => {
  logger.info('Mongoose connected to MongoDB');
});

db.on('error', (error) => {
  logger.error('Mongoose connection error:', error);
});

db.on('disconnected', () => {
  logger.info('Mongoose disconnected from MongoDB');
});

module.exports = db;
