const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");

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
  // Retrieve flash messages
  const errorMessage = req.session.errorMessage;
  const successMessage = req.session.successMessage;

  // Clear flash messages after retrieving them
  delete req.session.errorMessage;
  delete req.session.successMessage;

  res.render("admin/login", {
    title: "Admin Login",
    layout: "layouts/admin-login",
    errorMessage: errorMessage || null,
    successMessage: successMessage || null,
    stylesheets: "",
    scripts: "",
    path: "/admin/login",
  });
};

// Handle login
const login = async (req, res) => {
  try {
    console.log("Login attempt - Request body:", { 
      email: req.body.email, 
      hasPassword: !!req.body.password 
    });
    
    const { email, password } = req.body;

    // Find user by email
    console.log("Looking for user with email:", email);
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    console.log("User found:", user ? user._id : "None");
    
    if (!user) {
      console.log("No user found with this email");
      return res.json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check password using bcrypt comparison (passwords are already hashed in DB)
    console.log("Comparing passwords...");
    console.log("Plain password provided:", password);
    console.log("Hashed password from DB:", user.password);
    
    // Use bcrypt.compare to check plain password against hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match result:", isMatch);
    
    // Additional debug: try with trimmed password in case of whitespace issues
    if (!isMatch) {
      const trimmedMatch = await bcrypt.compare(password.trim(), user.password);
      console.log("Trimmed password match result:", trimmedMatch);
      if (trimmedMatch) {
        console.log("Password matched after trimming whitespace");
        return res.json({
          success: true,
          message: "Login successful",
          redirect: user.role === 'admin' ? "/admin/dashboard" : "/dashboard"
        });
      }
    }
    
    if (!isMatch) {
      console.log("Password comparison failed");
      return res.json({
        success: false,
        message: "Invalid email or password"
      });
    }
    
    console.log("Login successful for user:", user._id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Set token in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Return success response
    res.json({
      success: true,
      message: "Login successful",
      redirect: user.role === 'admin' ? "/admin/dashboard" : "/dashboard"
    });
  } catch (error) {
    console.error("Login error:", error);
    res.json({
      success: false,
      message: "An error occurred during login"
    });
  }
};

// Register function
const register = async (req, res) => {
  try {
    console.log("Registration attempt - Request body:", { 
      name: req.body.name, 
      email: req.body.email, 
      hasPassword: !!req.body.password,
      hasConfirmPassword: !!req.body.confirmPassword 
    });
    
    const { name, email, password, confirmPassword } = req.body;

    // Validate input
    if (!name || !email || !password || !confirmPassword) {
      console.log("Validation failed - missing fields");
      return res.json({
        success: false,
        message: "All fields are required"
      });
    }

    if (password !== confirmPassword) {
      return res.json({
        success: false,
        message: "Passwords do not match"
      });
    }

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Password must be at least 8 characters long"
      });
    }

    // Check if user already exists
    console.log("Checking for existing user with email:", email);
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    console.log("Existing user found:", existingUser ? existingUser._id : "None");
    console.log("Database query result:", existingUser);
    
    // Also check with a count to verify database connectivity
    const userCount = await User.countDocuments({ email: email.toLowerCase().trim() });
    console.log("User count for this email:", userCount);
    
    if (existingUser) {
      console.log("User already exists - blocking registration");
      return res.json({
        success: false,
        message: "An account with this email already exists"
      });
    }
    
    console.log("No existing user found - proceeding with registration");

    // Create new user (password will be hashed by the model's pre-save middleware)
    const newUser = new User({
      name,
      email: email.toLowerCase().trim(), // Ensure consistent email format
      password: password, // Don't hash here, let the model do it
      role: 'user',
      createdAt: new Date()
    });

    console.log("About to save user to database...");
    await newUser.save();
    console.log("User saved successfully to database with ID:", newUser._id);
    
    // Verify the user was actually saved
    const savedUser = await User.findById(newUser._id);
    console.log("Verification - User exists in DB:", !!savedUser);

    console.log("User created successfully:", newUser._id);

    // Send welcome email (optional) - don't let email errors block registration
    try {
      await sendWelcomeEmail(email, name);
      console.log("Welcome email sent successfully");
    } catch (emailError) {
      console.error("Welcome email error:", emailError);
      // Don't fail registration if email fails
    }

    res.json({
      success: true,
      message: "Account created successfully! You can now sign in."
    });
  } catch (error) {
    console.error("Registration error:", error);
    console.error("Error stack:", error.stack);
    res.json({
      success: false,
      message: "An error occurred during registration"
    });
  }
};

exports.login = login;
exports.register = register;

// Send welcome email function
const sendWelcomeEmail = async (email, name) => {
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: "Welcome to DXpress!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #032330, #053142); padding: 40px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to DXpress!</h1>
          <p style="margin: 10px 0 0; font-size: 16px;">Your trusted shipping partner</p>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hi ${name},</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Thank you for joining DXpress! We're excited to help you with all your shipping needs.
          </p>
          <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
            With your new account, you can:
          </p>
          <ul style="color: #666; line-height: 1.8; margin-bottom: 30px;">
            <li>Create and track shipments</li>
            <li>Compare shipping rates from multiple carriers</li>
            <li>Manage your shipping history</li>
            <li>Get real-time updates on your packages</li>
          </ul>
          <div style="text-align: center;">
            <a href="${process.env.BASE_URL || 'http://localhost:3000'}/auth" 
               style="background: linear-gradient(135deg, #032330, #053142); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Get Started
            </a>
          </div>
        </div>
        <div style="padding: 20px; text-align: center; color: #999; font-size: 14px;">
          <p>Need help? Contact us at support@dxpress.com</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Logout
const logout = (req, res) => {
  // Clear JWT cookie
  res.clearCookie('token');
  
  // Destroy session if it exists
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
    });
  }
  
  res.json({
    success: true,
    message: "Logged out successfully",
    redirect: "/"
  });
};

exports.logout = logout;

// Get reset password page
const getResetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find user with valid reset token
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.render("auth/forgot-password", {
        title: "Reset Password",
        layout: false,
        error: "Invalid or expired reset token"
      });
    }

    res.render("auth/reset-password", {
      title: "Reset Password",
      layout: false,
      token: token,
      error: null
    });
  } catch (error) {
    console.error("Get reset password error:", error);
    res.render("auth/forgot-password", {
      title: "Reset Password",
      layout: false,
      error: "An error occurred"
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.json({
        success: false,
        message: "All fields are required"
      });
    }

    if (password !== confirmPassword) {
      return res.json({
        success: false,
        message: "Passwords do not match"
      });
    }

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Password must be at least 8 characters long"
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully! You can now sign in with your new password."
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.json({
      success: false,
      message: "An error occurred during password reset"
    });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({
        success: false,
        message: "Email is required"
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: "If an account with that email exists, we've sent a password reset link."
      });
    }

    // Generate reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // Save reset token to user
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Send reset email
    try {
      await sendResetEmail(email, user.name, resetToken);
    } catch (emailError) {
      console.error("Reset email error:", emailError);
      return res.json({
        success: false,
        message: "Error sending reset email. Please try again."
      });
    }

    res.json({
      success: true,
      message: "Password reset link sent to your email!"
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.json({
      success: false,
      message: "An error occurred. Please try again."
    });
  }
};

// Send reset email function
const sendResetEmail = async (email, name, resetToken) => {
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const resetUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/auth/reset-password/${resetToken}`;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: "Password Reset - DXpress",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #032330, #053142); padding: 40px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Password Reset</h1>
          <p style="margin: 10px 0 0; font-size: 16px;">DXpress Account</p>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hi ${name},</h2>
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            We received a request to reset your password for your DXpress account.
          </p>
          <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
            Click the button below to reset your password. This link will expire in 1 hour.
          </p>
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(135deg, #032330, #053142); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
          </p>
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #1b51ff; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
        <div style="padding: 20px; text-align: center; color: #999; font-size: 14px;">
          <p>Need help? Contact us at support@dxpress.com</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

exports.forgotPassword = forgotPassword;
exports.getResetPassword = getResetPassword;
exports.resetPassword = resetPassword;

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

    // Allow both admin@dxpress.uk and test email
    const allowedEmails = ["admin@dxpress.uk", "imadechriswebdev@gmail.com"];

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

    // Find user by email and role (could be admin@dxpress.uk or test email)
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
