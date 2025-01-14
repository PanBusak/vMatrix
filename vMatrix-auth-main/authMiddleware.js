const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.cookies.token; // Get token from cookies

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
    req.user = decoded;  // Attach user ID to the request
    next();  // Proceed to the next route handler
  } catch (error) {
    return res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

module.exports = authenticate;
