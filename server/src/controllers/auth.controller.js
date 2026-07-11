const bcrypt = require('bcryptjs');
const prisma = require('../prisma');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { verifyGoogleToken } = require('../services/googleAuth.service');

const logActivity = async (userId, action, req) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        ipAddress: req.ip || req.connection.remoteAddress || '',
        device: req.headers['user-agent'] || '',
      }
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, schoolCode } = req.body;

    // schoolCode is optional — only firstName, lastName, email, password are required
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: 'First name, last name, email, and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    // Find school by code if provided, otherwise use the first/default school
    let school;
    if (schoolCode && schoolCode.trim() !== '') {
      school = await prisma.school.findUnique({ where: { code: schoolCode.trim() } });
      if (!school) {
        return res.status(404).json({ success: false, message: `School with code "${schoolCode}" not found` });
      }
    } else {
      // Auto-assign to default school
      school = await prisma.school.findFirst({ orderBy: { createdAt: 'asc' } });
      if (!school) {
        return res.status(500).json({ success: false, message: 'No school configured. Please contact admin.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userRole = role === 'TEACHER' ? 'TEACHER' : 'STUDENT';

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        provider: 'LOCAL',
        role: userRole,
        schoolId: school.id,
      }
    });

    if (userRole === 'STUDENT') {
      await prisma.student.create({
        data: {
          userId: user.id,
          rollNumber: `STU-${Date.now()}` // Generate a placeholder
        }
      });
    } else if (userRole === 'TEACHER') {
      await prisma.teacher.create({
        data: {
          userId: user.id,
          employeeId: `TCH-${Date.now()}`
        }
      });
    }

    await logActivity(user.id, 'REGISTER_LOCAL', req);

    res.status(201).json({ success: true, message: 'Registration successful' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: `Account is ${user.status.toLowerCase()}` });
    }

    if (user.provider === 'GOOGLE' && !user.password) {
      return res.status(400).json({ success: false, message: 'Please login with Google' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const payload = { userId: user.id, schoolId: user.schoolId, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await logActivity(user.id, 'LOGIN_LOCAL', req);

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, avatar: user.avatar },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Google ID token required' });
    }

    const googlePayload = await verifyGoogleToken(token);
    
    let user = await prisma.user.findUnique({ where: { email: googlePayload.email } });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found. Please contact your administrator.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: `Account is ${user.status.toLowerCase()}` });
    }

    // Link google account if not linked
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googlePayload.googleId,
          avatar: user.avatar || googlePayload.avatar,
          isEmailVerified: googlePayload.isEmailVerified,
        }
      });
    }

    const payload = { userId: user.id, schoolId: user.schoolId, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await logActivity(user.id, 'LOGIN_GOOGLE', req);

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, avatar: user.avatar },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, avatar: true, schoolId: true }
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const logout = async (req, res) => {
  try {
    if (req.user) {
      await logActivity(req.user.userId, 'LOGOUT', req);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  getMe,
  logout
};
