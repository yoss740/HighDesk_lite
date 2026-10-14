const express = require('express');
const { getMetrics } = require('../controllers/metricsController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);
router.use(requireRole('Agent', 'Manager'));
router.get('/', getMetrics);

module.exports = router;
