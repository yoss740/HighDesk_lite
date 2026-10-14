const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { DatabaseSync } = require('node:sqlite');

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = process.env.DB_PATH || path.join(dataDir, 'highdesk.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

const { migrateEmployeeToClient } = require('./migrate');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);
migrateEmployeeToClient(db);

const seedUsers = [
  { full_name: 'Admin Manager', email: 'manager@company.com', password: 'Admin@123', role: 'Manager' },
  { full_name: 'Support Agent', email: 'agent@company.com', password: 'Agent@123', role: 'Agent' },
  { full_name: 'John Client', email: 'john@company.com', password: 'Client@123', role: 'Client' }
];

const insertUser = db.prepare(
  'INSERT OR IGNORE INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)'
);

for (const user of seedUsers) {
  insertUser.run(user.full_name, user.email, bcrypt.hashSync(user.password, 10), user.role);
}

const faqCount = db.prepare('SELECT COUNT(*) as count FROM faqs').get().count;
if (faqCount === 0) {
  const insertFaq = db.prepare(
    'INSERT INTO faqs (question, answer, category) VALUES (?, ?, ?)'
  );
  const faqs = [
    ['How do I reset my password?', 'Go to the company portal and click "Forgot Password". Follow the email instructions to set a new password.', 'IT'],
    ['How do I request PTO?', 'Submit a PTO request through the HR portal at least two weeks in advance for planned time off.', 'HR'],
    ['How do I report a facilities issue?', 'For urgent issues (leaks, power outages), call facilities directly. For non-urgent issues, submit a ticket under Facilities.', 'Facilities'],
    ['What are the Wi-Fi credentials?', 'Connect to "Company-Secure" using your corporate email and password. Guest Wi-Fi is available for visitors.', 'IT'],
    ['How do I update my direct deposit?', 'Log into the HR self-service portal under Payroll > Direct Deposit to update your banking information.', 'HR'],
    ['Where can I find the employee handbook?', 'The employee handbook is available on the company intranet under Resources > HR Documents.', 'General'],
    ['How do I request new equipment?', 'Submit an IT ticket with the equipment type needed and business justification. Approval may be required.', 'IT'],
    ['Who do I contact about benefits?', 'Contact HR at hr@company.com or submit an HR ticket for benefits enrollment questions.', 'HR']
  ];
  for (const faq of faqs) {
    insertFaq.run(...faq);
  }
}

console.log('Database initialized at', dbPath);
