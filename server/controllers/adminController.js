const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// ===== DASHBOARD =====
async function getDashboard(req, res) {
  try {
    const { rows: [{ total_departments }] } = await pool.query('SELECT COUNT(*) as total_departments FROM departments');
    const { rows: [{ total_teachers }] } = await pool.query('SELECT COUNT(*) as total_teachers FROM teachers');
    const { rows: [{ total_students }] } = await pool.query('SELECT COUNT(*) as total_students FROM students');
    const { rows: [{ total_quizzes }] } = await pool.query('SELECT COUNT(*) as total_quizzes FROM quizzes');
    const { rows: [{ completed_attempts }] } = await pool.query("SELECT COUNT(*) as completed_attempts FROM quiz_attempts WHERE status = 'completed'");
    const { rows: [{ total_attempts }] } = await pool.query('SELECT COUNT(*) as total_attempts FROM quiz_attempts');
    const { rows: [{ avg_score }] } = await pool.query("SELECT AVG(percentage) as avg_score FROM quiz_attempts WHERE status = 'completed'");
    const { rows: at_risk } = await pool.query(
      "SELECT COUNT(*) as cnt, risk_level FROM students GROUP BY risk_level"
    );
    const completion_rate = total_attempts > 0 ? ((completed_attempts / total_attempts) * 100).toFixed(1) : 0;
    res.json({
      success: true,
      data: {
        total_departments: parseInt(total_departments),
        total_teachers: parseInt(total_teachers),
        total_students: parseInt(total_students),
        total_quizzes: parseInt(total_quizzes),
        completion_rate,
        avg_score: avg_score ? parseFloat(avg_score).toFixed(1) : 0,
        at_risk_distribution: at_risk
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ===== DEPARTMENTS =====
async function getDepartments(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT d.*, u.name as hod_name,
        (SELECT COUNT(*) FROM teachers t WHERE t.department_id = d.id) as teacher_count,
        (SELECT COUNT(*) FROM students s WHERE s.department_id = d.id) as student_count
      FROM departments d
      LEFT JOIN users u ON d.hod_user_id = u.id
      ORDER BY d.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createDepartment(req, res) {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, message: 'Name and code required' });
    const { rows } = await pool.query(
      'INSERT INTO departments (name, code, description) VALUES ($1, $2, $3) RETURNING id',
      [name, code.toUpperCase(), description || null]
    );
    res.status(201).json({ success: true, message: 'Department created', data: { id: rows[0].id } });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ success: false, message: 'Department code already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateDepartment(req, res) {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;
    await pool.query('UPDATE departments SET name = $1, code = $2, description = $3 WHERE id = $4',
      [name, code?.toUpperCase(), description, id]);
    res.json({ success: true, message: 'Department updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function deleteDepartment(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM departments WHERE id = $1', [id]);
    res.json({ success: true, message: 'Department deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ===== TEACHERS =====
async function getTeachers(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.name, u.email, u.is_active, u.created_at,
             t.id as teacher_id, t.employee_id, t.specialization, t.joined_date,
             d.name as department_name, d.code as department_code,
             (SELECT COUNT(*) FROM students s WHERE s.teacher_id = t.id) as student_count
      FROM users u
      JOIN teachers t ON u.id = t.user_id
      JOIN departments d ON t.department_id = d.id
      ORDER BY u.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createTeacher(req, res) {
  const conn = await pool.connect();
  try {
    await conn.query('BEGIN');
    const { name, email, password, department_id, employee_id, specialization, joined_date } = req.body;
    if (!name || !email || !password || !department_id || !employee_id) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }
    const { rows: existing } = await conn.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length) {
      await conn.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    const hashed = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const { rows: userResult } = await conn.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, hashed, 'teacher']
    );
    await conn.query(
      'INSERT INTO teachers (user_id, department_id, employee_id, specialization, joined_date) VALUES ($1, $2, $3, $4, $5)',
      [userResult[0].id, department_id, employee_id, specialization || null, joined_date || null]
    );
    await conn.query('COMMIT');
    res.status(201).json({ success: true, message: 'Teacher created successfully' });
  } catch (err) {
    await conn.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

async function updateTeacher(req, res) {
  try {
    const { id } = req.params;
    const { name, department_id, specialization } = req.body;
    await pool.query('UPDATE users SET name = $1 WHERE id = (SELECT user_id FROM teachers WHERE id = $2)', [name, id]);
    await pool.query('UPDATE teachers SET department_id = $1, specialization = $2 WHERE id = $3',
      [department_id, specialization, id]);
    res.json({ success: true, message: 'Teacher updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function deleteTeacher(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT user_id FROM teachers WHERE id = $1', [id]);
    const teacher = rows[0];
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
    await pool.query('DELETE FROM users WHERE id = $1', [teacher.user_id]);
    res.json({ success: true, message: 'Teacher deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ===== STUDENTS =====
async function getStudents(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.name, u.email, u.is_active, u.created_at,
             s.id as student_id, s.roll_number, s.semester, s.academic_year,
             s.swbi_score, s.risk_level,
             d.name as department_name, d.code as department_code,
             CONCAT(tu.name) as teacher_name
      FROM users u
      JOIN students s ON u.id = s.user_id
      JOIN departments d ON s.department_id = d.id
      LEFT JOIN teachers t ON s.teacher_id = t.id
      LEFT JOIN users tu ON t.user_id = tu.id
      ORDER BY s.risk_level DESC, u.name ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createStudent(req, res) {
  const conn = await pool.connect();
  try {
    await conn.query('BEGIN');
    const { name, email, password, department_id, teacher_id, roll_number, semester, academic_year } = req.body;
    if (!name || !email || !password || !department_id || !roll_number) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }
    const { rows: existing } = await conn.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length) {
      await conn.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    const hashed = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const { rows: userResult } = await conn.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, hashed, 'student']
    );
    await conn.query(
      'INSERT INTO students (user_id, department_id, teacher_id, roll_number, semester, academic_year) VALUES ($1, $2, $3, $4, $5, $6)',
      [userResult[0].id, department_id, teacher_id || null, roll_number, semester || 1, academic_year || null]
    );
    await conn.query('COMMIT');
    res.status(201).json({ success: true, message: 'Student created successfully' });
  } catch (err) {
    await conn.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

async function updateStudent(req, res) {
  try {
    const { id } = req.params;
    const { name, department_id, teacher_id, semester } = req.body;
    await pool.query('UPDATE users SET name = $1 WHERE id = (SELECT user_id FROM students WHERE id = $2)', [name, id]);
    await pool.query('UPDATE students SET department_id = $1, teacher_id = $2, semester = $3 WHERE id = $4',
      [department_id, teacher_id || null, semester, id]);
    res.json({ success: true, message: 'Student updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getAtRiskStudents(req, res) {
  try {
    const { rows: atRiskStudents } = await pool.query(
      `SELECT s.id, s.roll_number, s.semester, s.swbi_score, s.risk_level, u.name, u.email, d.name as department_name, tu.name as teacher_name 
       FROM students s 
       JOIN users u ON s.user_id = u.id 
       JOIN departments d ON s.department_id = d.id 
       LEFT JOIN teachers t ON s.teacher_id = t.id 
       LEFT JOIN users tu ON t.user_id = tu.id 
       WHERE s.risk_level IN ('high', 'medium') 
       ORDER BY s.risk_level ASC, s.swbi_score ASC`
    );

    const { rows: distressSignals } = await pool.query(
      `SELECT ds.id, ds.status, ds.notes, ds.created_at, 
              s.roll_number, u.name as student_name, d.name as department_name
       FROM distress_signals ds
       JOIN students s ON ds.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN departments d ON ds.department_id = d.id
       WHERE ds.status IN ('pending', 'investigating')
       ORDER BY ds.created_at DESC`
    );

    res.json({ success: true, data: { atRiskStudents, distressSignals } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getAnalytics(req, res) {
  try {
    const { rows: deptPerformance } = await pool.query(`
      SELECT d.id, d.name as department, d.code,
        AVG(qa.percentage) as avg_score,
        COUNT(DISTINCT s.id) as student_count,
        COUNT(DISTINCT CASE WHEN s.risk_level = 'high' THEN s.id END) as high_risk_count
      FROM departments d
      LEFT JOIN students s ON s.department_id = d.id
      LEFT JOIN quiz_attempts qa ON qa.student_id = s.id AND qa.status = 'completed'
      GROUP BY d.id, d.name, d.code
      ORDER BY avg_score DESC
    `);
    
    const { rows: weeklyTrend } = await pool.query(`
      SELECT TO_CHAR(qa.completed_at, 'YYYY-WW') as week,
             AVG(qa.percentage) as avg_score,
             COUNT(*) as attempt_count
      FROM quiz_attempts qa
      WHERE qa.status = 'completed' AND qa.completed_at >= NOW() - INTERVAL '8 weeks'
      GROUP BY week
      ORDER BY week ASC
    `);

    res.json({
      success: true,
      data: {
        deptPerformance,
        weeklyTrend
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getDashboard,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getStudents,
  createStudent,
  updateStudent,
  getAtRiskStudents,
  getAnalytics
};
