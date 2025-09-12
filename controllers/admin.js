const Shipment = require("../models/Shipment");
const Newsletter = require("../models/Newsletter");
const User = require("../models/User");
const Contact = require("../models/Contact");
const GlobalSettings = require("../models/GlobalSettings");
const dhlService = require("../services/dhlService");
const nodemailer = require("nodemailer");

// Create a transporter using SMTP
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
});

// Email templates
const customerShipmentConfirmationTemplate = (shipment) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a237e; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; background-color: #f5f5f5; }
        .shipment-details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .tracking-number { font-size: 18px; font-weight: bold; color: #1a237e; }
        .button { display: inline-block; background-color: #1a237e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Your Shipment is Confirmed!</h1>
        </div>
        <div class="content">
            <p>Dear ${shipment.customerName},</p>
            <p>Thank you for choosing DXpress for your shipping needs. Your shipment has been confirmed and is now being processed.</p>
            
            <div class="shipment-details">
                <p><strong>Tracking Number:</strong> <span class="tracking-number">${
                  shipment.trackingId
                }</span></p>
                <p><strong>Origin:</strong> ${shipment.origin}</p>
                <p><strong>Destination:</strong> ${shipment.destination}</p>
                <p><strong>Package Type:</strong> ${shipment.packageType}</p>
                <p><strong>Weight:</strong> ${shipment.weight} kg</p>
                <p><strong>Estimated Delivery:</strong> ${new Date(
                  shipment.estimatedDelivery
                ).toDateString()}</p>
                <p><strong>Status:</strong> ${shipment.status}</p>
            </div>
            
            <p>You can track your shipment at any time by visiting our website and entering your tracking number.</p>
            
            <a href="https://www.dxpress.uk/shipment/track?id=${
              shipment.trackingId
            }" class="button">Track Shipment</a>
            
            <p>If you have any questions about your shipment, please contact our customer service team at support@dxpress.uk or call +44 7506 323070.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>The DXpress Team</p>
        </div>
    </div>
</body>
</html>
`;

const adminShipmentNotificationTemplate = (shipment) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a237e; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; background-color: #f5f5f5; }
        .shipment-details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .customer-info { background-color: #eff6ff; padding: 15px; margin: 15px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Shipment Created</h1>
        </div>
        <div class="content">
            <p>A new shipment has been created in the system by an administrator:</p>
            
            <div class="customer-info">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> ${shipment.customerName}</p>
                <p><strong>Email:</strong> ${shipment.customerEmail}</p>
                <p><strong>Phone:</strong> ${shipment.customerPhone}</p>
            </div>
            
            <div class="shipment-details">
                <h3>Shipment Details</h3>
                <p><strong>Tracking Number:</strong> ${shipment.trackingId}</p>
                <p><strong>Origin:</strong> ${shipment.origin}</p>
                <p><strong>Destination:</strong> ${shipment.destination}</p>
                <p><strong>Package Type:</strong> ${shipment.packageType}</p>
                <p><strong>Weight:</strong> ${shipment.weight} kg</p>
                <p><strong>Dimensions:</strong> ${
                  shipment.dimensions.length || "N/A"
                } x ${shipment.dimensions.width || "N/A"} x ${
  shipment.dimensions.height || "N/A"
} cm</p>
                <p><strong>Estimated Delivery:</strong> ${new Date(
                  shipment.estimatedDelivery
                ).toDateString()}</p>
                <p><strong>Status:</strong> ${shipment.status}</p>
                <p><strong>Fragile:</strong> ${
                  shipment.fragile ? "Yes" : "No"
                }</p>
                <p><strong>Insurance Included:</strong> ${
                  shipment.insuranceIncluded ? "Yes" : "No"
                }</p>
                <p><strong>Express Delivery:</strong> ${
                  shipment.expressDelivery ? "Yes" : "No"
                }</p>
                ${
                  shipment.additionalNotes
                    ? `<p><strong>Additional Notes:</strong> ${shipment.additionalNotes}</p>`
                    : ""
                }
            </div>
            
            <p>Please log in to the admin dashboard to manage this shipment.</p>
        </div>
        <div class="footer">
            <p>This is an automated message from the DXpress shipping system.</p>
        </div>
    </div>
</body>
</html>
`;

// Email template for shipment status update
const statusUpdateTemplate = (
  shipment,
  newStatus,
  statusLocation,
  statusNote
) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a237e; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { text-align: center; padding: 20px; background-color: #f5f5f5; }
        .shipment-details { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .status-update { background-color: #e8f5e9; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .status { font-weight: bold; font-size: 16px; }
        .tracking-number { font-weight: bold; color: #1a237e; }
        .button { display: inline-block; background-color: #1a237e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Shipment Status Update</h1>
        </div>
        <div class="content">
            <p>Dear ${shipment.customerName},</p>
            <p>Your shipment with DXpress has been updated:</p>
            
            <div class="status-update">
                <p><strong>New Status:</strong> <span class="status">${newStatus}</span></p>
                <p><strong>Location:</strong> ${statusLocation}</p>
                ${
                  statusNote
                    ? `<p><strong>Notes:</strong> ${statusNote}</p>`
                    : ""
                }
                <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="shipment-details">
                <p><strong>Tracking Number:</strong> <span class="tracking-number">${
                  shipment.trackingId
                }</span></p>
                <p><strong>Origin:</strong> ${shipment.origin}</p>
                <p><strong>Destination:</strong> ${shipment.destination}</p>
                <p><strong>Estimated Delivery:</strong> ${new Date(
                  shipment.estimatedDelivery
                ).toDateString()}</p>
            </div>
            
            <p>You can track your shipment at any time by visiting our website.</p>
            
            <a href="https://www.dxpress.uk/shipment/track?id=${
              shipment.trackingId
            }" class="button">Track Shipment</a>
            
            <p>If you have any questions about your shipment, please contact our customer service team at support@dxpress.uk or call +44 7506 323070.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>The DXpress Team</p>
        </div>
    </div>
</body>
</html>
`;

// Dashboard
exports.getDashboard = async (req, res) => {
  try {
    // Core metrics
    const totalUsers = await User.countDocuments();
    const totalShipments = await Shipment.countDocuments();
    const totalSubscribers = await Newsletter.countDocuments();

    // User analytics with time-based filtering
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: startOfDay },
    });
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: startOfWeek },
    });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // Active users (users who logged in within last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: thirtyDaysAgo },
    });

    // User registration trends (last 7 days)
    const userTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const count = await User.countDocuments({
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      });

      userTrends.push({
        date: startOfDay.toISOString().split("T")[0],
        count,
      });
    }

    // Shipment analytics
    const pendingShipments = await Shipment.countDocuments({
      status: "pending",
    });
    const inTransitShipments = await Shipment.countDocuments({
      status: "in-transit",
    });
    const deliveredShipments = await Shipment.countDocuments({
      status: "delivered",
    });
    const cancelledShipments = await Shipment.countDocuments({
      status: "cancelled",
    });

    // Revenue analytics
    const shipmentsThisMonth = await Shipment.countDocuments({
      createdAt: { $gte: startOfMonth },
    });
    const avgShipmentValue = 35.5; // Average shipment value
    const totalRevenue = totalShipments * avgShipmentValue;
    const monthlyRevenue = shipmentsThisMonth * avgShipmentValue;

    // Performance metrics
    const deliveryRate =
      totalShipments > 0
        ? ((deliveredShipments / totalShipments) * 100).toFixed(1)
        : 0;
    const onTimeDeliveries = Math.floor(deliveredShipments * 0.92); // 92% on-time rate

    // System health metrics
    const uptimeHours = Math.floor(process.uptime() / 3600);
    const uptimePercent = 99.8;
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);

    // Recent activity
    const recentShipments = await Shipment.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .select("trackingId customerName origin destination status createdAt");

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .select("name email role createdAt lastLogin");

    // Top performing routes (mock data for now)
    const topRoutes = [
      { route: "London → Manchester", shipments: 45, revenue: 1597.5 },
      { route: "Birmingham → Leeds", shipments: 32, revenue: 1136.0 },
      { route: "Glasgow → Edinburgh", shipments: 28, revenue: 994.0 },
      { route: "Liverpool → Newcastle", shipments: 23, revenue: 816.5 },
      { route: "Bristol → Cardiff", shipments: 19, revenue: 674.5 },
    ];

    // Geographic distribution (mock data)
    const geographicData = [
      {
        region: "London",
        users: Math.floor(totalUsers * 0.35),
        shipments: Math.floor(totalShipments * 0.4),
      },
      {
        region: "Manchester",
        users: Math.floor(totalUsers * 0.15),
        shipments: Math.floor(totalShipments * 0.18),
      },
      {
        region: "Birmingham",
        users: Math.floor(totalUsers * 0.12),
        shipments: Math.floor(totalShipments * 0.14),
      },
      {
        region: "Leeds",
        users: Math.floor(totalUsers * 0.08),
        shipments: Math.floor(totalShipments * 0.09),
      },
      {
        region: "Glasgow",
        users: Math.floor(totalUsers * 0.1),
        shipments: Math.floor(totalShipments * 0.08),
      },
      {
        region: "Other",
        users: Math.floor(totalUsers * 0.2),
        shipments: Math.floor(totalShipments * 0.11),
      },
    ];

    const analytics = {
      // Core metrics
      totalUsers,
      totalShipments,
      totalRevenue,
      totalSubscribers,

      // User analytics
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      activeUsers,
      userTrends,

      // Shipment analytics
      pendingShipments,
      inTransitShipments,
      deliveredShipments,
      cancelledShipments,
      shipmentsThisMonth,
      monthlyRevenue,

      // Performance metrics
      deliveryRate,
      onTimeDeliveries,

      // System health
      uptimeHours,
      uptimePercent,
      memoryUsedMB,
      memoryTotalMB,

      // Activity data
      recentShipments,
      recentUsers,
      topRoutes,
      geographicData,
    };

    res.render("admin/dashboard", {
      title: "Admin Dashboard",
      layout: "layouts/admin-dashboard",
      path: "/admin/",
      analytics,
      // Legacy support
      counts: {
        shipments: totalShipments,
        pendingShipments,
        deliveredShipments,
        newsletters: totalSubscribers,
      },
      recentShipments,
      stylesheets: "",
      scripts: "",
    });
  } catch (error) {
    console.error("Get dashboard error:", error);
    res.status(500).render("admin/dashboard", {
      title: "Admin Dashboard",
      layout: "layouts/admin-dashboard",
      path: "/admin/",
      errorMessage: "Failed to load dashboard data",
      analytics: {
        totalUsers: 0,
        totalShipments: 0,
        totalRevenue: 0,
        totalSubscribers: 0,
        userTrends: [],
        recentShipments: [],
        recentUsers: [],
        topRoutes: [],
        geographicData: [],
      },
      counts: {},
      recentShipments: [],
      stylesheets: "",
      scripts: "",
    });
  }
};

// Settings
exports.getSettings = async (req, res) => {
  try {
    // Validate user exists (for access control / context)
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).render("admin/404", {
        title: "User Not Found",
        path: "/admin/error",
        layout: "layouts/admin-dashboard",
        stylesheets: "",
        scripts: "",
      });
    }

    // Load carrier settings from GlobalSettings
    const defaultCarrierSettings = {
      dhl: { 
        additionalFees: 5.0, 
        enabled: true, 
        apiIntegrated: true 
      },
      fedex: { 
        baseRate: 35.5, 
        additionalFees: 3.5, 
        enabled: false, 
        apiIntegrated: false,
        maintenanceMode: true 
      },
      ups: { 
        baseRate: 40.75, 
        additionalFees: 4.25, 
        enabled: false, 
        apiIntegrated: false,
        maintenanceMode: true 
      },
    };
    
    console.log('🔧 [DEBUG] Loading carrier settings from GlobalSettings...');
    let carrierSettings;
    try {
      carrierSettings = await GlobalSettings.getSetting("carrier_settings", defaultCarrierSettings);
      console.log('📦 [DEBUG] Loaded carrier settings:', carrierSettings);
      
      if (!carrierSettings || typeof carrierSettings !== 'object') {
        console.warn('⚠️ [DEBUG] Invalid carrier settings, using defaults');
        carrierSettings = defaultCarrierSettings;
      }
    } catch (settingsError) {
      console.error('❌ [DEBUG] Error loading carrier settings:', settingsError);
      carrierSettings = defaultCarrierSettings;
    }

    // Prepare carrier settings for the view - no dummy API calls
    const shippingRates = {
      dhl: {
        additionalFees: carrierSettings.dhl?.additionalFees || 5.0,
        enabled: carrierSettings.dhl?.enabled !== false,
        apiIntegrated: true,
        service: "DHL Express"
      },
      fedex: {
        baseRate: carrierSettings.fedex?.baseRate || 35.5,
        additionalFees: carrierSettings.fedex?.additionalFees || 3.5,
        enabled: carrierSettings.fedex?.enabled === true,
        maintenanceMode: carrierSettings.fedex?.maintenanceMode === true
      },
      ups: {
        baseRate: carrierSettings.ups?.baseRate || 40.75,
        additionalFees: carrierSettings.ups?.additionalFees || 4.25,
        enabled: carrierSettings.ups?.enabled === true,
        maintenanceMode: carrierSettings.ups?.maintenanceMode === true
      }
    };

    res.render("admin/settings", {
      title: "Settings",
      layout: "layouts/admin-dashboard",
      user,
      shippingRates,
      path: "/admin/settings",
      stylesheets: "",
      scripts: "",
      req: req,
    });
  } catch (error) {
    console.error("Get settings error:", error);
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

exports.postSettings = async (req, res) => {
  try {
    console.log('🔧 [DEBUG] POST /admin/settings called');
    console.log('📋 [DEBUG] Request body:', req.body);
    console.log('👤 [DEBUG] User ID:', req.user._id);

    const { dhl, fedex, ups } = req.body;

    // Validate input data - DHL only needs additionalFees since baseRate comes from API
    if (!dhl || !dhl.additionalFees) {
      console.error('❌ [DEBUG] Missing DHL additional fees in request body');
      return res.redirect("/admin/settings?error=1");
    }

    // Validate numeric values
    const dhlAdditionalFees = parseFloat(dhl.additionalFees);
    
    if (isNaN(dhlAdditionalFees)) {
      console.error('❌ [DEBUG] Invalid DHL additional fees value');
      return res.redirect("/admin/settings?error=1");
    }

    // Load current carrier settings
    const currentSettings = await GlobalSettings.getSetting("carrier_settings", {});
    
    // Update carrier settings - only DHL additional fees for now
    const updatedCarrierSettings = {
      ...currentSettings,
      dhl: {
        ...currentSettings.dhl,
        additionalFees: dhlAdditionalFees,
        enabled: true,
        apiIntegrated: true
      },
      fedex: {
        ...currentSettings.fedex,
        enabled: false,
        maintenanceMode: true
      },
      ups: {
        ...currentSettings.ups,
        enabled: false,
        maintenanceMode: true
      }
    };

    console.log('💰 [DEBUG] Updated carrier settings:', updatedCarrierSettings);

    // Log the settings update
    console.log('📝 [DEBUG] Creating audit log...');
    const AuditLog = require("../models/AuditLog");
    try {
      await AuditLog.create({
        userId: req.user._id,
        action: "UPDATE_CARRIER_SETTINGS",
        resource: "global_settings",
        details: { carrier_settings: updatedCarrierSettings },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
      console.log('✅ [DEBUG] Audit log created');
    } catch (auditError) {
      console.error('❌ [DEBUG] Audit log creation failed:', auditError);
      // Continue with settings update even if audit log fails
    }

    // Update GlobalSettings carrier settings
    console.log('🔧 [DEBUG] Updating GlobalSettings...');
    try {
      const result = await GlobalSettings.setSetting("carrier_settings", updatedCarrierSettings, req.user._id, "Admin updated carrier settings");
      console.log('✅ [DEBUG] GlobalSettings updated successfully:', result);
    } catch (settingsError) {
      console.error('❌ [DEBUG] GlobalSettings update failed:', settingsError);
      throw settingsError;
    }

    res.redirect("/admin/settings?success=1");
  } catch (error) {
    console.error("❌ [DEBUG] Post settings error:", error);
    res.redirect("/admin/settings?error=1");
  }
};

exports.getLogin = (req, res) => {
  res.render("admin/login", {
    title: "Admin Login",
    layout: "layouts/admin-login",
  });
};

exports.postLogin = async (req, res) => {
  // Login logic here
  res.redirect("/admin");
};

exports.postLogout = (req, res) => {
  req.session.destroy();
  res.redirect("/admin/login");
};

exports.getProfile = (req, res) => {
  res.render("admin/profile", {
    title: "Admin Profile",
    layout: "layouts/admin",
  });
};

exports.postProfile = async (req, res) => {
  // Profile update logic here
  res.redirect("/admin/profile");
};

exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const roleFilter = req.query.role || "";
    const statusFilter = req.query.status || "";

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (roleFilter) filter.role = roleFilter;
    if (statusFilter === "active") {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      filter.lastLogin = { $gte: thirtyDaysAgo };
    } else if (statusFilter === "inactive") {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      filter.$or = [
        { lastLogin: { $lt: thirtyDaysAgo } },
        { lastLogin: { $exists: false } },
      ];
    }

    // Get users with pagination
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("name email role createdAt lastLogin");

    // User statistics
    const userStats = {
      total: await User.countDocuments(),
      admins: await User.countDocuments({ role: "admin" }),
      agents: await User.countDocuments({ role: "agent" }),
      customers: await User.countDocuments({ role: "customer" }),
      activeThisMonth: await User.countDocuments({
        lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
    };

    res.render("admin/users", {
      title: "Manage Users",
      path: "/admin/users",
      layout: "layouts/admin-dashboard",
      users,
      userStats,
      totalUsers: userStats.total,
      adminUsers: userStats.admins,
      activeUsers: userStats.activeThisMonth,
      suspendedUsers: 0, // Placeholder - add suspended user count if needed
      pagination: {
        page,
        limit,
        totalPages,
        totalItems: totalUsers,
      },
      filters: {
        search,
        role: roleFilter,
        status: statusFilter,
      },
      stylesheets: "",
      scripts: "",
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).render("admin/users", {
      title: "Manage Users",
      path: "/admin/users",
      layout: "layouts/admin-dashboard",
      errorMessage: "Failed to load users",
      users: [],
      userStats: {},
      pagination: { page: 1, limit: 15, totalPages: 0, totalItems: 0 },
      filters: {},
      stylesheets: "",
      scripts: "",
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).render("admin/404", {
        title: "User Not Found",
        path: "/admin/users",
        layout: "layouts/admin-dashboard",
      });
    }

    // Get user's shipments
    const userShipments = await Shipment.find({ customerEmail: user.email })
      .sort({ createdAt: -1 })
      .limit(10);

    // User activity stats
    const shipmentStats = {
      total: await Shipment.countDocuments({ customerEmail: user.email }),
      pending: await Shipment.countDocuments({
        customerEmail: user.email,
        status: "pending",
      }),
      delivered: await Shipment.countDocuments({
        customerEmail: user.email,
        status: "delivered",
      }),
      totalSpent: userShipments.length * 35.5, // Average shipment cost
    };

    res.render("admin/user", {
      title: `User: ${user.name}`,
      path: "/admin/users",
      layout: "layouts/admin-dashboard",
      user,
      userShipments,
      shipmentStats,
      stylesheets: "",
      scripts: "",
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).render("admin/500", {
      title: "Server Error",
      path: "/admin/users",
      layout: "layouts/admin-dashboard",
      error: process.env.NODE_ENV === "production" ? null : error,
    });
  }
};

exports.postUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, role } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).redirect("/admin/users?error=User not found");
    }

    // Update user fields
    user.name = name;
    user.email = email;
    user.role = role;

    await user.save();

    res.redirect(`/admin/users/${userId}?success=User updated successfully`);
  } catch (error) {
    console.error("Update user error:", error);
    res.redirect(`/admin/users/${req.params.id}?error=Failed to update user`);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent deletion of admin users
    const user = await User.findById(userId);
    if (user && user.role === "admin") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot delete admin users" });
    }

    await User.findByIdAndDelete(userId);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};

// NOTE: Duplicate postSettings definition removed; GlobalSettings-based implementation is defined above.

// Shipments management
exports.getShipments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const statusFilter = req.query.status || "";
    const searchQuery = req.query.search || "";

    // Build filter
    const filter = {};
    if (statusFilter) filter.status = statusFilter;

    // Add search functionality
    if (searchQuery) {
      filter.$or = [
        { trackingId: { $regex: searchQuery, $options: "i" } },
        { customerName: { $regex: searchQuery, $options: "i" } },
        { customerEmail: { $regex: searchQuery, $options: "i" } },
        { customerPhone: { $regex: searchQuery, $options: "i" } },
        { origin: { $regex: searchQuery, $options: "i" } },
        { destination: { $regex: searchQuery, $options: "i" } },
        { additionalNotes: { $regex: searchQuery, $options: "i" } },
        { packageType: { $regex: searchQuery, $options: "i" } },
      ];
    }

    // Count total documents with filter
    const totalShipments = await Shipment.countDocuments(filter);
    const totalPages = Math.ceil(totalShipments / limit);

    // Get shipments with pagination
    const shipments = await Shipment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render("admin/shipments", {
      title: "Manage Shipments",
      path: "/admin/shipments",
      layout: "layouts/admin-dashboard",
      shipments,
      pagination: {
        page,
        limit,
        totalPages,
        totalItems: totalShipments,
      },
      searchQuery,
      statusFilter,
      req: req,
      filters: { status: statusFilter },
      stylesheets: "",
      scripts: "",
    });
  } catch (error) {
    console.error("Get shipments error:", error);
    res.status(500).render("admin/shipments", {
      title: "Manage Shipments",
      path: "/admin/shipments",
      errorMessage: "Failed to load shipments",
      shipments: [],
      pagination: {
        page: 1,
        limit: 10,
        totalPages: 0,
        totalItems: 0,
      },
      searchQuery: req.query.search || "",
      statusFilter: "",
      req: req,
      filters: { status: "" },
      layout: "layouts/admin-dashboard",
      stylesheets: "",
      scripts: "",
    });
  }
};

// Get create shipment page
exports.getCreateShipment = (req, res) => {
  res.render("admin/create-shipment", {
    title: "Create New Shipment",
    path: "/admin/shipments/create",
    layout: "layouts/admin-dashboard",
    errorMessage: null,
    formData: {},
    stylesheets: "",
    scripts: "",
  });
};

// Create shipment
exports.createShipment = async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      origin,
      destination,
      estimatedDelivery,
      weight,
      length,
      width,
      height,
      packageType,
      isFragile,
      insurance,
      expressDelivery,
      additionalNotes,
    } = req.body;

    // Create new shipment object - tracking ID will be automatically generated by the model's pre-save hook
    const shipment = new Shipment({
      customerName,
      customerEmail,
      customerPhone,
      origin,
      destination,
      estimatedDelivery: new Date(estimatedDelivery),
      weight,
      dimensions: {
        length,
        width,
        height,
      },
      packageType,
      fragile: isFragile === "on",
      insuranceIncluded: insurance === "on",
      expressDelivery: expressDelivery === "on",
      additionalNotes,
      statusHistory: [
        {
          status: "Pending",
          location: origin,
          note: "Shipment created by admin",
          timestamp: new Date(),
        },
      ],
      status: "Pending",
    });

    // Save to database
    await shipment.save();
    console.log(
      `Created new shipment with tracking ID: ${shipment.trackingId}`
    );

    // Send email notifications
    try {
      // Send confirmation to customer
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: customerEmail,
        subject: "Your Shipment Confirmation - DXpress",
        html: customerShipmentConfirmationTemplate(shipment),
      });
      console.log(`Sent confirmation email to customer: ${customerEmail}`);

      // Send notification to admin
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: "admin@dxpress.uk",
        subject: `New Shipment Created - ${shipment.trackingId}`,
        html: adminShipmentNotificationTemplate(shipment),
      });
      console.log("Sent notification email to admin");
    } catch (emailError) {
      console.error("Error sending shipment emails:", emailError);
      // Continue processing even if email fails
    }

    // Redirect to shipments page with success message
    res.redirect(
      "/admin/shipments?message=Shipment created successfully! Tracking ID: " +
        shipment.trackingId
    );
  } catch (error) {
    console.error("Create shipment error:", error);
    res.render("admin/create-shipment", {
      title: "Create New Shipment",
      path: "/admin/shipments/create",
      errorMessage:
        "An error occurred while creating the shipment: " + error.message,
      formData: req.body,
      layout: false,
    });
  }
};

// Get edit shipment page
exports.getEditShipment = async (req, res) => {
  try {
    const shipmentId = req.params.id;
    const shipment = await Shipment.findById(shipmentId);

    if (!shipment) {
      return res.status(404).redirect("/admin/shipments");
    }

    res.render("admin/edit-shipment", {
      title: "Edit Shipment",
      path: "/admin/shipments/edit",
      layout: "layouts/admin-dashboard",
      shipment,
      errorMessage: null,
      stylesheets: "",
      scripts: "",
      req: req,
    });
  } catch (error) {
    console.error("Get edit shipment error:", error);
    res.status(500).redirect("/admin/shipments");
  }
};

// Update shipment
exports.updateShipment = async (req, res) => {
  try {
    const shipmentId = req.params.id;

    // Debug: Log form data
    console.log("Form data received:", JSON.stringify(req.body, null, 2));

    const {
      customerName,
      customerEmail,
      customerPhone,
      originAddress,
      originCity,
      originPostalCode,
      originCountry,
      destinationAddress,
      destinationCity,
      destinationPostalCode,
      destinationCountry,
      estimatedDelivery,
      status,
      statusLocation,
      statusNote,
      weight,
      length,
      width,
      height,
      packageType,
      isFragile,
      insurance,
      expressDelivery,
      additionalNotes,
      statusHistory,
    } = req.body;

    const shipment = await Shipment.findById(shipmentId);

    if (!shipment) {
      return res.status(404).redirect("/admin/shipments");
    }

    // Store previous status to check if it changed
    const previousStatus = shipment.status;

    // Update shipment
    shipment.customerName = customerName;
    shipment.customerEmail = customerEmail;
    shipment.customerPhone = customerPhone;
    shipment.origin = {
      address: originAddress,
      city: originCity,
      postalCode: originPostalCode,
      country: originCountry,
    };
    shipment.destination = {
      address: destinationAddress,
      city: destinationCity,
      postalCode: destinationPostalCode,
      country: destinationCountry,
    };
    shipment.estimatedDelivery = new Date(estimatedDelivery);
    shipment.weight = weight;
    shipment.dimensions = {
      length,
      width,
      height,
    };
    shipment.packageType = packageType;
    shipment.fragile = isFragile === "on";
    shipment.insuranceIncluded = insurance === "on";
    shipment.expressDelivery = expressDelivery === "on";
    shipment.additionalNotes = additionalNotes;
    shipment.status = status;

    // Handle status history entries from the form
    try {
      // Get all the statusHistory entries from the request body
      const historyEntries = {};

      // Process form fields to collect status history entries
      for (const key in req.body) {
        // Check if this is a status history field (e.g., statusHistory[0][date])
        if (key.startsWith("statusHistory[") && key.includes("][")) {
          // Parse the index and field name from the key
          // Example: statusHistory[0][date] -> index=0, field=date
          const indexMatch = key.match(/\[(\d+)\]\[([^\]]+)\]/);
          if (indexMatch) {
            const index = indexMatch[1];
            const field = indexMatch[2];

            // Initialize the history entry object if needed
            if (!historyEntries[index]) {
              historyEntries[index] = {};
            }

            // Add the field value to the entry
            historyEntries[index][field] = req.body[key];
          }
        }
      }

      // Convert the collected entries to an array
      const newStatusHistory = Object.values(historyEntries)
        .filter((entry) => entry.date && entry.status && entry.location) // Ensure valid entries
        .map((entry) => ({
          status: entry.status,
          location: entry.location,
          timestamp: new Date(entry.date),
          note: entry.note || "",
        }));

      // Sort by date (newest first)
      if (newStatusHistory.length > 0) {
        newStatusHistory.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );

        // Update the shipment history
        shipment.statusHistory = newStatusHistory;

        console.log(
          "New status history:",
          JSON.stringify(newStatusHistory, null, 2)
        );
      } else if (status !== previousStatus) {
        // If status changed but no valid history entries, add a default one
        shipment.statusHistory.unshift({
          status,
          location: statusLocation || `${originCity}, ${originCountry}`,
          note: statusNote || "",
          timestamp: new Date(),
        });

        // Send status update email to customer
        try {
          await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: shipment.customerEmail,
            subject: `Your Shipment Status Update - ${shipment.trackingId}`,
            html: statusUpdateTemplate(
              shipment,
              status,
              statusLocation || origin,
              statusNote || ""
            ),
          });
        } catch (emailError) {
          console.error("Error sending status update email:", emailError);
          // Continue processing even if email fails
        }
      }
    } catch (historyError) {
      console.error("Error processing status history:", historyError);
      // Continue processing even if status history update fails
    }

    await shipment.save();

    // Debug: Log updated shipment
    console.log(
      "Shipment after update:",
      JSON.stringify(
        {
          id: shipment._id,
          trackingId: shipment.trackingId,
          status: shipment.status,
          statusHistory: shipment.statusHistory,
        },
        null,
        2
      )
    );

    // Redirect to shipments page with success message
    res.redirect(
      "/admin/shipments?message=Shipment updated successfully! Tracking ID: " +
        shipment.trackingId
    );
  } catch (error) {
    console.error("Update shipment error:", error);
    const shipment = await Shipment.findById(req.params.id);
    res.render("admin/edit-shipment", {
      title: "Edit Shipment",
      path: "/admin/shipments/edit",
      layout: "layouts/admin-dashboard",
      shipment,
      errorMessage:
        "An error occurred while updating the shipment: " + error.message,
      stylesheets: "",
      scripts: "",
      req: req,
    });
  }
};

// Delete shipment
exports.deleteShipment = async (req, res) => {
  try {
    const shipmentId = req.params.id;
    await Shipment.findByIdAndDelete(shipmentId);

    res.redirect("/admin/shipments?message=Shipment deleted successfully");
  } catch (error) {
    console.error("Delete shipment error:", error);
    res.redirect("/admin/shipments?message=Failed to delete shipment");
  }
};

// Newsletter subscribers
exports.getNewsletterSubscribers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    // Build filter
    const filter = {};
    if (search) filter.email = { $regex: search, $options: "i" };

    // Count total documents with filter
    const totalSubscribers = await Newsletter.countDocuments(filter);
    const totalPages = Math.ceil(totalSubscribers / limit);

    // Get subscribers with pagination
    const subscribers = await Newsletter.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render("admin/newsletter", {
      title: "Newsletter Subscribers",
      path: "/admin/newsletter",
      layout: "layouts/admin-dashboard",
      subscribers,
      currentPage: page,
      totalPages,
      limit,
      search,
      searchQuery: search,
      totalSubscribers,
      // Newsletter analytics data
      campaignsSent: 12,
      openRate: 68.5,
      clickRate: 24.3,
      stylesheets: "",
      scripts: "",
    });
  } catch (error) {
    console.error("Get newsletter subscribers error:", error);
    res.status(500).render("admin/newsletter", {
      title: "Newsletter Subscribers",
      path: "/admin/newsletter",
      errorMessage: "Failed to load subscribers",
      subscribers: [],
      searchQuery: req.query.search || "",
      totalSubscribers: 0,
      campaignsSent: 0,
      openRate: 0,
      clickRate: 0,
      pagination: {
        page: 1,
        limit: 10,
        totalPages: 0,
        totalItems: 0,
      },
      layout: "layouts/admin-dashboard",
      stylesheets: "",
      scripts: "",
    });
  }
};

// Delete newsletter subscriber
exports.deleteNewsletterSubscriber = async (req, res) => {
  try {
    const subscriberId = req.params.id;
    await Newsletter.findByIdAndDelete(subscriberId);

    res.status(200).json({ message: "Subscriber deleted successfully" });
  } catch (error) {
    console.error("Delete subscriber error:", error);
    res.status(500).json({ message: "Failed to delete subscriber" });
  }
};

// Export newsletter subscribers to CSV
exports.exportNewsletterCSV = async (req, res) => {
  try {
    // Get all subscribers
    const subscribers = await Newsletter.find().sort({ createdAt: -1 });

    // Create CSV content
    let csvContent = "Email,Subscribed On\n";

    subscribers.forEach((subscriber) => {
      const subscribedDate = new Date(
        subscriber.createdAt
      ).toLocaleDateString();
      csvContent += `${subscriber.email},"${subscribedDate}"\n`;
    });

    // Set response headers for CSV download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="newsletter_subscribers_${Date.now()}.csv"`
    );

    // Send CSV content
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Export newsletter CSV error:", error);
    res.status(500).json({ message: "Failed to export subscribers" });
  }
};

// API endpoint for sending newsletters
exports.sendNewsletter = async (req, res) => {
  try {
    const { subject, content, campaignName, sendDate } = req.body;

    if (!subject || !content) {
      return res
        .status(400)
        .json({ success: false, message: "Subject and content are required" });
    }

    // Get all newsletter subscribers
    const subscribers = await Newsletter.find();

    if (subscribers.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No subscribers found" });
    }

    // Newsletter template
    const newsletterTemplate = (content, subject) => `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #032330; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>DXpress Newsletter</h1>
            <h2>${subject}</h2>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>© 2025 DXpress. All rights reserved.</p>
            <p>You received this email because you subscribed to our newsletter.</p>
            <p><a href="#">Unsubscribe</a></p>
        </div>
    </body>
    </html>
    `;

    // Send newsletter to all subscribers
    let successCount = 0;
    const emailPromises = subscribers.map(async (subscriber) => {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: subscriber.email,
          subject: `DXpress Newsletter: ${subject}`,
          html: newsletterTemplate(content, subject),
        });
        successCount++;
      } catch (emailError) {
        console.error(
          `Failed to send newsletter to ${subscriber.email}:`,
          emailError
        );
      }
    });

    await Promise.all(emailPromises);

    res.json({
      success: true,
      message: `Newsletter sent successfully to ${successCount} subscribers`,
      count: successCount,
    });
  } catch (error) {
    console.error("Send newsletter error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to send newsletter" });
  }
};

// API endpoint for broadcasting notifications
exports.broadcastNotification = async (req, res) => {
  console.log("🚀 [DEBUG] broadcastNotification called");
  console.log("📝 [DEBUG] Request body:", JSON.stringify(req.body, null, 2));
  console.log("👤 [DEBUG] User:", req.user ? { id: req.user._id, email: req.user.email } : "No user");
  
  try {
    const { title, message, type, priority, actionUrl, actionText, expiresAt } =
      req.body;
    const AdminNotification = require("../models/AdminNotification");
    const Notification = require("../models/Notification");
    const User = require("../models/User");

    console.log("📋 [DEBUG] Extracted fields:", { title, message, type, priority, actionUrl, actionText, expiresAt });

    if (!title || !message) {
      console.log("❌ [DEBUG] Validation failed: Missing title or message");
      return res
        .status(400)
        .json({ success: false, message: "Title and message are required" });
    }

    console.log("🔍 [DEBUG] Finding users to send notification to...");
    // Get all users to send notification to (exclude admins)
    const users = await User.find({ role: { $ne: "admin" } }, "_id email name");
    console.log(`👥 [DEBUG] Found ${users.length} users:`, users.map(u => ({ id: u._id, email: u.email })));

    console.log("💾 [DEBUG] Creating admin notification record...");
    // Create admin notification record
    const adminNotification = await AdminNotification.create({
      title,
      message,
      type: type || "info",
      actionUrl,
      actionText,
      sentBy: req.user._id,
      sentToCount: users.length,
    });
    console.log("✅ [DEBUG] Admin notification created:", { id: adminNotification._id, title: adminNotification.title });

    console.log("📤 [DEBUG] Creating individual user notifications...");
    // Create individual notifications for each user
    const userNotifications = await Promise.all(
      users.map(async (user, index) => {
        console.log(`📨 [DEBUG] Creating notification ${index + 1}/${users.length} for user:`, user.email);
        return await Notification.create({
          userId: user._id,
          title,
          message,
          type: type || "info",
          actionUrl,
          actionText,
          category: "system_announcement",
          priority: priority || "medium",
          pageUrl: actionUrl,
        });
      })
    );
    console.log(`✅ [DEBUG] Created ${userNotifications.length} user notifications`);

    console.log("🔌 [DEBUG] Broadcasting via WebSocket...");
    // Broadcast via WebSocket
    const io = req.app.get("io");
    if (io) {
      const notification = {
        id: adminNotification._id,
        title,
        message,
        type: type || "info",
        actionUrl,
        actionText,
        timestamp: new Date().toISOString(),
        read: false,
      };

      console.log("📡 [DEBUG] Emitting WebSocket notification:", notification);
      io.emit("new-notification", notification);
      console.log("✅ [DEBUG] WebSocket notification emitted");
    } else {
      console.log("⚠️ [DEBUG] No WebSocket instance found");
    }

    console.log("🔄 [DEBUG] Updating delivery count...");
    // Update delivery count
    await AdminNotification.findByIdAndUpdate(adminNotification._id, {
      deliveredCount: users.length,
    });
    console.log("✅ [DEBUG] Delivery count updated");

    const response = {
      success: true,
      message: "Notification sent successfully",
      count: users.length,
    };
    console.log("🎉 [DEBUG] Sending success response:", response);
    res.json(response);
  } catch (error) {
    console.error("💥 [DEBUG] Broadcast notification error:", error);
    console.error("📊 [DEBUG] Error stack:", error.stack);
    res
      .status(500)
      .json({ success: false, message: "Failed to send notification", error: error.message });
  }
};

// Helper functions for notifications
const getNotificationIcon = (type) => {
  const icons = {
    info: 'info-circle',
    success: 'check-circle',
    warning: 'exclamation-triangle',
    error: 'times-circle',
    feature: 'star',
    system: 'cog',
    shipment: 'box',
    payment: 'credit-card',
    security: 'shield-alt',
    user: 'user'
  };
  return icons[type] || 'bell';
};

const getNotificationColor = (type) => {
  const colors = {
    info: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    shipment: '#8b5cf6',
    payment: '#06b6d4',
    user: '#6366f1',
    system: '#6b7280'
  };
  return colors[type] || '#6b7280';
};

// Get notifications page
exports.getNotifications = async (req, res) => {
  try {
    const AdminNotification = require("../models/AdminNotification");
    const Notification = require("../models/Notification");

    // Get real notification stats
    const totalSent = await AdminNotification.aggregate([
      { $group: { _id: null, total: { $sum: "$sentToCount" } } },
    ]);

    const thisMonth = await AdminNotification.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$sentToCount" } } },
    ]);

    const activeUsers = await User.countDocuments({ role: { $ne: "admin" } });

    const deliveryStats = await AdminNotification.aggregate([
      {
        $group: {
          _id: null,
          totalSent: { $sum: "$sentToCount" },
          totalDelivered: { $sum: "$deliveredCount" },
        },
      },
    ]);

    const deliveryRate =
      deliveryStats.length > 0 && deliveryStats[0].totalSent > 0
        ? (
            (deliveryStats[0].totalDelivered / deliveryStats[0].totalSent) *
            100
          ).toFixed(1)
        : 100;

    const notificationStats = {
      totalSent: totalSent.length > 0 ? totalSent[0].total : 0,
      thisMonth: thisMonth.length > 0 ? thisMonth[0].total : 0,
      activeUsers,
      deliveryRate: parseFloat(deliveryRate),
    };

    // Get recent notifications from database
    const recentNotifications = await AdminNotification.find()
      .populate("sentBy", "name email")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.render("admin/notifications", {
      title: "Notifications",
      layout: "layouts/admin-dashboard",
      path: "/admin/notifications",
      notificationStats,
      recentNotifications,
      getNotificationIcon,
      getNotificationColor,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).render("admin/notifications", {
      title: "Notifications",
      layout: "layouts/admin-dashboard",
      path: "/admin/notifications",
      notificationStats: {
        totalSent: 0,
        thisMonth: 0,
        activeUsers: 0,
        deliveryRate: 0
      },
      recentNotifications: [],
      getNotificationIcon,
      getNotificationColor,
    });
  }
};
