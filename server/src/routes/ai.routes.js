const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.post('/generate-quiz', authenticate, authorize('TEACHER', 'ADMIN'), aiController.generateQuiz);

module.exports = router;
