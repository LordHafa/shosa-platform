const REQUIRED_SACCO_DOCUMENT_TYPES = [
  'sacco_passport_photo',
  'sacco_identity_document',
  'sacco_application_form',
  'sacco_registration_fee_proof'
];

const OPTIONAL_SACCO_DOCUMENT_TYPES = [
  'sacco_guardian_consent',
  'sacco_student_or_income_proof'
];

const SACCO_DOCUMENT_LABELS = {
  sacco_passport_photo: 'Passport-size photo',
  sacco_identity_document: 'National ID / Passport',
  sacco_application_form: 'Signed SACCO application / declaration',
  sacco_registration_fee_proof: 'Proof of registration fee payment',
  sacco_guardian_consent: 'Guardian / next-of-kin consent',
  sacco_student_or_income_proof: 'Student / employment / income proof'
};

function isRequiredSaccoDocument(type) {
  return REQUIRED_SACCO_DOCUMENT_TYPES.includes(type);
}

async function getSaccoDocumentStatus(prisma, alumniId) {
  const documents = await prisma.adminDocument.findMany({
    where: {
      alumniId,
      source: 'sacco_registration',
      isDeleted: false
    },
    orderBy: { createdAt: 'desc' }
  });

  const byType = {};
  for (const doc of documents) {
    if (!byType[doc.documentType]) byType[doc.documentType] = [];
    byType[doc.documentType].push(doc);
  }

  const required = REQUIRED_SACCO_DOCUMENT_TYPES.map((type) => {
    const docs = byType[type] || [];
    const latest = docs[0] || null;
    const verified = docs.some((doc) => doc.verificationStatus === 'verified');

    return {
      type,
      label: SACCO_DOCUMENT_LABELS[type] || type,
      uploaded: docs.length > 0,
      verified,
      latest
    };
  });

  const missing = required.filter((item) => !item.uploaded);
  const unverified = required.filter((item) => item.uploaded && !item.verified);

  return {
    documents,
    required,
    missing,
    unverified,
    allRequiredUploaded: missing.length === 0,
    allRequiredVerified: missing.length === 0 && unverified.length === 0
  };
}

async function ensureSaccoDocumentsVerified(prisma, alumniId) {
  const status = await getSaccoDocumentStatus(prisma, alumniId);

  if (!status.allRequiredUploaded) {
    const error = new Error(
      'SACCO membership cannot be approved yet. Required SACCO documents are missing.'
    );
    error.status = 400;
    error.details = status;
    throw error;
  }

  if (!status.allRequiredVerified) {
    const error = new Error(
      'SACCO membership cannot be approved yet. Required SACCO documents must be verified first.'
    );
    error.status = 400;
    error.details = status;
    throw error;
  }

  return status;
}

module.exports = {
  REQUIRED_SACCO_DOCUMENT_TYPES,
  OPTIONAL_SACCO_DOCUMENT_TYPES,
  SACCO_DOCUMENT_LABELS,
  isRequiredSaccoDocument,
  getSaccoDocumentStatus,
  ensureSaccoDocumentsVerified
};
