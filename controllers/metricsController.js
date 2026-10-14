const db = require('../db/connection');

function getMetrics(req, res) {
  const openTickets = db.prepare(`
    SELECT COUNT(*) as count FROM tickets WHERE status NOT IN ('Closed')
  `).get().count;

  const resolvedTickets = db.prepare(`
    SELECT COUNT(*) as count FROM tickets WHERE status IN ('Resolved', 'Closed')
  `).get().count;

  const byCategory = db.prepare(`
    SELECT category,
      SUM(CASE WHEN status NOT IN ('Closed') THEN 1 ELSE 0 END) as open_count,
      SUM(CASE WHEN status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) as resolved_count
    FROM tickets GROUP BY category
  `).all();

  const agentWorkload = db.prepare(`
    SELECT u.id, u.full_name,
      SUM(CASE WHEN t.status = 'New' THEN 1 ELSE 0 END) as new_count,
      SUM(CASE WHEN t.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_count,
      SUM(CASE WHEN t.status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) as resolved_count,
      COUNT(t.id) as total_assigned
    FROM users u
    LEFT JOIN tickets t ON t.assignee_id = u.id
    WHERE u.role IN ('Agent', 'Manager')
    GROUP BY u.id, u.full_name
  `).all();

  const ackMetrics = db.prepare(`
    SELECT t.id, t.title, t.category, t.created_at, t.acknowledged_at,
      CASE WHEN t.acknowledged_at IS NOT NULL
        THEN (julianday(t.acknowledged_at) - julianday(t.created_at)) * 24 * 60
        ELSE (julianday('now') - julianday(t.created_at)) * 24 * 60
      END as ack_minutes
    FROM tickets t
    WHERE t.status = 'New' OR t.acknowledged_at IS NOT NULL
    ORDER BY t.created_at DESC LIMIT 20
  `).all();

  const resolutionMetrics = db.prepare(`
    SELECT t.id, t.title, t.category, t.created_at, t.resolved_at,
      CASE WHEN t.resolved_at IS NOT NULL
        THEN (julianday(t.resolved_at) - julianday(t.created_at)) * 24
        ELSE NULL
      END as resolution_hours
    FROM tickets t
    WHERE t.resolved_at IS NOT NULL OR t.status IN ('In Progress', 'New')
    ORDER BY t.created_at DESC LIMIT 20
  `).all();

  const avgAckMinutes = db.prepare(`
    SELECT AVG((julianday(acknowledged_at) - julianday(created_at)) * 24 * 60) as avg_minutes
    FROM tickets WHERE acknowledged_at IS NOT NULL
  `).get().avg_minutes || 0;

  const avgResolutionHours = db.prepare(`
    SELECT AVG((julianday(resolved_at) - julianday(created_at)) * 24) as avg_hours
    FROM tickets WHERE resolved_at IS NOT NULL
  `).get().avg_hours || 0;

  const statusCounts = db.prepare(`
    SELECT status, COUNT(*) as count FROM tickets GROUP BY status
  `).all();

  res.json({
    summary: {
      open_tickets: openTickets,
      resolved_tickets: resolvedTickets,
      avg_ack_minutes: Math.round(avgAckMinutes * 10) / 10,
      avg_resolution_hours: Math.round(avgResolutionHours * 10) / 10,
      ack_target_minutes: 30
    },
    by_category: byCategory,
    agent_workload: agentWorkload,
    ack_metrics: ackMetrics,
    resolution_metrics: resolutionMetrics,
    status_counts: statusCounts
  });
}

module.exports = { getMetrics };
