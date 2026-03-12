// ============================================================
// Auth Routes
// ============================================================

const express = require('express');
const router = express.Router();

const {
    register,
    login,
    refreshToken,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    getMe,
    verifyRole,
} = require('../controllers/auth.controller');

const { protect } = require('../middleware/auth.middleware');
const {
    validate,
    registerRules,
    loginRules,
    forgotPasswordRules,
    resetPasswordRules,
    changePasswordRules,
} = require('../middleware/validate.middleware');

// Public routes
router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPasswordRules, validate, forgotPassword);
router.post('/reset-password/:token', resetPasswordRules, validate, resetPassword);

// Protected routes
router.use(protect); // all routes below require auth

router.get('/me', getMe);
router.get('/verify-role', verifyRole);
router.post('/logout', logout);
router.patch('/change-password', changePasswordRules, validate, changePassword);

module.exports = router;
