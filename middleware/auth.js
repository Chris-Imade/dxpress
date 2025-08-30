const jwt = require("jsonwebtoken");
const User = require("../models/User");

// General authentication middleware
exports.isAuthenticated = (req, res, next) => {
  try {
    // Get token from cookies
    const token = req.cookies.token;

    if (!token) {
      console.log("No authentication token found, redirecting to login");
      
      // Redirect based on the requested path
      if (req.path.startsWith('/admin')) {
        req.session.successMessage = "Please log in to access this page";
        return res.redirect("/admin/login");
      } else {
        return res.redirect("/auth");
      }
    }

    // Verify token
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your_jwt_secret"
      );
      req.user = decoded;
    } catch (tokenError) {
      console.error("Invalid token:", tokenError.message);
      res.clearCookie("token");
      
      if (req.path.startsWith('/admin')) {
        req.session.successMessage = "Your session has expired. Please log in again.";
        return res.redirect("/admin/login");
      } else {
        return res.redirect("/auth");
      }
    }

    // Get user from database (to make sure they still exist and are active)
    User.findById(req.user.userId)
      .then((user) => {
        if (!user) {
          console.error("User not found for token");
          res.clearCookie("token");
          
          if (req.path.startsWith('/admin')) {
            req.session.successMessage = "Your account could not be found. Please contact support.";
            return res.redirect("/admin/login");
          } else {
            return res.redirect("/auth");
          }
        }

        if (!user.isActive) {
          console.error("User account is inactive:", user.email);
          res.clearCookie("token");
          
          if (req.path.startsWith('/admin')) {
            req.session.successMessage = "Your account has been deactivated. Please contact support.";
            return res.redirect("/admin/login");
          } else {
            return res.redirect("/auth");
          }
        }

        // Extend user object with db details
        req.user = { ...req.user, ...user.toObject() };
        next();
      })
      .catch((error) => {
        console.error("Error finding user:", error);
        res.clearCookie("token");
        
        if (req.path.startsWith('/admin')) {
          req.session.successMessage = "An error occurred. Please try logging in again.";
          return res.redirect("/admin/login");
        } else {
          return res.redirect("/auth");
        }
      });
  } catch (error) {
    console.error("Authentication error:", error);
    res.clearCookie("token");
    
    if (req.path.startsWith('/admin')) {
      req.session.successMessage = "An error occurred. Please try logging in again.";
      return res.redirect("/admin/login");
    } else {
      return res.redirect("/auth");
    }
  }
};

// Admin role middleware
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    req.session.errorMessage = "You do not have permission to access this page";
    return res.redirect("/admin/dashboard");
  }
  next();
};

// Staff role middleware
exports.isStaff = (req, res, next) => {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "staff")) {
    req.session.errorMessage = "You do not have permission to access this page";
    return res.redirect("/admin/dashboard");
  }
  next();
};

// User role middleware (for regular users)
exports.isUser = (req, res, next) => {
  if (!req.user || req.user.role !== "user") {
    return res.redirect("/auth");
  }
  next();
};
