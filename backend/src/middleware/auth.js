const jwt = require('jsonwebtoken');
const { hasPermission } = require('../lib/permissions');
const { writeAudit } = require('../lib/audit');

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.type !== 'admin') {
    writeAudit(req, { action: 'PERMISSION_DENIED', resourceType: 'AdminArea', status: 'denied', reason: 'Admin access required' });
    return res.status(403).json({ error: 'Admin access required' });
  }
  return next();
}

function requireAlumni(req, res, next) {
  if (req.user?.type !== 'alumni') {
    return res.status(403).json({ error: 'Alumni access required' });
  }
  return next();
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (req.user?.type !== 'admin') {
      writeAudit(req, { action: 'PERMISSION_DENIED', resourceType: 'Permission', resourceId: permission, status: 'denied', reason: 'Not an admin' });
      return res.status(403).json({ error: 'Admin access required' });
    }
    if (!hasPermission(req.user.role || 'admin', permission)) {
      writeAudit(req, { action: 'PERMISSION_DENIED', resourceType: 'Permission', resourceId: permission, status: 'denied', reason: 'Missing permission' });
      return res.status(403).json({ error: 'You do not have permission to perform this action' });
    }
    return next();
  };
}

module.exports = { auth, requireAdmin, requireAlumni, requirePermission };
