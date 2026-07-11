const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!rows.length) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const user = rows[0];
    if (!user.is_active) return res.status(403).json({ success: false, message: 'Account is deactivated' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Get role-specific profile data
    let profileData = {};
    if (user.role === 'teacher') {
      const { rows: teacherRows } = await pool.query(
        `SELECT t.id as teacher_id, t.employee_id, t.department_id, t.specialization,
                d.name as department_name, d.code as department_code
         FROM teachers t 
         JOIN departments d ON t.department_id = d.id 
         WHERE t.user_id = $1`,
        [user.id]
      );
      if (teacherRows.length) profileData = teacherRows[0];
    } else if (user.role === 'student') {
      const { rows: studentRows } = await pool.query(
        `SELECT s.id as student_id, s.roll_number, s.semester, s.swbi_score, s.risk_level,
                s.department_id, d.name as department_name, d.code as department_code
         FROM students s 
         JOIN departments d ON s.department_id = d.id 
         WHERE s.user_id = $1`,
        [user.id]
      );
      if (studentRows.length) profileData = studentRows[0];
    }

    const tokenPayload = { id: user.id, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    res.json({
      success: true,
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...profileData,
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }
    const decoded = verifyRefreshToken(refreshToken);
    const { rows } = await pool.query('SELECT id, role, is_active FROM users WHERE id = $1', [decoded.id]);
    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }
    const user = rows[0];
    const newAccessToken = generateAccessToken({ id: user.id, role: user.role });
    res.json({ success: true, data: { accessToken: newAccessToken } });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
}

async function getMe(req, res) {
  try {
    const userId = req.user.id;
    const { rows } = await pool.query(
      'SELECT id, name, email, role, last_login, created_at FROM users WHERE id = $1',
      [userId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    const user = rows[0];

    let profileData = {};
    if (user.role === 'teacher') {
      const { rows: teacherRows } = await pool.query(
        `SELECT t.id as teacher_id, t.employee_id, t.department_id, t.specialization,
                d.name as department_name, d.code as department_code
         FROM teachers t 
         JOIN departments d ON t.department_id = d.id 
         WHERE t.user_id = $1`,
        [userId]
      );
      if (teacherRows.length) profileData = teacherRows[0];
    } else if (user.role === 'student') {
      const { rows: studentRows } = await pool.query(
        `SELECT s.id as student_id, s.roll_number, s.semester, s.swbi_score, s.risk_level,
                s.department_id, d.name as department_name, d.code as department_code
         FROM students s 
         JOIN departments d ON s.department_id = d.id 
         WHERE s.user_id = $1`,
        [userId]
      );
      if (studentRows.length) profileData = studentRows[0];
    }

    res.json({ success: true, data: { ...user, ...profileData } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function changePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
    }
    const { rows } = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, userId]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { login, refreshToken, getMe, changePassword };