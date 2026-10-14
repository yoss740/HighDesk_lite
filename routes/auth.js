const express = require('express');
const { register, login, me, ssoRedirect, logout } = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.get('/sso', ssoRedirect);

module.exports = router;
