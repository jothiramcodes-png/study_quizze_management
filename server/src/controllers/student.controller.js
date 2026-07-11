const prisma = require('../prisma');

const getDashboardStats = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        user: true,
        attempts: true,
        wellnessScore: {
          orderBy: { reportDate: 'asc' }
        },
        feedback: {
          where: { isRead: false },
          orderBy: { createdAt: 'desc' },
          include: {
            teacher: { include: { user: true } }
          }
        }
      }
    });

    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const completedAttempts = student.attempts.filter(a => a.status === 'completed');
    const attempted_count = completedAttempts.length;
    const avg_score = attempted_count > 0 
      ? (completedAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / attempted_count).toFixed(2)
      : 0;

    const unread_feedback = student.feedback.length;

    const recentFeedback = student.feedback.slice(0, 5).map(f => ({
      id: f.id,
      teacher_name: `${f.teacher.user.firstName} ${f.teacher.user.lastName}`,
      category: f.category,
      created_at: f.createdAt,
      feedback_text: f.feedbackText,
      student_ack: f.studentAck
    }));

    const completedQuizIds = student.attempts.map(a => a.quizId);
    
    const pendingQuizzesData = await prisma.quiz.findMany({
      where: {
        isActive: true,
        id: { notIn: completedQuizIds }
      },
      include: {
        _count: { select: { questions: true } }
      },
      take: 5
    });

    const pendingQuizzes = pendingQuizzesData.map(q => ({
      id: q.id,
      title: q.title,
      total_questions: q._count.questions,
      duration_mins: q.durationMins,
      difficulty: q.difficulty
    }));

    const swbiHistory = student.wellnessScore.map(w => ({
      label: w.reportDate.toISOString(),
      score: w.swbiScore
    }));

    res.json({
      success: true,
      data: {
        profile: {
          name: `${student.user.firstName} ${student.user.lastName}`,
          roll_number: student.rollNumber,
          semester: student.semester,
          risk_level: student.riskLevel,
          swbi_score: student.swbiScore.toFixed(2)
        },
        attempted_count,
        avg_score,
        unread_feedback,
        recentFeedback,
        pendingQuizzes,
        swbiHistory
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAttempts = async (req, res) => {
  try {
    const { userId } = req.user;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const attempts = await prisma.quizAttempt.findMany({
      where: { studentId: student.id, status: 'completed' },
      orderBy: { completedAt: 'desc' },
      include: {
        quiz: { select: { title: true, topic: true } }
      }
    });

    const formattedAttempts = attempts.map(a => ({
      id: a.id,
      quiz_id: a.quizId,
      quiz_title: a.quiz.title,
      topic: a.quiz.topic,
      score: a.score,
      total_marks: a.totalMarks,
      percentage: a.percentage,
      swbi_delta: a.swbiDelta,
      completed_at: a.completedAt
    }));

    res.json({ success: true, data: formattedAttempts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getFeedback = async (req, res) => {
  try {
    const { userId } = req.user;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const feedbackList = await prisma.feedback.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        attempt: { include: { quiz: { select: { title: true } } } }
      }
    });

    const formattedFeedback = feedbackList.map(f => ({
      id: f.id,
      teacher_name: f.teacher.user.firstName + ' ' + f.teacher.user.lastName,
      quiz_title: f.attempt?.quiz?.title || null,
      category: f.category,
      feedback_text: f.feedbackText,
      created_at: f.createdAt,
      is_read: f.isRead
    }));

    res.json({ success: true, data: formattedFeedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const acknowledgeFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const feedback = await prisma.feedback.update({
      where: { id, studentId: student.id },
      data: { studentAck: true }
    });

    res.json({ success: true, message: 'Feedback acknowledged', data: feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const sendDistressSignal = async (req, res) => {
  try {
    const { userId } = req.user;
    const student = await prisma.student.findUnique({
      where: { userId },
      include: { teacher: true }
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    // Update risk level to high
    await prisma.student.update({
      where: { id: student.id },
      data: { riskLevel: 'high' }
    });

    // Notify teacher if assigned
    if (student.teacher) {
      await prisma.notification.create({
        data: {
          userId: student.teacher.userId,
          title: '🚨 Distress Signal Received',
          message: 'A student under your guidance has sent a distress signal.',
          type: 'alert'
        }
      });
    }

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: '🚨 Distress Signal Received',
          message: 'A student has sent a distress signal.',
          type: 'alert'
        }
      });
    }

    res.json({ success: true, message: 'Distress signal sent successfully. Counseling center notified.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getDashboardStats,
  getAttempts,
  getFeedback,
  acknowledgeFeedback,
  sendDistressSignal
};
