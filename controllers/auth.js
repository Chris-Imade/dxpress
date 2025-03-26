const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Get login page
exports.getLoginPage = (req, res) => {
  res.render("admin/login", {
    title: "Admin Login",
    path: "/admin/login",
    errorMessage: null,
    layout: false, // Don't use any layout
  });
};

// Handle login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("admin/login", {
        title: "Admin Login",
        path: "/admin/login",
        errorMessage: "Invalid email or password",
        layout: false,
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.render("admin/login", {
        title: "Admin Login",
        path: "/admin/login",
        errorMessage:
          "Your account has been deactivated. Please contact administrator.",
        layout: false,
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.render("admin/login", {
        title: "Admin Login",
        path: "/admin/login",
        errorMessage: "Invalid email or password",
        layout: false,
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "1d" }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // Redirect to admin dashboard
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.error("Login error:", error);
    res.render("admin/login", {
      title: "Admin Login",
      path: "/admin/login",
      errorMessage: "An error occurred during login",
      layout: false,
    });
  }
};

// Logout
exports.logout = (req, res) => {
  res.clearCookie("token");
  res.redirect("/admin/login");
};

// Create admin user (for initial setup)
exports.createAdminUser = async (req, res) => {
  // This should only be accessible in development or through a secure admin creation process
  try {
    const { email, password, fullName } = req.body;

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin && process.env.NODE_ENV === "production") {
      return res.status(400).json({ message: "Admin user already exists" });
    }

    // Create new admin
    const admin = new User({
      email,
      password,
      fullName,
      role: "admin",
    });

    await admin.save();

    return res.status(201).json({ message: "Admin user created successfully" });
  } catch (error) {
    console.error("Create admin error:", error);
    return res.status(500).json({ message: "Error creating admin user" });
  }
};
