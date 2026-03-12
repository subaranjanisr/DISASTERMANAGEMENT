// ============================================================
// Achievement Routes
// ============================================================

const express = require('express');
const router = express.Router();
const Achievement = require('../models/Achievement.model');
const { protect, authorize } = require('../middleware/auth.middleware');

// @route  GET /api/v1/achievements/my-achievements
// @access Private (student)
router.get('/my-achievements', protect, authorize('student'), async (req, res, next) => {
    try {
        const achievements = await Achievement.find({ student: req.user._id }).sort({ earnedAt: -1 });
        res.status(200).json({ success: true, count: achievements.length, achievements });
    } catch (err) {
        next(err);
    }
});

// @route  POST /api/v1/achievements/award
// @desc   Award a badge to a student (admin or system)
// @access Private (admin)
router.post('/award', protect, authorize('admin', 'superadmin'), async (req, res, next) => {
    try {
        const { studentId, badgeId, badgeName, badgeIcon, description, category, xpReward } = req.body;

        // Prevent duplicate badges
        const existing = await Achievement.findOne({ student: studentId, badgeId });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Badge already awarded to this student.' });
        }

        const achievement = await Achievement.create({
            student: studentId,
            badgeId,
            badgeName,
            badgeIcon,
            description,
            category,
            xpReward: xpReward || 0,
        });

        res.status(201).json({ success: true, achievement });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
