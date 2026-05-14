const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { auth } = require('../middleware/auth');
const { makeUpload } = require('../middleware/upload');
const { normalizeEmail, cleanOptional } = require('../lib/validators');

const router = express.Router();
const uploadProfile = makeUpload('profiles');

function safeUser(user, type, role = null) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return { ...safe, type, role };
}

function isConsentAccepted(value) {
  return value === true || value === 'true' || value === '1' || value === 'on' || value === 'yes';
}

router.post('/register', uploadProfile.single('photo'), async (req, res, next) => {
  try {
    const {
      firstName, lastName, otherNames, email, phone, gender, campus, gradYear, period, house,
      occupation, city, country, password, passwordConfirm, consent
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !campus || !gradYear || !password) {
      return res.status(400).json({ error: 'Missing required registration fields' });
    }

    if (passwordConfirm !== undefined && password !== passwordConfirm) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (!isConsentAccepted(consent)) {
      return res.status(400).json({ error: 'Consent is required to register' });
    }

    const year = parseInt(gradYear, 10);
    if (!Number.isInteger(year) || year < 2000) {
      return res.status(400).json({ error: 'Graduation year cannot be before 2000' });
    }

    const normalizedEmail = normalizeEmail(email);
    const existing = await prisma.alumni.findUnique({ where: { email: normalizedEmail } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const displayName = [firstName, otherNames, lastName].filter(Boolean).join(' ');
    const profilePhoto = req.file ? `/uploads/profiles/${req.file.filename}` : null;

    const alumni = await prisma.alumni.create({
      data: {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        otherNames: cleanOptional(otherNames),
        displayName,
        email: normalizedEmail,
        phone: String(phone).trim(),
        gender: cleanOptional(gender),
        campus: String(campus).trim(),
        gradYear: year,
        period: cleanOptional(period),
        house: cleanOptional(house),
        occupation: cleanOptional(occupation),
        city: cleanOptional(city),
        country: cleanOptional(country) || 'Uganda',
        profilePhoto,
        passwordHash
      }
    });

    const { passwordHash: removed, ...safeAlumni } = alumni;
    res.status(201).json({ message: 'Registration successful. Please login.', alumni: safeAlumni });
  } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const normalizedEmail = normalizeEmail(email);
    let user = await prisma.alumni.findUnique({ where: { email: normalizedEmail } });
    let type = 'alumni';
    let role = null;

    if (!user) {
      user = await prisma.admin.findUnique({ where: { email: normalizedEmail } });
      type = 'admin';
      role = user?.role || null;
    }

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, type, role, campusScope: user.campusScope || null, name: user.fullName || user.displayName },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    const redirect = type === 'admin' ? '/admin' : '/alumni/dashboard';
    res.json({ token, type, role, campusScope: user.campusScope || null, name: user.fullName || user.displayName, redirect });
  } catch (error) { next(error); }
});

router.get('/me', auth, async (req, res, next) => {
  try {
    if (req.user.type === 'admin') {
      const admin = await prisma.admin.findUnique({ where: { id: req.user.id } });
      return res.json(safeUser(admin, 'admin', admin?.role || req.user.role));
    }

    const alumni = await prisma.alumni.findUnique({
      where: { id: req.user.id },
      include: { saccoMembership: true }
    });

    return res.json(safeUser(alumni, 'alumni'));
  } catch (error) { next(error); }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out' });
});

module.exports = router;

