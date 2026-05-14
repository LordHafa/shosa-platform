const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const publicRoutes = require('./routes/public');
const alumniRoutes = require('./routes/alumni');
const profileRoutes = require('./routes/profile');
const saccoRoutes = require('./routes/sacco');
const paymentsRoutes = require('./routes/payments');
const receiptRoutes = require('./routes/receipts');
const adminRoutes = require('./routes/admin');

const app = express();

app.set('trust proxy', 1);

function allowedOrigins() {
  const raw = process.env.FRONTEND_URL || 'http://localhost:5173';
  return raw.split(',').map((item) => item.trim()).filter(Boolean);
}

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
  origin(origin, callback) {
    const allowed = allowedOrigins();

    if (!origin || allowed.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});

const ipKeyGenerator = rateLimit.ipKeyGenerator || ((ip) => ip);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please wait 15 minutes and try again.' },
  keyGenerator: (req) => {
    const email = String(req.body?.email || 'unknown').toLowerCase().trim();
    return `${ipKeyGenerator(req.ip)}:${email || 'unknown'}`;
  }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts. Please try again later.' }
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages sent. Please try again later.' }
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/contact', contactLimiter);
app.use('/api/', globalLimiter);

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'shosa-api' }));
app.use('/api/auth', authRoutes);
app.use('/api', publicRoutes);
app.use('/api', profileRoutes);
app.use('/api/sacco', saccoRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

app.use((err, req, res, next) => {
  const status = err.status || 500;

  console.error('[SHOSA API ERROR]', {
    status,
    method: req.method,
    url: req.originalUrl,
    message: err.message,
    stack: err.stack
  });

  const message = status < 500
    ? err.message
    : 'An unexpected error occurred. Please try again.';

  res.status(status).json({ error: message });
});

module.exports = app;