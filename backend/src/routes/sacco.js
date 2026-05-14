const express = require('express');
const fs = require('fs');
const path = require('path');
const prisma = require('../lib/prisma');
const { auth, requireAlumni } = require('../middleware/auth');
const { makeUpload } = require('../middleware/upload');
const { parsePositiveUgx, cleanOptional } = require('../lib/validators');
const {
  SACCO_REGISTRATION_FEE,
  normalizeMembershipType,
  validateMembershipContributionOption,
  getSaccoPaymentContext
} = require('../lib/saccoRules');
const {
  REQUIRED_SACCO_DOCUMENT_TYPES,
  OPTIONAL_SACCO_DOCUMENT_TYPES,
  SACCO_DOCUMENT_LABELS,
  getSaccoDocumentStatus
} = require('../lib/saccoDocuments');

const router = express.Router();

router.use(auth, requireAlumni);

const uploadSaccoDocuments = makeUpload('documents', { mode: 'document', private: true });

const SACCO_DOCUMENT_UPLOAD_FIELDS = [
  ...REQUIRED_SACCO_DOCUMENT_TYPES,
  ...OPTIONAL_SACCO_DOCUMENT_TYPES
].map((name) => ({ name, maxCount: 1 }));

function flattenUploadedFiles(files = {}) {
  return Object.entries(files)
    .flatMap(([documentType, fileList]) => (fileList || []).map((file) => ({ documentType, file })));
}

function cleanupUploadedFiles(files = {}) {
  for (const item of flattenUploadedFiles(files)) {
    if (item.file?.path) {
      try {
        fs.unlinkSync(item.file.path);
      } catch {
        // Best-effort cleanup only.
      }
    }
  }
}

function assertRequiredDocuments(files = {}) {
  const missing = REQUIRED_SACCO_DOCUMENT_TYPES.filter((type) => !files[type]?.[0]);

  if (missing.length) {
    const error = new Error(
      `Missing required SACCO document(s): ${missing.map((type) => SACCO_DOCUMENT_LABELS[type] || type).join(', ')}`
    );
    error.status = 400;
    throw error;
  }
}

function assertPassportPhotoIsImage(files = {}) {
  const passportPhoto = files.sacco_passport_photo?.[0];

  if (!passportPhoto) return;

  const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const ext = path.extname(passportPhoto.originalname || '').toLowerCase();
  const imageExtOk = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);

  if (!allowedImageTypes.has(passportPhoto.mimetype) && !imageExtOk) {
    const error = new Error('Passport-size photo must be a JPG, PNG or WEBP image.');
    error.status = 400;
    throw error;
  }
}

router.get('/me', async (req, res, next) => {
  try {
    const context = await getSaccoPaymentContext(prisma, req.user.id);
    const documentStatus = await getSaccoDocumentStatus(prisma, req.user.id);

    const payments = await prisma.payment.findMany({
      where: { alumniId: req.user.id, paymentType: { startsWith: 'sacco_' } },
      orderBy: { createdAt: 'desc' }
    });

    const approvedAmount = payments
      .filter(payment => payment.status === 'approved')
      .reduce((sum, payment) => sum + payment.amount, 0);

    const pendingCount = payments
      .filter(payment => payment.status === 'pending' || payment.status === 'pending_gateway_confirmation')
      .length;

    res.json({
      membership: context.membership,
      subscription: context.subscription,
      documentStatus,
      payments,
      summary: {
        approvedAmount,
        pendingCount,
        totalCount: payments.length
      }
    });
  } catch (error) { next(error); }
});

router.post('/register', uploadSaccoDocuments.fields(SACCO_DOCUMENT_UPLOAD_FIELDS), async (req, res, next) => {
  let completed = false;

  try {
    const existing = await prisma.saccoMembership.findUnique({ where: { alumniId: req.user.id } });
    if (existing) {
      const error = new Error('You have already started SACCO registration');
      error.status = 400;
      throw error;
    }

    const { membershipType, monthlyContribution, startDate, phone, network, transactionRef } = req.body;
    const normalizedMembershipType = normalizeMembershipType(membershipType || 'starter');
    const contribution = monthlyContribution ? parsePositiveUgx(monthlyContribution) : null;

    validateMembershipContributionOption(normalizedMembershipType, contribution);

    assertRequiredDocuments(req.files || {});
    assertPassportPhotoIsImage(req.files || {});

    if (transactionRef) {
      const duplicate = await prisma.payment.findUnique({
        where: { transactionRef: String(transactionRef).trim() }
      });

      if (duplicate) {
        const error = new Error('This transaction reference has already been recorded');
        error.status = 409;
        throw error;
      }
    }

    const uploadedDocs = flattenUploadedFiles(req.files || {});

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          alumniId: req.user.id,
          paymentType: 'sacco_membership_fee',
          label: 'SACCO Registration Fee',
          amount: SACCO_REGISTRATION_FEE,
          phone: cleanOptional(phone),
          network: cleanOptional(network),
          transactionRef: cleanOptional(transactionRef),
          status: 'pending',
          paymentChannel: network === 'Bank Transfer' ? 'bank_transfer' : network === 'Cash / Manual Deposit' ? 'cash' : 'mobile_money'
        }
      });

      const membership = await tx.saccoMembership.create({
        data: {
          alumniId: req.user.id,
          membershipNumber: `SAC-${new Date().getFullYear()}-${String(req.user.id).padStart(5, '0')}`,
          status: 'pending',
          registrationFeePaymentId: payment.id,
          membershipType: normalizedMembershipType,
          monthlyContribution: contribution,
          startDate: startDate ? new Date(startDate) : null,
          notes: 'SACCO registration submitted with member-uploaded onboarding documents.'
        }
      });

      const documents = [];

      for (const item of uploadedDocs) {
        const created = await tx.adminDocument.create({
          data: {
            adminId: null,
            alumniId: req.user.id,
            documentType: item.documentType,
            originalFileName: item.file.originalname,
            storedFileName: item.file.filename,
            mimeType: item.file.mimetype,
            sizeBytes: item.file.size,
            uploadedBy: null,
            uploadedByAlumniId: req.user.id,
            source: 'sacco_registration',
            verificationStatus: 'pending'
          }
        });

        documents.push(created);
      }

      return { payment, membership, documents };
    });

    completed = true;

    res.status(201).json({
      message: 'SACCO registration created with required documents. Awaiting admin document and payment verification.',
      ...result
    });
  } catch (error) {
    if (!completed) cleanupUploadedFiles(req.files || {});
    next(error);
  }
});

module.exports = router;


