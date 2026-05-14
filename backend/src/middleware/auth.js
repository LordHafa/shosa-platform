const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { hasPermission } = require('../lib/permissions');
const { writeAudit } = require('../lib/audit');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || !String(secret).trim()) {
    const error = new Error('Internal server error');
    error.status = 500;
    throw error;
  }

  return secret;
}

async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  let decoded;

  try {
    decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    if (decoded.type === 'admin') {
      const admin = await prisma.admin.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          campusScope: true
        }
      });

      if (!admin) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      req.user = {
        id: admin.id,
        email: admin.email,
        type: 'admin',
        role: admin.role,
        campusScope: admin.campusScope || null,
        name: admin.fullName
      };

      return next();
    }

    if (decoded.type === 'alumni') {
      const alumni = await prisma.alumni.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          displayName: true,
          verificationStatus: true
        }
      });

      if (!alumni) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      req.user = {
        id: alumni.id,
        email: alumni.email,
        type: 'alumni',
        role: null,
        campusScope: null,
        name: alumni.displayName,
        verificationStatus: alumni.verificationStatus
      };

      return next();
    }

    return res.status(401).json({ error: 'Invalid or expired token' });
  } catch (error) {
    return next(error);
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

module.exports = { auth, requireAdmin, requireAlumni, requirePermission, getJwtSecret };
