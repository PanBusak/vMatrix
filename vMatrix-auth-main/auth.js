const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('./User'); // Import the User model
const jwt = require('jsonwebtoken');

const router = express.Router();

// Function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Register Route
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const user = new User({ username, email, password });
    await user.save(); // Hashing handled by the model

    const token = generateToken(user._id);
    res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'strict' });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Check if username and password are provided
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // 2. Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Username does not exist' });
    }

    // 3. Check if password matches
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Generate JWT token if login is successful
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({ message: 'Logged in successfully' });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/check', (req, res) => {
  const token = req.cookies.token; // Get the token from cookies

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' }); // Token missing
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
    res.json({ id: decoded.id }); // Return user info (if necessary)
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' }); // Token invalid
  }
});


// Logout Route (GET)
router.get('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'strict', // Prevent CSRF
  });
  res.status(200).json({ message: 'Logged out successfully' });
});




module.exports = router;
