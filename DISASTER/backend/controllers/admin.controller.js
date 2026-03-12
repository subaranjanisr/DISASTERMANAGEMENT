// ============================================================
// Admin Controller — Manage users, view institution analytics
// ============================================================

const User = require('../models/User.model');
const DrillProgress = require('../models/DrillProgress.model');
const Achievement = require('../models/Achievement.model');
const { paginate } = require('../utils/response.utils');

// -------------------------------------------------------
// @route   GET /api/v1/admin/dashboard
// @desc    Admin analytics overview
// @access  Private (admin, superadmin)
// -------------------------------------------------------
exports.getAdminDashboard = async (req, res, next) => {
    try {
        const adminUser = req.user;
        // Scope to admin's institution unless superadmin
        const institutionFilter =
            adminUser.role === 'superadmin' ? {} : { institution: adminUser.institution };

        const [
            totalStudents,
            activeStudents,
            avgScoreResult,
            drillStats,
            recentStudents,
        ] = await Promise.all([
            User.countDocuments({ role: 'student', ...institutionFilter }),
            User.countDocuments({
                role: 'student',
                isActive: true,
                lastActiveDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                ...institutionFilter,
            }),
            User.aggregate([
                { $match: { role: 'student', ...institutionFilter } },
                { $group: { _id: null, avgScore: { $avg: '$preparednessScore' } } },
            ]),
            DrillProgress.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            User.find({ role: 'student', ...institutionFilter })
                .select('firstName lastName email preparednessScore streak institution createdAt')
                .sort({ createdAt: -1 })
                .limit(5),
        ]);

        const avgScore =
            avgScoreResult.length > 0
                ? Math.round(avgScoreResult[0].avgScore)
                : 0;

        const drillSummary = drillStats.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            analytics: {
                totalStudents,
                activeStudentsThisWeek: activeStudents,
                avgPreparednessScore: avgScore,
                drills: drillSummary,
                recentRegistrations: recentStudents,
            },
        });
    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------
// @route   GET /api/v1/admin/students
// @desc    List all students (paginated)
// @access  Private (admin)
// -------------------------------------------------------
exports.getAllStudents = async (req, res, next) => {
    try {
        const filter = { role: 'student' };
        if (req.user.role !== 'superadmin') {
            filter.institution = req.user.institution;
        }
        if (req.query.search) {
            const re = new RegExp(req.query.search, 'i');
            filter.$or = [{ firstName: re }, { lastName: re }, { email: re }, { studentId: re }];
        }

        const result = await paginate(User, filter, req, '');
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------
// @route   GET /api/v1/admin/students/:id
// @desc    Get full student detail
// @access  Private (admin)
// -------------------------------------------------------
exports.getStudentById = async (req, res, next) => {
    try {
        const student = await User.findOne({ _id: req.params.id, role: 'student' });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        const drills = await DrillProgress.find({ student: student._id });
        const achievements = await Achievement.find({ student: student._id });

        res.status(200).json({
            success: true,
            student,
            drills,
            achievements,
        });
    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------
// @route   PATCH /api/v1/admin/students/:id/status
// @desc    Activate / Deactivate a student account
// @access  Private (admin)
// -------------------------------------------------------
exports.toggleStudentStatus = async (req, res, next) => {
    try {
        const student = await User.findOne({ _id: req.params.id, role: 'student' });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        student.isActive = !student.isActive;
        await student.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: `Student account ${student.isActive ? 'activated' : 'deactivated'}.`,
            isActive: student.isActive,
        });
    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------
// @route   DELETE /api/v1/admin/students/:id
// @desc    Permanently delete a student (superadmin only)
// @access  Private (superadmin)
// -------------------------------------------------------
exports.deleteStudent = async (req, res, next) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        await DrillProgress.deleteMany({ student: req.params.id });
        await Achievement.deleteMany({ student: req.params.id });

        res.status(200).json({ success: true, message: 'Student and all data permanently deleted.' });
    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------
// @route   GET /api/v1/admin/drill-performance
// @desc    Drill performance overview across institution
// @access  Private (admin)
// -------------------------------------------------------
exports.getDrillPerformance = async (req, res, next) => {
    try {
        const stats = await DrillProgress.aggregate([
            {
                $group: {
                    _id: '$drillType',
                    totalAttempts: { $sum: '$attempts' },
                    avgScore: { $avg: '$bestScore' },
                    completedCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                    },
                },
            },
            { $sort: { avgScore: -1 } },
        ]);

        res.status(200).json({ success: true, drillPerformance: stats });
    } catch (err) {
        next(err);
    }
};
