const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authenticate');
const {
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
} = require('../controllers/adminController');

// All routes here are restricted to Admin
router.use(authenticate, authorize('admin'));

// Dashboard and Analytics
router.get('/dashboard', getDashboard);
router.get('/analytics', getAnalytics);
router.get('/at-risk-students', getAtRiskStudents);

// Departments CRUD
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

// Teachers CRUD
router.get('/teachers', getTeachers);
router.post('/teachers', createTeacher);
router.put('/teachers/:id', updateTeacher);
router.delete('/teachers/:id', deleteTeacher);

// Students CRUD
router.get('/students', getStudents);
router.post('/students', createStudent);
router.put('/students/:id', updateStudent);

module.exports = router;