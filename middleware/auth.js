const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Authentication middleware
exports.isAuthenticated = (req, res, next) => {
  try {
    // Get token from cookies
    const token = req.cookies.token;

    if (!token) {
      console.log("No authentication token found, redirecting to login");
      req.session.successMessage = "Please log in to access this page";
      return res.redirect("/admin/login");
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
      req.session.successMessage =
        "Your session has expired. Please log in again.";
      return res.redirect("/admin/login");
    }

    // Get user from database (to make sure they still exist and are active)
    User.findById(req.user.userId)
      .then((user) => {
        if (!user) {
          console.error("User not found for token");
          res.clearCookie("token");
          req.session.successMessage =
            "Your account could not be found. Please contact support.";
          return res.redirect("/admin/login");
        }

        if (!user.isActive) {
          console.error("User account is inactive:", user.email);
          res.clearCookie("token");
          req.session.successMessage =
            "Your account has been deactivated. Please contact support.";
          return res.redirect("/admin/login");
        }

        // Extend user object with db details
        req.user.email = user.email;
        req.user.fullName = user.fullName;

        console.log(`User authenticated: ${user.email} (${user.role})`);
        next();
      })
      .catch((err) => {
        console.error("Error finding user:", err);
        res.clearCookie("token");
        return res.redirect("/admin/login");
      });
  } catch (error) {
    console.error("Authentication error:", error);
    res.clearCookie("token");
    return res.redirect("/admin/login");
  }
};

// Admin authorization middleware
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  res.status(403).render("admin/forbidden", {
    title: "Access Denied",
    path: "/admin",
    message: "You don't have permission to access this resource",
  });
};

// Staff authorization middleware
exports.isStaff = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "staff")) {
    return next();
  }

  res.status(403).render("admin/forbidden", {
    title: "Access Denied",
    path: "/admin",
    message: "You don't have permission to access this resource",
  });
};
