const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const expressLayouts = require("express-ejs-layouts");
const cookieParser = require("cookie-parser");
const session = require("express-session");
// const ejsLocals = require("ejs-locals");
require("dotenv").config();

// Import routes
const indexRoutes = require("./routes/index");
const shipmentRoutes = require("./routes/shipment");
const serviceRoutes = require("./routes/service");
const aboutRoutes = require("./routes/about");
const contactRoutes = require("./routes/contact");
const blogRoutes = require("./routes/blog");
const teamRoutes = require("./routes/team");
const projectRoutes = require("./routes/project");
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");
const apiRoutes = require("./routes/api");

// Initialize Express app
const app = express();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/dxpress")
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.error("MongoDB connection error:", err));

// Set view engine
//app.engine("ejs", ejsLocals); // Use ejs-locals for layout, partial and block templates
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/admin", express.static(path.join(__dirname, "public/admin")));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// Setup express-ejs-layouts
app.use(expressLayouts);
app.set("layout", "layouts/main");

// Middleware to disable layouts for admin routes
app.use((req, res, next) => {
  if (req.path.startsWith("/admin")) {
    res.locals.layout = false;
  }
  next();
});

// HTML extension redirect middleware
app.use((req, res, next) => {
  if (req.path.endsWith(".html")) {
    const withoutHtml = req.path.slice(0, -5);
    const query = Object.keys(req.query).length
      ? `?${new URLSearchParams(req.query)}`
      : "";
    return res.redirect(301, `${withoutHtml}${query}`);
  }
  next();
});

// Routes
app.use("/", indexRoutes);
app.use("/shipment", shipmentRoutes);
app.use("/services", serviceRoutes);
app.use("/about", aboutRoutes);
app.use("/contact", contactRoutes);
app.use("/blog", blogRoutes);
app.use("/team", teamRoutes);
app.use("/project", projectRoutes);
app.use("/admin", adminRoutes);
app.use("/auth", authRoutes);
app.use("/api", apiRoutes);

// 404 handler
app.use((req, res) => {
  if (req.path.startsWith("/admin")) {
    return res.status(404).render("admin/404", {
      title: "404 - Page Not Found",
      path: "/admin/error",
      layout: false,
    });
  }
  res.status(404).render("404", {
    title: "404 - Page Not Found",
    path: req.url,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (req.path.startsWith("/admin")) {
    return res.status(500).render("admin/500", {
      title: "500 - Server Error",
      path: "/admin/error",
      error: err,
      layout: false,
    });
  }
  res.status(500).render("500", {
    title: "500 - Server Error",
    error: err.message,
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
