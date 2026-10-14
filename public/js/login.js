import { api, setAuth, getToken, getUser } from './api.js';
import { validateLoginEmail, validateLoginPassword, attachRealtimeValidation } from './validation.js';

const user = getUser();
if (getToken() && user) {
  const dest = user.role === 'Client' ? '/dashboard.html' :
               user.role === 'Manager' ? '/manager.html' : '/agent.html';
  window.location.href = dest;
}

const form = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const alertEl = document.getElementById('alert');
const ssoBtn = document.getElementById('sso-btn');

attachRealtimeValidation([
  { input: emailInput, validator: validateLoginEmail },
  { input: passwordInput, validator: validateLoginPassword }
]);

ssoBtn.addEventListener('click', async () => {
  try {
    const data = await api('/auth/sso');
    alertEl.textContent = `${data.message} — Provider: ${data.provider}. Contact IT to configure SSO.`;
    alertEl.classList.remove('hidden', 'alert-error');
    alertEl.classList.add('alert-success');
  } catch {
    alertEl.textContent = 'SSO is not configured. Please use email/password login.';
    alertEl.classList.remove('hidden');
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  alertEl.classList.add('hidden');

  const valid = validateLoginEmail(emailInput) & validateLoginPassword(passwordInput);
  if (!valid) return;

  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: emailInput.value.trim(),
        password: passwordInput.value
      })
    });

    setAuth(data.token, data.user);
    const dest = data.user.role === 'Client' ? '/dashboard.html' :
                 data.user.role === 'Manager' ? '/manager.html' : '/agent.html';
    window.location.href = dest;
  } catch (err) {
    alertEl.textContent = err.error || 'Invalid email or password';
    alertEl.classList.remove('hidden');
    alertEl.classList.add('alert-error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
});
