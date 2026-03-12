// ============================================================
// Authentication & Authorization Middleware
// ============================================================

const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { verifyAccessToken } = require('../utils/jwt.utils');

/**
 * Protect routes — verify JWT access token
 */
const protect = async (req, res, next) => {
    try {
        let token;

        // 1. Check Authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer ')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }
        // 2. Fall back to cookie
        else if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided. Please log in.',
            });
        }

        // Verify token
        const decoded = verifyAccessToken(token);

        // Find user
        const user = await User.findById(decoded.id).select(
            '-password -refreshTokens'
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'The user associated with this token no longer exists.',
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated. Contact support.',
            });
        }

        // Check if password was changed after token was issued
        if (user.changedPasswordAfter(decoded.iat)) {
            return res.status(401).json({
                success: false,
                message: 'Password was recently changed. Please log in again.',
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token.' });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
        }
        next(err);
    }
};

/**
 * Role-based access control
 * Usage: authorize('admin', 'superadmin')
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access forbidden. Role '${req.user.role}' is not permitted to access this resource.`,
            });
        }
        next();
    };
};

/**
 * Optional auth — attaches user if token present, but doesn't block
 */
const optionalAuth = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (token) {
            const decoded = verifyAccessToken(token);
            req.user = await User.findById(decoded.id).select('-password');
        }
    } catch (_) {
        // Silently fail — route is accessible without auth
    }
    next();
};

module.exports = { protect, authorize, optionalAuth };
