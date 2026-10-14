import { api, requireAuth, redirectByRole, setupHeader, getUser } from './api.js';

if (!requireAuth()) throw new Error('Auth required');
redirectByRole();
setupHeader();

const user = getUser();
if (user.role === 'Client') {
  window.location.href = '/dashboard.html';
}

const summaryEl = document.getElementById('summary-metrics');
const categoryBody = document.getElementById('category-body');
const workloadBody = document.getElementById('workload-body');
const ackBody = document.getElementById('ack-body');
const resolutionBody = document.getElementById('resolution-body');

async function loadMetrics() {
  try {
    const data = await api('/metrics');
    renderSummary(data.summary);
    renderCategory(data.by_category);
    renderWorkload(data.agent_workload);
    renderAck(data.ack_metrics);
    renderResolution(data.resolution_metrics);
  } catch (err) {
    summaryEl.innerHTML = '<div class="empty-state">Failed to load metrics</div>';
  }
}

function renderSummary(s) {
  const ackWarning = s.avg_ack_minutes > s.ack_target_minutes;
  summaryEl.innerHTML = `
    <div class="metric-card">
      <div class="metric-value">${s.open_tickets}</div>
      <div class="metric-label">Open Tickets</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${s.resolved_tickets}</div>
      <div class="metric-label">Resolved Tickets</div>
    </div>
    <div class="metric-card ${ackWarning ? 'warning' : ''}">
      <div class="metric-value">${s.avg_ack_minutes}</div>
      <div class="metric-label">Avg Ack Time (min)</div>
      <div class="metric-target">Target &lt; ${s.ack_target_minutes} min</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${s.avg_resolution_hours}</div>
      <div class="metric-label">Avg Resolution (hrs)</div>
    </div>
  `;
}

function renderCategory(categories) {
  categoryBody.innerHTML = categories.length === 0
    ? '<tr><td colspan="3">No data</td></tr>'
    : categories.map(c => `
      <tr>
        <td><span class="badge badge-medium">${c.category}</span></td>
        <td>${c.open_count}</td>
        <td>${c.resolved_count}</td>
      </tr>
    `).join('');
}

function renderWorkload(agents) {
  workloadBody.innerHTML = agents.length === 0
    ? '<tr><td colspan="5">No agents</td></tr>'
    : agents.map(a => `
      <tr>
        <td>${a.full_name}</td>
        <td><span class="badge badge-new">${a.new_count}</span></td>
        <td><span class="badge badge-in-progress">${a.in_progress_count}</span></td>
        <td><span class="badge badge-resolved">${a.resolved_count}</span></td>
        <td><strong>${a.total_assigned}</strong></td>
      </tr>
    `).join('');
}

function renderAck(metrics) {
  ackBody.innerHTML = metrics.length === 0
    ? '<tr><td colspan="5">No data</td></tr>'
    : metrics.map(m => {
      const overTarget = m.ack_minutes > 30;
      return `
        <tr>
          <td>#${m.id} ${escapeHtml(m.title)}</td>
          <td>${m.category}</td>
          <td>${new Date(m.created_at).toLocaleString()}</td>
          <td><span class="badge ${overTarget ? 'badge-urgent' : 'badge-new'}">${Math.round(m.ack_minutes)} min</span></td>
          <td>${m.acknowledged_at ? 'Acknowledged' : 'Pending'}</td>
        </tr>
      `;
    }).join('');
}

function renderResolution(metrics) {
  resolutionBody.innerHTML = metrics.length === 0
    ? '<tr><td colspan="4">No data</td></tr>'
    : metrics.map(m => `
      <tr>
        <td>#${m.id} ${escapeHtml(m.title)}</td>
        <td>${m.category}</td>
        <td>${new Date(m.created_at).toLocaleString()}</td>
        <td>${m.resolution_hours != null ? `<span class="badge badge-new">${Math.round(m.resolution_hours * 10) / 10} hrs</span>` : '—'}</td>
      </tr>
    `).join('');
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

loadMetrics();
setInterval(loadMetrics, 30000);
