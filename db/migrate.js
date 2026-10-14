const bcrypt = require('bcryptjs');

function migrateEmployeeToClient(db) {
  const table = db.prepare(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'"
  ).get();

  if (!table || !table.sql || !table.sql.includes("'Employee'")) {
    return;
  }

  db.exec('PRAGMA foreign_keys = OFF');
  db.exec('BEGIN');
  try {
    db.exec(`
      CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('Client', 'Agent', 'Manager')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.exec(`
      INSERT INTO users_new (id, full_name, email, password_hash, role, created_at)
      SELECT
        id,
        CASE WHEN full_name = 'John Employee' THEN 'John Client' ELSE full_name END,
        email,
        password_hash,
        CASE WHEN role = 'Employee' THEN 'Client' ELSE role END,
        created_at
      FROM users;
    `);
    db.exec('DROP TABLE users');
    db.exec('ALTER TABLE users_new RENAME TO users');
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    db.exec('PRAGMA foreign_keys = ON');
    throw err;
  }
  db.exec('PRAGMA foreign_keys = ON');

  const demo = db.prepare('SELECT id FROM users WHERE email = ?').get('john@company.com');
  if (demo) {
    db.prepare(
      'UPDATE users SET full_name = ?, password_hash = ?, role = ? WHERE email = ?'
    ).run('John Client', bcrypt.hashSync('Client@123', 10), 'Client', 'john@company.com');
  }
}

module.exports = { migrateEmployeeToClient };
