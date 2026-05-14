const express = require('express');
const prisma = require('../lib/prisma');
const { auth, requireAlumni } = require('../middleware/auth');
const { makeUpload } = require('../middleware/upload');

const router = express.Router();
const uploadProfile = makeUpload('profiles');

router.use(auth, requireAlumni);

router.get('/me', async (req, res, next) => {
  try {
    const alumni = await prisma.alumni.findUnique({
      where: { id: req.user.id },
      include: { saccoMembership: true, payments: { orderBy: { createdAt: 'desc' }, take: 10 } }
    });
    if (!alumni) return res.status(404).json({ error: 'Alumni not found' });
    const { passwordHash, ...safe } = alumni;
    res.json(safe);
  } catch (error) { next(error); }
});

router.put('/me', async (req, res, next) => {
  try {
    const { phone, occupation, city, country, bio, house, period } = req.body;
    const alumni = await prisma.alumni.update({
      where: { id: req.user.id },
      data: { phone, occupation, city, country, bio, house, period, lastProfileUpdate: new Date() }
    });
    const { passwordHash, ...safe } = alumni;
    res.json(safe);
  } catch (error) { next(error); }
});

router.post('/me/photo', uploadProfile.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Photo file is required' });
    const profilePhoto = `/uploads/profiles/${req.file.filename}`;
    await prisma.alumni.update({ where: { id: req.user.id }, data: { profilePhoto } });
    res.json({ message: 'Profile photo uploaded', profilePhoto });
  } catch (error) { next(error); }
});

router.post('/sacco/register', async (req, res, next) => {
  try {
    const existing = await prisma.saccoMembership.findUnique({ where: { alumniId: req.user.id } });
    if (existing) return res.status(400).json({ error: 'You have already started SACCO registration' });

    const { membershipType, monthlyContribution, startDate, phone, network, transactionRef } = req.body;
    const amount = parseInt(process.env.SACCO_REG_FEE || '50000', 10);

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          alumniId: req.user.id,
          paymentType: 'sacco_membership_fee',
          label: 'SACCO Registration Fee',
          amount,
          phone: phone || null,
          network: network || null,
          transactionRef: transactionRef || null,
          status: 'pending',
          paymentChannel: 'mobile_money'
        }
      });

      const membership = await tx.saccoMembership.create({
        data: {
          alumniId: req.user.id,
          membershipNumber: `SAC-${new Date().getFullYear()}-${String(req.user.id).padStart(5, '0')}`,
          status: 'pending',
          registrationFeePaymentId: payment.id,
          membershipType: membershipType || 'ordinary',
          monthlyContribution: monthlyContribution ? parseInt(monthlyContribution, 10) : null,
          startDate: startDate ? new Date(startDate) : null
        }
      });

      return { payment, membership };
    });

    res.status(201).json({ message: 'SACCO registration created. Awaiting admin payment approval.', ...result });
  } catch (error) { next(error); }
});

router.get('/payments', async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({ where: { alumniId: req.user.id }, orderBy: { createdAt: 'desc' } });
    res.json(payments);
  } catch (error) { next(error); }
});

router.post('/payments', async (req, res, next) => {
  try {
    const { paymentType, label, amount, phone, network, transactionRef, description } = req.body;
    if (!paymentType || !amount) return res.status(400).json({ error: 'Payment type and amount are required' });

    const payment = await prisma.payment.create({
      data: {
        alumniId: req.user.id,
        paymentType,
        label: label || paymentType,
        amount: parseInt(amount, 10),
        phone: phone || null,
        network: network || null,
        transactionRef: transactionRef || null,
        description: description || null,
        status: 'pending',
        paymentChannel: 'mobile_money'
      }
    });
    res.status(201).json(payment);
  } catch (error) { next(error); }
});

module.exports = router;

