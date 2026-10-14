const COMPANY_DOMAIN = process.env.COMPANY_DOMAIN || 'company.com';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[a-zA-Z\s]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

function validateRegistration(req, res, next) {
  const { full_name, email, password, confirm_password, role } = req.body;
  const errors = {};

  if (!full_name || !NAME_REGEX.test(full_name.trim())) {
    errors.full_name = 'Full name is required (min 2 characters, letters and spaces only)';
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    errors.email = 'Valid email is required';
  } else if (!email.endsWith(`@${COMPANY_DOMAIN}`)) {
    errors.email = `Email must use @${COMPANY_DOMAIN} domain`;
  }

  if (!password || !PASSWORD_REGEX.test(password)) {
    errors.password = 'Password must be 8+ chars with uppercase, lowercase, number, and special character (@$!%*?&)';
  }

  if (password !== confirm_password) {
    errors.confirm_password = 'Passwords do not match';
  }

  if (!role || !['Client', 'Agent', 'Manager'].includes(role)) {
    errors.role = 'Role selection is required';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = {};

  if (!email || !EMAIL_REGEX.test(email)) {
    errors.email = 'Valid email is required';
  }
  if (!password || password.length === 0) {
    errors.password = 'Password is required';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }
  next();
}

function validateTicket(req, res, next) {
  const { title, category, urgency, description } = req.body;
  const errors = {};

  if (!title || title.length < 5 || title.length > 100) {
    errors.title = 'Title must be between 5 and 100 characters';
  }

  if (!category || !['IT', 'HR', 'Facilities'].includes(category)) {
    errors.category = 'Category is required (IT, HR, or Facilities)';
  }

  if (!urgency || !['Low', 'Medium', 'High', 'Urgent'].includes(urgency)) {
    errors.urgency = 'Urgency is required (Low, Medium, High, or Urgent)';
  }

  if (!description || description.length < 20 || description.length > 1000) {
    errors.description = 'Description must be between 20 and 1000 characters';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }
  next();
}

const VALID_TRANSITIONS = {
  'New': ['In Progress'],
  'In Progress': ['Resolved'],
  'Resolved': ['Closed'],
  'Closed': []
};

function validateStatusTransition(currentStatus, newStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
}

module.exports = {
  validateRegistration,
  validateLogin,
  validateTicket,
  validateStatusTransition,
  EMAIL_REGEX,
  NAME_REGEX,
  PASSWORD_REGEX,
  COMPANY_DOMAIN
};
