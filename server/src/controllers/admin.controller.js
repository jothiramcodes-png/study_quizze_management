const prisma = require('../prisma');

const getUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;
    
    const where = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true, provider: true, createdAt: true }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Admin getUsers error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['STUDENT', 'TEACHER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.userId,
        action: `CHANGED_ROLE_FOR_${updatedUser.email}_TO_${role}`,
      }
    });

    res.json({ success: true, message: 'Role updated successfully', data: updatedUser });
  } catch (error) {
    console.error('Admin updateUserRole error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, email: true, status: true }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.userId,
        action: `CHANGED_STATUS_FOR_${updatedUser.email}_TO_${status}`,
      }
    });

    res.json({ success: true, message: 'Status updated successfully', data: updatedUser });
  } catch (error) {
    console.error('Admin updateUserStatus error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getUsers,
  updateUserRole,
  updateUserStatus
};
