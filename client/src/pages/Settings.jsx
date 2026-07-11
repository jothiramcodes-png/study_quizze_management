import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Shield, User, Lock, Bell, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [changingPw, setChangingPw] = useState(false);

  const displayUser = user || { name: 'User', email: '', role: 'student' };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setChangingPw(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  };

  const roleColor = displayUser.role === 'admin' ? 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20'
    : displayUser.role === 'teacher' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-400 mb-1">
          Account Settings
        </h1>
        <p className="text-slate-500 text-sm">Manage your profile and security preferences.</p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <Card>
          {/* Avatar */}
          <div className="flex items-center gap-6 mb-8 pb-6 border-b border-slate-800">
            <div className="w-20 h-20 rounded-2xl bg-indigo-500/20 border-2 border-indigo-500/30 flex items-center justify-center text-4xl font-bold text-indigo-300">
              {displayUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{displayUser.name}</h2>
              <p className="text-slate-400 text-sm mb-2">{displayUser.email}</p>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border capitalize ${roleColor}`}>
                <Shield className="w-3 h-3" />
                {displayUser.role}
              </span>
            </div>
          </div>

          {/* Profile Info Grid */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Account Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Full Name', value: displayUser.name },
                { label: 'Email Address', value: displayUser.email },
                { label: 'Role', value: displayUser.role, capitalize: true },
                displayUser.department_name && { label: 'Department', value: displayUser.department_name },
                displayUser.roll_number && { label: 'Roll Number', value: displayUser.roll_number },
                displayUser.semester && { label: 'Semester', value: `Semester ${displayUser.semester}` },
                displayUser.employee_id && { label: 'Employee ID', value: displayUser.employee_id },
                displayUser.specialization && { label: 'Specialization', value: displayUser.specialization },
              ].filter(Boolean).map((field, i) => (
                <div key={i} className="bg-slate-800/40 rounded-xl p-3.5 border border-slate-700/40">
                  <p className="text-xs text-slate-500 mb-1">{field.label}</p>
                  <p className={`text-sm font-medium text-white ${field.capitalize ? 'capitalize' : ''}`}>{field.value}</p>
                </div>
              ))}
            </div>

            {/* Well-being for students */}
            {displayUser.role === 'student' && displayUser.swbi_score !== undefined && (
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-500/5 to-violet-500/5 border border-indigo-500/15">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white mb-0.5">Student Well-Being Index (SWBI)</p>
                    <p className="text-xs text-slate-500">Your current overall wellness score</p>
                  </div>
                  <div className="text-3xl font-bold text-indigo-400">{displayUser.swbi_score}<span className="text-slate-500 text-lg font-normal">/100</span></div>
                </div>
                <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                    style={{ width: `${displayUser.swbi_score}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>0</span>
                  <span className={`font-medium capitalize ${
                    displayUser.risk_level === 'high' ? 'text-red-400' :
                    displayUser.risk_level === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>{displayUser.risk_level} risk</span>
                  <span>100</span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl mt-2">
              <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400">
                Profile information is managed by your institution administrator. Contact your admin to make changes.
              </p>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card>
          <h3 className="text-base font-semibold text-white mb-6">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={showPw.current ? 'text' : 'password'}
                  className="form-input pr-10"
                  value={pwForm.currentPassword}
                  onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                  required
                />
                <button type="button" onClick={() => setShowPw(p => ({ ...p, current: !p.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPw.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showPw.new ? 'text' : 'password'}
                  className="form-input pr-10"
                  value={pwForm.newPassword}
                  onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                  placeholder="Min. 8 characters"
                  minLength={8}
                  required
                />
                <button type="button" onClick={() => setShowPw(p => ({ ...p, new: !p.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPw.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPw.confirm ? 'text' : 'password'}
                  className="form-input pr-10"
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Re-enter new password"
                  minLength={8}
                  required
                />
                <button type="button" onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPw.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
              )}
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={changingPw} className="w-full sm:w-auto">
                {changingPw ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Security Tips</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              {[
                'Use a strong, unique password for this account.',
                'Never share your credentials with others.',
                'Log out when using shared devices.',
                'Contact your administrator if you suspect unauthorized access.',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-0.5">•</span>{tip}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
}
