const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../prisma');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Ensure user still exists and is active
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, message: 'Invalid or inactive user' });
    }

    req.user = decoded; // { userId, schoolId, email, role }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access forbidden' });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
