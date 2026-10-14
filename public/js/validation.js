const COMPANY_DOMAIN = 'company.com';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[a-zA-Z\s]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

function showFieldError(input, message) {
  const group = input.closest('.form-group');
  const errorEl = group.querySelector('.field-error');
  input.classList.remove('valid');
  input.classList.add('invalid');
  if (errorEl) errorEl.textContent = message || '';
}

function showFieldValid(input, message) {
  const group = input.closest('.form-group');
  const errorEl = group.querySelector('.field-error');
  input.classList.remove('invalid');
  input.classList.add('valid');
  if (errorEl) errorEl.textContent = message || '';
}

function clearFieldState(input) {
  input.classList.remove('valid', 'invalid');
  const errorEl = input.closest('.form-group')?.querySelector('.field-error');
  if (errorEl) errorEl.textContent = '';
}

export function validateName(input) {
  const val = input.value.trim();
  if (!val) { showFieldError(input, 'Full name is required'); return false; }
  if (!NAME_REGEX.test(val)) { showFieldError(input, 'Letters and spaces only (min 2 characters)'); return false; }
  showFieldValid(input);
  return true;
}

export function validateEmail(input, requireDomain = true) {
  const val = input.value.trim();
  if (!val) { showFieldError(input, 'Email is required'); return false; }
  if (!EMAIL_REGEX.test(val)) { showFieldError(input, 'Enter a valid email address'); return false; }
  if (requireDomain && !val.endsWith(`@${COMPANY_DOMAIN}`)) {
    showFieldError(input, `Must use @${COMPANY_DOMAIN} domain`);
    return false;
  }
  showFieldValid(input);
  return true;
}

export function validatePassword(input) {
  const val = input.value;
  if (!val) { showFieldError(input, 'Password is required'); return false; }
  if (!PASSWORD_REGEX.test(val)) {
    showFieldError(input, 'Min 8 chars with uppercase, lowercase, number, and special (@$!%*?&)');
    return false;
  }
  showFieldValid(input);
  return true;
}

export function validateConfirmPassword(passwordInput, confirmInput) {
  if (confirmInput.value !== passwordInput.value) {
    showFieldError(confirmInput, 'Passwords do not match');
    return false;
  }
  if (!confirmInput.value) {
    showFieldError(confirmInput, 'Please confirm your password');
    return false;
  }
  showFieldValid(confirmInput, 'Passwords match');
  return true;
}

export function validateRole(input) {
  if (!input.value) { showFieldError(input, 'Please select a role'); return false; }
  showFieldValid(input);
  return true;
}

export function validateLoginEmail(input) {
  const val = input.value.trim();
  if (!val) { showFieldError(input, 'Email is required'); return false; }
  if (!EMAIL_REGEX.test(val)) { showFieldError(input, 'Enter a valid email address'); return false; }
  showFieldValid(input);
  return true;
}

export function validateLoginPassword(input) {
  if (!input.value) { showFieldError(input, 'Password is required'); return false; }
  showFieldValid(input);
  return true;
}

export function validateTicketTitle(input) {
  const len = input.value.trim().length;
  if (len < 5 || len > 100) {
    showFieldError(input, 'Title must be 5–100 characters');
    return false;
  }
  showFieldValid(input);
  return true;
}

export function validateTicketCategory(input) {
  if (!input.value) { showFieldError(input, 'Category is required'); return false; }
  showFieldValid(input);
  return true;
}

export function validateTicketUrgency(input) {
  if (!input.value) { showFieldError(input, 'Urgency is required'); return false; }
  showFieldValid(input);
  return true;
}

export function validateTicketDescription(input) {
  const len = input.value.trim().length;
  if (len < 20 || len > 1000) {
    showFieldError(input, 'Description must be 20–1000 characters');
    return false;
  }
  showFieldValid(input);
  return true;
}

export function attachRealtimeValidation(formConfig) {
  for (const { input, validator, deps } of formConfig) {
    input.addEventListener('input', () => {
      validator(input);
      if (deps) deps.forEach(d => d());
    });
    input.addEventListener('blur', () => validator(input));
  }
}

export { clearFieldState, showFieldError, showFieldValid };
