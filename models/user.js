const db = require('../db/connection');
const bcrypt = require('bcryptjs');

function findByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function findById(id) {
  return db.prepare('SELECT id, full_name, email, role, created_at FROM users WHERE id = ?').get(id);
}

function create({ full_name, email, password, role }) {
  const password_hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run(full_name.trim(), email.toLowerCase(), password_hash, role);
  return findById(result.lastInsertRowid);
}

function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

function getAgents() {
  return db.prepare(
    "SELECT id, full_name, email FROM users WHERE role IN ('Agent', 'Manager')"
  ).all();
}

module.exports = { findByEmail, findById, create, verifyPassword, getAgents };
