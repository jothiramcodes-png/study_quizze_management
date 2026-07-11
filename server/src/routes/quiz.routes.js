const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, quizController.getQuizzes);
router.get('/:id', authenticate, quizController.getQuizById);
router.get('/:id/preview', authenticate, authorize('TEACHER', 'ADMIN'), quizController.getQuizPreview);

router.post('/:id/attempt/start', authenticate, authorize('STUDENT'), quizController.startAttempt);
router.post('/attempt/:id/submit', authenticate, authorize('STUDENT'), quizController.submitAttempt);
router.get('/attempt/:id', authenticate, quizController.getAttemptDetails);

module.exports = router;
