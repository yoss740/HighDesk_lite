const Faq = require('../models/faq');

function listFaqs(req, res) {
  const { search, category } = req.query;
  const faqs = Faq.findAll(search, category);
  res.json({ faqs });
}

function getFaq(req, res) {
  const faq = Faq.findById(parseInt(req.params.id, 10));
  if (!faq) return res.status(404).json({ error: 'FAQ not found' });
  res.json({ faq });
}

module.exports = { listFaqs, getFaq };
