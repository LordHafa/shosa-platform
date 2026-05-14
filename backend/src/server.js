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

const app = require('./app');

const PORT = process.env.PORT || 5000;

for (const dir of ['uploads', 'uploads/gallery', 'uploads/profiles']) {
  fs.mkdirSync(path.join(process.cwd(), dir), { recursive: true });
}

app.listen(PORT, () => {
  console.log(`SHOSA API running on http://localhost:${PORT}/api`);
});