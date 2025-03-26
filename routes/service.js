const express = require('express');
const router = express.Router();

// Controllers
const serviceController = require('../controllers/service');

// Services pages
router.get('/', serviceController.getServicesPage);
router.get('/:id', serviceController.getServiceDetailsPage);

module.exports = router; 