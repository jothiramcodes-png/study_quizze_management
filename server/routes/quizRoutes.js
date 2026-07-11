const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authenticate');
const {
  getQuizzes,
  getQuizById,
  startAttempt,
  submitAttempt,
  getAttemptDetails,
  getQuizPreview
} = require('../controllers/quizController');

// All routes require authentication
router.use(authenticate);

router.get('/', getQuizzes);
router.get('/:id', getQuizById);
router.get('/:id/preview', authorize('admin', 'teacher'), getQuizPreview);
router.get('/attempt/:id', getAttemptDetails);

// Attempt operations are restricted to Students
router.post('/:id/attempt/start', authorize('student'), startAttempt);
router.post('/attempt/:id/submit', authorize('student'), submitAttempt);

module.exports = router;