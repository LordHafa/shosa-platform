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

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

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
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;


