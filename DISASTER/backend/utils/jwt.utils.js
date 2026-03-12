// ============================================================
// JWT Utility — generate, verify, and manage tokens
// ============================================================

const jwt = require('jsonwebtoken');

/**
 * Generate a signed access token
 * @param {string} userId
 * @param {string} role
 * @returns {string} JWT access token
 */
const generateAccessToken = (userId, role) => {
    return jwt.sign(
        { id: userId, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

/**
 * Generate a refresh token
 * @param {string} userId
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
    );
};

/**
 * Verify an access token
 * @param {string} token
 * @returns decoded payload or throws error
 */
const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Verify a refresh token
 * @param {string} token
 * @returns decoded payload or throws error
 */
const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

/**
 * Build and send token response with cookie
 * @param {object} user  - Mongoose user doc
 * @param {number} statusCode
 * @param {object} res   - Express response
 */
const sendTokenResponse = (user, statusCode, res) => {
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Cookie options
    const cookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    };

    // Remove sensitive fields
    user.password = undefined;
    user.refreshTokens = undefined;

    res
        .status(statusCode)
        .cookie('accessToken', accessToken, cookieOptions)
        .json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                studentId: user.studentId,
                institution: user.institution,
                preparednessScore: user.preparednessScore,
                xpPoints: user.xpPoints,
                level: user.level,
                streak: user.streak,
                avatar: user.avatar,
            },
        });
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    sendTokenResponse,
};
