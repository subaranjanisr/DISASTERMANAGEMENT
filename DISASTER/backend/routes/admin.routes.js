// ============================================================
// Admin Routes
// ============================================================

const express = require('express');
const router = express.Router();

const {
    getAdminDashboard,
    getAllStudents,
    getStudentById,
    toggleStudentStatus,
    deleteStudent,
    getDrillPerformance,
} = require('../controllers/admin.controller');

const { protect, authorize } = require('../middleware/auth.middleware');

// All admin routes require authentication + admin role
router.use(protect, authorize('admin', 'superadmin'));

router.get('/dashboard', getAdminDashboard);
router.get('/students', getAllStudents);
router.get('/students/:id', getStudentById);
router.patch('/students/:id/status', toggleStudentStatus);
router.delete('/students/:id', authorize('superadmin'), deleteStudent); // superadmin only
router.get('/drill-performance', getDrillPerformance);

module.exports = router;
