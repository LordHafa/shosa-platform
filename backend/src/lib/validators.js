function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function parsePositiveUgx(amount) {
  if (amount === undefined || amount === null || amount === '') {
    const error = new Error('Amount is required'); error.status = 400; throw error;
  }
  const raw = String(amount).trim();
  if (!/^\d+$/.test(raw)) {
    const error = new Error('Amount must be a positive whole UGX amount'); error.status = 400; throw error;
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) {
    const error = new Error('Amount must be greater than zero'); error.status = 400; throw error;
  }
  if (value > 100000000) {
    const error = new Error('Amount exceeds the maximum allowed UGX 100,000,000'); error.status = 400; throw error;
  }
  return value;
}

function cleanOptional(value) {
  const text = String(value || '').trim();
  return text ? text : null;
}

function requireNonEmpty(value, label) {
  if (!String(value || '').trim()) {
    const error = new Error(`${label} is required`); error.status = 400; throw error;
  }
  return String(value).trim();
}

function parseId(value, label = 'ID') {
  const id = Number.parseInt(value, 10);
  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error(`Invalid ${label}`); error.status = 400; throw error;
  }
  return id;
}

const FINALIZABLE_PAYMENT_STATUSES = new Set(['pending', 'pending_gateway_confirmation']);
function ensurePaymentCanBeFinalized(payment) {
  if (!payment) {
    const error = new Error('Payment not found'); error.status = 404; throw error;
  }
  if (!FINALIZABLE_PAYMENT_STATUSES.has(payment.status)) {
    const error = new Error('Only pending payments can be approved or rejected'); error.status = 400; throw error;
  }
}

function validateContactStatus(status) {
  const allowed = new Set(['new', 'read', 'replied', 'archived']);
  const value = String(status || '').trim().toLowerCase();
  if (!allowed.has(value)) {
    const error = new Error('Invalid contact status'); error.status = 400; throw error;
  }
  return value;
}

function validateVerificationStatus(status) {
  const allowed = new Set(['pending', 'verified', 'rejected', 'suspended']);
  const value = String(status || '').trim().toLowerCase();
  if (!allowed.has(value)) {
    const error = new Error('Invalid verification status'); error.status = 400; throw error;
  }
  return value;
}

module.exports = {
  normalizeEmail,
  parsePositiveUgx,
  cleanOptional,
  requireNonEmpty,
  parseId,
  ensurePaymentCanBeFinalized,
  validateContactStatus,
  validateVerificationStatus,
  FINALIZABLE_PAYMENT_STATUSES
};

