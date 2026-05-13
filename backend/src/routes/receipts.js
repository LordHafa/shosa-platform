const express = require('express');
const prisma = require('../lib/prisma');
const { auth } = require('../middleware/auth');
const { receiptInclude, sendReceiptEmail } = require('../lib/receipts');

const router = express.Router();

router.use(auth);

function canAccessReceipt(req, receipt) {
  if (req.user.type === 'admin') return true;
  return receipt.alumniId === req.user.id;
}

function emailStatusMessage(status) {
  switch (status) {
    case 'sent':
      return 'Sent';
    case 'failed':
      return 'Email delivery failed. Please contact admin or try again later.';
    case 'not_configured':
      return 'Email delivery is not configured yet.';
    case 'no_recipient':
      return 'No recipient email is configured for this alumni record.';
    default:
      return 'Pending email delivery.';
  }
}

function sanitizeReceipt(receipt, isAdmin) {
  return {
    ...receipt,
    emailStatusMessage: emailStatusMessage(receipt.emailStatus),
    emailError: isAdmin ? receipt.emailError : null,
    canSeeEmailDebug: isAdmin
  };
}

router.get('/:receiptNumber', async (req, res, next) => {
  try {
    const receiptNumber = String(req.params.receiptNumber || '').trim();

    const receipt = await prisma.receipt.findUnique({
      where: { receiptNumber },
      include: receiptInclude()
    });

    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    if (!canAccessReceipt(req, receipt)) return res.status(403).json({ error: 'You cannot access this receipt' });

    res.json(sanitizeReceipt(receipt, req.user.type === 'admin'));
  } catch (error) { next(error); }
});

router.post('/:receiptNumber/email', async (req, res, next) => {
  try {
    const receiptNumber = String(req.params.receiptNumber || '').trim();

    const receipt = await prisma.receipt.findUnique({
      where: { receiptNumber },
      include: receiptInclude()
    });

    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    if (!canAccessReceipt(req, receipt)) return res.status(403).json({ error: 'You cannot email this receipt' });

    const updated = await sendReceiptEmail(prisma, receipt.id);
    res.json(sanitizeReceipt(updated, req.user.type === 'admin'));
  } catch (error) { next(error); }
});

module.exports = router;
