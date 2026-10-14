require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const faqRoutes = require('./routes/faq');
const metricsRoutes = require('./routes/metrics');

const app = express();
const PORT = process.env.PORT || 3000;

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'highdesk.db');
if (!fs.existsSync(dbPath)) {
  require('./db/init.js');
} else {
  require('./db/connection.js');
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/metrics', metricsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Highdesk' });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Highdesk running at http://localhost:${PORT}`);
});
