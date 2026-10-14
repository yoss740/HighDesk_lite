function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

function isAgentOrManager(req) {
  return req.user && (req.user.role === 'Agent' || req.user.role === 'Manager');
}

module.exports = { requireRole, isAgentOrManager };
