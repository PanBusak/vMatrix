const jwt = require('jsonwebtoken');
const config = require('./config');

module.exports = (req, res, next) => {
  // Check if authentication is disabled
  if (config.disableAuth) {
    // Skip authentication, but you can set a default user if needed
    req.user = { id: 'guest', role: 'guest' }; // Example user object
    return next();
  }

  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized, token invalid' });
  }
};
