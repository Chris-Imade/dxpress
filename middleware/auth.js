const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Authentication middleware
exports.isAuthenticated = async (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies.token;

    if (!token) {
      return res.redirect("/admin/login");
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    );

    // Find user
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      res.clearCookie("token");
      return res.redirect("/admin/login");
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.clearCookie("token");
    res.redirect("/admin/login");
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
