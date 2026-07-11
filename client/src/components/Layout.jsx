import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Brain, LayoutDashboard, FileText, CheckSquare, MessageSquare,
  LogOut, Users, Building2, Shield, ChevronRight, Bell, GraduationCap,
  BarChart2, Settings, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NavLink = ({ to, icon: Icon, label, currentPath }) => {
  const isActive = currentPath === to || (to !== '/dashboard' && currentPath.startsWith(to));
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group ${
        isActive
          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[inset_0_0_10px_rgba(99,102,241,0.1)]'
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
      }`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'group-hover:text-slate-300'}`} />
      <span className="font-medium text-sm">{label}</span>
      {isActive && <ChevronRight className="w-4 h-4 ml-auto text-indigo-400/60" />}
    </Link>
  );
};

const NavSection = ({ title, children }) => (
  <div className="mb-2">
    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 mb-1">{title}</p>
    <div className="space-y-0.5">{children}</div>
  </div>
);

export default function Layout({ children }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayUser = user || { name: 'Loading...', role: 'student' };
  const role = (displayUser.role || 'student').toLowerCase();

  // Role-specific dashboard path
  const dashPath = role === 'admin' ? '/dashboard/admin'
    : role === 'teacher' ? '/dashboard/teacher'
    : '/dashboard/student';

  const roleColor = role === 'admin' ? 'text-fuchsia-400 bg-fuchsia-500/20 border-fuchsia-500/30'
    : role === 'teacher' ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
    : 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30';

  const avatarBg = role === 'admin' ? 'bg-fuchsia-500/20 border-fuchsia-500/30 text-fuchsia-300'
    : role === 'teacher' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
    : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300';

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      {/* Background effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-64 w-[40%] h-[30%] bg-indigo-600/5 blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[30%] h-[40%] bg-violet-600/5 blur-[100px]" />
      </div>

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/95 border-r border-slate-800/80 flex flex-col z-20 relative">
        {/* Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Brain className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <span className="text-base font-bold text-white leading-none">MindTrack</span>
            <span className="text-base font-bold text-indigo-400 leading-none"> AI</span>
          </div>
        </div>

        {/* Role Badge */}
        <div className="px-4 py-3 border-b border-slate-800/50">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${roleColor}`}>
            {role === 'admin' && <Shield className="w-3 h-3" />}
            {role === 'teacher' && <GraduationCap className="w-3 h-3" />}
            {role === 'student' && <Users className="w-3 h-3" />}
            <span className="capitalize">{role} Portal</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-3 overflow-y-auto">
          {/* Common */}
          <NavSection title="Overview">
            <NavLink to={dashPath} icon={LayoutDashboard} label="Dashboard" currentPath={currentPath} />
          </NavSection>

          {/* Student Nav */}
          {role === 'student' && (
            <NavSection title="Learning">
              <NavLink to="/quizzes" icon={CheckSquare} label="My Quizzes" currentPath={currentPath} />
              <NavLink to="/history" icon={FileText} label="Attempt History" currentPath={currentPath} />
              <NavLink to="/feedback" icon={MessageSquare} label="Feedback" currentPath={currentPath} />
            </NavSection>
          )}

          {/* Teacher Nav */}
          {role === 'teacher' && (
            <NavSection title="Management">
              <NavLink to="/generate-quiz" icon={Sparkles} label="AI Quiz Gen" currentPath={currentPath} />
              <NavLink to="/students" icon={Users} label="My Students" currentPath={currentPath} />
              <NavLink to="/analytics" icon={BarChart2} label="Analytics" currentPath={currentPath} />
              <NavLink to="/feedback-history" icon={MessageSquare} label="Feedback Sent" currentPath={currentPath} />
            </NavSection>
          )}

          {/* Admin Nav */}
          {role === 'admin' || role === 'ADMIN' ? (
            <>
              <NavSection title="Management">
                <NavLink to="/dashboard/admin" icon={LayoutDashboard} label="Admin Dashboard" currentPath={currentPath} />
                <NavLink to="/dashboard/admin/users" icon={Users} label="User Management" currentPath={currentPath} />
              </NavSection>
            </>
          ) : null}

          {/* Settings - all roles */}
          <NavSection title="Account">
            <NavLink to="/settings" icon={Settings} label="Settings" currentPath={currentPath} />
          </NavSection>
        </nav>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-slate-800/80">
          <div className="flex items-center gap-3 mb-2 px-2 py-2 rounded-xl">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border font-bold text-sm ${avatarBg}`}>
              {((displayUser.name || displayUser.firstName || 'U').charAt(0)).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{displayUser.name || `${displayUser.firstName} ${displayUser.lastName}`}</p>
              <p className="text-xs text-slate-500 truncate">{displayUser.email || displayUser.role}</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Logout confirm modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-2">Confirm Logout</h3>
            <p className="text-slate-400 text-sm mb-6">Are you sure you want to log out of MindTrack AI?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-all text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/60 px-8 py-3 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            <span className="text-slate-400 font-medium">{displayUser.name || `${displayUser.firstName} ${displayUser.lastName}`}</span>
            {displayUser.department_name && (
              <span className="ml-2 text-slate-600">• {displayUser.department_name}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-500">Connected</span>
          </div>
        </div>

        <div className="p-8 max-w-7xl mx-auto relative">
          {children}
        </div>
      </main>
    </div>
  );
}
