// ============================================================
// VR Drill Progress Model
// ============================================================

const mongoose = require('mongoose');

const DrillProgressSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        drillType: {
            type: String,
            enum: ['earthquake', 'fire', 'flood', 'medical', 'cyclone', 'tsunami'],
            required: true,
        },
        drillName: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['not_started', 'in_progress', 'completed'],
            default: 'not_started',
        },
        attempts: {
            type: Number,
            default: 0,
        },
        bestScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 1000,
        },
        lastScore: {
            type: Number,
            default: 0,
        },
        timeSpentSeconds: {
            type: Number,
            default: 0,
        },
        progressPercent: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        completedAt: {
            type: Date,
        },
        xpEarned: {
            type: Number,
            default: 0,
        },
        feedback: {
            type: String,
            maxlength: 500,
        },
        sessionLogs: [
            {
                startedAt: Date,
                endedAt: Date,
                score: Number,
                durationSeconds: Number,
            },
        ],
    },
    {
        timestamps: true,
    }
);

DrillProgressSchema.index({ student: 1, drillType: 1 }, { unique: true });

module.exports = mongoose.model('DrillProgress', DrillProgressSchema);
