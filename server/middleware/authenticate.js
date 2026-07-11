const { verifyAccessToken } = require('../utils/jwt');
const { pool } = require('../config/database');
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ success: false });
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const { rows } = await pool.query('SELECT id, name, email, role, is_active FROM users WHERE id = $1', [decoded.id]);
    if (!rows.length || !rows[0].is_active) return res.status(401).json({ success: false });
    req.user = rows[0];
    next();
  } catch (err) { return res.status(401).json({ success: false }); }
}
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ success: false });
    next();
  };
}
module.exports = { authenticate, authorize };