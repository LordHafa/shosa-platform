const express = require('express');
const prisma = require('../lib/prisma');
const { auth, requireAlumni } = require('../middleware/auth');

const router = express.Router();

router.use(auth, requireAlumni);

function deprecatedRoute(replacement) {
  return (req, res) => {
    res.status(410).json({
      error: 'This legacy endpoint has been retired. Please use the current endpoint.',
      replacement
    });
  };
}

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

router.get('/payments', async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { alumniId: req.user.id },
      include: { receipt: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(payments);
  } catch (error) { next(error); }
});

router.put('/me', deprecatedRoute('/api/me'));
router.post('/me/photo', deprecatedRoute('/api/profile/photo'));
router.post('/sacco/register', deprecatedRoute('/api/sacco/register'));
router.post('/payments', deprecatedRoute('/api/payments/mobilemoney'));

module.exports = router;
