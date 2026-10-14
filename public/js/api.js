const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('highdesk_token');
}

function getUser() {
  const raw = localStorage.getItem('highdesk_user');
  if (!raw) return null;
  const user = JSON.parse(raw);
  if (user.role === 'Employee') user.role = 'Client';
  return user;
}

function setAuth(token, user) {
  localStorage.setItem('highdesk_token', token);
  localStorage.setItem('highdesk_user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('highdesk_token');
  localStorage.removeItem('highdesk_user');
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = '/index.html';
    return false;
  }
  return true;
}

function redirectByRole() {
  const user = getUser();
  if (!user) return (window.location.href = '/index.html');

  const page = window.location.pathname;
  if (page.includes('agent.html') && user.role === 'Client') {
    return (window.location.href = '/dashboard.html');
  }
  if (page.includes('manager.html') && user.role === 'Client') {
    return (window.location.href = '/dashboard.html');
  }
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearAuth();
    window.location.href = '/index.html';
    throw new Error('Session expired');
  }

  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

async function logout() {
  try {
    if (getToken()) {
      await api('/auth/logout', { method: 'POST' });
    }
  } catch {
    // Clear local session even if the server call fails
  } finally {
    clearAuth();
    window.location.href = '/index.html';
  }
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function statusBadge(status) {
  const cls = {
    'New': 'badge-new',
    'In Progress': 'badge-in-progress',
    'Resolved': 'badge-resolved',
    'Closed': 'badge-closed'
  }[status] || 'badge-closed';
  return `<span class="badge ${cls}">${status}</span>`;
}

function urgencyBadge(urgency) {
  const cls = {
    'Urgent': 'badge-urgent',
    'High': 'badge-high',
    'Medium': 'badge-medium',
    'Low': 'badge-low'
  }[urgency] || 'badge-low';
  return `<span class="badge ${cls}">${urgency}</span>`;
}

function setupHeader() {
  const user = getUser();
  if (!user) return;

  const nameEl = document.getElementById('user-name');
  const roleEl = document.getElementById('user-role');
  if (nameEl) nameEl.textContent = user.full_name;
  if (roleEl) roleEl.textContent = user.role;

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
}

export {
  api, getToken, getUser, setAuth, clearAuth, requireAuth,
  redirectByRole, logout, formatDate, statusBadge, urgencyBadge, setupHeader
};
