// ============================================================
// Achievement / Badge Model
// ============================================================

const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        badgeId: {
            type: String,
            required: true,
        },
        badgeName: {
            type: String,
            required: true,
        },
        badgeIcon: {
            type: String, // emoji or URL
            default: '🏅',
        },
        description: {
            type: String,
        },
        category: {
            type: String,
            enum: ['drill', 'learning', 'streak', 'social', 'special'],
            default: 'drill',
        },
        xpReward: {
            type: Number,
            default: 0,
        },
        earnedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

AchievementSchema.index({ student: 1, badgeId: 1 }, { unique: true });

module.exports = mongoose.model('Achievement', AchievementSchema);
