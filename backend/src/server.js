require('dotenv').config();
const fs = require('fs');
const path = require('path');

function fatal(message) {
  console.error(`FATAL: ${message}`);
  process.exit(1);
}

function requireStrongJwtSecret() {
  const value = process.env.JWT_SECRET;

  if (!value || !String(value).trim()) {
    fatal('JWT_SECRET environment variable is not set. Refusing to start.');
  }

  const normalized = String(value).trim().toLowerCase();

  const unsafeValues = new Set([
    ['dev', 'secret'].join('-'),
    ['change', 'this', 'local', 'dev', 'secret'].join('-'),
    ['replace', 'with', '64', 'plus', 'random', 'characters'].join('-')
  ]);

  if (unsafeValues.has(normalized) || String(value).length < 32) {
    fatal('JWT_SECRET is missing, too short, or still using a placeholder.');
  }
}

requireStrongJwtSecret();

function requireProductionOrigins() {
  if (process.env.NODE_ENV !== 'production') return;

  const raw = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || '';
  const origins = raw.split(',').map((item) => item.trim()).filter(Boolean);

  if (!origins.length) {
    fatal('ALLOWED_ORIGINS or production FRONTEND_URL must be set in production.');
  }

  const unsafeOrigin = origins.find((origin) => {
    const value = origin.toLowerCase();
    return (
      value === '*' ||
      value.startsWith('http://localhost') ||
      value.startsWith('http://127.0.0.1') ||
      value.startsWith('http://0.0.0.0') ||
      value.startsWith('http://')
    );
  });

  if (unsafeOrigin) {
    fatal(`Unsafe production CORS origin configured: ${unsafeOrigin}`);
  }
}

requireProductionOrigins();


const app = require('./app');

const PORT = process.env.PORT || 5000;

for (const dir of ['uploads', 'uploads/gallery', 'uploads/profiles']) {
  fs.mkdirSync(path.join(process.cwd(), dir), { recursive: true });
}

app.listen(PORT, () => {
  console.log(`SHOSA API running on http://localhost:${PORT}/api`);
});