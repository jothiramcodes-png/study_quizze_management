const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Create School
  const school = await prisma.school.upsert({
    where: { code: 'MINDTRACK01' },
    update: {},
    create: {
      name: 'MindTrack International School',
      code: 'MINDTRACK01',
      address: '123 Education Lane, Tech City'
    }
  });

  const hashedAdminPassword = await bcrypt.hash('Admin@123', 12);
  const hashedTeacherPassword = await bcrypt.hash('Password@123', 12);
  const hashedStudentPassword = await bcrypt.hash('Password@123', 12);

  // 2. Create Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@mindtrack.edu' },
    update: {},
    create: {
      email: 'admin@mindtrack.edu',
      password: hashedAdminPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN',
      schoolId: school.id,
      admin: {
        create: {}
      }
    }
  });

  // 3. Create Teacher
  const teacherUser = await prisma.user.upsert({
    where: { email: 'sharma@mindtrack.edu' },
    update: {},
    create: {
      email: 'sharma@mindtrack.edu',
      password: hashedTeacherPassword,
      firstName: 'Anita',
      lastName: 'Sharma',
      role: 'TEACHER',
      schoolId: school.id,
      teacher: {
        create: {
          employeeId: 'TCH-001',
          specialization: 'Computer Science'
        }
      }
    },
    include: {
      teacher: true
    }
  });

  // 4. Create Student
  const studentUser = await prisma.user.upsert({
    where: { email: 'john@mindtrack.edu' },
    update: {},
    create: {
      email: 'john@mindtrack.edu',
      password: hashedStudentPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'STUDENT',
      schoolId: school.id,
      student: {
        create: {
          rollNumber: 'CS2024-001',
          semester: 4,
          academicYear: '2023-2024',
          teacherId: teacherUser.teacher.id
        }
      }
    }
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
