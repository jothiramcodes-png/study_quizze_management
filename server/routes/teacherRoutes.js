const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authenticate');
const {
  getDashboard,
  getStudents,
  getAnalytics,
  submitFeedback,
  getStudentResults,
  getStudentSWBIHistory,
  getAtRiskStudents,
  getMyFeedback
} = require('../controllers/teacherController');

// All routes here are restricted to Teacher
router.use(authenticate, authorize('teacher'));

router.get('/dashboard', getDashboard);
router.get('/students', getStudents);
router.get('/students/:id/results', getStudentResults);
router.get('/students/:id/swbi', getStudentSWBIHistory);
router.post('/feedback', submitFeedback);
router.get('/my-feedback', getMyFeedback);
router.get('/at-risk', getAtRiskStudents);
router.get('/analytics', getAnalytics);

module.exports = router;