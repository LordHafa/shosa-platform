const express = require('express');
const prisma = require('../lib/prisma');
const { auth, requireAlumni } = require('../middleware/auth');
const { makeUpload } = require('../middleware/upload');
const { cleanOptional } = require('../lib/validators');

const router = express.Router();
const uploadProfile = makeUpload('profiles');

const PROFILE_EDIT_LOCK_MONTHS = 12;

function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function profileEditInfo(lastProfileUpdate) {
  if (!lastProfileUpdate) {
    return { canEdit: true, nextEditAt: null };
  }

  const nextEditAt = addMonths(lastProfileUpdate, PROFILE_EDIT_LOCK_MONTHS);
  const now = new Date();

  return {
    canEdit: now >= nextEditAt,
    nextEditAt: nextEditAt.toISOString()
  };
}

function attachProfileEditInfo(alumni) {
  const info = profileEditInfo(alumni.lastProfileUpdate);
  return { ...alumni, profileEdit: info };
}

router.get('/me', auth, requireAlumni, async (req, res, next) => {
  try {
    const alumni = await prisma.alumni.findUnique({
      where: { id: req.user.id },
      include: { saccoMembership: true, payments: { orderBy: { createdAt: 'desc' }, take: 10 } }
    });

    if (!alumni) return res.status(404).json({ error: 'Alumni not found' });

    const { passwordHash, ...safe } = alumni;
    res.json(attachProfileEditInfo(safe));
  } catch (error) { next(error); }
});

router.put('/me', auth, requireAlumni, async (req, res, next) => {
  try {
    const current = await prisma.alumni.findUnique({ where: { id: req.user.id } });
    if (!current) return res.status(404).json({ error: 'Alumni not found' });

    const editInfo = profileEditInfo(current.lastProfileUpdate);

    if (!editInfo.canEdit) {
      return res.status(403).json({
        error: 'Profile can only be edited once every 12 months. Please contact an administrator for urgent corrections.',
        nextEditAt: editInfo.nextEditAt
      });
    }

    const { phone, occupation, city, country, bio, house, period } = req.body;

    const alumni = await prisma.alumni.update({
      where: { id: req.user.id },
      data: {
        phone: cleanOptional(phone) || current.phone,
        occupation: cleanOptional(occupation),
        city: cleanOptional(city),
        country: cleanOptional(country) || 'Uganda',
        bio: cleanOptional(bio),
        house: cleanOptional(house),
        period: cleanOptional(period),
        lastProfileUpdate: new Date()
      }
    });

    const { passwordHash, ...safe } = alumni;
    res.json(attachProfileEditInfo(safe));
  } catch (error) { next(error); }
});

router.post('/profile/photo', auth, requireAlumni, uploadProfile.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Photo file is required' });

    const current = await prisma.alumni.findUnique({ where: { id: req.user.id } });
    if (!current) return res.status(404).json({ error: 'Alumni not found' });

    const editInfo = profileEditInfo(current.lastProfileUpdate);

    if (current.profilePhoto && !editInfo.canEdit) {
      return res.status(403).json({
        error: 'Profile photo can only be changed during your annual profile update window.',
        nextEditAt: editInfo.nextEditAt
      });
    }

    const profilePhoto = `/uploads/profiles/${req.file.filename}`;
    await prisma.alumni.update({
      where: { id: req.user.id },
      data: { profilePhoto }
    });

    res.json({ message: 'Profile photo uploaded', profilePhoto });
  } catch (error) { next(error); }
});

module.exports = router;

