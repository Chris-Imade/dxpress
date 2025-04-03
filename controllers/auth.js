const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Add timeout settings to give more time for connection
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000, // 30 seconds
  socketTimeout: 60000, // 60 seconds
  debug: true, // Enable debug output
  logger: true, // Log SMTP traffic
});

// Verify SMTP connection on initialization
transporter.verify(function (error, success) {
  if (error) {
    console.error("SMTP verification error:", error);
  } else {
    console.log("SMTP server is ready to take our messages");
    // Log the configuration for debugging
    console.log("Email configuration:");
    console.log("Host:", process.env.SMTP_HOST || "smtp.gmail.com");
    console.log("Port:", process.env.SMTP_PORT || 587);
    console.log("User:", process.env.SMTP_USER);
    console.log(
      "Pass:",
      process.env.SMTP_PASS ? "[PROVIDED]" : "[NOT PROVIDED]"
    );
  }
});

// Get login page
exports.getLoginPage = (req, res) => {
  // Check for success message in session
  const successMessage = req.session.successMessage;

  // Clear success message from session
  if (successMessage) {
    req.session.successMessage = null;
  }

  res.render("admin/login", {
    title: "Admin Login",
    path: "/admin/login",
    errorMessage: null,
    successMessage: successMessage,
    layout: false, // Don't use any layout
  });
};

// Handle login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Get any success message from session
    const successMessage = req.session.successMessage;

    // Clear success message from session
    if (successMessage) {
      req.session.successMessage = null;
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("admin/login", {
        title: "Admin Login",
        path: "/admin/login",
        errorMessage: "Invalid email or password",
        successMessage: successMessage,
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
        successMessage: successMessage,
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
        successMessage: successMessage,
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

    console.log(`User logged in successfully: ${user.email} (${user.role})`);

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
      successMessage: null,
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

// Get forgot password page
exports.getForgotPasswordPage = (req, res) => {
  res.render("admin/forgot-password", {
    title: "Forgot Password",
    path: "/admin/forgot-password",
    errorMessage: null,
    successMessage: null,
    layout: false, // Don't use any layout
  });
};

// Handle forgot password request
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Allow both support@dxpress.uk and test email
    const allowedEmails = ["support@dxpress.uk", "imadechriswebdev@gmail.com"];

    // For security, always show success message even if user doesn't exist
    if (!email || !allowedEmails.includes(email)) {
      return res.render("admin/forgot-password", {
        title: "Forgot Password",
        path: "/admin/forgot-password",
        errorMessage:
          "If this email exists, a password reset link will be sent.",
        successMessage: null,
        layout: false,
      });
    }

    // Find user by email and role (could be support@dxpress.uk or test email)
    const user = await User.findOne({ email, role: "admin" });

    if (!user) {
      // If user doesn't exist but email is valid, create a temporary admin
      if (allowedEmails.includes(email)) {
        const tempAdmin = new User({
          email: email,
          password: process.env.ADMIN_PASSWORD || "$IamtheAdmin11",
          fullName: "Admin User",
          role: "admin",
          isActive: true,
        });

        await tempAdmin.save();
        console.log(`Temporary admin created with email: ${email}`);

        // Continue with the reset process for this new user
        return handlePasswordReset(tempAdmin, req, res);
      }

      return res.render("admin/forgot-password", {
        title: "Forgot Password",
        path: "/admin/forgot-password",
        errorMessage: null,
        successMessage:
          "If this email exists, a password reset link will be sent.",
        layout: false,
      });
    }

    // Process password reset for existing user
    await handlePasswordReset(user, req, res);
  } catch (error) {
    console.error("Forgot password error:", error);
    res.render("admin/forgot-password", {
      title: "Forgot Password",
      path: "/admin/forgot-password",
      errorMessage: "An error occurred. Please try again.",
      successMessage: null,
      layout: false,
    });
  }
};

// Helper function to handle password reset
async function handlePasswordReset(user, req, res) {
  // Generate reset token (random string)
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token for storage
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set token and expiry in user document
  user.resetToken = hashedToken;
  user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
  await user.save();

  // Create reset URL with JWT for security
  const resetJwt = jwt.sign(
    { userId: user._id, token: resetToken },
    process.env.JWT_SECRET || "your_jwt_secret",
    { expiresIn: "1h" }
  );

  // req.protocol returns either 'http' or 'https' depending on the protocol used in the request
  // req.get('host') returns the host header from the request (e.g. 'localhost:3000' or 'mydomain.com')
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/admin/reset-password/${resetJwt}`;

  // Create the email message
  const message = `
    <h1>DXpress Admin Password Reset</h1>
    <p>You requested a password reset for your admin account.</p>
    <p>Click this link to set a new password:</p>
    <a href="${resetUrl}" style="padding: 10px 15px; background-color: #1a237e; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
    <p>The link will expire in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;

  try {
    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: user.email,
      subject: "DXpress Admin Password Reset",
      html: message,
    });

    console.log(`Password reset email sent to: ${user.email}`);

    res.render("admin/forgot-password", {
      title: "Forgot Password",
      path: "/admin/forgot-password",
      errorMessage: null,
      successMessage: "Password reset link sent to your email.",
      layout: false,
    });
  } catch (emailError) {
    console.error("Error sending reset email:", emailError);
    res.render("admin/forgot-password", {
      title: "Forgot Password",
      path: "/admin/forgot-password",
      errorMessage: "Failed to send reset email. Please try again.",
      successMessage: null,
      layout: false,
    });
  }
}

// Get reset password page
exports.getResetPasswordPage = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.redirect("/admin/login");
    }

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
    } catch (error) {
      return res.render("admin/reset-password", {
        title: "Reset Password",
        path: "/admin/reset-password",
        errorMessage: "Password reset link is invalid or has expired.",
        token: null,
        layout: false,
      });
    }

    // Find user by ID
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.render("admin/reset-password", {
        title: "Reset Password",
        path: "/admin/reset-password",
        errorMessage: "User not found.",
        token: null,
        layout: false,
      });
    }

    // Verify token and check if token is expired
    const hashedToken = crypto
      .createHash("sha256")
      .update(decoded.token)
      .digest("hex");

    if (user.resetToken !== hashedToken || user.resetTokenExpiry < Date.now()) {
      return res.render("admin/reset-password", {
        title: "Reset Password",
        path: "/admin/reset-password",
        errorMessage: "Password reset link is invalid or has expired.",
        token: null,
        layout: false,
      });
    }

    // If everything is valid, show reset password form
    res.render("admin/reset-password", {
      title: "Reset Password",
      path: "/admin/reset-password",
      errorMessage: null,
      token: token,
      layout: false,
    });
  } catch (error) {
    console.error("Reset password page error:", error);
    res.redirect("/admin/login");
  }
};

// Handle reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token) {
      return res.redirect("/admin/login");
    }

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
    } catch (error) {
      return res.render("admin/reset-password", {
        title: "Reset Password",
        path: "/admin/reset-password",
        errorMessage: "Password reset link is invalid or has expired.",
        token: null,
        layout: false,
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.render("admin/reset-password", {
        title: "Reset Password",
        path: "/admin/reset-password",
        errorMessage: "Passwords do not match.",
        token: token,
        layout: false,
      });
    }

    // Check password strength (at least 8 characters with mix of letters, numbers, special chars)
    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.render("admin/reset-password", {
        title: "Reset Password",
        path: "/admin/reset-password",
        errorMessage:
          "Password must be at least 8 characters with a mix of letters, numbers, and special characters.",
        token: token,
        layout: false,
      });
    }

    // Find user by ID
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.render("admin/reset-password", {
        title: "Reset Password",
        path: "/admin/reset-password",
        errorMessage: "User not found.",
        token: null,
        layout: false,
      });
    }

    // Verify token and check if token is expired
    const hashedToken = crypto
      .createHash("sha256")
      .update(decoded.token)
      .digest("hex");

    if (user.resetToken !== hashedToken || user.resetTokenExpiry < Date.now()) {
      return res.render("admin/reset-password", {
        title: "Reset Password",
        path: "/admin/reset-password",
        errorMessage: "Password reset link is invalid or has expired.",
        token: null,
        layout: false,
      });
    }

    // Update user's password and clear reset token
    user.password = password;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    console.log(`Password reset successful for user: ${user.email}`);

    // Send confirmation email
    const message = `
      <h1>DXpress Admin Password Reset Confirmation</h1>
      <p>Your password has been successfully reset.</p>
      <p>If you did not perform this action, please contact support immediately.</p>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: user.email,
      subject: "DXpress Admin Password Reset Confirmation",
      html: message,
    });

    console.log(`Password reset confirmation email sent to: ${user.email}`);

    // Store success message in session and redirect to login
    req.session.successMessage =
      "Your password has been reset successfully. Please log in with your new password.";
    res.redirect("/admin/login");
  } catch (error) {
    console.error("Reset password error:", error);
    res.render("admin/reset-password", {
      title: "Reset Password",
      path: "/admin/reset-password",
      errorMessage: "An error occurred while resetting your password.",
      token: req.body.token,
      layout: false,
    });
  }
};
