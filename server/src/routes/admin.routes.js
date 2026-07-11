const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('ADMIN'));

router.get('/users', adminController.getUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/status', adminController.updateUserStatus);

// Placeholders for older routes to prevent 404s
router.get('/dashboard', (req, res) => res.json({ success: true, data: { total_departments: 1, total_teachers: 1, total_students: 1, total_quizzes: 1, completion_rate: 100, avg_score: 100, at_risk_distribution: [] } }));
router.get('/departments', (req, res) => res.json({ success: true, data: [] }));
router.get('/teachers', (req, res) => res.json({ success: true, data: [] }));
router.get('/students', (req, res) => res.json({ success: true, data: [] }));
router.get('/at-risk-students', (req, res) => res.json({ success: true, data: { atRiskStudents: [], distressSignals: [] } }));
router.get('/analytics', (req, res) => res.json({ success: true, data: { deptPerformance: [], weeklyTrend: [] } }));

module.exports = router;
