// ============================================================
// Drill Controller — VR Drill Progress CRUD
// ============================================================

const DrillProgress = require('../models/DrillProgress.model');
const User = require('../models/User.model');

const DRILL_XP = {
    earthquake: 150,
    fire: 120,
    flood: 130,
    medical: 100,
    cyclone: 140,
    tsunami: 160,
};

// -------------------------------------------------------
// @route   GET /api/v1/drills/my-progress
// @desc    Get all drill progress for current student
// @access  Private (student)
// -------------------------------------------------------
exports.getMyDrillProgress = async (req, res, next) => {
    try {
        const drills = await DrillProgress.find({ student: req.user._id });
        res.status(200).json({ success: true, count: drills.length, drills });
    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------
// @route   POST /api/v1/drills/start
// @desc    Start or resume a drill
// @access  Private (student)
// -------------------------------------------------------
exports.startDrill = async (req, res, next) => {
    try {
        const { drillType, drillName } = req.body;

        let drill = await DrillProgress.findOne({
            student: req.user._id,
            drillType,
        });

        if (!drill) {
            drill = await DrillProgress.create({
                student: req.user._id,
                drillType,
                drillName: drillName || `${drillType.charAt(0).toUpperCase() + drillType.slice(1)} Drill`,
                status: 'in_progress',
                attempts: 1,
                sessionLogs: [{ startedAt: new Date() }],
            });
        } else {
            drill.status = 'in_progress';
            drill.attempts += 1;
            drill.sessionLogs.push({ startedAt: new Date() });
            await drill.save();
        }

        res.status(200).json({ success: true, drill });
    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------
// @route   PATCH /api/v1/drills/complete
// @desc    Submit drill completion with score
// @access  Private (student)
// -------------------------------------------------------
exports.completeDrill = async (req, res, next) => {
    try {
        const { drillType, score, durationSeconds, feedback } = req.body;

        const drill = await DrillProgress.findOne({
            student: req.user._id,
            drillType,
        });

        if (!drill) {
            return res.status(404).json({ success: false, message: 'Drill session not found.' });
        }

        const isNewBest = score > drill.bestScore;
        const xpToAward = isNewBest ? DRILL_XP[drillType] || 100 : Math.floor((DRILL_XP[drillType] || 100) * 0.3);

        // Update the last session log
        const lastLog = drill.sessionLogs[drill.sessionLogs.length - 1];
        if (lastLog && !lastLog.endedAt) {
            lastLog.endedAt = new Date();
            lastLog.score = score;
            lastLog.durationSeconds = durationSeconds || 0;
        }

        drill.status = 'completed';
        drill.lastScore = score;
        drill.bestScore = Math.max(drill.bestScore, score);
        drill.timeSpentSeconds += durationSeconds || 0;
        drill.progressPercent = 100;
        drill.completedAt = new Date();
        drill.xpEarned += xpToAward;
        if (feedback) drill.feedback = feedback;

        await drill.save();

        // Update student stats
        const newScore = await _recalculatePreparednessScore(req.user._id);
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { xpPoints: xpToAward },
            preparednessScore: newScore,
        });

        res.status(200).json({
            success: true,
            message: isNewBest ? '🏆 New personal best!' : 'Drill completed!',
            xpEarned: xpToAward,
            drill,
        });
    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------
// @route   GET /api/v1/drills/update-progress
// @desc    Update mid-drill progress percent
// @access  Private (student)
// -------------------------------------------------------
exports.updateProgress = async (req, res, next) => {
    try {
        const { drillType, progressPercent } = req.body;

        const drill = await DrillProgress.findOneAndUpdate(
            { student: req.user._id, drillType },
            { progressPercent: Math.min(99, progressPercent) },
            { new: true }
        );

        res.status(200).json({ success: true, drill });
    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------
// Internal helper — recalculate preparedness score
// -------------------------------------------------------
async function _recalculatePreparednessScore(studentId) {
    const drills = await DrillProgress.find({ student: studentId });
    if (drills.length === 0) return 0;

    const completedWeight = drills.filter((d) => d.status === 'completed').length / drills.length;
    const avgScore = drills.reduce((s, d) => s + d.bestScore, 0) / drills.length;
    const normalizedScore = Math.min(1000, avgScore) / 1000;

    const preparedness = Math.round((completedWeight * 0.4 + normalizedScore * 0.6) * 100);
    return Math.min(100, preparedness);
}
