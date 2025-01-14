require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const authRoutes = require('./auth'); // Authentication routes
const sessionRoutes = require('./session'); // Session routes

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser()); // Cookie parser for handling cookies

const cors = require('cors');

// Allow CORS with credentials
const allowedOrigins = ['http://localhost:5173']; // Ensure your frontend URL is correct

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Allow cookies
  })
);

// Routes
app.use('/auth', authRoutes); // Authentication routes for login, register
app.use('/session', sessionRoutes); // Mount session routes

// Database connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Database connection error:', error));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
