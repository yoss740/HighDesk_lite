import {
  api, requireAuth, redirectByRole, setupHeader,
  formatDate, statusBadge, urgencyBadge, getUser
} from './api.js';
import {
  validateTicketTitle, validateTicketCategory, validateTicketUrgency,
  validateTicketDescription, attachRealtimeValidation
} from './validation.js';

if (!requireAuth()) throw new Error('Auth required');
redirectByRole();
setupHeader();

const user = getUser();
if (user.role !== 'Client') {
  window.location.href = user.role === 'Manager' ? '/manager.html' : '/agent.html';
}

const titleInput = document.getElementById('title');
const categoryInput = document.getElementById('category');
const urgencyInput = document.getElementById('urgency');
const descInput = document.getElementById('description');
const descCount = document.getElementById('desc-count');
const ticketForm = document.getElementById('ticket-form');
const ticketAlert = document.getElementById('ticket-alert');
const ticketsBody = document.getElementById('tickets-body');
const emptyTickets = document.getElementById('empty-tickets');
const faqList = document.getElementById('faq-list');
const faqSearch = document.getElementById('faq-search');
const faqCategory = document.getElementById('faq-category');

attachRealtimeValidation([
  { input: titleInput, validator: validateTicketTitle },
  { input: categoryInput, validator: validateTicketCategory },
  { input: urgencyInput, validator: validateTicketUrgency },
  { input: descInput, validator: validateTicketDescription }
]);

descInput.addEventListener('input', () => {
  descCount.textContent = descInput.value.length;
  validateTicketDescription(descInput);
});

async function loadFaqs() {
  const params = new URLSearchParams();
  if (faqSearch.value) params.set('search', faqSearch.value);
  if (faqCategory.value !== 'All') params.set('category', faqCategory.value);

  try {
    const { faqs } = await api(`/faqs?${params}`);
    faqList.innerHTML = faqs.length === 0
      ? '<div class="empty-state">No FAQs found</div>'
      : faqs.map(f => `
        <div class="faq-item" data-id="${f.id}">
          <span class="faq-cat">${f.category}</span>
          <div class="faq-q">${escapeHtml(f.question)}</div>
          <div class="faq-a">${escapeHtml(f.answer)}</div>
        </div>
      `).join('');

    faqList.querySelectorAll('.faq-item').forEach(el => {
      el.addEventListener('click', () => el.classList.toggle('open'));
    });
  } catch (err) {
    faqList.innerHTML = '<div class="empty-state">Failed to load FAQs</div>';
  }
}

async function loadTickets() {
  try {
    const { tickets } = await api('/tickets');
    if (tickets.length === 0) {
      ticketsBody.innerHTML = '';
      emptyTickets.classList.remove('hidden');
      return;
    }
    emptyTickets.classList.add('hidden');
    ticketsBody.innerHTML = tickets.map(t => `
      <tr>
        <td>#${t.id}</td>
        <td>${escapeHtml(t.title)}</td>
        <td>${t.category}</td>
        <td>${urgencyBadge(t.urgency)}</td>
        <td>${statusBadge(t.status)}</td>
        <td>${t.assignee_name || '—'}</td>
        <td>${formatDate(t.created_at)}</td>
      </tr>
    `).join('');
  } catch (err) {
    ticketsBody.innerHTML = '<tr><td colspan="7">Failed to load tickets</td></tr>';
  }
}

ticketForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  ticketAlert.classList.add('hidden');

  const valid = validateTicketTitle(titleInput) &
    validateTicketCategory(categoryInput) &
    validateTicketUrgency(urgencyInput) &
    validateTicketDescription(descInput);

  if (!valid) return;

  const btn = ticketForm.querySelector('button[type="submit"]');
  btn.disabled = true;

  try {
    const data = await api('/tickets', {
      method: 'POST',
      body: JSON.stringify({
        title: titleInput.value.trim(),
        category: categoryInput.value,
        urgency: urgencyInput.value,
        description: descInput.value.trim()
      })
    });

    ticketAlert.textContent = `Ticket #${data.ticket.id} submitted successfully (${data.processing_ms}ms)`;
    ticketAlert.classList.remove('hidden', 'alert-error');
    ticketAlert.classList.add('alert-success');
    ticketForm.reset();
    descCount.textContent = '0';
    loadTickets();
  } catch (err) {
    const msg = err.errors ? Object.values(err.errors).join('. ') : (err.error || 'Submission failed');
    ticketAlert.textContent = msg;
    ticketAlert.classList.remove('hidden', 'alert-success');
    ticketAlert.classList.add('alert-error');
  } finally {
    btn.disabled = false;
  }
});

faqSearch.addEventListener('input', debounce(loadFaqs, 300));
faqCategory.addEventListener('change', loadFaqs);

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

loadFaqs();
loadTickets();
