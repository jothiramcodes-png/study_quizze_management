const { pool } = require('../config/database');

async function getDashboard(req, res) {
  try {
    const userId = req.user.id;

    const { rows: studentRows } = await pool.query(
      `SELECT s.id, s.department_id, s.roll_number, s.semester, s.swbi_score, s.risk_level, u.name, u.email 
       FROM students s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.user_id = $1`,
      [userId]
    );
    const student = studentRows[0];
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const { rows: [{ attempted_count }] } = await pool.query(
      "SELECT COUNT(*) as attempted_count FROM quiz_attempts WHERE student_id = $1 AND status = 'completed'",
      [student.id]
    );

    const { rows: [{ avg_score }] } = await pool.query(
      "SELECT AVG(percentage) as avg_score FROM quiz_attempts WHERE student_id = $1 AND status = 'completed'",
      [student.id]
    );

    const { rows: [{ unread_feedback }] } = await pool.query(
      "SELECT COUNT(*) as unread_feedback FROM feedback WHERE student_id = $1 AND is_read = false",
      [student.id]
    );

    const { rows: recentFeedback } = await pool.query(
      `SELECT f.id, f.category, f.feedback_text, f.is_read, f.student_ack, f.created_at, tu.name as teacher_name 
       FROM feedback f 
       JOIN teachers t ON f.teacher_id = t.id 
       JOIN users tu ON t.user_id = tu.id 
       WHERE f.student_id = $1 
       ORDER BY f.created_at DESC LIMIT 3`,
      [student.id]
    );

    const { rows: pendingQuizzes } = await pool.query(
      `SELECT q.id, q.title, q.description, q.topic, q.quiz_type, q.difficulty, q.total_questions, q.duration_mins 
       FROM quizzes q 
       WHERE q.is_active = true 
         AND (q.department_id = $1 OR q.department_id IS NULL)
         AND q.id NOT IN (SELECT quiz_id FROM quiz_attempts WHERE student_id = $2 AND status = 'completed')`,
      [student.department_id, student.id]
    );

    const { rows: swbiHistory } = await pool.query(
      `SELECT report_date as label, swbi_score as score 
       FROM wellness_reports 
       WHERE student_id = $1 
       ORDER BY report_date ASC LIMIT 6`,
      [student.id]
    );

    res.json({
      success: true,
      data: {
        profile: student,
        attempted_count: parseInt(attempted_count),
        avg_score: avg_score ? parseFloat(avg_score).toFixed(1) : 0,
        unread_feedback: parseInt(unread_feedback),
        recentFeedback,
        pendingQuizzes,
        swbiHistory
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getAttempts(req, res) {
  try {
    const userId = req.user.id;
    const { rows: studentRows } = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
    const student = studentRows[0];
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const { rows: attempts } = await pool.query(
      `SELECT qa.*, q.title, q.topic, q.quiz_type 
       FROM quiz_attempts qa 
       JOIN quizzes q ON qa.quiz_id = q.id 
       WHERE qa.student_id = $1 
       ORDER BY qa.started_at DESC`,
      [student.id]
    );

    res.json({ success: true, data: attempts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getFeedback(req, res) {
  try {
    const userId = req.user.id;
    const { rows: studentRows } = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
    const student = studentRows[0];
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    await pool.query('UPDATE feedback SET is_read = true WHERE student_id = $1', [student.id]);

    const { rows: feedback } = await pool.query(
      `SELECT f.*, tu.name as teacher_name 
       FROM feedback f 
       JOIN teachers t ON f.teacher_id = t.id 
       JOIN users tu ON t.user_id = tu.id 
       WHERE f.student_id = $1 
       ORDER BY f.created_at DESC`,
      [student.id]
    );

    res.json({ success: true, data: feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function acknowledgeFeedback(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { rows: studentRows } = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
    const student = studentRows[0];
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const { rowCount } = await pool.query(
      'UPDATE feedback SET student_ack = true WHERE id = $1 AND student_id = $2',
      [id, student.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Feedback item not found or not authorized' });
    }

    res.json({ success: true, message: 'Feedback acknowledged' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function sendDistressSignal(req, res) {
  try {
    const userId = req.user.id;
    const { rows: studentRows } = await pool.query(
      'SELECT id, teacher_id, roll_number, department_id FROM students WHERE user_id = $1',
      [userId]
    );
    const student = studentRows[0];
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    let teacherUserId = null;
    if (student.teacher_id) {
      const { rows: tRows } = await pool.query('SELECT user_id FROM teachers WHERE id = $1', [student.teacher_id]);
      if (tRows[0]) teacherUserId = tRows[0].user_id;
    }

    await pool.query(
      'INSERT INTO distress_signals (student_id, department_id, notes) VALUES ($1, $2, $3)',
      [student.id, student.department_id, 'Confidential SOS triggered by student from dashboard']
    );

    const { rows: admins } = await pool.query("SELECT id FROM users WHERE role = 'admin'");

    if (teacherUserId) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type) 
         VALUES ($1, '🚨 Distress Signal Received', 'A student under your guidance has sent a distress signal.', 'alert')`,
        [teacherUserId]
      );
    }

    for (const admin of admins) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type) 
         VALUES ($1, '🚨 Distress Signal Received', 'A student in the CSE/IT/ECE department has sent a distress signal.', 'alert')`,
        [admin.id]
      );
    }

    await pool.query(
      "UPDATE students SET risk_level = 'high' WHERE id = $1",
      [student.id]
    );

    res.json({ success: true, message: 'Distress signal sent successfully. Counseling center notified.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getDashboard,
  getAttempts,
  getFeedback,
  acknowledgeFeedback,
  sendDistressSignal
};
