const prisma = require('./prisma');

function safeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return metadata || null;
  const blocked = new Set(['password', 'passwordHash', 'token', 'authorization', 'secret', 'jwt']);
  const cleaned = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (blocked.has(String(key).toLowerCase())) continue;
    cleaned[key] = value;
  }
  return cleaned;
}

async function writeAudit(req, data = {}) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: req.user?.type === 'admin' ? req.user.id : null,
        adminEmail: req.user?.email || null,
        adminRole: req.user?.role || null,
        action: data.action || 'UNKNOWN_ACTION',
        resourceType: data.resourceType || 'System',
        resourceId: data.resourceId ? String(data.resourceId) : null,
        status: data.status || 'success',
        reason: data.reason || null,
        ip: req.ip,
        userAgent: req.headers?.['user-agent'] || null,
        metadata: safeMetadata(data.metadata)
      }
    });
  } catch (error) {
    // Audit failure should not crash the user-facing request in local testing.
    console.error('Audit write failed:', error.message);
  }
}

module.exports = { writeAudit };

