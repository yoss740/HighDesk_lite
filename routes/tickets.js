const express = require('express');
const {
  listTickets, getTicket, createTicket, updateStatus,
  assignTicket, claimTicket, getAgents
} = require('../controllers/ticketController');
const { validateTicket } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticate);

router.get('/', listTickets);
router.get('/agents', requireRole('Agent', 'Manager'), getAgents);
router.get('/:id', getTicket);
router.post('/', validateTicket, createTicket);
router.patch('/:id/status', requireRole('Agent', 'Manager'), updateStatus);
router.patch('/:id/assign', requireRole('Agent', 'Manager'), assignTicket);
router.post('/:id/claim', requireRole('Agent', 'Manager'), claimTicket);

module.exports = router;
