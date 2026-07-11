const { pool } = require('../config/database');

async function getDashboard(req, res) {
  try {
    const userId = req.user.id;
    
    const { rows: tRows } = await pool.query(
      'SELECT id, department_id FROM teachers WHERE user_id = $1',
      [userId]
    );
    const teacher = tRows[0];
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    }

    const { rows: [{ total_students }] } = await pool.query(
      'SELECT COUNT(*) as total_students FROM students WHERE teacher_id = $1',
      [teacher.id]
    );

    const { rows: [{ at_risk_count }] } = await pool.query(
      "SELECT COUNT(*) as at_risk_count FROM students WHERE teacher_id = $1 AND risk_level IN ('medium', 'high')",
      [teacher.id]
    );

    const { rows: [{ avg_score }] } = await pool.query(
      `SELECT AVG(qa.percentage) as avg_score 
       FROM quiz_attempts qa
       JOIN students s ON qa.student_id = s.id
       WHERE s.teacher_id = $1 AND qa.status = 'completed'`,
      [teacher.id]
    );

    const { rows: [{ feedback_given }] } = await pool.query(
      'SELECT COUNT(*) as feedback_given FROM feedback WHERE teacher_id = $1',
      [teacher.id]
    );

    res.json({
      success: true,
      data: {
        total_students: parseInt(total_students),
        at_risk_count: parseInt(at_risk_count),
        avg_score: avg_score ? parseFloat(avg_score).toFixed(1) : 0,
        feedback_given: parseInt(feedback_given)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getStudents(req, res) {
  try {
    const userId = req.user.id;
    const { rows: tRows } = await pool.query(
      'SELECT id FROM teachers WHERE user_id = $1',
      [userId]
    );
    const teacher = tRows[0];
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    }

    const { rows: students } = await pool.query(
      `SELECT s.id as student_id, u.name, u.email, s.roll_number, s.semester, s.swbi_score, s.risk_level
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.teacher_id = $1
       ORDER BY CASE s.risk_level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END, u.name ASC`,
      [teacher.id]
    );

    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getAnalytics(req, res) {
  try {
    const userId = req.user.id;
    const { rows: tRows } = await pool.query(
      'SELECT id FROM teachers WHERE user_id = $1',
      [userId]
    );
    const teacher = tRows[0];
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    }

    const { rows: weeklyTrend } = await pool.query(
      `SELECT TO_CHAR(qa.completed_at, 'YYYY-WW') as week,
              AVG(qa.percentage) as avg_score,
              COUNT(*) as attempt_count
       FROM quiz_attempts qa
       JOIN students s ON qa.student_id = s.id
       WHERE s.teacher_id = $1 AND qa.status = 'completed' AND qa.completed_at >= NOW() - INTERVAL '8 weeks'
       GROUP BY week
       ORDER BY week ASC`,
      [teacher.id]
    );

    res.json({ success: true, data: { weeklyTrend } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function submitFeedback(req, res) {
  try {
    const userId = req.user.id;
    const { student_id, category, feedback_text, attempt_id } = req.body;
    
    if (!student_id || !category || !feedback_text) {
      return res.status(400).json({ success: false, message: 'student_id, category, and feedback_text are required' });
    }

    const { rows: tRows } = await pool.query(
      'SELECT id FROM teachers WHERE user_id = $1',
      [userId]
    );
    const teacher = tRows[0];
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    }

    const { rows: result } = await pool.query(
      `INSERT INTO feedback (teacher_id, student_id, attempt_id, category, feedback_text) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [teacher.id, student_id, attempt_id || null, category, feedback_text]
    );

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { feedbackId: result[0].id }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getStudentResults(req, res) {
  try {
    const { id } = req.params;
    const { rows: attempts } = await pool.query(
      `SELECT qa.*, q.title, q.topic, q.quiz_type
       FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.id
       WHERE qa.student_id = $1
       ORDER BY qa.completed_at DESC`,
      [id]
    );
    res.json({ success: true, data: attempts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getStudentSWBIHistory(req, res) {
  try {
    const { id } = req.params;
    const { rows: history } = await pool.query(
      `SELECT report_date, swbi_score, academic_score, risk_level, ai_summary
       FROM wellness_reports
       WHERE student_id = $1
       ORDER BY report_date ASC`,
      [id]
    );
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getAtRiskStudents(req, res) {
  try {
    const userId = req.user.id;
    const { rows: tRows } = await pool.query(
      'SELECT id FROM teachers WHERE user_id = $1',
      [userId]
    );
    const teacher = tRows[0];
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    }

    const { rows: students } = await pool.query(
      `SELECT s.id as student_id, u.name, u.email, s.roll_number, s.swbi_score, s.risk_level
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.teacher_id = $1 AND s.risk_level IN ('medium', 'high')
       ORDER BY CASE s.risk_level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, u.name ASC`,
      [teacher.id]
    );

    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getMyFeedback(req, res) {
  try {
    const userId = req.user.id;
    const { rows: tRows } = await pool.query(
      'SELECT id FROM teachers WHERE user_id = $1',
      [userId]
    );
    const teacher = tRows[0];
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

    const { rows } = await pool.query(
      `SELECT f.id, f.category, f.feedback_text, f.is_read, f.student_ack, f.created_at,
              su.name as student_name, s.roll_number
       FROM feedback f
       JOIN students s ON f.student_id = s.id
       JOIN users su ON s.user_id = su.id
       WHERE f.teacher_id = $1
       ORDER BY f.created_at DESC`,
      [teacher.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getDashboard,
  getStudents,
  getAnalytics,
  submitFeedback,
  getStudentResults,
  getStudentSWBIHistory,
  getAtRiskStudents,
  getMyFeedback
};
