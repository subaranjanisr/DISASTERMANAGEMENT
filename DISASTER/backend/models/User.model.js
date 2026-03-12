// ============================================================
// User Model — supports Admin & Student roles
// ============================================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema(
    {
        // --------------------------------------------------
        // Core Identity
        // --------------------------------------------------
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
            maxlength: [50, 'First name cannot exceed 50 characters'],
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
            maxlength: [50, 'Last name cannot exceed 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false, // never return password in queries
        },

        // --------------------------------------------------
        // Role & Status
        // --------------------------------------------------
        role: {
            type: String,
            enum: ['student', 'admin', 'superadmin'],
            default: 'student',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },

        // --------------------------------------------------
        // Student-specific Details
        // --------------------------------------------------
        studentId: {
            type: String,
            unique: true,
            sparse: true, // allows nulls for admins
        },
        institution: {
            type: String,
            trim: true,
            maxlength: [100, 'Institution name cannot exceed 100 characters'],
        },
        course: {
            type: String,
            trim: true,
        },
        grade: {
            type: String,
            trim: true,
        },
        phone: {
            type: String,
            match: [/^\+?[\d\s\-()]{7,15}$/, 'Please provide a valid phone number'],
        },
        avatar: {
            type: String,
            default: '',
        },

        // --------------------------------------------------
        // Admin-specific Details
        // --------------------------------------------------
        adminCode: {
            type: String,
            select: false, // Used during admin registration verification
        },
        department: {
            type: String,
            trim: true,
        },

        // --------------------------------------------------
        // Gamification & Progress (Students)
        // --------------------------------------------------
        preparednessScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        xpPoints: {
            type: Number,
            default: 0,
        },
        level: {
            type: Number,
            default: 1,
            min: 1,
            max: 6,
        },
        streak: {
            type: Number,
            default: 0,
        },
        lastActiveDate: {
            type: Date,
        },

        // --------------------------------------------------
        // Session & Security
        // --------------------------------------------------
        refreshTokens: [
            {
                token: String,
                createdAt: { type: Date, default: Date.now },
                expiresAt: Date,
            },
        ],
        passwordResetToken: String,
        passwordResetExpires: Date,
        emailVerificationToken: String,
        passwordChangedAt: Date,
        loginAttempts: {
            type: Number,
            default: 0,
        },
        lockUntil: {
            type: Date,
        },
    },
    {
        timestamps: true, // adds createdAt, updatedAt
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// --------------------------------------------------
// Indexes
// --------------------------------------------------
UserSchema.index({ email: 1 });
UserSchema.index({ institution: 1, role: 1 });
UserSchema.index({ preparednessScore: -1 });

// --------------------------------------------------
// Virtuals
// --------------------------------------------------
UserSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

UserSchema.virtual('isLocked').get(function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// --------------------------------------------------
// Pre-save Middleware: Hash password before save
// --------------------------------------------------
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    if (!this.isNew) {
        this.passwordChangedAt = Date.now() - 1000;
    }
    next();
});

// --------------------------------------------------
// Pre-save: Auto-assign studentId
// --------------------------------------------------
UserSchema.pre('save', async function (next) {
    if (this.role === 'student' && !this.studentId) {
        const year = new Date().getFullYear();
        const rand = Math.floor(10000 + Math.random() * 90000);
        this.studentId = `SG-${year}-${rand}`;
    }
    next();
});

// --------------------------------------------------
// Pre-save: Level Calculation (Gamification)
// --------------------------------------------------
UserSchema.pre('save', function (next) {
    if (!this.isModified('xpPoints')) return next();

    const xp = this.xpPoints || 0;
    let newLevel = 1;

    if (xp >= 15000) newLevel = 6;
    else if (xp >= 9000) newLevel = 5;
    else if (xp >= 5000) newLevel = 4;
    else if (xp >= 2500) newLevel = 3;
    else if (xp >= 1000) newLevel = 2;

    this.level = newLevel;
    next();
});

// --------------------------------------------------
// Instance Methods
// --------------------------------------------------

// Compare plain password with hashed
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Check if JWT was issued after password change
UserSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTime = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTime;
    }
    return false;
};

// Generate password reset token
UserSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    return resetToken;
};

// Generate email verification token
UserSchema.methods.createEmailVerificationToken = function () {
    const verifyToken = crypto.randomBytes(32).toString('hex');
    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verifyToken)
        .digest('hex');
    return verifyToken;
};

// Handle failed login attempts (account lockout)
UserSchema.methods.incrementLoginAttempts = async function () {
    // Unlock if lock has expired
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return await this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 },
        });
    }
    const updates = { $inc: { loginAttempts: 1 } };
    // Lock for 2 hours after 5 failed attempts
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
    }
    return await this.updateOne(updates);
};

module.exports = mongoose.model('User', UserSchema);
