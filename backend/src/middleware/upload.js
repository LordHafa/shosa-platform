const fs = require('fs');
const path = require('path');
const multer = require('multer');

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DOCUMENT_TYPES = [...IMAGE_TYPES, 'application/pdf'];

function ensureDir(folder) {
  fs.mkdirSync(folder, { recursive: true });
}

function safeFileName(originalname) {
  const ext = path.extname(originalname || '').toLowerCase();
  const base = path.basename(originalname || 'upload', ext).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}-${base}${ext}`;
}

function makeUpload(folder, options = {}) {
  const mode = options.mode || 'image';
  const isPrivate = Boolean(options.private);
  const allowed = mode === 'document' ? DOCUMENT_TYPES : IMAGE_TYPES;

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
      const ext = path.extname(file.originalname || '').toLowerCase();
      const badExt = new Set(['.svg', '.html', '.htm', '.js', '.exe', '.bat', '.cmd', '.ps1']);
      if (badExt.has(ext)) return cb(new Error('This file type is not allowed'));
      if (!allowed.includes(file.mimetype)) {
        const message = mode === 'document'
          ? 'Only PDF, JPG, PNG, or WEBP files are allowed for private documents'
          : 'Only JPG, PNG, or WEBP images are allowed';
        return cb(new Error(message));
      }
      cb(null, true);
    }
  });
}

module.exports = { makeUpload };
