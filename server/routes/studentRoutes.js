const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authenticate');
const {
  getDashboard,
  getAttempts,
  getFeedback,
  acknowledgeFeedback,
  sendDistressSignal
} = require('../controllers/studentController');

// All routes here are restricted to Student
router.use(authenticate, authorize('student'));

router.get('/dashboard', getDashboard);
router.get('/attempts', getAttempts);
router.get('/feedback', getFeedback);
router.post('/acknowledge-feedback/:id', acknowledgeFeedback);
router.post('/distress-signal', sendDistressSignal);

module.exports = router;