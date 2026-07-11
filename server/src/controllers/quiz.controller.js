const prisma = require('../prisma');

const formatOption = (opt) => ({
  id: opt.id,
  question_id: opt.questionId,
  option_text: opt.optionText,
  option_label: opt.optionLabel,
  is_correct: opt.isCorrect !== undefined ? (opt.isCorrect ? 1 : 0) : undefined
});

const formatQuestion = (q) => ({
  id: q.id,
  quiz_id: q.quizId,
  question_text: q.questionText,
  question_type: q.questionType,
  marks: q.marks,
  explanation: q.explanation,
  order_num: q.orderNum,
  options: q.optionsList ? q.optionsList.map(formatOption) : undefined
});

const formatQuiz = (q) => ({
  id: q.id,
  title: q.title,
  description: q.description,
  topic: q.topic,
  quiz_type: q.quizType,
  difficulty: q.difficulty,
  total_marks: q.totalMarks,
  duration_mins: q.durationMins,
  ai_generated: q.aiGenerated,
  is_active: q.isActive,
  created_by_id: q.createdById,
  created_at: q.createdAt,
  total_questions: q.questions ? q.questions.length : (q._count?.questions || 0),
  questions: q.questions ? q.questions.map(formatQuestion) : undefined
});

const getQuizzes = async (req, res) => {
  try {
    const { role, userId } = req.user;
    
    const quizzes = await prisma.quiz.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { questions: true }
        }
      }
    });

    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
      
      const attempts = await prisma.quizAttempt.findMany({
        where: { studentId: student.id }
      });

      const formattedQuizzes = quizzes.map(q => {
        const attempt = attempts.find(a => a.quizId === q.id);
        return { 
          ...formatQuiz(q), 
          attempt_status: attempt ? attempt.status : null 
        };
      });
      return res.json({ success: true, data: formattedQuizzes });
    }

    res.json({ success: true, data: quizzes.map(formatQuiz) });
  } catch (err) {
    console.error('getQuizzes error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;
    
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { orderNum: 'asc' },
          include: {
            optionsList: {
              orderBy: { optionLabel: 'asc' }
            }
          }
        }
      }
    });

    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    
    const formatted = formatQuiz(quiz);
    if (role === 'STUDENT') {
      formatted.questions.forEach(q => {
        q.options.forEach(opt => {
          delete opt.is_correct;
        });
      });
    }

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('getQuizById error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const startAttempt = async (req, res) => {
  try {
    const quizId = req.params.id;
    const { userId } = req.user;

    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: { studentId: student.id, quizId }
    });

    if (existingAttempt && existingAttempt.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Quiz already completed' });
    }
    
    if (existingAttempt && existingAttempt.status === 'in_progress') {
      return res.json({ success: true, message: 'Resuming attempt', data: { attemptId: existingAttempt.id } });
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        studentId: student.id,
        quizId,
        status: 'in_progress'
      }
    });

    res.status(201).json({ success: true, message: 'Attempt started', data: { attemptId: attempt.id } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const submitAttempt = async (req, res) => {
  try {
    const attemptId = req.params.id;
    const { answers, timeTakenSecs } = req.body;
    const { userId } = req.user;

    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const attempt = await prisma.quizAttempt.findFirst({
      where: { id: attemptId, studentId: student.id, status: 'in_progress' }
    });
    if (!attempt) return res.status(400).json({ success: false, message: 'No active attempt found to submit' });

    const quiz = await prisma.quiz.findUnique({ where: { id: attempt.quizId } });
    const questions = await prisma.quizQuestion.findMany({
      where: { quizId: quiz.id },
      include: { optionsList: { where: { isCorrect: true } } }
    });

    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    const attemptAnswers = [];

    const correctMap = {};
    for (const q of questions) {
      correctMap[q.id] = {
        correctOptionId: q.optionsList[0]?.id || null,
        marks: q.marks
      };
    }

    for (const ans of answers) {
      const grading = correctMap[ans.question_id];
      if (!grading) continue;

      const isCorrect = grading.correctOptionId === ans.selected_option_id;
      const marksAwarded = isCorrect ? grading.marks : 0;

      if (isCorrect) {
        score += grading.marks;
        correctCount++;
      } else {
        incorrectCount++;
      }

      attemptAnswers.push({
        attemptId,
        questionId: ans.question_id,
        selectedOptId: ans.selected_option_id || null,
        isCorrect,
        marksAwarded
      });
    }

    // Insert answers using a transaction
    await prisma.$transaction(
      attemptAnswers.map(ans => prisma.attemptAnswer.create({ data: ans }))
    );

    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    const percentage = totalMarks > 0 ? parseFloat(((score / totalMarks) * 100).toFixed(2)) : 0;

    let swbiDelta = 0;
    let newSwbiScore = student.swbiScore;

    if (quiz.quizType === 'wellness') {
      newSwbiScore = percentage;
      swbiDelta = newSwbiScore - student.swbiScore;
      const riskLevel = newSwbiScore >= 70 ? 'low' : newSwbiScore >= 50 ? 'medium' : 'high';
      
      await prisma.student.update({
        where: { id: student.id },
        data: { swbiScore: newSwbiScore, riskLevel }
      });

      await prisma.wellbeingScore.create({
        data: {
          studentId: student.id,
          swbiScore: newSwbiScore,
          academicScore: newSwbiScore,
          riskLevel,
          aiSummary: `Automatically calculated SWBI from Wellness Quiz: \${quiz.title}`
        }
      });
    }

    await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        score,
        totalMarks,
        percentage,
        swbiDelta,
        status: 'completed',
        completedAt: new Date(),
        timeTakenSecs: timeTakenSecs || 0
      }
    });

    await prisma.activityLog.create({
      data: { userId, action: `SUBMITTED_QUIZ_\${quiz.id}` }
    });

    res.json({
      success: true,
      message: 'Quiz submitted and graded successfully',
      data: { attemptId, score, totalMarks, percentage, correctCount, incorrectCount, swbiDelta }
    });
  } catch (err) {
    console.error('Submit attempt error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAttemptDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user;

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id },
      include: {
        quiz: true,
        student: { include: { user: true } },
        answers: { include: { selectedOpt: true } }
      }
    });

    if (!attempt) return res.status(404).json({ success: false, message: 'Quiz attempt not found' });

    if (role === 'STUDENT' && attempt.student.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const questions = await prisma.quizQuestion.findMany({
      where: { quizId: attempt.quizId },
      orderBy: { orderNum: 'asc' },
      include: {
        optionsList: { orderBy: { optionLabel: 'asc' } }
      }
    });

    const formattedQuestions = questions.map(q => {
      const studentAns = attempt.answers.find(a => a.questionId === q.id);
      const formattedQ = formatQuestion(q);
      formattedQ.student_answer = studentAns ? {
        selected_option: studentAns.selectedOptId,
        is_correct: studentAns.isCorrect ? 1 : 0,
        marks_awarded: studentAns.marksAwarded
      } : null;
      return formattedQ;
    });

    const formattedAttempt = {
      id: attempt.id,
      student_id: attempt.studentId,
      student_name: attempt.student.user.firstName + ' ' + attempt.student.user.lastName,
      roll_number: attempt.student.rollNumber,
      quiz_id: attempt.quizId,
      title: attempt.quiz.title,
      description: attempt.quiz.description,
      topic: attempt.quiz.topic,
      score: attempt.score,
      total_marks: attempt.totalMarks,
      percentage: attempt.percentage,
      swbi_delta: attempt.swbiDelta,
      status: attempt.status,
      completed_at: attempt.completedAt,
      time_taken_secs: attempt.timeTakenSecs
    };

    res.json({ success: true, data: { attempt: formattedAttempt, questions: formattedQuestions } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getQuizPreview = async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { orderNum: 'asc' },
          include: {
            optionsList: { orderBy: { optionLabel: 'asc' } }
          }
        }
      }
    });

    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const formatted = formatQuiz(quiz);

    res.json({ success: true, data: { quiz: formatted, questions: formatted.questions } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getQuizzes,
  getQuizById,
  startAttempt,
  submitAttempt,
  getAttemptDetails,
  getQuizPreview
};
