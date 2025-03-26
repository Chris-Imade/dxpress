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

// Team routes
router.get("/team", (req, res) => {
  res.render("team/index", {
    page: "team",
    title: "Our Team",
    layout: "layouts/main",
    isLoggedIn: req.session.isLoggedIn,
    user: req.session.user,
  });
});

router.get("/team/:slug", (req, res) => {
  const memberSlug = req.params.slug;

  // Define team members data (same as in team route)
  const teamMembers = [
    {
      id: 1,
      name: "John Smith",
      position: "CEO & Founder",
      image: "/assets/images/thumbs/team-img1.png",
      email: "john.smith@dxpress.uk",
      phone: "+44 7123 456789",
      social: {
        facebook: "https://facebook.com",
        twitter: "https://twitter.com",
        linkedin: "https://linkedin.com",
        instagram: "https://instagram.com",
      },
    },
    {
      id: 2,
      name: "Sarah Johnson",
      position: "Operations Manager",
      image: "/assets/images/thumbs/team-img2.png",
      email: "sarah.johnson@dxpress.uk",
      phone: "+44 7234 567890",
      social: {
        facebook: "https://facebook.com",
        twitter: "https://twitter.com",
        linkedin: "https://linkedin.com",
        instagram: "https://instagram.com",
      },
    },
    {
      id: 3,
      name: "Michael Brown",
      position: "Logistics Director",
      image: "/assets/images/thumbs/team-img3.png",
      email: "michael.brown@dxpress.uk",
      phone: "+44 7345 678901",
      social: {
        facebook: "https://facebook.com",
        twitter: "https://twitter.com",
        linkedin: "https://linkedin.com",
        instagram: "https://instagram.com",
      },
    },
    {
      id: 4,
      name: "Emily Davis",
      position: "Customer Service Manager",
      image: "/assets/images/thumbs/team-img4.png",
      email: "emily.davis@dxpress.uk",
      phone: "+44 7456 789012",
      social: {
        facebook: "https://facebook.com",
        twitter: "https://twitter.com",
        linkedin: "https://linkedin.com",
        instagram: "https://instagram.com",
      },
    },
    {
      id: 5,
      name: "Robert Wilson",
      position: "Transportation Specialist",
      image: "/assets/images/thumbs/team-img5.png",
      email: "robert.wilson@dxpress.uk",
      phone: "+44 7567 890123",
      social: {
        facebook: "https://facebook.com",
        twitter: "https://twitter.com",
        linkedin: "https://linkedin.com",
        instagram: "https://instagram.com",
      },
    },
    {
      id: 6,
      name: "Jennifer Taylor",
      position: "Supply Chain Manager",
      image: "/assets/images/thumbs/team-img6.png",
      email: "jennifer.taylor@dxpress.uk",
      phone: "+44 7678 901234",
      social: {
        facebook: "https://facebook.com",
        twitter: "https://twitter.com",
        linkedin: "https://linkedin.com",
        instagram: "https://instagram.com",
      },
    },
    {
      id: 7,
      name: "David Martinez",
      position: "Fleet Manager",
      image: "/assets/images/thumbs/team-img7.png",
      email: "david.martinez@dxpress.uk",
      phone: "+44 7789 012345",
      social: {
        facebook: "https://facebook.com",
        twitter: "https://twitter.com",
        linkedin: "https://linkedin.com",
        instagram: "https://instagram.com",
      },
    },
    {
      id: 8,
      name: "Jessica Anderson",
      position: "International Shipping Coordinator",
      image: "/assets/images/thumbs/team-img8.png",
      email: "jessica.anderson@dxpress.uk",
      phone: "+44 7890 123456",
      social: {
        facebook: "https://facebook.com",
        twitter: "https://twitter.com",
        linkedin: "https://linkedin.com",
        instagram: "https://instagram.com",
      },
    },
  ];

  // Find the member based on the slug (assuming slug is the id)
  const member = teamMembers.find((m) => m.id.toString() === memberSlug);

  if (!member) {
    // If member not found, redirect to team page
    return res.redirect("/team");
  }

  res.render("team/details", {
    page: "team",
    title: member.name,
    layout: "layouts/main",
    memberSlug,
    member,
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
  const { trackingId } = req.body;

  if (!trackingId) {
    return res.render("shipment/track", {
      page: "track",
      title: "Track Shipment",
      layout: "layouts/main",
      errorMessage: "Please enter a tracking number",
      successMessage: null,
      trackingResult: null,
    });
  }

  // Mock shipment data
  const shipment = {
    id: trackingId,
    status: "In Transit",
    currentLocation: "London Distribution Center",
    destination: "Manchester",
    estimatedDelivery: "March 20, 2024",
    lastUpdate: new Date().toLocaleString(),
    trackingHistory: [
      {
        status: "Package Received",
        location: "London Warehouse",
        timestamp: "2024-03-18 09:00:00",
      },
      {
        status: "In Transit",
        location: "London Distribution Center",
        timestamp: "2024-03-19 14:30:00",
      },
    ],
  };

  res.render("shipment/track-result", {
    page: "track",
    title: "Tracking Result",
    layout: "layouts/main",
    shipment,
    errorMessage: null,
  });
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

module.exports = router;
