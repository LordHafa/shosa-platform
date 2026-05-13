const CAMPUSES = [
  { code: 'main', name: 'Main Campus', sortOrder: 1 },
  { code: 'mbalala', name: 'Mbalala Campus', sortOrder: 2 },
  { code: 'green', name: 'Green Campus', sortOrder: 3 },
  { code: 'alevel', name: 'A Level Campus', sortOrder: 4 },
];

const PERMISSION_DEFINITIONS = [
  { code: 'dashboard:read', name: 'View admin dashboard', category: 'dashboard' },
  { code: 'alumni:read', name: 'View alumni records', category: 'alumni' },
  { code: 'alumni:update', name: 'Update alumni verification', category: 'alumni' },
  { code: 'payments:read', name: 'View payment records', category: 'payments' },
  { code: 'payments:review', name: 'Approve or reject payments', category: 'payments' },
  { code: 'gallery:manage', name: 'Manage gallery uploads', category: 'gallery' },
  { code: 'documents:manage', name: 'Manage private documents', category: 'documents' },
  { code: 'contacts:read', name: 'View contact submissions', category: 'contacts' },
  { code: 'contacts:update', name: 'Update contact status', category: 'contacts' },
  { code: 'audit:read', name: 'View audit logs', category: 'audit' },
  { code: 'users:manage', name: 'Manage admin users and roles', category: 'governance' },
  { code: '*', name: 'Full platform access', category: 'governance' },
];

const ROLE_DEFINITIONS = [
  { code: 'super_admin', name: 'Super Admin', scopeLevel: 'global', description: 'Full control of the Seeta Alumni System.' },
  { code: 'system_auditor', name: 'System Auditor', scopeLevel: 'global', description: 'Can inspect dashboards and audit trails but should not mutate records.' },
  { code: 'central_secretary', name: 'Central Secretary', scopeLevel: 'global', description: 'Coordinates alumni records, communication, gallery and contacts.' },
  { code: 'central_treasurer', name: 'Central Treasurer', scopeLevel: 'global', description: 'Oversees central financial records and summaries.' },
  { code: 'campus_representative', name: 'Campus Representative', scopeLevel: 'campus', description: 'Views and supports records for a specific campus.' },
  { code: 'campus_secretary', name: 'Campus Secretary', scopeLevel: 'campus', description: 'Manages records and documents for a specific campus.' },
  { code: 'campus_treasurer', name: 'Campus Treasurer', scopeLevel: 'campus', description: 'Reviews campus-scoped payment summaries.' },
  { code: 'sacco_verifier', name: 'SACCO Verifier', scopeLevel: 'global', description: 'Reviews and verifies SACCO/mobile-money payment records.' },
  { code: 'sacco_board', name: 'SACCO Board', scopeLevel: 'global', description: 'Views SACCO member and financial summaries.' },
  { code: 'credit_committee', name: 'Credit Committee', scopeLevel: 'global', description: 'Views SACCO financial records for credit discussions.' },
  { code: 'admin', name: 'General Admin', scopeLevel: 'global', description: 'Basic admin access for viewing common records.' },
];

const ROLE_PERMISSIONS = {
  super_admin: ['*'],
  system_auditor: ['audit:read', 'dashboard:read'],
  central_treasurer: ['dashboard:read', 'payments:read', 'payments:review', 'audit:read'],
  central_secretary: ['dashboard:read', 'alumni:read', 'alumni:update', 'contacts:read', 'contacts:update', 'gallery:manage', 'documents:manage'],
  campus_treasurer: ['dashboard:read', 'payments:read', 'payments:review'],
  campus_secretary: ['dashboard:read', 'alumni:read', 'alumni:update', 'contacts:read', 'contacts:update', 'documents:manage'],
  campus_representative: ['dashboard:read', 'alumni:read', 'gallery:manage'],
  sacco_verifier: ['dashboard:read', 'payments:read', 'payments:review'],
  sacco_board: ['dashboard:read', 'payments:read', 'alumni:read'],
  credit_committee: ['dashboard:read', 'payments:read'],
  admin: ['dashboard:read', 'alumni:read', 'payments:read', 'contacts:read'],
};

function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes('*') || permissions.includes(permission);
}

function adminScopeWhere(user, field = 'campus') {
  if (!user || !user.campusScope) return undefined;
  if (user.role === 'super_admin' || user.role === 'central_secretary' || user.role === 'central_treasurer') return undefined;
  return { [field]: user.campusScope };
}

module.exports = { CAMPUSES, PERMISSION_DEFINITIONS, ROLE_DEFINITIONS, ROLE_PERMISSIONS, hasPermission, adminScopeWhere };
