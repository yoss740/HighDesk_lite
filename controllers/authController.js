const User = require('../models/user');
const { generateToken } = require('../middleware/auth');

async function register(req, res) {
  try {
    const existing = User.findByEmail(req.body.email.toLowerCase());
    if (existing) {
      return res.status(409).json({ errors: { email: 'An account with this email already exists' } });
    }

    const user = User.create(req.body);
    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
}

async function login(req, res) {
  try {
    const user = User.findByEmail(req.body.email.toLowerCase());
    if (!user || !User.verifyPassword(req.body.password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { password_hash, ...safeUser } = user;
    const token = generateToken(safeUser);
    res.json({ user: safeUser, token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
}

function me(req, res) {
  const user = User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
}

function ssoRedirect(req, res) {
  res.json({
    message: 'SSO integration placeholder',
    redirect_url: '/api/auth/sso/callback',
    provider: 'Okta/Azure AD'
  });
}

function logout(req, res) {
  res.json({ message: 'Logged out successfully' });
}

module.exports = { register, login, me, ssoRedirect, logout };
