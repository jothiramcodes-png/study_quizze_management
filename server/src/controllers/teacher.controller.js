const prisma = require('../prisma');

const getDashboardStats = async (req, res) => {
  try {
    const { userId } = req.user;
    const teacher = await prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

    // Since we removed department in favor of school, we get all students in the school
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    const studentsCount = await prisma.student.count({
      where: { user: { schoolId: user.schoolId } }
    });

    const atRiskCount = await prisma.student.count({
      where: { user: { schoolId: user.schoolId }, riskLevel: 'high' }
    });

    const attempts = await prisma.quizAttempt.findMany({
      where: { quiz: { createdById: userId }, status: 'completed' },
      select: { percentage: true }
    });
    
    const avgScore = attempts.length > 0 
      ? (attempts.reduce((acc, curr) => acc + curr.percentage, 0) / attempts.length).toFixed(1)
      : 0;

    const feedbackGiven = await prisma.feedback.count({
      where: { teacherId: teacher.id }
    });

    res.json({
      success: true,
      data: {
        total_students: studentsCount,
        at_risk_count: atRiskCount,
        avg_score: avgScore,
        feedback_given: feedbackGiven
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getStudents = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const students = await prisma.student.findMany({
      where: { user: { schoolId: user.schoolId } },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        attempts: { where: { status: 'completed' } }
      }
    });

    const formattedStudents = students.map(s => ({
      id: s.id,
      student_id: s.id,
      name: s.user.firstName + ' ' + s.user.lastName,
      email: s.user.email,
      roll_number: s.rollNumber,
      semester: s.semester,
      swbi_score: s.swbiScore,
      risk_level: s.riskLevel,
      quizzes_taken: s.attempts.length
    }));

    res.json({ success: true, data: formattedStudents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getStudentSWBIHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await prisma.wellbeingScore.findMany({
      where: { studentId: id },
      orderBy: { reportDate: 'asc' }
    });
    
    res.json({
      success: true,
      data: history.map(h => ({
        report_date: h.reportDate,
        swbi_score: h.swbiScore,
        academic_score: h.academicScore,
        risk_level: h.riskLevel
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getStudentResults = async (req, res) => {
  try {
    const { id } = req.params;
    const attempts = await prisma.quizAttempt.findMany({
      where: { studentId: id, status: 'completed' },
      orderBy: { completedAt: 'desc' },
      include: {
        quiz: { select: { title: true, topic: true, difficulty: true } }
      }
    });

    res.json({
      success: true,
      data: attempts.map(a => ({
        id: a.id,
        quiz_title: a.quiz.title,
        topic: a.quiz.topic,
        difficulty: a.quiz.difficulty,
        score: a.score,
        total_marks: a.totalMarks,
        percentage: a.percentage,
        swbi_delta: a.swbiDelta,
        completed_at: a.completedAt
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    const students = await prisma.student.findMany({
      where: { user: { schoolId: user.schoolId } }
    });
    
    const distribution = { low: 0, medium: 0, high: 0 };
    students.forEach(s => {
      if (s.riskLevel) distribution[s.riskLevel]++;
    });

    res.json({
      success: true,
      data: {
        swbiDistribution: distribution,
        recentTrends: [], // Placeholder for chart data
        atRiskStudents: students.filter(s => s.riskLevel === 'high').length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const submitFeedback = async (req, res) => {
  try {
    const { userId } = req.user;
    const { student_id, category, feedback_text, attempt_id } = req.body;

    if (!student_id || !category || !feedback_text) {
      return res.status(400).json({ success: false, message: 'student_id, category, and feedback_text are required' });
    }

    const teacher = await prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    }

    const feedback = await prisma.feedback.create({
      data: {
        teacherId: teacher.id,
        studentId: student_id,
        attemptId: attempt_id || null,
        category,
        feedbackText: feedback_text
      }
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { feedbackId: feedback.id }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyFeedback = async (req, res) => {
  try {
    const { userId } = req.user;
    const teacher = await prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    }

    const feedbackList = await prisma.feedback.findMany({
      where: { teacherId: teacher.id },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedFeedback = feedbackList.map(f => ({
      id: f.id,
      category: f.category,
      feedback_text: f.feedbackText,
      is_read: f.isRead,
      student_ack: f.studentAck,
      created_at: f.createdAt,
      student_name: f.student.user.firstName + ' ' + f.student.user.lastName,
      roll_number: f.student.rollNumber
    }));

    res.json({ success: true, data: formattedFeedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getDashboardStats,
  getStudents,
  getStudentSWBIHistory,
  getStudentResults,
  getAnalytics,
  submitFeedback,
  getMyFeedback
};
