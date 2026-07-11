import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import QuizPage from './pages/QuizPage';
import Settings from './pages/Settings';
import QuizzesPage from './pages/QuizzesPage';
import AttemptHistory from './pages/AttemptHistory';
import FeedbackPage from './pages/FeedbackPage';
import TeacherStudents from './pages/TeacherStudents';
import TeacherAnalytics from './pages/TeacherAnalytics';
import FeedbackHistory from './pages/FeedbackHistory';
import QuizReviewPage from './pages/QuizReviewPage';
import QuizPreviewPage from './pages/QuizPreviewPage';
import GenerateQuiz from './pages/GenerateQuiz';

// Smart redirect based on user role
function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const role = user.role.toLowerCase();
  if (role === 'admin') return <Navigate to="/dashboard/admin" replace />;
  if (role === 'teacher') return <Navigate to="/dashboard/teacher" replace />;
  return <Navigate to="/dashboard/student" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(99,102,241,0.2)' },
            success: { iconTheme: { primary: '#10b981', secondary: '#1e293b' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Smart dashboard redirect */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />

          <Route path="/quiz/:id" element={
            <ProtectedRoute allowedRoles={['student']}>
              <QuizPage />
            </ProtectedRoute>
          } />

          {/* Quiz Review page (accessible to students, teachers, admins) */}
          <Route path="/quiz/attempt/:attemptId" element={
            <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
              <Layout><QuizReviewPage /></Layout>
            </ProtectedRoute>
          } />

          {/* Quiz Preview page (accessible to teachers, admins) */}
          <Route path="/quiz-preview/:id" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <Layout><QuizPreviewPage /></Layout>
            </ProtectedRoute>
          } />

          {/* ── Student routes ── */}
          <Route path="/dashboard/student" element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout><StudentDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/quizzes" element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout><QuizzesPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout><AttemptHistory /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/feedback" element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout><FeedbackPage /></Layout>
            </ProtectedRoute>
          } />

          {/* ── Teacher routes ── */}
          <Route path="/dashboard/teacher" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <Layout><TeacherDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/generate-quiz" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <Layout><GenerateQuiz /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/students" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <Layout><TeacherStudents /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <Layout><TeacherAnalytics /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/feedback-history" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <Layout><FeedbackHistory /></Layout>
            </ProtectedRoute>
          } />

          {/* ── Admin routes ── */}
          <Route path="/dashboard/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout><AdminDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout><AdminUsers /></Layout>
            </ProtectedRoute>
          } />

          {/* Settings - all roles */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout><Settings /></Layout>
            </ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}