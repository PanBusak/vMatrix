const express = require('express');
const protect = require('./authMiddleware'); // Middleware for authentication
const User = require('./User'); // User model

const router = express.Router();

// Get session state (including dark mode)
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id); // Use authenticated user's ID
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ darkMode: user.darkMode }); // Send dark mode state
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve session', error: error.message });
  }
});

// Update session state (dark mode)
router.post('/', protect, async (req, res) => {
  const { darkMode } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { darkMode },
      { new: true }
    );
    res.json({ message: 'Dark mode updated', darkMode: user.darkMode });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update session', error: error.message });
  }
});

module.exports = router;
