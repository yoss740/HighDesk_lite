import {
  api, requireAuth, redirectByRole, setupHeader,
  formatDate, statusBadge, urgencyBadge, getUser
} from './api.js';

if (!requireAuth()) throw new Error('Auth required');
redirectByRole();
setupHeader();

const user = getUser();
if (user.role === 'Client') {
  window.location.href = '/dashboard.html';
}

let tickets = [];
let agents = [];

const filterCategory = document.getElementById('filter-category');
const filterUrgency = document.getElementById('filter-urgency');
const filterAssignee = document.getElementById('filter-assignee');
const kanbanView = document.getElementById('kanban-view');
const listView = document.getElementById('list-view');
const viewKanban = document.getElementById('view-kanban');
const viewList = document.getElementById('view-list');
const listBody = document.getElementById('list-body');

const columns = {
  'New': document.getElementById('col-new'),
  'In Progress': document.getElementById('col-in-progress'),
  'Resolved': document.getElementById('col-resolved'),
  'Closed': document.getElementById('col-closed')
};

const counts = {
  'New': document.getElementById('count-new'),
  'In Progress': document.getElementById('count-in-progress'),
  'Resolved': document.getElementById('count-resolved'),
  'Closed': document.getElementById('count-closed')
};

viewKanban.addEventListener('click', () => {
  viewKanban.classList.add('active');
  viewList.classList.remove('active');
  kanbanView.classList.remove('hidden');
  listView.classList.add('hidden');
});

viewList.addEventListener('click', () => {
  viewList.classList.add('active');
  viewKanban.classList.remove('active');
  listView.classList.remove('hidden');
  kanbanView.classList.add('hidden');
});

[filterCategory, filterUrgency, filterAssignee].forEach(el => {
  el.addEventListener('change', loadTickets);
});

async function loadAgents() {
  try {
    const data = await api('/tickets/agents');
    agents = data.agents;
    filterAssignee.innerHTML = '<option value="">All Assignees</option>' +
      agents.map(a => `<option value="${a.id}">${a.full_name}</option>`).join('');
  } catch { /* ignore */ }
}

async function loadTickets() {
  const params = new URLSearchParams();
  if (filterCategory.value) params.set('category', filterCategory.value);
  if (filterUrgency.value) params.set('urgency', filterUrgency.value);
  if (filterAssignee.value) params.set('assignee_id', filterAssignee.value);

  try {
    const data = await api(`/tickets?${params}`);
    tickets = data.tickets;
    renderKanban();
    renderList();
  } catch (err) {
    console.error('Failed to load tickets', err);
  }
}

function getNextStatus(status) {
  const map = { 'New': 'In Progress', 'In Progress': 'Resolved', 'Resolved': 'Closed' };
  return map[status] || null;
}

function renderKanbanCard(t) {
  const next = getNextStatus(t.status);
  let actions = '';

  if (t.status === 'New' && !t.assignee_id) {
    actions += `<button class="btn btn-sm btn-primary claim-btn" data-id="${t.id}">Claim Ticket</button>`;
  }
  if (next) {
    actions += `<button class="btn btn-sm btn-primary advance-btn" data-id="${t.id}" data-status="${next}">→ ${next}</button>`;
  }
  if (t.status !== 'Closed') {
    actions += `<select class="assign-select btn-sm" data-id="${t.id}" style="padding:0.3rem;border-radius:4px;">
      <option value="">Reassign…</option>
      ${agents.map(a => `<option value="${a.id}" ${t.assignee_id === a.id ? 'selected' : ''}>${a.full_name}</option>`).join('')}
    </select>`;
  }

  return `
    <div class="kanban-card">
      <h4>#${t.id} ${escapeHtml(t.title)}</h4>
      <div class="meta">
        ${urgencyBadge(t.urgency)} ${t.category}<br>
        Reporter: ${t.reporter_name}<br>
        Assignee: ${t.assignee_name || 'Unassigned'}<br>
        ${formatDate(t.created_at)}
      </div>
      <div class="actions">${actions}</div>
    </div>
  `;
}

function renderKanban() {
  Object.keys(columns).forEach(status => {
    const filtered = tickets.filter(t => t.status === status);
    counts[status].textContent = filtered.length;
    columns[status].innerHTML = filtered.map(renderKanbanCard).join('');
  });
  bindActions(columns['New'].parentElement.parentElement);
}

function renderList() {
  listBody.innerHTML = tickets.map(t => {
    const next = getNextStatus(t.status);
    let actions = '';
    if (t.status === 'New' && !t.assignee_id) {
      actions += `<button class="btn btn-sm btn-primary claim-btn" data-id="${t.id}">Claim</button> `;
    }
    if (next) {
      actions += `<button class="btn btn-sm btn-primary advance-btn" data-id="${t.id}" data-status="${next}">${next}</button>`;
    }
    return `
      <tr>
        <td>#${t.id}</td>
        <td>${escapeHtml(t.title)}</td>
        <td>${t.category}</td>
        <td>${urgencyBadge(t.urgency)}</td>
        <td>${statusBadge(t.status)}</td>
        <td>${t.reporter_name}</td>
        <td>${t.assignee_name || '—'}</td>
        <td>${actions}</td>
      </tr>
    `;
  }).join('');
  bindActions(listView);
}

function bindActions(container) {
  container.querySelectorAll('.claim-btn').forEach(btn => {
    btn.addEventListener('click', () => claimTicket(btn.dataset.id));
  });
  container.querySelectorAll('.advance-btn').forEach(btn => {
    btn.addEventListener('click', () => updateStatus(btn.dataset.id, btn.dataset.status));
  });
  container.querySelectorAll('.assign-select').forEach(sel => {
    sel.addEventListener('change', () => {
      if (sel.value) assignTicket(sel.dataset.id, sel.value);
    });
  });
}

async function claimTicket(id) {
  try {
    await api(`/tickets/${id}/claim`, { method: 'POST' });
    loadTickets();
  } catch (err) {
    alert(err.error || 'Failed to claim ticket');
  }
}

async function updateStatus(id, status) {
  try {
    await api(`/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    loadTickets();
  } catch (err) {
    alert(err.error || 'Invalid status transition');
  }
}

async function assignTicket(id, assigneeId) {
  try {
    await api(`/tickets/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignee_id: parseInt(assigneeId, 10) })
    });
    loadTickets();
  } catch (err) {
    alert(err.error || 'Failed to assign ticket');
  }
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

loadAgents().then(loadTickets);
setInterval(loadTickets, 30000);
