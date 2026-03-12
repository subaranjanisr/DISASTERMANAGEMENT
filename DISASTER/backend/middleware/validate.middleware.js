// ============================================================
// Validation Middleware — express-validator rules
// ============================================================

const { body, validationResult } = require('express-validator');

/**
 * Run validation and return errors if any
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: 'Validation failed.',
            errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
        });
    }
    next();
};

// --------------------------------------------------
// Registration validation rules
// --------------------------------------------------
const registerRules = [
    body('firstName')
        .trim()
        .notEmpty().withMessage('First name is required')
        .isLength({ max: 50 }).withMessage('First name must be 50 characters or fewer'),

    body('lastName')
        .trim()
        .notEmpty().withMessage('Last name is required')
        .isLength({ max: 50 }).withMessage('Last name must be 50 characters or fewer'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

    body('role')
        .optional()
        .isIn(['student', 'admin']).withMessage('Invalid role'),

    body('institution')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Institution name cannot exceed 100 characters'),
];

// --------------------------------------------------
// Login validation rules
// --------------------------------------------------
const loginRules = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email'),

    body('password')
        .notEmpty().withMessage('Password is required'),
];

// --------------------------------------------------
// Forgot password validation rules
// --------------------------------------------------
const forgotPasswordRules = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email'),
];

// --------------------------------------------------
// Reset password validation rules
// --------------------------------------------------
const resetPasswordRules = [
    body('password')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase, and a number'),

    body('confirmPassword')
        .notEmpty().withMessage('Please confirm your password')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        }),
];

// --------------------------------------------------
// Change password validation rules
// --------------------------------------------------
const changePasswordRules = [
    body('currentPassword')
        .notEmpty().withMessage('Current password is required'),

    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase, and a number'),
];

module.exports = {
    validate,
    registerRules,
    loginRules,
    forgotPasswordRules,
    resetPasswordRules,
    changePasswordRules,
};
