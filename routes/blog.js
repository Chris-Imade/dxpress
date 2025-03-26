const express = require('express');
const router = express.Router();

// Controllers
const blogController = require('../controllers/blog');

// Blog pages
router.get('/', blogController.getBlogPage);
router.get('/:id', blogController.getBlogDetailsPage);

module.exports = router; 