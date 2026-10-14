const db = require('../db/connection');

const TICKET_SELECT = `
  SELECT t.*,
    r.full_name AS reporter_name,
    r.email AS reporter_email,
    a.full_name AS assignee_name,
    a.email AS assignee_email
  FROM tickets t
  JOIN users r ON t.reporter_id = r.id
  LEFT JOIN users a ON t.assignee_id = a.id
`;

function findAll(filters = {}) {
  let query = TICKET_SELECT + ' WHERE 1=1';
  const params = [];

  if (filters.reporter_id) {
    query += ' AND t.reporter_id = ?';
    params.push(filters.reporter_id);
  }
  if (filters.status) {
    query += ' AND t.status = ?';
    params.push(filters.status);
  }
  if (filters.category) {
    query += ' AND t.category = ?';
    params.push(filters.category);
  }
  if (filters.assignee_id) {
    query += ' AND t.assignee_id = ?';
    params.push(filters.assignee_id);
  }
  if (filters.urgency) {
    query += ' AND t.urgency = ?';
    params.push(filters.urgency);
  }

  query += ' ORDER BY t.created_at DESC';
  return db.prepare(query).all(...params);
}

function findById(id) {
  return db.prepare(TICKET_SELECT + ' WHERE t.id = ?').get(id);
}

function create({ title, category, urgency, description, reporter_id }) {
  const result = db.prepare(`
    INSERT INTO tickets (title, category, urgency, description, reporter_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(title, category, urgency, description, reporter_id);
  return findById(result.lastInsertRowid);
}

function updateStatus(id, newStatus) {
  const now = new Date().toISOString();
  const ticket = db.prepare('SELECT status FROM tickets WHERE id = ?').get(id);
  if (!ticket) return null;

  if (newStatus === 'In Progress' && ticket.status === 'New') {
    db.prepare('UPDATE tickets SET status = ?, acknowledged_at = ? WHERE id = ?').run(newStatus, now, id);
  } else if (newStatus === 'Resolved') {
    db.prepare('UPDATE tickets SET status = ?, resolved_at = ? WHERE id = ?').run(newStatus, now, id);
  } else if (newStatus === 'Closed') {
    db.prepare('UPDATE tickets SET status = ?, closed_at = ? WHERE id = ?').run(newStatus, now, id);
  } else {
    db.prepare('UPDATE tickets SET status = ? WHERE id = ?').run(newStatus, id);
  }
  return findById(id);
}

function assign(id, assignee_id) {
  db.prepare('UPDATE tickets SET assignee_id = ? WHERE id = ?').run(assignee_id, id);
  return findById(id);
}

function claim(id, assignee_id) {
  const ticket = findById(id);
  if (!ticket) return null;

  db.prepare(`
    UPDATE tickets SET assignee_id = ?, status = 'In Progress', acknowledged_at = COALESCE(acknowledged_at, ?)
    WHERE id = ? AND status = 'New'
  `).run(assignee_id, new Date().toISOString(), id);

  return findById(id);
}

module.exports = { findAll, findById, create, updateStatus, assign, claim };
