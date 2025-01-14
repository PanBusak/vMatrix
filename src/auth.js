const jwt = require('jsonwebtoken');
const config = require('./config');

module.exports = (req, res, next) => {
  // Check if authentication is disabled
  if (config.disableAuth) {
    req.user = { id: 'guest', role: 'guest' }; // Example guest user
    return next();
  }

  // Get token from either Authorization header or cookies
  let token = req.headers['authorization']?.split(' ')[1] || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded token payload to request
    next(); // Proceed to next middleware
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized, token invalid' });
  }
};
