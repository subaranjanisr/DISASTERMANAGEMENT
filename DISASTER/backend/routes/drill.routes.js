// ============================================================
// Drill Routes
// ============================================================

const express = require('express');
const router = express.Router();

const {
    getMyDrillProgress,
    startDrill,
    completeDrill,
    updateProgress,
} = require('../controllers/drill.controller');

const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect, authorize('student'));

router.get('/my-progress', getMyDrillProgress);
router.post('/start', startDrill);
router.patch('/complete', completeDrill);
router.patch('/update-progress', updateProgress);

module.exports = router;
