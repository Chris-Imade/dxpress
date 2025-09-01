const AuditLog = require("../models/AuditLog");

// Get audit logs with filtering and pagination
exports.getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    const { action, resource, dateFrom, dateTo, export: exportCsv } = req.query;

    if (action) filter.action = action;
    if (resource) filter.resource = resource;

    // Date range filter
    if (dateFrom || dateTo) {
      filter.timestamp = {};
      if (dateFrom) filter.timestamp.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999); // End of day
        filter.timestamp.$lte = endDate;
      }
    }

    // Get total count for pagination
    const totalLogs = await AuditLog.countDocuments(filter);
    const totalPages = Math.ceil(totalLogs / limit);

    // Get logs with user population
    const logs = await AuditLog.find(filter)
      .populate("userId", "name email")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    // Handle CSV export
    if (exportCsv === 'csv') {
      return this.exportLogsCSV(res, logs);
    }

    res.render("admin/audit-logs", {
      title: "Audit Logs",
      path: "/admin/audit-logs",
      layout: "layouts/admin-dashboard",
      logs,
      pagination: {
        page,
        totalPages,
        totalItems: totalLogs,
      },
      filters: {
        action: action || '',
        resource: resource || '',
        dateFrom: dateFrom || '',
        dateTo: dateTo || '',
      },
      stylesheets: "",
      scripts: "",
      req: req,
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
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

// Export logs as CSV
exports.exportLogsCSV = (res, logs) => {
  const csvHeaders = [
    'Timestamp',
    'User Name',
    'User Email',
    'Action',
    'Resource',
    'Resource ID',
    'Status',
    'IP Address',
    'Details'
  ];

  const csvRows = logs.map(log => [
    new Date(log.timestamp).toISOString(),
    log.userId ? log.userId.name || 'Unknown' : 'System',
    log.userId ? log.userId.email || 'N/A' : 'system@dxpress.com',
    log.action,
    log.resource,
    log.resourceId || 'N/A',
    log.success ? 'Success' : 'Failed',
    log.ipAddress || 'Unknown',
    log.details ? JSON.stringify(log.details) : 'N/A'
  ]);

  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csvContent);
};

// Helper function to create audit log entry
exports.createAuditLog = async (logData) => {
  try {
    const auditLog = new AuditLog(logData);
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error("Create audit log error:", error);
    // Don't throw error to prevent breaking main functionality
    return null;
  }
};
