const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const IMAGE_MIME_EXTENSIONS = new Map([
  ['image/jpeg', new Set(['.jpg', '.jpeg'])],
  ['image/png', new Set(['.png'])],
  ['image/webp', new Set(['.webp'])]
]);

const DOCUMENT_MIME_EXTENSIONS = new Map([
  ...IMAGE_MIME_EXTENSIONS,
  ['application/pdf', new Set(['.pdf'])]
]);

function ensureDir(folder) {
  fs.mkdirSync(folder, { recursive: true });
}

function safeFileName(originalname) {
  const ext = path.extname(originalname || '').toLowerCase();
  const base = path
    .basename(originalname || 'upload', ext)
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 80);

  const random = crypto.randomBytes(16).toString('hex');
  return `${Date.now()}-${random}-${base}${ext}`;
}

function uploadError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function validateFileType(file, mode) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedMap = mode === 'document' ? DOCUMENT_MIME_EXTENSIONS : IMAGE_MIME_EXTENSIONS;
  const allowedExtensions = allowedMap.get(file.mimetype);

  if (!allowedExtensions || !allowedExtensions.has(ext)) {
    const message = mode === 'document'
      ? 'Only PDF, JPG, PNG, or WEBP files with matching extensions are allowed for private documents'
      : 'Only JPG, PNG, or WEBP images with matching extensions are allowed';

    return uploadError(message);
  }

  return null;
}

function makeUpload(folder, options = {}) {
  const mode = options.mode || 'image';
  const isPrivate = Boolean(options.private);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const root = isPrivate ? 'private_admin_documents' : 'uploads';
      const dir = path.join(process.cwd(), root, folder);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, safeFileName(file.originalname));
    }
  });

  return multer({
    storage,
    limits: { fileSize: parseInt(process.env.MAX_UPLOAD_SIZE || '5242880', 10) },
    fileFilter: (req, file, cb) => {
      const error = validateFileType(file, mode);
      if (error) return cb(error);
      cb(null, true);
    }
  });
}

module.exports = { makeUpload, validateFileType };
