// ============================================================
// Student Controller — Profile, Progress, Dashboard data
// ============================================================

const User = require('../models/User.model');
const DrillProgress = require('../models/DrillProgress.model');
const Achievement = require('../models/Achievement.model');
const { ModuleProgress } = require('../models/Module.model');
const { paginate } = require('../utils/response.utils');

// -------------------------------------------------------
// @route   GET /api/v1/students/dashboard
// @desc    Get the student's full dashboard data
// @access  Private (student)
// -------------------------------------------------------
exports.getDashboard = async (req, res, next) => {
    try {
        const studentId = req.user._id;

        const [drills, achievements, moduleProgress] = await Promise.all([
            DrillProgress.find({ student: studentId }),
            Achievement.find({ student: studentId }).sort({ earnedAt: -1 }).limit(10),
            ModuleProgress.find({ student: studentId }).populate('module', 'title category durationMinutes'),
        ]);

        const completedDrills = drills.filter((d) => d.status === 'completed').length;
        const totalXP = drills.reduce((sum, d) => sum + (d.xpEarned || 0), 0)
            + achievements.reduce((sum, a) => sum + (a.xpReward || 0), 0);

        res.status(200).json({
            success: true,
            dashboard: {
                student: {
                    name: req.user.fullName,
                    studentId: req.user.studentId,
                    institution: req.user.institution,
                    streak: req.user.streak,
                    level: req.user.level,
                    preparednessScore: req.user.preparednessScore,
                    xpPoints: totalXP,
                },
                drills: {
                    total: drills.length,
                    completed: completedDrills,
                    inProgress: drills.filter((d) => d.status === 'in_progress').length,
                    list: drills,
                },
                achievements: {
                    total: achievements.length,
                    latest: achievements.slice(0, 4),
                },
                modules: {
                    total: moduleProgress.length,
                    completed: moduleProgress.filter((m) => m.status === 'completed').length,
                    list: moduleProgress,
                },
            },
        });
    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------
// @route   GET /api/v1/students/profile
// @desc    Get current student's profile
// @access  Private (student)
// -------------------------------------------------------
exports.getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        res.status(200).json({ success: true, user });
    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------
// @route   PATCH /api/v1/students/profile
// @desc    Update student profile details
// @access  Private (student)
// -------------------------------------------------------
exports.updateProfile = async (req, res, next) => {
    try {
        // Fields that students are allowed to update
        const allowedFields = ['firstName', 'lastName', 'phone', 'institution', 'course', 'grade', 'avatar'];
        const updates = {};
        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const user = await User.findByIdAndUpdate(req.user._id, updates, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ success: true, user });
    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------
// @route   GET /api/v1/students/leaderboard
// @desc    Top students by preparedness score
// @access  Private
// -------------------------------------------------------
exports.getLeaderboard = async (req, res, next) => {
    try {
        const institution = req.query.institution;
        const query = { role: 'student', isActive: true };
        if (institution) query.institution = institution;

        const students = await User.find(query)
            .select('firstName lastName preparednessScore xpPoints level institution streak')
            .sort({ preparednessScore: -1, xpPoints: -1 })
            .limit(20);

        res.status(200).json({
            success: true,
            count: students.length,
            leaderboard: students,
        });
    } catch (err) {
        next(err);
    }
};
