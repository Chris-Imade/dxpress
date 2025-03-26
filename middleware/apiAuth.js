/**
 * API Authentication Middleware
 * Validates API keys for protected routes
 */

// This would come from your database in a real application
const validApiKeys = [
  // Test API key for development
  "dxp_test_12345678",
  // Production API key example
  "dxp_live_abcdefgh",
];

/**
 * Middleware to authenticate API requests using API key
 */
const authenticateApiKey = (req, res, next) => {
  // Get API key from request headers
  const apiKey = req.headers["x-api-key"];

  // Check if API key is present
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: "API key is required",
    });
  }

  // Validate API key
  if (!validApiKeys.includes(apiKey)) {
    return res.status(403).json({
      success: false,
      message: "Invalid API key",
    });
  }

  // If API key is valid, proceed to the next middleware
  next();
};

module.exports = authenticateApiKey;
