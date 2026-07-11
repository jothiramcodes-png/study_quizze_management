const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function seed() {
  console.log('🌱 Starting database seeding...');
  const conn = await pool.connect();

  try {
    await conn.query('BEGIN');

    // 1. Clear existing data (in reverse order of dependencies)
    console.log('🧹 Cleaning old data...');
    await conn.query('TRUNCATE TABLE audit_logs CASCADE');
    await conn.query('TRUNCATE TABLE notifications CASCADE');
    await conn.query('TRUNCATE TABLE wellness_reports CASCADE');
    await conn.query('TRUNCATE TABLE feedback CASCADE');
    await conn.query('TRUNCATE TABLE attempt_answers CASCADE');
    await conn.query('TRUNCATE TABLE quiz_attempts CASCADE');
    await conn.query('TRUNCATE TABLE options CASCADE');
    await conn.query('TRUNCATE TABLE questions CASCADE');
    await conn.query('TRUNCATE TABLE quizzes CASCADE');
    await conn.query('TRUNCATE TABLE distress_signals CASCADE');
    await conn.query('TRUNCATE TABLE students CASCADE');
    await conn.query('TRUNCATE TABLE teachers CASCADE');
    await conn.query('TRUNCATE TABLE departments CASCADE');
    await conn.query('DELETE FROM users WHERE email != $1', ['admin@mindtrack.edu']);

    const rounds = 12;
    const passwordHash = await bcrypt.hash('Password@123', rounds);

    // 2. Create Departments
    console.log('🏢 Seeding departments...');
    const depts = [
      ['Computer Science & Engineering', 'CSE', 'Core software and hardware engineering principles.'],
      ['Information Technology', 'IT', 'Software systems, networking, and data processing.'],
      ['Electronics & Communication', 'ECE', 'Analog and digital electronics, VLSI and communication.'],
      ['Mechanical Engineering', 'MECH', 'Thermal systems, design, and manufacturing systems.']
    ];
    
    const deptIds = {};
    for (const [name, code, desc] of depts) {
      const res = await conn.query(
        'INSERT INTO departments (name, code, description) VALUES ($1, $2, $3) RETURNING id',
        [name, code, desc]
      );
      deptIds[code] = res.rows[0].id;
    }

    // 3. Create Teachers
    console.log('👨‍🏫 Seeding teachers...');
    const teachersList = [
      { name: 'Prof. Rajesh Sharma', email: 'sharma@mindtrack.edu', dept: 'CSE', empId: 'T-CSE-01', spec: 'Artificial Intelligence' },
      { name: 'Dr. Amit Patel', email: 'patel@mindtrack.edu', dept: 'IT', empId: 'T-IT-01', spec: 'Cybersecurity' },
      { name: 'Prof. Sunita Rao', email: 'rao@mindtrack.edu', dept: 'ECE', empId: 'T-ECE-01', spec: 'Signal Processing' }
    ];

    const teacherIds = [];
    for (const t of teachersList) {
      const userRes = await conn.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [t.name, t.email, passwordHash, 'teacher']
      );
      const userId = userRes.rows[0].id;

      const teacherRes = await conn.query(
        'INSERT INTO teachers (user_id, department_id, employee_id, specialization, joined_date) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
        [userId, deptIds[t.dept], t.empId, t.spec]
      );
      teacherIds.push({ name: t.name, id: teacherRes.rows[0].id, deptId: deptIds[t.dept] });
    }

    // 4. Create Students and Wellness Reports
    console.log('🎓 Seeding students & wellness history...');
    const studentsList = [
      { name: 'John Doe', email: 'john@mindtrack.edu', dept: 'CSE', roll: 'S-CSE-01', sem: 5, year: '2024-25', swbi: 78, risk: 'low', teacherIdx: 0, history: [70, 72, 75, 78] },
      { name: 'Michael Chang', email: 'michael@mindtrack.edu', dept: 'CSE', roll: 'S-CSE-02', sem: 5, year: '2024-25', swbi: 45, risk: 'high', teacherIdx: 0, history: [65, 58, 50, 45] },
      { name: 'Sarah Jenkins', email: 'sarah@mindtrack.edu', dept: 'IT', roll: 'S-IT-01', sem: 3, year: '2024-25', swbi: 52, risk: 'medium', teacherIdx: 1, history: [60, 58, 55, 52] },
      { name: 'David Miller', email: 'david@mindtrack.edu', dept: 'ECE', roll: 'S-ECE-01', sem: 7, year: '2024-25', swbi: 58, risk: 'medium', teacherIdx: 2, history: [52, 54, 56, 58] }
    ];

    for (const s of studentsList) {
      const userRes = await conn.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [s.name, s.email, passwordHash, 'student']
      );
      const userId = userRes.rows[0].id;

      const teacher = teacherIds[s.teacherIdx];
      const studRes = await conn.query(
        'INSERT INTO students (user_id, department_id, teacher_id, roll_number, semester, academic_year, swbi_score, risk_level) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
        [userId, deptIds[s.dept], teacher.id, s.roll, s.sem, s.year, s.swbi, s.risk]
      );
      const studentId = studRes.rows[0].id;

      // Seed 4 weeks of wellness reports
      const dates = ['2026-05-18', '2026-05-25', '2026-06-01', '2026-06-08'];
      for (let w = 0; w < 4; w++) {
        const swbiVal = s.history[w];
        const riskLevel = swbiVal > 70 ? 'low' : swbiVal > 50 ? 'medium' : 'high';
        await conn.query(
          `INSERT INTO wellness_reports (student_id, report_date, swbi_score, academic_score, risk_level, ai_summary)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [studentId, dates[w], swbiVal, swbiVal + (w * 2), riskLevel, `AI summary for week ${w + 1}`]
        );
      }
    }

    // 5. Create Quizzes (1 Wellness, 1 Academic)
    console.log('📝 Seeding quizzes...');
    const adminUser = await conn.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin']);
    const adminId = adminUser.rows[0].id;

    // Wellness Quiz
    const quizWellness = await conn.query(
      `INSERT INTO quizzes (title, description, topic, quiz_type, difficulty, total_questions, total_marks, duration_mins, created_by, ai_generated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      ['Weekly Wellness & Stress Assessment', 'Track your emotional state and stress levels over the past week.', 'Stress Management', 'wellness', 'easy', 3, 3, 10, adminId, false]
    );
    const qWellnessId = quizWellness.rows[0].id;

    const wellnessQs = [
      { text: 'How often have you felt overwhelmed by academic pressure this week?', opt: [['Not at all', true], ['A few times', false], ['Frequently', false], ['Almost constantly', false]], exp: 'Tracks general cognitive overload' },
      { text: 'Have you been able to maintain a regular sleep schedule (7-8 hours)?', opt: [['Yes, consistently', true], ['Most days', false], ['Rarely', false], ['No, extreme sleep disruption', false]], exp: 'Tracks sleep hygiene' },
      { text: 'Do you feel you have a support system (friends, family, mentors) to talk to?', opt: [['Yes, definitely', true], ['Somewhat', false], ['Not really', false], ['Completely isolated', false]], exp: 'Tracks social isolation' }
    ];

    for (let i = 0; i < wellnessQs.length; i++) {
      const q = wellnessQs[i];
      const qRes = await conn.query(
        'INSERT INTO questions (quiz_id, question_text, question_type, marks, explanation, order_num) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [qWellnessId, q.text, 'mcq', 1, q.exp, i + 1]
      );
      const qId = qRes.rows[0].id;

      const labels = ['A', 'B', 'C', 'D'];
      for (let j = 0; j < q.opt.length; j++) {
        const [optText, isCorrect] = q.opt[j];
        await conn.query(
          'INSERT INTO options (question_id, option_text, is_correct, option_label) VALUES ($1, $2, $3, $4)',
          [qId, optText, isCorrect, labels[j]]
        );
      }
    }

    // Academic Quiz
    const quizAcademic = await conn.query(
      `INSERT INTO quizzes (title, description, topic, quiz_type, difficulty, total_questions, total_marks, duration_mins, created_by, ai_generated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      ['Data Structures: Linked Lists', 'Academic evaluation for CSE students covering linear data structures.', 'Data Structures', 'academic', 'medium', 3, 3, 15, adminId, false]
    );
    const qAcademicId = quizAcademic.rows[0].id;

    const academicQs = [
      { text: 'What is the time complexity to insert an element at the beginning of a singly linked list?', opt: [['O(1)', true], ['O(n)', false], ['O(log n)', false], ['O(n log n)', false]], exp: 'Inserting at head only requires pointer update.' },
      { text: 'Which linked list allows traversal in both forward and backward directions?', opt: [['Singly Linked List', false], ['Doubly Linked List', true], ['Circular Linked List', false], ['Header Linked List', false]], exp: 'Doubly linked lists have prev and next pointers.' },
      { text: 'What occurs when a new node is inserted into a full memory heap?', opt: [['Underflow', false], ['Overflow', true], ['Garbage Collection', false], ['Dereferencing', false]], exp: 'Memory exhaustion triggers heap overflow.' }
    ];

    for (let i = 0; i < academicQs.length; i++) {
      const q = academicQs[i];
      const qRes = await conn.query(
        'INSERT INTO questions (quiz_id, question_text, question_type, marks, explanation, order_num) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [qAcademicId, q.text, 'mcq', 1, q.exp, i + 1]
      );
      const qId = qRes.rows[0].id;

      const labels = ['A', 'B', 'C', 'D'];
      for (let j = 0; j < q.opt.length; j++) {
        const [optText, isCorrect] = q.opt[j];
        await conn.query(
          'INSERT INTO options (question_id, option_text, is_correct, option_label) VALUES ($1, $2, $3, $4)',
          [qId, optText, isCorrect, labels[j]]
        );
      }
    }

    await conn.query('COMMIT');
    console.log('✅ Seeding completed successfully!');
  } catch (err) {
    await conn.query('ROLLBACK');
    console.error('❌ Seeding failed:', err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed();
