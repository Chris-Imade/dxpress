const express = require('express');
const router = express.Router();
const carrierRatesController = require('../../controllers/admin/carrierRates');
const { isAuthenticated, isAdmin } = require('../../middleware/auth');

// Apply authentication middleware
router.use(isAuthenticated);
router.use(isAdmin);

// GET: Carrier rates management page
router.get('/', carrierRatesController.getRatesPage);

// API Routes
router.get('/api/:carrier/current', carrierRatesController.getCurrentRates);
router.post('/api/create', carrierRatesController.createRateVersion);
router.put('/api/:rateId', carrierRatesController.updateRateVersion);
router.post('/api/:rateId/activate', carrierRatesController.activateRateVersion);
router.delete('/api/:rateId', carrierRatesController.deleteRateVersion);
router.post('/api/import-csv', carrierRatesController.importRatesFromCSV);
router.get('/api/compare', carrierRatesController.compareRateVersions);

module.exports = router;
