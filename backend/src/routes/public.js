const express = require('express');
const prisma = require('../lib/prisma');
const { parsePositiveUgx, cleanOptional } = require('../lib/validators');

const router = express.Router();

const CONTACT_CATEGORIES = new Set(['general', 'sacco', 'membership', 'events', 'donations', 'store', 'technical']);

router.get('/events', async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({ where: { isActive: true }, orderBy: { startDate: 'asc' } });
    res.json(events);
  } catch (error) { next(error); }
});

router.get('/gallery', async (req, res, next) => {
  try {
    const items = await prisma.galleryItem.findMany({ where: { isPublished: true }, orderBy: { createdAt: 'desc' } });
    res.json(items);
  } catch (error) { next(error); }
});

router.get('/store/products', async (req, res, next) => {
  try {
    const products = await prisma.storeProduct.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
    res.json(products);
  } catch (error) { next(error); }
});

router.post('/contact', async (req, res, next) => {
  try {
    const { name, email, phone, category, subject, message, consent } = req.body;
    if (!name || !email || !subject || !message) return res.status(400).json({ error: 'Name, email, subject, and message are required' });
    if (consent === false) return res.status(400).json({ error: 'Consent is required before submitting this message' });
    const safeCategory = CONTACT_CATEGORIES.has(category) ? category : 'general';
    const saved = await prisma.contactSubmission.create({
      data: { name, email, phone: phone || '', category: safeCategory, subject, message, ip: req.ip, userAgent: req.headers['user-agent'] }
    });
    res.status(201).json({ message: 'Message submitted successfully', id: saved.id });
  } catch (error) { next(error); }
});

router.post('/donations', async (req, res, next) => {
  try {
    const { donorName, donorEmail, donorPhone, category, amount, message } = req.body;
    if (!donorName) return res.status(400).json({ error: 'Donor name is required' });
    const saved = await prisma.donation.create({
      data: {
        donorName,
        donorEmail: cleanOptional(donorEmail),
        donorPhone: cleanOptional(donorPhone),
        category: cleanOptional(category) || 'general_support',
        amount: parsePositiveUgx(amount),
        message: cleanOptional(message)
      }
    });
    res.status(201).json({ message: 'Donation intent recorded. The team will follow up with payment confirmation details.', id: saved.id });
  } catch (error) { next(error); }
});

module.exports = router;
