const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacher.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('TEACHER', 'ADMIN'));

router.get('/dashboard', teacherController.getDashboardStats);
router.get('/students', teacherController.getStudents);
router.get('/students/:id/swbi', teacherController.getStudentSWBIHistory);
router.get('/students/:id/results', teacherController.getStudentResults);
router.post('/feedback', teacherController.submitFeedback);
router.get('/my-feedback', teacherController.getMyFeedback);
router.get('/analytics', teacherController.getAnalytics);

module.exports = router;
