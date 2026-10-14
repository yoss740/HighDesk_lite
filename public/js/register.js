import { api, setAuth, getToken, getUser } from './api.js';
import {
  validateName, validateEmail, validatePassword, validateConfirmPassword,
  validateRole, attachRealtimeValidation
} from './validation.js';

const user = getUser();
if (getToken() && user) {
  window.location.href = user.role === 'Client' ? '/dashboard.html' : '/agent.html';
}

const form = document.getElementById('register-form');
const fullNameInput = document.getElementById('full_name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('confirm_password');
const roleInput = document.getElementById('role');
const alertEl = document.getElementById('alert');

const checkConfirm = () => validateConfirmPassword(passwordInput, confirmInput);

attachRealtimeValidation([
  { input: fullNameInput, validator: validateName },
  { input: emailInput, validator: (i) => validateEmail(i, true) },
  { input: passwordInput, validator: validatePassword, deps: [checkConfirm] },
  { input: confirmInput, validator: () => checkConfirm() },
  { input: roleInput, validator: validateRole }
]);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  alertEl.classList.add('hidden');

  const valid = validateName(fullNameInput) &
    validateEmail(emailInput, true) &
    validatePassword(passwordInput) &
    checkConfirm() &
    validateRole(roleInput);

  if (!valid) return;

  const btn = document.getElementById('register-btn');
  btn.disabled = true;
  btn.textContent = 'Creating account…';

  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        full_name: fullNameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value,
        confirm_password: confirmInput.value,
        role: roleInput.value
      })
    });

    setAuth(data.token, data.user);
    const dest = data.user.role === 'Client' ? '/dashboard.html' :
                 data.user.role === 'Manager' ? '/manager.html' : '/agent.html';
    window.location.href = dest;
  } catch (err) {
    if (err.errors) {
      const msgs = Object.values(err.errors).join('. ');
      alertEl.textContent = msgs;
    } else {
      alertEl.textContent = err.error || 'Registration failed';
    }
    alertEl.classList.remove('hidden');
    alertEl.classList.add('alert-error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
});
