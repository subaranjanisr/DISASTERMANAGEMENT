// ============================================================
// Learning Module Routes
// ============================================================

const express = require('express');
const router = express.Router();
const { Module, ModuleProgress } = require('../models/Module.model');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

// @route  GET /api/v1/modules
// @desc   List all published modules
// @access Private
router.get('/', async (req, res, next) => {
    try {
        const filter = { isPublished: true };
        if (req.query.category) filter.category = req.query.category;
        if (req.query.difficulty) filter.difficulty = req.query.difficulty;

        const modules = await Module.find(filter).sort({ category: 1, difficulty: 1 });
        res.status(200).json({ success: true, count: modules.length, modules });
    } catch (err) {
        next(err);
    }
});

// @route  POST /api/v1/modules
// @desc   Create a new module
// @access Private (admin)
router.post('/', authorize('admin', 'superadmin'), async (req, res, next) => {
    try {
        const module = await Module.create({ ...req.body, createdBy: req.user._id });
        res.status(201).json({ success: true, module });
    } catch (err) {
        next(err);
    }
});

// @route  PATCH /api/v1/modules/:id/progress
// @desc   Update or create module progress for a student
// @access Private (student)
router.patch('/:id/progress', authorize('student'), async (req, res, next) => {
    try {
        const { status, progressPercent, quizScore } = req.body;

        const updates = { status, progressPercent };
        if (quizScore !== undefined) updates.quizScore = quizScore;
        if (status === 'completed') {
            updates.completedAt = new Date();
            const mod = await Module.findById(req.params.id);
            if (mod) updates.xpEarned = mod.xpReward;
        }

        const progress = await ModuleProgress.findOneAndUpdate(
            { student: req.user._id, module: req.params.id },
            updates,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({ success: true, progress });
    } catch (err) {
        next(err);
    }
});

// @route  GET /api/v1/modules/my-progress
// @desc   Get current student's module progress
// @access Private (student)
router.get('/my-progress', authorize('student'), async (req, res, next) => {
    try {
        const progress = await ModuleProgress.find({ student: req.user._id })
            .populate('module', 'title category difficulty durationMinutes xpReward');
        res.status(200).json({ success: true, progress });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
