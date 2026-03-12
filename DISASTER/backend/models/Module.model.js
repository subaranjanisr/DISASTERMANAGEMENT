// ============================================================
// Learning Module Model
// ============================================================

const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Module title is required'],
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            enum: ['earthquake', 'fire', 'flood', 'medical', 'first_aid', 'leadership', 'psychology'],
            required: true,
        },
        difficulty: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'beginner',
        },
        durationMinutes: {
            type: Number,
            required: true,
        },
        contentUrl: {
            type: String, // Video/PDF URL
        },
        xpReward: {
            type: Number,
            default: 50,
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Module Progress per student (embedded sub-document pattern via separate model)
const ModuleProgressSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        module: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Module',
            required: true,
        },
        status: {
            type: String,
            enum: ['not_started', 'in_progress', 'completed'],
            default: 'not_started',
        },
        progressPercent: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        completedAt: Date,
        quizScore: {
            type: Number,
            min: 0,
            max: 100,
        },
        xpEarned: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

ModuleProgressSchema.index({ student: 1, module: 1 }, { unique: true });

const Module = mongoose.model('Module', ModuleSchema);
const ModuleProgress = mongoose.model('ModuleProgress', ModuleProgressSchema);

module.exports = { Module, ModuleProgress };
