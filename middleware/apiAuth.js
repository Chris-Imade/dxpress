/**
 * API Authentication Middleware
 * Validates API keys for protected routes
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");

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
const authenticateApiKey = async (req, res, next) => {
  console.log("[API Auth Middleware] Starting authentication check...");

  try {
    const apiKey = req.headers["x-api-key"];
    console.log("[API Auth Middleware] API Key present:", !!apiKey);

    if (!apiKey) {
      console.log("[API Auth Middleware] No API key provided");
      return res.status(401).json({
        success: false,
        message: "API key is required",
      });
    }

    // Check if API key is valid
    if (apiKey !== process.env.API_KEY) {
      console.log("[API Auth Middleware] Invalid API key provided");
      return res.status(401).json({
        success: false,
        message: "Invalid API key",
      });
    }

    console.log("[API Auth Middleware] API key validated successfully");

    // Get the JWT token from the Authorization header
    const authHeader = req.headers.authorization;
    console.log(
      "[API Auth Middleware] Authorization header present:",
      !!authHeader
    );

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("[API Auth Middleware] No valid Bearer token found");
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];
    console.log("[API Auth Middleware] Token extracted from header");

    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("[API Auth Middleware] Token verified successfully");

      // Get the user from the database
      const user = await User.findById(decoded.userId);
      console.log(
        "[API Auth Middleware] User lookup result:",
        user ? "Found" : "Not found"
      );

      if (!user) {
        console.log("[API Auth Middleware] User not found in database");
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      // Add the user to the request object
      req.user = user;
      console.log("[API Auth Middleware] Authentication successful");
      next();
    } catch (error) {
      console.error("[API Auth Middleware] Token verification failed:", {
        error: error.message,
        stack: error.stack,
      });
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
  } catch (error) {
    console.error("[API Auth Middleware] Unexpected error:", {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = authenticateApiKey;
