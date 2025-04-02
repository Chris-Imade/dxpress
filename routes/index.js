const express = require("express");
const router = express.Router();

// Middleware to set default variables for all routes
router.use((req, res, next) => {
  res.locals.page = "other";
  res.locals.title = "Page";
  next();
});

// Home page route
router.get("/", (req, res) => {
  res.render("index", {
    page: "home",
    title: "Home",
    layout: "layouts/main", // Update layout path
  });
});

// Services routes
router.get("/services", (req, res) => {
  res.render("service/index", {
    page: "services",
    title: "Services",
    layout: "layouts/main", // Update layout path
  });
});

router.get("/service/:slug", (req, res) => {
  res.render("service/details", {
    page: "services",
    title: "Service Details",
    layout: "layouts/main",
    serviceSlug: req.params.slug,
  });
});

// Project routes
router.get("/project", (req, res) => {
  res.render("project/index", {
    page: "project",
    title: "Projects",
    layout: "layouts/main",
  });
});

router.get("/project/:slug", (req, res) => {
  res.render("project/details", {
    page: "project",
    title: "Project Details",
    layout: "layouts/main",
    projectSlug: req.params.slug,
  });
});

// About route
router.get("/about", (req, res) => {
  res.render("about", {
    page: "about",
    title: "About Us",
    layout: "layouts/main", // Fix layout path
  });
});

// Contact route
router.get("/contact", (req, res) => {
  res.render("contact", {
    page: "contact",
    title: "Contact Us",
    layout: "layouts/main", // Fix layout path
  });
});

// Blog routes
router.get("/blog", (req, res) => {
  const blogs = [
    {
      id: 1,
      title: "Logistics Innovation",
      excerpt: "Modern solutions in logistics",
      image: "/assets/images/blog/blog1.jpg",
      date: "2024-03-15",
      author: "John Doe",
      slug: "logistics-innovation",
      category: "Innovation",
      commentCount: 5,
    },
    {
      id: 2,
      title: "Supply Chain Management",
      excerpt: "Best practices in supply chain",
      image: "/assets/images/blog/blog2.jpg",
      date: "2024-03-14",
      author: "Jane Smith",
    },
  ];

  const pagination = {
    currentPage: 1,
    totalPages: 1,
    totalItems: blogs.length,
  };

  res.render("blog/index", {
    page: "blog",
    title: "Blog",
    layout: "layouts/main",
    blogs: blogs,
    pagination: pagination,
  });
});

router.get("/blog/:id", (req, res) => {
  res.render("blog/details", {
    page: "blog",
    title: "Blog Details",
    layout: "layouts/main", // Fix layout path
  });
});

// Tracking routes
router.get("/track", (req, res) => {
  res.render("shipment/track", {
    page: "track",
    title: "Track Shipment",
    layout: "layouts/main",
    errorMessage: null,
    successMessage: null,
    trackingResult: null,
  });
});

router.post("/track-shipment", (req, res) => {
  // Redirect POST requests with the form data
  const trackingId = req.body.trackingId;
  if (trackingId) {
    // If there's tracking data, forward it to the correct route
    res.redirect(307, "/shipment/track"); // 307 preserves the POST method
  } else {
    res.redirect("/shipment/track");
  }
});

router.get("/track-result", (req, res) => {
  const trackingNumber = req.query.number;

  if (!trackingNumber) {
    return res.redirect("/track");
  }

  res.render("shipment/track-result", {
    page: "track",
    title: "Tracking Result",
    layout: "layouts/main",
    errorMessage: null,
    trackingNumber,
    trackingResult: {}, // Add tracking result data here later
  });
});

// HTML page redirects
const htmlRedirects = [
  "index.html",
  "service.html",
  "about.html",
  "contact.html",
  "blog.html",
  "team.html",
  "project.html",
];

htmlRedirects.forEach((page) => {
  router.get(`/${page}`, (req, res) => {
    const path = page === "index.html" ? "/" : `/${page.replace(".html", "")}`;
    res.redirect(301, path);
  });
});

// HTML redirects for detail pages
const detailRedirects = [
  "service-details.html",
  "project-details.html",
  "team-details.html",
  "blog-details.html",
];

detailRedirects.forEach((page) => {
  router.get(`/${page}`, (req, res) => {
    const path = `/${page.replace("-details.html", "")}/details`;
    res.redirect(301, path);
  });
});

// HTML redirects
router.get("/track-shipment.html", (req, res) => {
  res.redirect(301, "/track");
});

// API Documentation
router.get("/api-docs", (req, res) => {
  res.render("api-docs", {
    title: "API Documentation",
    isLoggedIn:
      req.session && req.session.isLoggedIn ? req.session.isLoggedIn : false,
    user: req.session && req.session.user ? req.session.user : null,
  });
});

// API Integration Demo
router.get("/api-integration", (req, res) => {
  res.render("api-integration", {
    title: "API Integration Demo",
    isLoggedIn:
      req.session && req.session.isLoggedIn ? req.session.isLoggedIn : false,
    user: req.session && req.session.user ? req.session.user : null,
  });
});

// Shipment Calculation Page
router.get("/shipment-calculator", (req, res) => {
  res.render("shipment/calculator", {
    title: "Shipment Calculator",
    isLoggedIn: req.session.isLoggedIn || false,
    user: req.session.user || null,
  });
});

// Create Shipment route
router.get("/create-shipment", (req, res) => {
  res.render("shipment/create-shipment", {
    page: "create-shipment",
    title: "Create Shipment",
    layout: "layouts/main",
  });
});

// Add a redirect for the old track-shipment URL
router.get("/track-shipment", (req, res) => {
  res.redirect("/shipment/track");
});

module.exports = router;
