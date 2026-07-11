const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('STUDENT'));

router.get('/dashboard', studentController.getDashboardStats);
router.get('/attempts', studentController.getAttempts);
router.get('/feedback', studentController.getFeedback);
router.post('/acknowledge-feedback/:id', studentController.acknowledgeFeedback);
router.post('/distress-signal', studentController.sendDistressSignal);

module.exports = router;
