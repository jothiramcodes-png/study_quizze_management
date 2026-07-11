const { pool } = require('../config/database');

async function getQuizzes(req, res) {
  try {
    const { role, id } = req.user;

    let query = '';
    let params = [];

    if (role === 'student') {
      const { rows } = await pool.query('SELECT id, department_id FROM students WHERE user_id = $1', [id]);
      const student = rows[0];
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
      
      query = `
        SELECT q.id, q.title, q.description, q.topic, q.quiz_type, q.difficulty, q.total_questions, q.duration_mins,
               (SELECT status FROM quiz_attempts WHERE student_id = $1 AND quiz_id = q.id LIMIT 1) as attempt_status
        FROM quizzes q
        WHERE q.is_active = true AND (q.department_id = $2 OR q.department_id IS NULL)
        ORDER BY q.created_at DESC
      `;
      params = [student.id, student.department_id];
    } else if (role === 'teacher') {
      const { rows } = await pool.query('SELECT department_id FROM teachers WHERE user_id = $1', [id]);
      const teacher = rows[0];
      if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

      query = 'SELECT * FROM quizzes WHERE department_id = $1 OR department_id IS NULL ORDER BY created_at DESC';
      params = [teacher.department_id];
    } else {
      query = 'SELECT * FROM quizzes ORDER BY created_at DESC';
    }

    const { rows: quizzes } = await pool.query(query, params);
    res.json({ success: true, data: quizzes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getQuizById(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM quizzes WHERE id = $1', [id]);
    const quiz = rows[0];
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const { rows: questions } = await pool.query(
      'SELECT id, quiz_id, question_text, question_type, marks, explanation FROM questions WHERE quiz_id = $1 ORDER BY order_num ASC',
      [id]
    );

    for (let q of questions) {
      let options;
      if (req.user.role === 'student') {
        const resOpt = await pool.query(
          'SELECT id, option_text, option_label FROM options WHERE question_id = $1 ORDER BY option_label ASC',
          [q.id]
        );
        options = resOpt.rows;
      } else {
        const resOpt = await pool.query(
          'SELECT id, option_text, option_label, is_correct FROM options WHERE question_id = $1 ORDER BY option_label ASC',
          [q.id]
        );
        options = resOpt.rows;
      }
      q.options = options;
    }

    res.json({ success: true, data: { ...quiz, questions } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function startAttempt(req, res) {
  try {
    const quizId = req.params.id;
    const userId = req.user.id;

    const { rows: sRows } = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
    const student = sRows[0];
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const { rows: cRows } = await pool.query(
      "SELECT id FROM quiz_attempts WHERE student_id = $1 AND quiz_id = $2 AND status = 'completed'",
      [student.id, quizId]
    );
    const completed = cRows[0];
    if (completed) {
      return res.status(400).json({ success: false, message: 'Quiz already completed' });
    }

    const { rows: iRows } = await pool.query(
      "SELECT id FROM quiz_attempts WHERE student_id = $1 AND quiz_id = $2 AND status = 'in_progress'",
      [student.id, quizId]
    );
    const inProgress = iRows[0];
    if (inProgress) {
      return res.json({ success: true, message: 'Resuming attempt', data: { attemptId: inProgress.id } });
    }

    const { rows: result } = await pool.query(
      "INSERT INTO quiz_attempts (student_id, quiz_id, status, started_at) VALUES ($1, $2, 'in_progress', NOW()) RETURNING id",
      [student.id, quizId]
    );

    res.status(201).json({
      success: true,
      message: 'Attempt started successfully',
      data: { attemptId: result[0].id }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function submitAttempt(req, res) {
  const conn = await pool.connect();
  try {
    await conn.query('BEGIN');

    const attemptId = req.params.id;
    const { answers, timeTakenSecs } = req.body;
    const userId = req.user.id;

    const { rows: sRows } = await conn.query('SELECT id, swbi_score FROM students WHERE user_id = $1', [userId]);
    const student = sRows[0];
    if (!student) {
      await conn.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const { rows: aRows } = await conn.query(
      "SELECT * FROM quiz_attempts WHERE id = $1 AND student_id = $2 AND status = 'in_progress'",
      [attemptId, student.id]
    );
    const attempt = aRows[0];
    if (!attempt) {
      await conn.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'No active attempt found to submit' });
    }

    const { rows: qRows } = await conn.query('SELECT * FROM quizzes WHERE id = $1', [attempt.quiz_id]);
    const quiz = qRows[0];

    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;

    const { rows: questions } = await conn.query(
      'SELECT id, marks, question_type FROM questions WHERE quiz_id = $1',
      [attempt.quiz_id]
    );

    const correctMap = {};
    for (const q of questions) {
      const { rows: oRows } = await conn.query(
        'SELECT id FROM options WHERE question_id = $1 AND is_correct = true',
        [q.id]
      );
      const correctOpt = oRows[0];
      correctMap[q.id] = {
        correctOptionId: correctOpt ? correctOpt.id : null,
        marks: q.marks || 1
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

      await conn.query(
        `INSERT INTO attempt_answers (attempt_id, question_id, selected_option, is_correct, marks_awarded) 
         VALUES ($1, $2, $3, $4, $5)`,
        [attemptId, ans.question_id, ans.selected_option_id || null, isCorrect, marksAwarded]
      );
    }

    const totalQuestions = questions.length;
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    const percentage = totalMarks > 0 ? parseFloat(((score / totalMarks) * 100).toFixed(2)) : 0;

    let swbiDelta = 0;
    let newSwbiScore = parseFloat(student.swbi_score);

    if (quiz.quiz_type === 'wellness') {
      newSwbiScore = percentage;
      swbiDelta = newSwbiScore - parseFloat(student.swbi_score);

      const riskLevel = newSwbiScore >= 70 ? 'low' : newSwbiScore >= 50 ? 'medium' : 'high';
      await conn.query(
        'UPDATE students SET swbi_score = $1, risk_level = $2 WHERE id = $3',
        [newSwbiScore, riskLevel, student.id]
      );

      await conn.query(
        `INSERT INTO wellness_reports (student_id, report_date, swbi_score, academic_score, risk_level, ai_summary) 
         VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)`,
        [student.id, newSwbiScore, newSwbiScore, riskLevel, `Automatically calculated SWBI from Wellness Quiz: ${quiz.title}`]
      );
    } else {
      await conn.query(
        `UPDATE wellness_reports SET academic_score = $1 WHERE student_id = $2 AND report_date = (
           SELECT report_date FROM wellness_reports WHERE student_id = $2 ORDER BY report_date DESC LIMIT 1
         )`,
        [percentage, student.id]
      );
    }

    await conn.query(
      `UPDATE quiz_attempts 
       SET score = $1, total_marks = $2, percentage = $3, swbi_delta = $4, status = 'completed', completed_at = NOW(), time_taken_secs = $5 
       WHERE id = $6`,
      [score, totalMarks, percentage, swbiDelta, timeTakenSecs || 0, attemptId]
    );

    await conn.query('COMMIT');
    conn.release();

    res.json({
      success: true,
      message: 'Quiz submitted and graded successfully',
      data: {
        attemptId,
        score,
        totalMarks,
        percentage,
        correctCount,
        incorrectCount,
        swbiDelta
      }
    });
  } catch (err) {
    await conn.query('ROLLBACK');
    conn.release();
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getAttemptDetails(req, res) {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const { rows: aRows } = await pool.query(
      `SELECT qa.*, q.title, q.description, q.topic, q.quiz_type, q.difficulty, q.duration_mins,
              s.id as student_id, s.user_id as student_user_id, u.name as student_name, s.roll_number, s.department_id as student_dept_id
       FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.id
       JOIN students s ON qa.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE qa.id = $1`,
      [id]
    );
    const attempt = aRows[0];

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Quiz attempt not found' });
    }

    if (role === 'student') {
      if (attempt.student_user_id !== userId) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only view your own quiz attempts.' });
      }
    } else if (role === 'teacher') {
      const { rows: tRows } = await pool.query('SELECT id, department_id FROM teachers WHERE user_id = $1', [userId]);
      const teacher = tRows[0];
      if (!teacher) {
        return res.status(403).json({ success: false, message: 'Teacher profile not found' });
      }
      if (attempt.student_dept_id !== teacher.department_id) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only view attempts from students in your department.' });
      }
    }

    const { rows: questions } = await pool.query(
      'SELECT id, quiz_id, question_text, question_type, marks, explanation FROM questions WHERE quiz_id = $1 ORDER BY order_num ASC',
      [attempt.quiz_id]
    );

    for (let q of questions) {
      const { rows: options } = await pool.query(
        'SELECT id, option_text, option_label, is_correct FROM options WHERE question_id = $1 ORDER BY option_label ASC',
        [q.id]
      );
      q.options = options;

      const { rows: ansRows } = await pool.query(
        'SELECT selected_option, is_correct, marks_awarded FROM attempt_answers WHERE attempt_id = $1 AND question_id = $2',
        [id, q.id]
      );
      q.student_answer = ansRows[0] || null;
    }

    res.json({
      success: true,
      data: { attempt, questions }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getQuizPreview(req, res) {
  try {
    const quizId = req.params.id;
    const { rows: qRows } = await pool.query(
      'SELECT id, title, description, topic, quiz_type, difficulty, total_questions, duration_mins FROM quizzes WHERE id = $1',
      [quizId]
    );
    const quiz = qRows[0];

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const { rows: questions } = await pool.query(
      'SELECT id, question_text, question_type, explanation, order_num FROM questions WHERE quiz_id = $1 ORDER BY order_num ASC',
      [quizId]
    );

    for (let q of questions) {
      const { rows: options } = await pool.query(
        'SELECT id, option_text, option_label, is_correct FROM options WHERE question_id = $1 ORDER BY option_label ASC',
        [q.id]
      );
      q.options = options;
    }

    res.json({ success: true, data: { quiz, questions } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getQuizzes,
  getQuizById,
  startAttempt,
  submitAttempt,
  getAttemptDetails,
  getQuizPreview
};
