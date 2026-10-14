const db = require('../db/connection');

function findAll(search, category) {
  let query = 'SELECT * FROM faqs WHERE 1=1';
  const params = [];

  if (category && category !== 'All') {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (question LIKE ? OR answer LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term);
  }

  query += ' ORDER BY category, question';
  return db.prepare(query).all(...params);
}

function findById(id) {
  return db.prepare('SELECT * FROM faqs WHERE id = ?').get(id);
}

module.exports = { findAll, findById };
