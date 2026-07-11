import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';
import {
  Building2, Users, GraduationCap, FileCheck, Sparkles, Plus, Loader2,
  X, AlertTriangle, Edit2, Trash2, Search, ChevronDown, Eye
} from 'lucide-react';
import AIGeneratorModal from '../components/AIGeneratorModal';
import api from '../services/api';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// ===== MODAL: Create/Edit Department =====
function DeptModal({ dept, onClose, onSave }) {
  const [form, setForm] = useState({ name: dept?.name || '', code: dept?.code || '', description: dept?.description || '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (dept?.id) {
        await api.put(`/admin/departments/${dept.id}`, form);
        toast.success('Department updated');
      } else {
        await api.post('/admin/departments', form);
        toast.success('Department created');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving department');
    } finally { setLoading(false); }
  };

  return (
    <Modal title={dept?.id ? 'Edit Department' : 'Add Department'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Department Name" required>
          <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Computer Science" required />
        </FormField>
        <FormField label="Code" required>
          <input className="form-input uppercase" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g., CSE" maxLength={10} required />
        </FormField>
        <FormField label="Description">
          <textarea className="form-input resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
        </FormField>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ===== MODAL: Create Teacher =====
function TeacherModal({ departments, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', department_id: '', employee_id: '', specialization: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/teachers', form);
      toast.success('Teacher created successfully');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating teacher');
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Add New Teacher" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Full Name" required>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Dr. Jane Smith" required />
          </FormField>
          <FormField label="Employee ID" required>
            <input className="form-input" value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} placeholder="EMP001" required />
          </FormField>
        </div>
        <FormField label="Email" required>
          <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="teacher@college.edu" required />
        </FormField>
        <FormField label="Password" required>
          <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters" minLength={8} required />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Department" required>
            <select className="form-input" value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))} required>
              <option value="">Select...</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </FormField>
          <FormField label="Specialization">
            <input className="form-input" value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} placeholder="e.g., Machine Learning" />
          </FormField>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Teacher'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ===== MODAL: Create Student =====
function StudentModal({ departments, teachers, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', department_id: '', teacher_id: '', roll_number: '', semester: '1' });
  const [loading, setLoading] = useState(false);

  const filteredTeachers = form.department_id
    ? teachers.filter(t => String(t.department_id) === String(form.department_id))
    : teachers;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/students', form);
      toast.success('Student created successfully');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating student');
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Add New Student" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Full Name" required>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" required />
          </FormField>
          <FormField label="Roll Number" required>
            <input className="form-input" value={form.roll_number} onChange={e => setForm(f => ({ ...f, roll_number: e.target.value }))} placeholder="CS2024001" required />
          </FormField>
        </div>
        <FormField label="Email" required>
          <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="student@college.edu" required />
        </FormField>
        <FormField label="Password" required>
          <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters" minLength={8} required />
        </FormField>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Department" required>
            <select className="form-input" value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value, teacher_id: '' }))} required>
              <option value="">Select...</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </FormField>
          <FormField label="Assign Teacher">
            <select className="form-input" value={form.teacher_id} onChange={e => setForm(f => ({ ...f, teacher_id: e.target.value }))}>
              <option value="">Select...</option>
              {filteredTeachers.map(t => <option key={t.teacher_id} value={t.teacher_id}>{t.name}</option>)}
            </select>
          </FormField>
          <FormField label="Semester">
            <select className="form-input" value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}>
              {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
            </select>
          </FormField>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Student'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ===== SHARED UI =====
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const RISK_COLORS = {
  high: 'bg-red-500/10 text-red-400 border-red-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
};

// ===== TABS =====
const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'departments', label: 'Departments', icon: '🏫' },
  { id: 'teachers', label: 'Teachers', icon: '👩‍🏫' },
  { id: 'students', label: 'Students', icon: '🎓' },
  { id: 'at-risk', label: 'At-Risk Alerts', icon: '⚠️' },
];

export default function AdminDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [openModal, setOpenModal] = useState(null); // 'dept' | 'teacher' | 'student'
  const [editingDept, setEditingDept] = useState(null);

  const [metrics, setMetrics] = useState({ total_departments: 0, total_teachers: 0, total_students: 0, total_quizzes: 0, completion_rate: 0, avg_score: 0 });
  const [deptPerformance, setDeptPerformance] = useState([]);
  const [riskDistribution, setRiskDistribution] = useState({ low: 0, medium: 0, high: 0 });
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const [distressSignals, setDistressSignals] = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, analyticsRes, deptsRes, teachersRes, studentsRes, atRiskRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/analytics'),
        api.get('/admin/departments'),
        api.get('/admin/teachers'),
        api.get('/admin/students'),
        api.get('/admin/at-risk-students'),
      ]);
      if (dashRes.data.success) {
        const d = dashRes.data.data;
        setMetrics({ total_departments: d.total_departments, total_teachers: d.total_teachers, total_students: d.total_students, total_quizzes: d.total_quizzes, completion_rate: d.completion_rate, avg_score: d.avg_score });
        const dist = { low: 0, medium: 0, high: 0 };
        d.at_risk_distribution.forEach(item => { if (dist[item.risk_level] !== undefined) dist[item.risk_level] = Number(item.cnt); });
        setRiskDistribution(dist);
      }
      if (analyticsRes.data.success) setDeptPerformance(analyticsRes.data.data.deptPerformance);
      if (deptsRes.data.success) setDepartments(deptsRes.data.data);
      if (teachersRes.data.success) setTeachers(teachersRes.data.data);
      if (studentsRes.data.success) setStudents(studentsRes.data.data);
      if (atRiskRes.data.success) {
        setAtRiskStudents(atRiskRes.data.data.atRiskStudents || []);
        setDistressSignals(atRiskRes.data.data.distressSignals || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      toast.error('Failed to load admin data');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDeleteDept = async (id, name) => {
    if (!window.confirm(`Delete department "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/departments/${id}`);
      toast.success('Department deleted');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Error deleting department'); }
  };

  const handleDeleteTeacher = async (id, name) => {
    if (!window.confirm(`Remove teacher "${name}"? This will delete their account.`)) return;
    try {
      await api.delete(`/admin/teachers/${id}`);
      toast.success('Teacher removed');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Error removing teacher'); }
  };

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.department_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredTeachers = teachers.filter(t =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.department_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const barData = {
    labels: deptPerformance.map(d => d.code),
    datasets: [{ label: 'Avg Score %', data: deptPerformance.map(d => parseFloat(d.avg_score || 0)), backgroundColor: 'rgba(99,102,241,0.8)', borderRadius: 6 }]
  };
  const doughnutData = {
    labels: ['Low Risk', 'Medium Risk', 'High Risk'],
    datasets: [{ data: [riskDistribution.low, riskDistribution.medium, riskDistribution.high], backgroundColor: ['rgba(16,185,129,0.8)', 'rgba(245,158,11,0.8)', 'rgba(239,68,68,0.8)'], borderWidth: 0 }]
  };
  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16, font: { size: 12 } } } } };
  const barOptions = { ...chartOptions, scales: { y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }, x: { grid: { display: false }, ticks: { color: '#94a3b8' } } } };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
      <p>Loading admin dashboard...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-1">
            Admin Control Center
          </h1>
          <p className="text-slate-400 text-sm">System-wide management and AI-powered insights.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all text-sm"
        >
          <Sparkles className="w-4 h-4" /> AI Generator
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <span>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* ===== TAB: OVERVIEW ===== */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Departments', val: metrics.total_departments, icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/20' },
              { label: 'Teachers', val: metrics.total_teachers, icon: GraduationCap, color: 'text-indigo-400', bg: 'bg-indigo-500/15 border-indigo-500/20' },
              { label: 'Students', val: metrics.total_students, icon: Users, color: 'text-violet-400', bg: 'bg-violet-500/15 border-violet-500/20' },
              { label: 'Quizzes', val: metrics.total_quizzes, icon: FileCheck, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/15 border-fuchsia-500/20' },
              { label: 'Completion', val: `${metrics.completion_rate}%`, icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/20' },
              { label: 'Avg Score', val: `${metrics.avg_score}%`, icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/20' },
            ].map((k, i) => (
              <Card key={i} padding="p-4" className={`flex flex-col items-center text-center border ${k.bg}`}>
                <div className={`p-2 rounded-lg ${k.bg} mb-2`}><k.icon className={`w-5 h-5 ${k.color}`} /></div>
                <p className="text-2xl font-bold text-white mb-0.5">{k.val}</p>
                <p className="text-xs text-slate-400">{k.label}</p>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="flex flex-col min-h-[320px]">
              <h3 className="text-base font-semibold text-white mb-4">Department Performance (Avg Score)</h3>
              <div className="flex-1 relative"><Bar data={barData} options={barOptions} /></div>
            </Card>
            <Card className="flex flex-col min-h-[320px]">
              <h3 className="text-base font-semibold text-white mb-4">Risk Level Distribution</h3>
              <div className="flex-1 relative"><Doughnut data={doughnutData} options={chartOptions} /></div>
            </Card>
          </div>

          {/* AI CTA */}
          <div className="relative overflow-hidden rounded-2xl p-px bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            <div className="bg-slate-900 rounded-[15px] p-8 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="absolute top-0 right-0 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
              <div className="flex-1 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
                  <Sparkles className="w-3.5 h-3.5" /> AI Powered Tool
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Generate Assessment Quizzes with Gemini AI</h2>
                <p className="text-slate-400 text-sm">Instantly create mental wellness assessments tailored to specific departments or stress factors.</p>
              </div>
              <div className="relative z-10 flex-shrink-0">
                <button onClick={() => setIsModalOpen(true)} className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all">
                  Open AI Generator
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== TAB: DEPARTMENTS ===== */}
      {activeTab === 'departments' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-slate-400 text-sm">{departments.length} departments registered</p>
            <Button onClick={() => { setEditingDept(null); setOpenModal('dept'); }} className="flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Department
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map(dept => (
              <Card key={dept.id} padding="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/20">{dept.code}</span>
                    </div>
                    <h3 className="font-semibold text-white">{dept.name}</h3>
                    {dept.description && <p className="text-slate-500 text-xs mt-1">{dept.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingDept(dept); setOpenModal('dept'); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-all">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteDept(dept.id, dept.name)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-800 pt-3 mt-2">
                  <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> {dept.teacher_count || 0} Teachers</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {dept.student_count || 0} Students</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ===== TAB: TEACHERS ===== */}
      {activeTab === 'teachers' && (
        <div>
          <div className="flex justify-between items-center mb-4 gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                className="form-input pl-9 py-2 text-sm"
                placeholder="Search teachers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setOpenModal('teacher')} className="flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Teacher
            </Button>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full">
              <thead className="bg-slate-800/60">
                <tr>
                  {['Name', 'Employee ID', 'Department', 'Specialization', 'Students', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredTeachers.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 text-sm font-bold">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{t.name}</p>
                          <p className="text-xs text-slate-500">{t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{t.employee_id}</td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{t.department_code}</span></td>
                    <td className="px-4 py-3 text-sm text-slate-400">{t.specialization || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{t.student_count}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full border ${t.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-600'}`}>
                        {t.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDeleteTeacher(t.teacher_id, t.name)} className="text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTeachers.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500 text-sm">No teachers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== TAB: STUDENTS ===== */}
      {activeTab === 'students' && (
        <div>
          <div className="flex justify-between items-center mb-4 gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                className="form-input pl-9 py-2 text-sm"
                placeholder="Search students..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setOpenModal('student')} className="flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Student
            </Button>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full">
              <thead className="bg-slate-800/60">
                <tr>
                  {['Student', 'Roll No.', 'Department', 'Teacher', 'Sem', 'SWBI', 'Risk', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredStudents.map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-sm font-bold">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 font-mono">{s.roll_number}</td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{s.department_code}</span></td>
                    <td className="px-4 py-3 text-sm text-slate-400">{s.teacher_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{s.semester}</td>
                    <td className="px-4 py-3 text-sm text-white font-semibold">{s.swbi_score}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full border capitalize ${RISK_COLORS[s.risk_level] || RISK_COLORS.low}`}>
                        {s.risk_level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hover:text-slate-400 cursor-pointer">
                      <Eye className="w-4 h-4" />
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500 text-sm">No students found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== TAB: AT-RISK ===== */}
      {activeTab === 'at-risk' && (
        <div className="space-y-8">
          {/* Distress Signals Section */}
          {distressSignals.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4 p-4 bg-red-600/20 border border-red-500/40 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 animate-pulse" />
                <div className="flex-1">
                  <p className="font-bold text-red-300">Active Distress Signals ({distressSignals.length})</p>
                  <p className="text-sm text-red-400/80">These students requested immediate help via the SOS button.</p>
                </div>
              </div>
              <div className="space-y-3">
                {distressSignals.map((ds) => (
                  <Card key={ds.id} padding="p-4" className="border-red-500/30 bg-slate-800/80">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white">{ds.student_name}</span>
                          <span className="text-xs text-slate-400">({ds.roll_number})</span>
                        </div>
                        <p className="text-sm text-slate-400 mb-2">{ds.department_name}</p>
                        <p className="text-sm text-red-300 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20 inline-block">{ds.notes}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-1 rounded">{ds.status}</span>
                        <p className="text-xs text-slate-500 mt-2">{new Date(ds.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* At Risk Students Section */}
          <div>
            <div className="flex items-center gap-3 mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-300">{atRiskStudents.length} students flagged as medium or high risk based on SWBI analytics.</p>
            </div>
            <div className="space-y-3">
            {atRiskStudents.map((s, i) => (
              <Card key={i} padding="p-4" className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    s.risk_level === 'high' ? 'bg-red-500/20 border border-red-500/30 text-red-300' : 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
                  }`}>
                    {s.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.roll_number} • {s.department_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-0.5">SWBI Score</p>
                    <p className="font-bold text-white">{s.swbi_score}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-0.5">Mentor</p>
                    <p className="text-sm text-slate-300">{s.teacher_name || 'Unassigned'}</p>
                  </div>
                  <span className={`text-xs px-3 py-1.5 rounded-full border font-semibold capitalize ${RISK_COLORS[s.risk_level]}`}>
                    {s.risk_level} risk
                  </span>
                </div>
              </Card>
            ))}
            {atRiskStudents.length === 0 && (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">🎉</div>
                <p className="text-slate-400 font-medium">No at-risk students detected.</p>
                <p className="text-slate-600 text-sm mt-1">All students are currently in the low-risk category.</p>
              </div>
            )}
          </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {openModal === 'dept' && (
        <DeptModal dept={editingDept} onClose={() => setOpenModal(null)} onSave={() => { setOpenModal(null); fetchAll(); }} />
      )}
      {openModal === 'teacher' && (
        <TeacherModal departments={departments} onClose={() => setOpenModal(null)} onSave={() => { setOpenModal(null); fetchAll(); }} />
      )}
      {openModal === 'student' && (
        <StudentModal departments={departments} teachers={teachers} onClose={() => setOpenModal(null)} onSave={() => { setOpenModal(null); fetchAll(); }} />
      )}

      <AIGeneratorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
