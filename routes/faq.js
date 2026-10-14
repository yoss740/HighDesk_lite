const express = require('express');
const { listFaqs, getFaq } = require('../controllers/faqController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.get('/', listFaqs);
router.get('/:id', getFaq);

module.exports = router;
