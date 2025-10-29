const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from the header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, 'yourSecretKey'); // 'yourSecretKey' should match the one in your login endpoint
    req.vendor = decoded.vendor; // Attach the decoded vendor data to the request object
    next();
  } catch (e) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};