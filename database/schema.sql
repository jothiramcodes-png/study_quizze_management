-- ============================================================
-- MindTrack AI — Complete PostgreSQL Database Schema
-- Version: 1.0.0
-- ============================================================

-- NOTE: Execute this script in your target PostgreSQL database (e.g., mindtrack_db).
-- Assuming database is already created and you are connected to it.

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100)        NOT NULL,
  email        VARCHAR(150) UNIQUE NOT NULL,
  password     VARCHAR(255)        NOT NULL,
  role         VARCHAR(20)         CHECK (role IN ('admin','teacher','student')) NOT NULL,
  is_active    BOOLEAN             DEFAULT TRUE,
  profile_pic  VARCHAR(255)        DEFAULT NULL,
  last_login   TIMESTAMP           DEFAULT NULL,
  created_at   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: departments
-- ============================================================
CREATE TABLE departments (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100)        NOT NULL,
  code         VARCHAR(20) UNIQUE  NOT NULL,
  description  TEXT                DEFAULT NULL,
  hod_user_id  INT                 DEFAULT NULL,
  created_at   TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hod_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE: teachers
-- ============================================================
CREATE TABLE teachers (
  id              SERIAL PRIMARY KEY,
  user_id         INT UNIQUE NOT NULL,
  department_id   INT        NOT NULL,
  employee_id     VARCHAR(50) UNIQUE NOT NULL,
  specialization  VARCHAR(100)       DEFAULT NULL,
  joined_date     DATE               DEFAULT NULL,
  FOREIGN KEY (user_id)       REFERENCES users(id)       ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
);

-- ============================================================
-- TABLE: students
-- ============================================================
CREATE TABLE students (
  id              SERIAL PRIMARY KEY,
  user_id         INT UNIQUE NOT NULL,
  department_id   INT        NOT NULL,
  teacher_id      INT        DEFAULT NULL,
  roll_number     VARCHAR(50) UNIQUE NOT NULL,
  semester        SMALLINT    NOT NULL DEFAULT 1,
  academic_year   VARCHAR(10)        DEFAULT NULL,
  swbi_score      DECIMAL(5,2)       DEFAULT 0.00,
  risk_level      VARCHAR(10)        CHECK (risk_level IN ('low','medium','high')) DEFAULT 'low',
  FOREIGN KEY (user_id)       REFERENCES users(id)       ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  FOREIGN KEY (teacher_id)    REFERENCES teachers(id)    ON DELETE SET NULL
);

-- ============================================================
-- TABLE: quizzes
-- ============================================================
CREATE TABLE quizzes (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(200)       NOT NULL,
  description     TEXT               DEFAULT NULL,
  topic           VARCHAR(100)       NOT NULL,
  quiz_type       VARCHAR(20)        CHECK (quiz_type IN ('academic','wellness')) NOT NULL DEFAULT 'academic',
  difficulty      VARCHAR(20)        CHECK (difficulty IN ('easy','medium','hard','expert','adaptive')) DEFAULT 'medium',
  total_questions INT                NOT NULL DEFAULT 10,
  total_marks     INT                NOT NULL DEFAULT 10,
  duration_mins   INT                DEFAULT 30,
  department_id   INT                DEFAULT NULL,
  created_by      INT                NOT NULL,
  ai_generated    BOOLEAN            DEFAULT TRUE,
  is_active       BOOLEAN            DEFAULT TRUE,
  available_from  TIMESTAMP          DEFAULT NULL,
  available_until TIMESTAMP          DEFAULT NULL,
  created_at      TIMESTAMP          DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by)    REFERENCES users(id)       ON DELETE RESTRICT
);

-- ============================================================
-- TABLE: questions
-- ============================================================
CREATE TABLE questions (
  id            SERIAL PRIMARY KEY,
  quiz_id       INT          NOT NULL,
  question_text TEXT         NOT NULL,
  question_type VARCHAR(20)  CHECK (question_type IN ('mcq','true_false')) DEFAULT 'mcq',
  marks         INT          DEFAULT 1,
  explanation   TEXT         DEFAULT NULL,
  order_num     INT          DEFAULT 0,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: options
-- ============================================================
CREATE TABLE options (
  id           SERIAL PRIMARY KEY,
  question_id  INT          NOT NULL,
  option_text  TEXT         NOT NULL,
  is_correct   BOOLEAN      DEFAULT FALSE,
  option_label CHAR(1)      DEFAULT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: quiz_attempts
-- ============================================================
CREATE TABLE quiz_attempts (
  id              SERIAL PRIMARY KEY,
  student_id      INT          NOT NULL,
  quiz_id         INT          NOT NULL,
  score           DECIMAL(5,2) DEFAULT 0.00,
  total_marks     INT          NOT NULL DEFAULT 0,
  percentage      DECIMAL(5,2) DEFAULT 0.00,
  swbi_delta      DECIMAL(5,2) DEFAULT 0.00,
  status          VARCHAR(20)  CHECK (status IN ('in_progress','completed','abandoned')) DEFAULT 'in_progress',
  started_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  completed_at    TIMESTAMP    DEFAULT NULL,
  time_taken_secs INT          DEFAULT NULL,
  UNIQUE (student_id, quiz_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_id)    REFERENCES quizzes(id)  ON DELETE CASCADE
);

-- ============================================================
-- TABLE: attempt_answers
-- ============================================================
CREATE TABLE attempt_answers (
  id              SERIAL PRIMARY KEY,
  attempt_id      INT    NOT NULL,
  question_id     INT    NOT NULL,
  selected_option INT    DEFAULT NULL,
  is_correct      BOOLEAN DEFAULT FALSE,
  marks_awarded   INT    DEFAULT 0,
  answered_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id)      REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id)     REFERENCES questions(id)     ON DELETE CASCADE,
  FOREIGN KEY (selected_option) REFERENCES options(id)       ON DELETE SET NULL
);

-- ============================================================
-- TABLE: feedback
-- ============================================================
CREATE TABLE feedback (
  id              SERIAL PRIMARY KEY,
  teacher_id      INT    NOT NULL,
  student_id      INT    NOT NULL,
  attempt_id      INT    DEFAULT NULL,
  category        VARCHAR(20) CHECK (category IN ('academic','emotional','social','general')) NOT NULL DEFAULT 'general',
  feedback_text   TEXT   NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  student_ack     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id)      ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id)      ON DELETE CASCADE,
  FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE: wellness_reports
-- ============================================================
CREATE TABLE wellness_reports (
  id              SERIAL PRIMARY KEY,
  student_id      INT          NOT NULL,
  report_date     DATE         NOT NULL,
  swbi_score      DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  academic_score  DECIMAL(5,2) DEFAULT NULL,
  risk_level      VARCHAR(10)  CHECK (risk_level IN ('low','medium','high')) DEFAULT 'low',
  ai_summary      TEXT         DEFAULT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: distress_signals
-- ============================================================
CREATE TABLE distress_signals (
  id              SERIAL PRIMARY KEY,
  student_id      INT          NOT NULL,
  department_id   INT          NOT NULL,
  status          VARCHAR(20)  CHECK (status IN ('pending','investigating','resolved')) DEFAULT 'pending',
  notes           TEXT         DEFAULT NULL,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE notifications (
  id              SERIAL PRIMARY KEY,
  user_id         INT          NOT NULL,
  title           VARCHAR(200) NOT NULL,
  message         TEXT         NOT NULL,
  type            VARCHAR(20)  CHECK (type IN ('info','warning','alert','feedback','quiz')) DEFAULT 'info',
  is_read         BOOLEAN      DEFAULT FALSE,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: audit_logs
-- ============================================================
CREATE TABLE audit_logs (
  id              SERIAL PRIMARY KEY,
  user_id         INT          DEFAULT NULL,
  action          VARCHAR(100) NOT NULL,
  entity_type     VARCHAR(50)  DEFAULT NULL,
  entity_id       INT          DEFAULT NULL,
  details         JSONB        DEFAULT NULL,
  ip_address      VARCHAR(45)  DEFAULT NULL,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_students_dept     ON students(department_id);
CREATE INDEX idx_students_teacher  ON students(teacher_id);
CREATE INDEX idx_students_risk     ON students(risk_level);
CREATE INDEX idx_quizzes_dept      ON quizzes(department_id);
CREATE INDEX idx_attempts_student  ON quiz_attempts(student_id);
CREATE INDEX idx_attempts_quiz     ON quiz_attempts(quiz_id);
CREATE INDEX idx_feedback_student  ON feedback(student_id);
CREATE INDEX idx_feedback_teacher  ON feedback(teacher_id);
CREATE INDEX idx_wellness_student  ON wellness_reports(student_id, report_date);
CREATE INDEX idx_notifs_user       ON notifications(user_id, is_read);

-- ============================================================
-- SEED: Default Admin User
-- Password: Admin@123 (bcrypt hashed)
-- ============================================================
INSERT INTO users (name, email, password, role) VALUES
('System Admin', 'admin@mindtrack.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhPMqJ1Cl5M2YZ7/kXsRRi', 'admin');
