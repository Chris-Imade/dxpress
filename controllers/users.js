const User = require("../models/User");
const Shipment = require("../models/Shipment");
const AuditLog = require("../models/AuditLog");
const bcrypt = require("bcryptjs");

// Get all users (admin view)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    
    // Get user statistics
    const totalUsers = users.length;
    const adminUsers = users.filter(user => user.role === 'admin').length;
    const activeUsers = users.filter(user => user.status !== 'suspended').length;
    const suspendedUsers = users.filter(user => user.status === 'suspended').length;
    
    // Get shipment counts for each user
    for (let user of users) {
      const shipmentCount = await Shipment.countDocuments({ customerEmail: user.email });
      user.shipmentCount = shipmentCount;
    }

    res.render("admin/users", {
      title: "User Management",
      path: "/admin/users",
      layout: "layouts/admin-dashboard",
      users,
      totalUsers,
      adminUsers,
      activeUsers,
      suspendedUsers,
      stylesheets: "",
      scripts: "",
      req: req,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).render("admin/500", {
      title: "Server Error",
      path: "/500",
      layout: "layouts/admin-dashboard",
      error: process.env.NODE_ENV === "production" ? null : error,
      stylesheets: "",
      scripts: "",
    });
  }
};

// Create new user
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.redirect("/admin/users?error=User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
      status: 'active',
    });

    await user.save();

    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      action: "CREATE_USER",
      resource: "user",
      resourceId: user._id.toString(),
      details: {
        createdUserEmail: email,
        createdUserRole: role,
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.redirect("/admin/users?message=User created successfully");
  } catch (error) {
    console.error("Create user error:", error);
    res.redirect("/admin/users?error=Failed to create user: " + error.message);
  }
};

// Suspend user
exports.suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ error: "Cannot suspend admin users" });
    }

    user.status = 'suspended';
    await user.save();

    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      action: "SUSPEND_USER",
      resource: "user",
      resourceId: id,
      details: {
        suspendedUserEmail: user.email,
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Suspend user error:", error);
    res.status(500).json({ error: "Failed to suspend user" });
  }
};

// Activate user
exports.activateUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.status = 'active';
    await user.save();

    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      action: "UPDATE_USER",
      resource: "user",
      resourceId: id,
      details: {
        action: "activate",
        activatedUserEmail: user.email,
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Activate user error:", error);
    res.status(500).json({ error: "Failed to activate user" });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ error: "Cannot delete admin users" });
    }

    // Check if user has shipments
    const shipmentCount = await Shipment.countDocuments({ customerEmail: user.email });
    if (shipmentCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete user with ${shipmentCount} shipments. Suspend instead.` 
      });
    }

    await User.findByIdAndDelete(id);

    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      action: "DELETE_USER",
      resource: "user",
      resourceId: id,
      details: {
        deletedUserEmail: user.email,
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// Get edit user page
exports.getEditUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).redirect("/admin/users?error=User not found");
    }

    res.render("admin/edit-user", {
      title: "Edit User",
      path: "/admin/users/edit",
      layout: "layouts/admin-dashboard",
      user,
      errorMessage: null,
      stylesheets: "",
      scripts: "",
      req: req,
    });
  } catch (error) {
    console.error("Get edit user error:", error);
    res.status(500).redirect("/admin/users?error=Failed to load user");
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).redirect("/admin/users?error=User not found");
    }

    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.render("admin/edit-user", {
          title: "Edit User",
          path: "/admin/users/edit",
          layout: "layouts/admin-dashboard",
          user,
          errorMessage: "Email is already taken by another user",
          stylesheets: "",
          scripts: "",
          req: req,
        });
      }
    }

    // Update user fields
    user.name = name;
    user.email = email;
    user.role = role;

    // Update password if provided
    if (password && password.trim() !== '') {
      user.password = await bcrypt.hash(password, 12);
    }

    await user.save();

    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      action: "UPDATE_USER",
      resource: "user",
      resourceId: id,
      details: {
        updatedUserEmail: email,
        updatedFields: { name, email, role, passwordChanged: !!password },
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.redirect("/admin/users?message=User updated successfully");
  } catch (error) {
    console.error("Update user error:", error);
    const user = await User.findById(req.params.id);
    res.render("admin/edit-user", {
      title: "Edit User",
      path: "/admin/users/edit",
      layout: "layouts/admin-dashboard",
      user,
      errorMessage: "Failed to update user: " + error.message,
      stylesheets: "",
      scripts: "",
      req: req,
    });
  }
};
