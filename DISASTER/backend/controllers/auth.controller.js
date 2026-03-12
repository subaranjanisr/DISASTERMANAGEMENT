// ============================================================
// Auth Controller — Register, Login, Token Refresh,
//                  Forgot/Reset Password, Change Password,
//                  Logout, Verify Role
// ============================================================

const crypto = require('crypto');
const User = require('../models/User.model');
const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    sendTokenResponse,
} = require('../utils/jwt.utils');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/email.utils');

// -------------------------------------------------------
// @route   POST /api/v1/auth/register
// @desc    Register a new student or admin
// @access  Public
// -------------------------------------------------------
exports.register = async (req, res, next) => {
    try {
        const {
            firstName, lastName, email, password,
            role, institution, course, grade, phone,
            adminCode, department,
        } = req.body;

        // If admin registration, verify admin secret code
        if (role === 'admin') {
            if (!adminCode || adminCode !== process.env.ADMIN_SECRET_CODE) {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid admin authorization code.',
                });
            }
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.',
            });
        }

        // Create user
        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            role: role || 'student',
            institution,
            course,
            grade,
            phone,
            department,
        });

        // Send welcome email (non-blocking)
        sendWelcomeEmail(user).catch((err) =>
            console.error('Welcome email failed:', err.message)
        );

        sendTokenResponse(user, 201, res);
    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------
// @route   POST /api/v1/auth/login
// @desc    Login with email & password
// @access  Public
// -------------------------------------------------------
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user WITH password field
        const user = await User.findOne({ email }).select(
            '+password +loginAttempts +lockUntil'
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.',
            });
        }

        // Check account lock
        if (user.isLocked) {
            return res.status(423).json({
                success: false,
                message: 'Account temporarily locked due to too many failed attempts. Try again in 2 hours.',
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.',
            });
        }

        // Compare passwords
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            await user.incrementLoginAttempts();
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.',
                attemptsLeft: Math.max(0, 5 - (user.loginAttempts + 1)),
            });
        }

        // Reset login attempts on success
        await User.findByIdAndUpdate(user._id, {
            $set: { loginAttempts: 0 },
            $unset: { lockUntil: 1 },
            lastActiveDate: Date.now(),
        });

        // Update streak logic
        const today = new Date().toDateString();
        const lastActive = user.lastActiveDate
            ? new Date(user.lastActiveDate).toDateString()
            : null;

        let streakUpdate = {};
        if (lastActive !== today) {
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            streakUpdate = lastActive === yesterday
                ? { $inc: { streak: 1 } }
                : { $set: { streak: 1 } };
        }

        if (Object.keys(streakUpdate).length > 0) {
            await User.findByIdAndUpdate(user._id, streakUpdate);
        }

        // Store refresh token
        const refreshToken = generateRefreshToken(user._id);
        const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await User.findByIdAndUpdate(user._id, {
            $push: {
                refreshTokens: {
                    token: refreshToken,
                    expiresAt: refreshExpiry,
                },
            },
        });

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------
// @route   POST /api/v1/auth/refresh-token
// @desc    Refresh access token using refresh token
// @access  Public
// -------------------------------------------------------
exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required.',
            });
        }

        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token.',
            });
        }

        const user = await User.findOne({
            _id: decoded.id,
            'refreshTokens.token': refreshToken,
            'refreshTokens.expiresAt': { $gt: new Date() },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token not recognized or has expired.',
            });
        }

        const newAccessToken = generateAccessToken(user._id, user.role);

        res.status(200).json({
            success: true,
            accessToken: newAccessToken,
        });
    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------
// @route   POST /api/v1/auth/logout
// @desc    Logout — revoke refresh token
// @access  Private
// -------------------------------------------------------
exports.logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            await User.findByIdAndUpdate(req.user._id, {
                $pull: { refreshTokens: { token: refreshToken } },
            });
        }

        res.clearCookie('accessToken');

        res.status(200).json({
            success: true,
            message: 'Logged out successfully.',
        });
    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------
// @route   POST /api/v1/auth/forgot-password
// @desc    Send password reset email
// @access  Public
// -------------------------------------------------------
exports.forgotPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        // Always return success to prevent email enumeration
        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'If that email exists, a reset link has been sent.',
            });
        }

        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        try {
            await sendPasswordResetEmail(user, resetUrl);
            res.status(200).json({
                success: true,
                message: 'Password reset link sent to your email.',
            });
        } catch (emailErr) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({
                success: false,
                message: 'Email could not be sent. Please try again.',
            });
        }
    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------
// @route   POST /api/v1/auth/reset-password/:token
// @desc    Reset password using token
// @access  Public
// -------------------------------------------------------
exports.resetPassword = async (req, res, next) => {
    try {
        const { password } = req.body;

        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Reset link is invalid or has expired.',
            });
        }

        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        // Invalidate all refresh tokens
        user.refreshTokens = [];
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------
// @route   PATCH /api/v1/auth/change-password
// @desc    Change password when logged in
// @access  Private
// -------------------------------------------------------
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id).select('+password');
        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect.',
            });
        }

        user.password = newPassword;
        user.refreshTokens = []; // log out all other devices
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------
// @route   GET /api/v1/auth/me
// @desc    Get current authenticated user's profile
// @access  Private
// -------------------------------------------------------
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        res.status(200).json({
            success: true,
            user,
        });
    } catch (err) {
        next(err);
    }
};

// -------------------------------------------------------
// @route   GET /api/v1/auth/verify-role
// @desc    Verify current user's role (for frontend routing)
// @access  Private
// -------------------------------------------------------
exports.verifyRole = async (req, res) => {
    res.status(200).json({
        success: true,
        role: req.user.role,
        userId: req.user._id,
    });
};
