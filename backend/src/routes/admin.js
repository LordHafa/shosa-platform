const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { auth, requireAdmin, requirePermission } = require('../middleware/auth');
const { makeUpload } = require('../middleware/upload');
const { writeAudit } = require('../lib/audit');
const { normalizeEmail, isValidEmail, validatePassword, getBcryptRounds } = require('../lib/validators');
const { adminScopeWhere, CAMPUSES, ROLE_DEFINITIONS, PERMISSION_DEFINITIONS, ROLE_PERMISSIONS } = require('../lib/permissions');
const {
  parseId,
  cleanOptional,
  requireNonEmpty,
  ensurePaymentCanBeFinalized,
  validateContactStatus,
  validateVerificationStatus
} = require('../lib/validators');
const { ensureSaccoDocumentsVerified } = require('../lib/saccoDocuments');
const { issueReceiptForPayment } = require('../lib/receipts');

const router = express.Router();
const uploadGallery = makeUpload('gallery');
const uploadDocument = makeUpload('documents', { mode: 'document', private: true });

router.use(auth, requireAdmin);

function monthKey(date) {
  return date.toISOString().slice(0, 7);
}

function lastSixMonthKeys() {
  const now = new Date();
  const keys = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 1));
    keys.push(d.toISOString().slice(0, 7));
  }
  return keys;
}

function safeAdmin(admin) {
  if (!admin) return null;
  const { passwordHash, ...safe } = admin;
  return safe;
}

function documentPath(storedFileName) {
  const safeName = path.basename(storedFileName || '');
  return path.join(process.cwd(), 'private_admin_documents', 'documents', safeName);
}

function campusAliases(value) {
  const raw = String(value || '').trim();
  if (!raw) return [];

  const key = raw.toLowerCase().replace(/[\s-]+/g, '_');

  const aliasMap = {
    main: ['Main', 'Main Campus', 'main', 'main campus'],
    main_campus: ['Main', 'Main Campus', 'main', 'main campus'],

    mbalala: ['Mbalala', 'Mbalala Campus', 'mbalala', 'mbalala campus'],
    mbalala_campus: ['Mbalala', 'Mbalala Campus', 'mbalala', 'mbalala campus'],

    green: ['Green', 'Green Campus', 'green', 'green campus'],
    green_campus: ['Green', 'Green Campus', 'green', 'green campus'],

    alevel: ['A Level', 'A Level Campus', 'A-Level', 'A-Level Campus', 'alevel', 'a level', 'a level campus'],
    a_level: ['A Level', 'A Level Campus', 'A-Level', 'A-Level Campus', 'alevel', 'a level', 'a level campus'],
    a_level_campus: ['A Level', 'A Level Campus', 'A-Level', 'A-Level Campus', 'alevel', 'a level', 'a level campus']
  };

  return aliasMap[key] || [raw];
}

function buildAlumniWhere(query, user) {
  const baseScope = adminScopeWhere(user, 'campus') || {};
  const andClauses = [];

  if (Object.keys(baseScope).length) andClauses.push(baseScope);

  if (query.campus) {
    const aliases = campusAliases(query.campus);
    if (aliases.length) {
      andClauses.push({
        OR: aliases.map((campus) => ({
          campus: { equals: campus, mode: 'insensitive' }
        }))
      });
    }
  }

  if (query.status) {
    andClauses.push({ verificationStatus: String(query.status).trim().toLowerCase() });
  }

  if (query.membershipTier) {
    andClauses.push({ membershipTier: String(query.membershipTier).trim() });
  }

  if (query.year) {
    const year = parseInt(query.year, 10);
    if (Number.isInteger(year)) andClauses.push({ gradYear: year });
  }

  if (query.search) {
    const search = String(query.search).trim();
    if (search) {
      andClauses.push({
        OR: [
          { displayName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { campus: { contains: search, mode: 'insensitive' } }
        ]
      });
    }
  }

  if (!andClauses.length) return {};
  if (andClauses.length === 1) return andClauses[0];

  return { AND: andClauses };
}

function combineWhereClauses(...clauses) {
  const clean = clauses.filter((clause) => clause && Object.keys(clause).length);
  if (!clean.length) return {};
  if (clean.length === 1) return clean[0];
  return { AND: clean };
}

function paymentCampusScopeFilter(user) {
  const scoped = adminScopeWhere(user, 'campus');
  if (!scoped?.campus) return null;

  const aliases = campusAliases(scoped.campus);

  return {
    OR: aliases.map((campus) => ({
      alumni: {
        campus: { equals: campus, mode: 'insensitive' }
      }
    }))
  };
}

function applyPaymentScope(baseWhere, user) {
  return combineWhereClauses(baseWhere || {}, paymentCampusScopeFilter(user));
}

function buildPaymentWhere(query, user) {
  const where = {};

  if (query.status) where.status = String(query.status);
  if (query.type) where.paymentType = String(query.type);

  if (query.search) {
    const search = String(query.search).trim();

    if (search) {
      where.OR = [
        { transactionRef: { contains: search, mode: 'insensitive' } },
        { label: { contains: search, mode: 'insensitive' } },
        { alumni: { displayName: { contains: search, mode: 'insensitive' } } },
        { alumni: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }
  }

  return applyPaymentScope(where, user);
}

router.get('/dashboard', requirePermission('dashboard:read'), async (req, res, next) => {
  try {
    const monthKeys = lastSixMonthKeys();
    const trendStart = new Date(`${monthKeys[0]}-01T00:00:00.000Z`);
    const scopedAlumniWhere = adminScopeWhere(req.user, 'campus');
    const scopedPaymentWhere = applyPaymentScope({}, req.user);

    const [
      totalAlumni,
      pendingAlumni,
      verifiedAlumni,
      saccoMembers,
      pendingSaccoMembers,
      pendingPayments,
      approvedPayments,
      rejectedPayments,
      totalPayments,
      contactMessages,
      galleryUploads,
      adminDocuments,
      auditLogCount,
      roleCount,
      campusCount,
      permissionCount,
      recentAlumni,
      approvedRecentPayments,
      recentPayments,
      recentAuditLogs,
      allAlumniForGroups
    ] = await Promise.all([
      prisma.alumni.count({ where: scopedAlumniWhere }),
      prisma.alumni.count({ where: { ...(scopedAlumniWhere || {}), verificationStatus: 'pending' } }),
      prisma.alumni.count({ where: { ...(scopedAlumniWhere || {}), verificationStatus: 'verified' } }),
      prisma.saccoMembership.count({ where: { status: 'active' } }),
      prisma.saccoMembership.count({ where: { status: 'pending' } }),
      prisma.payment.count({ where: applyPaymentScope({ status: { in: ['pending', 'pending_gateway_confirmation'] } }, req.user) }),
      prisma.payment.count({ where: applyPaymentScope({ status: 'approved' }, req.user) }),
      prisma.payment.count({ where: applyPaymentScope({ status: 'rejected' }, req.user) }),
      prisma.payment.aggregate({ where: applyPaymentScope({ status: 'approved' }, req.user), _sum: { amount: true } }),
      prisma.contactSubmission.count({ where: { status: 'new' } }),
      prisma.galleryItem.count(),
      prisma.adminDocument.count({ where: { isDeleted: false } }),
      prisma.auditLog.count(),
      prisma.role.count(),
      prisma.campus.count({ where: { isActive: true } }),
      prisma.permission.count(),
      prisma.alumni.findMany({ where: scopedAlumniWhere, orderBy: { createdAt: 'desc' }, take: 8, select: { id: true, displayName: true, email: true, campus: true, gradYear: true, verificationStatus: true } }),
      prisma.payment.findMany({ where: applyPaymentScope({ status: 'approved', createdAt: { gte: trendStart } }, req.user), select: { amount: true, paymentType: true, createdAt: true } }),
      prisma.payment.findMany({ where: scopedPaymentWhere, include: { alumni: { select: { id: true, displayName: true, email: true, campus: true } }, receipt: true }, orderBy: { createdAt: 'desc' }, take: 8 }),
      prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
      prisma.alumni.findMany({ where: scopedAlumniWhere, select: { campus: true, gradYear: true } })
    ]);

    const trendMap = Object.fromEntries(monthKeys.map((key) => [key, 0]));
    const breakdownMap = {};
    approvedRecentPayments.forEach((payment) => {
      const key = monthKey(payment.createdAt);
      if (key in trendMap) trendMap[key] += payment.amount || 0;
      const type = payment.paymentType || 'other';
      breakdownMap[type] = (breakdownMap[type] || 0) + (payment.amount || 0);
    });

    const campusCounts = {};
    const yearCounts = {};
    allAlumniForGroups.forEach((alumni) => {
      campusCounts[alumni.campus || 'unknown'] = (campusCounts[alumni.campus || 'unknown'] || 0) + 1;
      yearCounts[alumni.gradYear || 'unknown'] = (yearCounts[alumni.gradYear || 'unknown'] || 0) + 1;
    });

    res.json({
      totalAlumni,
      pendingAlumni,
      verifiedAlumni,
      saccoMembers,
      pendingSaccoMembers,
      pendingPayments,
      approvedPayments,
      rejectedPayments,
      totalRevenue: totalPayments._sum.amount || 0,
      contactMessages,
      galleryUploads,
      adminDocuments,
      auditLogCount,
      roleCount,
      campusCount,
      permissionCount,
      campusCounts: Object.entries(campusCounts).map(([campus, count]) => ({ campus, count })),
      yearCounts: Object.entries(yearCounts).map(([year, count]) => ({ year, count })).sort((a, b) => Number(b.year) - Number(a.year)),
      collectionsTrend: monthKeys.map((key) => ({ month: key, amount: trendMap[key] || 0 })),
      paymentBreakdown: Object.entries(breakdownMap).map(([type, amount]) => ({ type, amount })).sort((a, b) => b.amount - a.amount),
      recentAlumni,
      recentPayments,
      recentAuditLogs
    });
  } catch (error) { next(error); }
});

router.get('/alumni', requirePermission('alumni:read'), async (req, res, next) => {
  try {
    const alumni = await prisma.alumni.findMany({
      where: buildAlumniWhere(req.query, req.user),
      orderBy: { createdAt: 'desc' },
      include: { saccoMembership: true },
      take: 200
    });
    res.json(alumni.map(({ passwordHash, ...safe }) => safe));
  } catch (error) { next(error); }
});

router.put('/alumni/:id/verification', requirePermission('alumni:update'), async (req, res, next) => {
  try {
    const id = parseId(req.params.id, 'alumni ID');
    const verificationStatus = validateVerificationStatus(req.body.status);
    const updated = await prisma.alumni.update({ where: { id }, data: { verificationStatus } });
    await writeAudit(req, { action: 'UPDATE_ALUMNI_VERIFICATION', resourceType: 'Alumni', resourceId: id, status: 'success', metadata: { verificationStatus } });
    const { passwordHash, ...safe } = updated;
    res.json(safe);
  } catch (error) { next(error); }
});

router.get('/sacco-members', requirePermission('alumni:read'), async (req, res, next) => {
  try {
    const status = req.query.status ? String(req.query.status) : undefined;
    const memberships = await prisma.saccoMembership.findMany({
      where: status ? { status } : undefined,
      include: { alumni: { select: { id: true, displayName: true, email: true, phone: true, campus: true, gradYear: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    res.json(memberships);
  } catch (error) { next(error); }
});

router.get('/payments', requirePermission('payments:read'), async (req, res, next) => {
  try {
    const where = buildPaymentWhere(req.query, req.user);

    const payments = await prisma.payment.findMany({
      where,
      include: { alumni: { select: { id: true, displayName: true, email: true, campus: true } }, receipt: true },
      orderBy: { createdAt: 'desc' },
      take: 250
    });

    res.json(payments);
  } catch (error) { next(error); }
});

router.post('/payments/:id/approve', requirePermission('payments:review'), async (req, res, next) => {
  try {
    const id = parseId(req.params.id, 'payment ID');
    const payment = await prisma.payment.findFirst({ where: applyPaymentScope({ id }, req.user) });
    ensurePaymentCanBeFinalized(payment);

    if (payment.paymentType === 'sacco_membership_fee') {
      await ensureSaccoDocumentsVerified(prisma, payment.alumniId);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const approved = await tx.payment.update({
        where: { id },
        data: { status: 'approved', confirmedAt: new Date(), confirmedBy: req.user.id, reviewedAt: new Date(), reviewedBy: req.user.id }
      });
      if (payment.paymentType === 'sacco_membership_fee') {
        await tx.saccoMembership.updateMany({
          where: { alumniId: payment.alumniId },
          data: { status: 'active', approvedAt: new Date(), approvedBy: req.user.id, joinedAt: new Date() }
        });
        await tx.alumni.update({ where: { id: payment.alumniId }, data: { membershipTier: 'sacco_member' } });
      }
      await tx.paymentReview.create({
        data: {
          paymentId: id,
          reviewerAdminId: req.user.id,
          action: 'approved',
          fromStatus: payment.status,
          toStatus: 'approved',
          metadata: { paymentType: payment.paymentType, amount: payment.amount }
        }
      });
      return approved;
    });

    const receipt = await issueReceiptForPayment(prisma, { paymentId: id, adminId: req.user.id });

    await writeAudit(req, {
      action: 'ISSUE_RECEIPT',
      resourceType: 'Receipt',
      resourceId: receipt.id,
      status: 'success',
      metadata: {
        paymentId: id,
        receiptNumber: receipt.receiptNumber,
        emailStatus: receipt.emailStatus
      }
    });

    await writeAudit(req, {
      action: 'APPROVE_PAYMENT',
      resourceType: 'Payment',
      resourceId: id,
      status: 'success',
      metadata: {
        paymentType: payment.paymentType,
        amount: payment.amount,
        receiptNumber: receipt.receiptNumber
      }
    });

    res.json({ ...updated, receipt });
  } catch (error) { next(error); }
});

router.post('/payments/:id/reject', requirePermission('payments:review'), async (req, res, next) => {
  try {
    const id = parseId(req.params.id, 'payment ID');
    const reason = requireNonEmpty(req.body.reason, 'Rejection reason');
    const payment = await prisma.payment.findFirst({ where: applyPaymentScope({ id }, req.user) });
    ensurePaymentCanBeFinalized(payment);

    const updated = await prisma.$transaction(async (tx) => {
      const rejected = await tx.payment.update({
        where: { id },
        data: { status: 'rejected', rejectionReason: reason, reviewedAt: new Date(), reviewedBy: req.user.id }
      });
      await tx.paymentReview.create({
        data: {
          paymentId: id,
          reviewerAdminId: req.user.id,
          action: 'rejected',
          fromStatus: payment.status,
          toStatus: 'rejected',
          reason,
          metadata: { paymentType: payment.paymentType, amount: payment.amount }
        }
      });
      return rejected;
    });
    await writeAudit(req, { action: 'REJECT_PAYMENT', resourceType: 'Payment', resourceId: id, status: 'success', reason, metadata: { paymentType: payment.paymentType, amount: payment.amount } });
    res.json(updated);
  } catch (error) { next(error); }
});

router.get('/gallery', requirePermission('gallery:manage'), async (req, res, next) => {
  try {
    const items = await prisma.galleryItem.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(items);
  } catch (error) { next(error); }
});

router.post('/gallery', requirePermission('gallery:manage'), uploadGallery.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image file is required' });
    const { title, description, category } = req.body;
    const item = await prisma.galleryItem.create({
      data: {
        title: cleanOptional(title) || req.file.originalname,
        description: cleanOptional(description),
        category: cleanOptional(category) || 'general',
        imagePath: `/uploads/gallery/${req.file.filename}`,
        uploadedBy: req.user.id,
        isPublished: true
      }
    });
    await writeAudit(req, { action: 'UPLOAD_GALLERY_IMAGE', resourceType: 'GalleryItem', resourceId: item.id, status: 'success', metadata: { category: item.category } });
    res.status(201).json(item);
  } catch (error) { next(error); }
});

router.delete('/gallery/:id', requirePermission('gallery:manage'), async (req, res, next) => {
  try {
    const id = parseId(req.params.id, 'gallery item ID');
    const item = await prisma.galleryItem.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: 'Gallery item not found' });
    await prisma.galleryItem.delete({ where: { id } });
    await writeAudit(req, { action: 'DELETE_GALLERY_IMAGE', resourceType: 'GalleryItem', resourceId: id, status: 'success', metadata: { title: item.title } });
    res.json({ message: 'Gallery item deleted' });
  } catch (error) { next(error); }
});

router.get('/contacts', requirePermission('contacts:read'), async (req, res, next) => {
  try {
    const where = req.query.status ? { status: String(req.query.status) } : undefined;
    const items = await prisma.contactSubmission.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
    res.json(items);
  } catch (error) { next(error); }
});

router.get('/contact-submissions', requirePermission('contacts:read'), async (req, res, next) => {
  try {
    const where = req.query.status ? { status: String(req.query.status) } : undefined;
    const items = await prisma.contactSubmission.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
    res.json(items);
  } catch (error) { next(error); }
});

router.get('/contacts/:id', requirePermission('contacts:read'), async (req, res, next) => {
  try {
    const id = parseId(req.params.id, 'contact message ID');
    const item = await prisma.contactSubmission.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: 'Contact message not found' });
    res.json(item);
  } catch (error) { next(error); }
});

router.put('/contacts/:id/status', requirePermission('contacts:update'), async (req, res, next) => {
  try {
    const id = parseId(req.params.id, 'contact message ID');
    const status = validateContactStatus(req.body.status);
    const data = { status };
    if (status === 'replied') data.repliedAt = new Date();
    if (status === 'archived') data.archivedAt = new Date();
    const updated = await prisma.contactSubmission.update({ where: { id }, data });
    await writeAudit(req, { action: 'UPDATE_CONTACT_STATUS', resourceType: 'ContactSubmission', resourceId: id, status: 'success', metadata: { newStatus: status } });
    res.json(updated);
  } catch (error) { next(error); }
});

router.put('/contact-submissions/:id/status', requirePermission('contacts:update'), async (req, res, next) => {
  try {
    const id = parseId(req.params.id, 'contact message ID');
    const status = validateContactStatus(req.body.status);
    const data = { status };
    if (status === 'replied') data.repliedAt = new Date();
    if (status === 'archived') data.archivedAt = new Date();
    const updated = await prisma.contactSubmission.update({ where: { id }, data });
    await writeAudit(req, { action: 'UPDATE_CONTACT_STATUS', resourceType: 'ContactSubmission', resourceId: id, status: 'success', metadata: { newStatus: status } });
    res.json(updated);
  } catch (error) { next(error); }
});


router.get('/governance', requirePermission('dashboard:read'), async (req, res, next) => {
  try {
    const [campuses, roles, permissions, settings] = await Promise.all([
      prisma.campus.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.role.findMany({ orderBy: { code: 'asc' }, include: { permissions: { include: { permission: true } } } }),
      prisma.permission.findMany({ orderBy: [{ category: 'asc' }, { code: 'asc' }] }),
      prisma.setting.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] })
    ]);
    res.json({
      campuses: campuses.length ? campuses : CAMPUSES,
      roles: roles.length ? roles : ROLE_DEFINITIONS,
      permissions: permissions.length ? permissions : PERMISSION_DEFINITIONS,
      rolePermissions: ROLE_PERMISSIONS,
      settings
    });
  } catch (error) { next(error); }
});

router.get('/audit-logs', requirePermission('audit:read'), async (req, res, next) => {
  try {
    const where = {};
    if (req.query.action) where.action = { contains: String(req.query.action), mode: 'insensitive' };
    if (req.query.resourceType) where.resourceType = String(req.query.resourceType);
    const logs = await prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
    res.json(logs);
  } catch (error) { next(error); }
});

router.get('/users', requirePermission('users:manage'), async (req, res, next) => {
  try {
    const admins = await prisma.admin.findMany({ orderBy: { createdAt: 'desc' }, include: { adminRoles: { include: { role: true } } } });
    res.json(admins.map(safeAdmin));
  } catch (error) { next(error); }
});

router.post('/users', requirePermission('*'), async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address' });
    const fullName = requireNonEmpty(req.body.fullName, 'Full name');
    const role = cleanOptional(req.body.role) || 'admin';
    const password = validatePassword(requireNonEmpty(req.body.password, 'Password'));
    const passwordHash = await bcrypt.hash(password, getBcryptRounds());
    const campusScope = cleanOptional(req.body.campusScope);
    const admin = await prisma.$transaction(async (tx) => {
      const created = await tx.admin.create({ data: { email, fullName, role, campusScope, passwordHash } });
      const roleRecord = await tx.role.findUnique({ where: { code: role } });
      if (roleRecord) {
        await tx.adminRole.create({ data: { adminId: created.id, roleId: roleRecord.id, scopeType: campusScope ? 'campus' : null, scopeValue: campusScope } });
      }
      return created;
    });
    await writeAudit(req, { action: 'CREATE_ADMIN_USER', resourceType: 'Admin', resourceId: admin.id, status: 'success', metadata: { email, role, campusScope } });
    res.status(201).json(safeAdmin(admin));
  } catch (error) { next(error); }
});

router.put('/users/:id', requirePermission('*'), async (req, res, next) => {
  try {
    const id = parseId(req.params.id, 'admin ID');
    const data = {};
    if (req.body.fullName !== undefined) data.fullName = requireNonEmpty(req.body.fullName, 'Full name');
    if (req.body.role !== undefined) data.role = requireNonEmpty(req.body.role, 'Role');
    if (req.body.campusScope !== undefined) data.campusScope = cleanOptional(req.body.campusScope);
    const admin = await prisma.admin.update({ where: { id }, data });
    await writeAudit(req, { action: 'UPDATE_ADMIN_USER', resourceType: 'Admin', resourceId: id, status: 'success', metadata: data });
    res.json(safeAdmin(admin));
  } catch (error) { next(error); }
});

router.get('/users/:id/documents', requirePermission('documents:manage'), async (req, res, next) => {
  try {
    const alumniId = parseId(req.params.id, 'alumni ID');
    const documents = await prisma.adminDocument.findMany({
      where: { alumniId, isDeleted: false },
      orderBy: { createdAt: 'desc' }
    });
    res.json(documents);
  } catch (error) { next(error); }
});

router.post('/users/:id/documents', requirePermission('documents:manage'), uploadDocument.single('document'), async (req, res, next) => {
  try {
    const alumniId = parseId(req.params.id, 'alumni ID');
    const alumni = await prisma.alumni.findUnique({ where: { id: alumniId }, select: { id: true, displayName: true } });
    if (!alumni) return res.status(404).json({ error: 'Alumni not found' });
    if (!req.file) return res.status(400).json({ error: 'Document file is required' });
    const documentType = cleanOptional(req.body.documentType) || 'general';
    const document = await prisma.adminDocument.create({
      data: {
        adminId: req.user.id,
        alumniId,
        documentType,
        originalFileName: req.file.originalname,
        storedFileName: req.file.filename,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        uploadedBy: req.user.id
      }
    });
    await writeAudit(req, { action: 'UPLOAD_ADMIN_DOCUMENT', resourceType: 'AdminDocument', resourceId: document.id, status: 'success', metadata: { alumniId, documentType, fileName: req.file.originalname } });
    res.status(201).json(document);
  } catch (error) { next(error); }
});

router.get('/users/:id/documents/:documentId/download', requirePermission('documents:manage'), async (req, res, next) => {
  try {
    const alumniId = parseId(req.params.id, 'alumni ID');
    const documentId = parseId(req.params.documentId, 'document ID');
    const document = await prisma.adminDocument.findFirst({ where: { id: documentId, alumniId, isDeleted: false } });
    if (!document) return res.status(404).json({ error: 'Document not found' });
    const filePath = documentPath(document.storedFileName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Document file is missing on disk' });
    await writeAudit(req, { action: 'DOWNLOAD_ADMIN_DOCUMENT', resourceType: 'AdminDocument', resourceId: document.id, status: 'success', metadata: { alumniId } });
    res.download(filePath, path.basename(document.originalFileName || 'document'));
  } catch (error) { next(error); }
});

router.delete('/users/:id/documents/:documentId', requirePermission('documents:manage'), async (req, res, next) => {
  try {
    const alumniId = parseId(req.params.id, 'alumni ID');
    const documentId = parseId(req.params.documentId, 'document ID');
    const document = await prisma.adminDocument.findFirst({ where: { id: documentId, alumniId, isDeleted: false } });
    if (!document) return res.status(404).json({ error: 'Document not found' });
    const updated = await prisma.adminDocument.update({ where: { id: document.id }, data: { isDeleted: true, deletedAt: new Date(), deletedBy: req.user.id } });
    await writeAudit(req, { action: 'DELETE_ADMIN_DOCUMENT', resourceType: 'AdminDocument', resourceId: document.id, status: 'success', metadata: { alumniId, originalFileName: document.originalFileName } });
    res.json(updated);
  } catch (error) { next(error); }
});

router.get('/documents', requirePermission('documents:manage'), async (req, res, next) => {
  try {
    const documents = await prisma.adminDocument.findMany({
      where: { isDeleted: false },
      include: { alumni: { select: { id: true, displayName: true, email: true, campus: true } }, receipt: true },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    res.json(documents);
  } catch (error) { next(error); }
});


router.put('/documents/:documentId/verify', requirePermission('documents:manage'), async (req, res, next) => {
  try {
    const documentId = parseId(req.params.documentId, 'document ID');
    const reviewNote = cleanOptional(req.body.reviewNote);

    const document = await prisma.adminDocument.findFirst({
      where: { id: documentId, isDeleted: false }
    });

    if (!document) return res.status(404).json({ error: 'Document not found' });

    const updated = await prisma.adminDocument.update({
      where: { id: documentId },
      data: {
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        verifiedBy: req.user.id,
        reviewNote
      }
    });

    await writeAudit(req, {
      action: 'VERIFY_ADMIN_DOCUMENT',
      resourceType: 'AdminDocument',
      resourceId: documentId,
      status: 'success',
      metadata: { alumniId: document.alumniId, documentType: document.documentType }
    });

    res.json(updated);
  } catch (error) { next(error); }
});

router.put('/documents/:documentId/reject', requirePermission('documents:manage'), async (req, res, next) => {
  try {
    const documentId = parseId(req.params.documentId, 'document ID');
    const reviewNote = requireNonEmpty(req.body.reviewNote, 'Review note');

    const document = await prisma.adminDocument.findFirst({
      where: { id: documentId, isDeleted: false }
    });

    if (!document) return res.status(404).json({ error: 'Document not found' });

    const updated = await prisma.adminDocument.update({
      where: { id: documentId },
      data: {
        verificationStatus: 'rejected',
        verifiedAt: new Date(),
        verifiedBy: req.user.id,
        reviewNote
      }
    });

    await writeAudit(req, {
      action: 'REJECT_ADMIN_DOCUMENT',
      resourceType: 'AdminDocument',
      resourceId: documentId,
      status: 'success',
      reason: reviewNote,
      metadata: { alumniId: document.alumniId, documentType: document.documentType }
    });

    res.json(updated);
  } catch (error) { next(error); }
});

module.exports = router;







