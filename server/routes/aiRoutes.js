const express = require('express');
const router = express.Router();
const { generateQuiz } = require('../controllers/aiController');
const { authenticate, authorize } = require('../middleware/authenticate');

router.post('/generate-quiz', authenticate, authorize('admin'), generateQuiz);

module.exports = router;