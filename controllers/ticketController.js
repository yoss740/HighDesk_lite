const Ticket = require('../models/ticket');
const User = require('../models/user');
const { validateStatusTransition } = require('../middleware/validation');
const { isAgentOrManager } = require('../middleware/rbac');

function listTickets(req, res) {
  const filters = {};

  if (!isAgentOrManager(req)) {
    filters.reporter_id = req.user.id;
  } else {
    if (req.query.status) filters.status = req.query.status;
    if (req.query.category) filters.category = req.query.category;
    if (req.query.assignee_id) filters.assignee_id = parseInt(req.query.assignee_id, 10);
    if (req.query.urgency) filters.urgency = req.query.urgency;
  }

  const tickets = Ticket.findAll(filters);
  res.json({ tickets });
}

function getTicket(req, res) {
  const ticket = Ticket.findById(parseInt(req.params.id, 10));
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  if (!isAgentOrManager(req) && ticket.reporter_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json({ ticket });
}

function createTicket(req, res) {
  const start = process.hrtime.bigint();
  const ticket = Ticket.create({
    ...req.body,
    reporter_id: req.user.id
  });
  const elapsed = Number(process.hrtime.bigint() - start) / 1e6;
  res.status(201).json({ ticket, processing_ms: Math.round(elapsed * 100) / 100 });
}

function updateStatus(req, res) {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body;
  const ticket = Ticket.findById(id);

  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  if (!validateStatusTransition(ticket.status, status)) {
    return res.status(400).json({
      error: `Invalid status transition from "${ticket.status}" to "${status}"`,
      allowed: ticket.status === 'New' ? ['In Progress'] :
               ticket.status === 'In Progress' ? ['Resolved'] :
               ticket.status === 'Resolved' ? ['Closed'] : []
    });
  }

  const updated = Ticket.updateStatus(id, status);
  res.json({ ticket: updated });
}

function assignTicket(req, res) {
  const id = parseInt(req.params.id, 10);
  const { assignee_id } = req.body;
  const ticket = Ticket.findById(id);

  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const assignee = User.findById(assignee_id);
  if (!assignee || !['Agent', 'Manager'].includes(assignee.role)) {
    return res.status(400).json({ error: 'Invalid assignee' });
  }

  const updated = Ticket.assign(id, assignee_id);
  res.json({ ticket: updated });
}

function claimTicket(req, res) {
  const id = parseInt(req.params.id, 10);
  const ticket = Ticket.findById(id);

  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  if (ticket.status !== 'New') {
    return res.status(400).json({ error: 'Only New tickets can be claimed' });
  }

  const updated = Ticket.claim(id, req.user.id);
  res.json({ ticket: updated });
}

function getAgents(req, res) {
  const agents = User.getAgents();
  res.json({ agents });
}

module.exports = {
  listTickets,
  getTicket,
  createTicket,
  updateStatus,
  assignTicket,
  claimTicket,
  getAgents
};
