// db.js
const mongoose = require('mongoose');
const config = require('./config');
const logger = require('./logger'); // Your Winston logger

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('Connected to MongoDB successfully.');
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1); 
  }
};

module.exports = connectDB;
