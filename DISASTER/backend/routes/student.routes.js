// ============================================================
// Student Routes
// ============================================================

const express = require('express');
const router = express.Router();

const {
    getDashboard,
    getProfile,
    updateProfile,
    getLeaderboard,
} = require('../controllers/student.controller');

const { protect, authorize } = require('../middleware/auth.middleware');

// All student routes require authentication
router.use(protect);

router.get('/dashboard', authorize('student'), getDashboard);
router.get('/profile', authorize('student'), getProfile);
router.patch('/profile', authorize('student'), updateProfile);
router.get('/leaderboard', getLeaderboard); // accessible to students AND admins

module.exports = router;
