import os

files = {
    "server/package.json": """{
  "name": "mindtrack-ai-server",
  "version": "1.0.0",
  "description": "MindTrack AI Backend API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.3.1",
    "helmet": "^7.1.0",
    "joi": "^17.13.1",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "mysql2": "^3.10.1",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}""",

    "server/.env.example": """NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=mindtrack_db
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this_in_production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key_here
CORS_ORIGIN=http://localhost:5173
BCRYPT_ROUNDS=12""",

    "server/server.js": """const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 5000;

testConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`\\n🚀 MindTrack AI Server running on port ${PORT}`);
    console.log(`📌 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 API Base: http://localhost:${PORT}/api`);
  });
}).catch((err) => {
  console.error('❌ Failed to connect to database:', err.message);
  process.exit(1);
});""",

    "server/app.js": """require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
const quizRoutes = require('./routes/quizRoutes');
const aiRoutes = require('./routes/aiRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api', limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ success: true }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/ai', aiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;""",

    "server/config/database.js": """const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mindtrack_db',
  waitForConnections: true,
  connectionLimit: 10
});
async function testConnection() {
  const conn = await pool.getConnection();
  console.log('✅ MySQL connected');
  conn.release();
}
module.exports = { pool, testConnection };""",

    "server/config/gemini.js": """const { GoogleGenerativeAI } = require('@google/generative-ai');
let genAI = null;
function getGeminiClient() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}
module.exports = { getGeminiClient };""",

    "server/utils/jwt.js": """const jwt = require('jsonwebtoken');
function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
}
function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
}
function verifyAccessToken(token) { return jwt.verify(token, process.env.JWT_SECRET); }
function verifyRefreshToken(token) { return jwt.verify(token, process.env.JWT_REFRESH_SECRET); }
module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken };""",

    "server/middleware/authenticate.js": """const { verifyAccessToken } = require('../utils/jwt');
const { pool } = require('../config/database');
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ success: false });
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const [rows] = await pool.execute('SELECT id, name, email, role, is_active FROM users WHERE id = ?', [decoded.id]);
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
module.exports = { authenticate, authorize };""",

    "server/middleware/errorHandler.js": """function notFound(req, res, next) { next(new Error(`Route not found`)); }
function errorHandler(err, req, res, next) {
  res.status(500).json({ success: false, message: err.message });
}
module.exports = { notFound, errorHandler };""",

    "server/controllers/authController.js": """const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
async function login(req, res) {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const tokenPayload = { id: user.id, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    res.json({ success: true, data: { userId: user.id, name: user.name, role: user.role, accessToken, refreshToken } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
}
module.exports = { login };""",

    "server/routes/authRoutes.js": """const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
router.post('/login', login);
module.exports = router;""",

    "server/routes/adminRoutes.js": """const express = require('express');
const router = express.Router();
router.get('/dashboard', (req,res)=>res.json({success:true,data:{}}));
router.get('/departments', (req,res)=>res.json({success:true,data:[]}));
router.get('/teachers', (req,res)=>res.json({success:true,data:[]}));
router.get('/students', (req,res)=>res.json({success:true,data:[]}));
router.get('/analytics', (req,res)=>res.json({success:true,data:{}}));
router.get('/at-risk-students', (req,res)=>res.json({success:true,data:[]}));
module.exports = router;""",

    "server/routes/teacherRoutes.js": """const express = require('express');
const router = express.Router();
router.get('/dashboard', (req,res)=>res.json({success:true,data:{}}));
router.get('/students', (req,res)=>res.json({success:true,data:[]}));
router.get('/analytics', (req,res)=>res.json({success:true,data:{}}));
module.exports = router;""",

    "server/routes/studentRoutes.js": """const express = require('express');
const router = express.Router();
router.get('/dashboard', (req,res)=>res.json({success:true,data:{}}));
router.get('/attempts', (req,res)=>res.json({success:true,data:[]}));
router.get('/feedback', (req,res)=>res.json({success:true,data:[]}));
module.exports = router;""",

    "server/routes/quizRoutes.js": """const express = require('express');
const router = express.Router();
router.get('/', (req,res)=>res.json({success:true,data:[]}));
module.exports = router;""",

    "server/routes/aiRoutes.js": """const express = require('express');
const router = express.Router();
router.post('/generate-quiz', (req,res)=>res.json({success:true,data:{}}));
module.exports = router;""",


    "client/package.json": """{
  "name": "mindtrack-ai-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "axios": "^1.7.2",
    "chart.js": "^4.4.3",
    "lucide-react": "^0.395.0",
    "react": "^18.3.1",
    "react-chartjs-2": "^5.2.0",
    "react-dom": "^18.3.1",
    "react-hot-toast": "^2.4.1",
    "react-router-dom": "^6.24.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "vite": "^5.3.1"
  }
}""",

    "client/vite.config.js": """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } } }
})""",

    "client/tailwind.config.js": """export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}""",

    "client/postcss.config.js": """export default { plugins: { tailwindcss: {}, autoprefixer: {} } }""",

    "client/index.html": """<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>MindTrack AI</title></head>
<body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body>
</html>""",

    "client/src/main.jsx": """import React from 'react'; import ReactDOM from 'react-dom/client'; import App from './App.jsx'; import './index.css';
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);""",

    "client/src/index.css": """@tailwind base; @tailwind components; @tailwind utilities;""",

    "client/src/App.jsx": """import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
export default function App() {
  return <BrowserRouter><Routes><Route path="/" element={<Landing />} /></Routes></BrowserRouter>;
}""",

    "client/src/pages/Landing.jsx": """export default function Landing() { return <div className="p-8 text-xl font-bold">MindTrack AI Loading...</div>; }""",

    "ppt_content.md": """# MindTrack AI - Slide Deck
Slide 1: MindTrack AI System
Slide 2: Mental Health Challenge
Slide 3: Our Solution
Slide 4: Architecture
Slide 5: Database
Slide 6: Student Dashboard
Slide 7: Teacher Dashboard
Slide 8: Admin Dashboard
Slide 9: AI Generator
Slide 10: Conclusion
"""
}

# Write files
for filepath, content in files.items():
    full_path = os.path.join("C:/Users/jothi/Documents/student-quizzes-app", filepath)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Scaffold complete!")
