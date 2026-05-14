function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  const value = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateEmail(email) {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    const error = new Error('Please enter a valid email address');
    error.status = 400;
    throw error;
  }
  return normalized;
}

function validatePassword(password, label = 'Password') {
  const value = String(password || '');
  if (value.length < 8 || value.length > 128) {
    const error = new Error(`${label} must be 8-128 characters`);
    error.status = 400;
    throw error;
  }
  return value;
}

function isPasswordWithinBounds(password) {
  const value = String(password || '');
  return value.length >= 8 && value.length <= 128;
}

function getBcryptRounds() {
  const parsed = Number.parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
  if (!Number.isInteger(parsed)) return 12;
  return Math.min(14, Math.max(10, parsed));
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
  isValidEmail,
  validateEmail,
  validatePassword,
  isPasswordWithinBounds,
  getBcryptRounds,
  parsePositiveUgx,
  cleanOptional,
  requireNonEmpty,
  parseId,
  ensurePaymentCanBeFinalized,
  validateContactStatus,
  validateVerificationStatus,
  FINALIZABLE_PAYMENT_STATUSES
};