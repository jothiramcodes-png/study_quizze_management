import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Users, Search, AlertCircle, MessageSquare, BarChart2,
  Loader2, ChevronDown, ChevronUp, X, Send, TrendingUp, Activity
} from 'lucide-react';

const riskConfig = {
  high: { label: 'High Risk', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', dot: 'bg-red-400' },
  medium: { label: 'Medium Risk', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', dot: 'bg-amber-400' },
  low: { label: 'Low Risk', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400' },
};

function FeedbackModal({ student, onClose, onSuccess }) {
  const [category, setCategory] = useState('academic');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/teachers/feedback', {
        student_id: student.student_id,
        category,
        feedback_text: text.trim(),
      });
      toast.success(`Feedback sent to ${student.name}`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to send feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-white">Send Feedback</h3>
            <p className="text-sm text-slate-400">To: {student.name} ({student.roll_number})</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500/50"
            >
              <option value="academic">Academic</option>
              <option value="behavioral">Behavioral</option>
              <option value="emotional">Emotional</option>
              <option value="general">General</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Message</label>
            <textarea
              rows={5}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Write your feedback here..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-indigo-500/50"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 text-sm font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Sending...' : 'Send Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StudentResultsPanel({ student, onClose }) {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/teachers/students/${student.student_id}/results`)
      .then(res => { if (res.data.success) setResults(res.data.data); })
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false));
  }, [student.student_id]);

  return (
    <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/40 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">Quiz Attempts</h4>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X className="w-4 h-4" /></button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
        </div>
      ) : results.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-4">No quiz attempts yet</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {results.map(r => (
            <div key={r.id} className="flex items-center justify-between px-3 py-2 bg-slate-900/60 rounded-lg text-sm gap-2">
              <span className="text-slate-300 truncate flex-1 mr-2">{r.title}</span>
              <span className={`font-bold flex-shrink-0 ${
                parseFloat(r.percentage) >= 80 ? 'text-emerald-400' :
                parseFloat(r.percentage) >= 50 ? 'text-amber-400' : 'text-red-400'
              }`}>{parseFloat(r.percentage || 0).toFixed(1)}%</span>
              {r.status === 'completed' && (
                <button
                  onClick={() => navigate(`/quiz/attempt/${r.id}`)}
                  className="px-2 py-0.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 rounded text-[10px] font-semibold transition-all flex-shrink-0"
                >
                  Review
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentCard({ student, onFeedback }) {
  const [showResults, setShowResults] = useState(false);
  const risk = riskConfig[student.risk_level] || riskConfig.low;

  return (
    <div className={`bg-slate-900/60 border rounded-2xl p-5 transition-all duration-300 ${
      student.risk_level === 'high' ? 'border-red-500/30 shadow-sm shadow-red-500/5' :
      student.risk_level === 'medium' ? 'border-amber-500/20' :
      'border-slate-700/60'
    }`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base border ${risk.bg} ${risk.color}`}>
            {student.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-white">{student.name}</p>
            <p className="text-xs text-slate-500">{student.roll_number} • Sem {student.semester}</p>
          </div>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${risk.bg} ${risk.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${risk.dot} ${student.risk_level === 'high' ? 'animate-pulse' : ''}`} />
          {risk.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-slate-800/50 rounded-xl">
          <p className="text-lg font-bold text-white">{student.swbi_score ?? '—'}</p>
          <p className="text-[10px] text-slate-500">SWBI</p>
        </div>
        <div className="text-center p-2 bg-slate-800/50 rounded-xl">
          <p className="text-lg font-bold text-white capitalize">{student.semester ?? '—'}</p>
          <p className="text-[10px] text-slate-500">Semester</p>
        </div>
        <div className="text-center p-2 bg-slate-800/50 rounded-xl">
          <p className="text-xs font-medium text-slate-400 truncate pt-1">{student.email?.split('@')[0]}</p>
          <p className="text-[10px] text-slate-500">Email</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onFeedback(student)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 rounded-xl text-xs font-medium transition-all"
        >
          <MessageSquare className="w-3.5 h-3.5" /> Send Feedback
        </button>
        <button
          onClick={() => setShowResults(!showResults)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-400 hover:text-white rounded-xl text-xs font-medium transition-all"
        >
          <BarChart2 className="w-3.5 h-3.5" />
          Results
          {showResults ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {showResults && (
        <StudentResultsPanel student={student} onClose={() => setShowResults(false)} />
      )}
    </div>
  );
}

export default function TeacherStudents() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [feedbackTarget, setFeedbackTarget] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/teachers/students');
      if (res.data.success) setStudents(res.data.data);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filtered = students.filter(s => {
    const matchSearch =
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRisk = riskFilter === 'all' || s.risk_level === riskFilter;
    return matchSearch && matchRisk;
  });

  const highRisk = students.filter(s => s.risk_level === 'high').length;
  const medRisk = students.filter(s => s.risk_level === 'medium').length;
  const avgSwbi = students.length > 0
    ? (students.reduce((sum, s) => sum + (parseFloat(s.swbi_score) || 0), 0) / students.length).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p>Loading students...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {feedbackTarget && (
        <FeedbackModal
          student={feedbackTarget}
          onClose={() => setFeedbackTarget(null)}
          onSuccess={loadStudents}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
          My Students
        </h1>
        <p className="text-slate-400">Monitor well-being, quiz performance, and send personalized guidance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400"><Users className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">Total Students</p>
            <p className="text-xl font-bold text-white">{students.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500/20 rounded-xl text-red-400"><AlertCircle className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">High Risk</p>
            <p className="text-xl font-bold text-white">{highRisk}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400"><TrendingUp className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">Medium Risk</p>
            <p className="text-xl font-bold text-white">{medRisk}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/20 rounded-xl text-cyan-400"><Activity className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">Avg SWBI Score</p>
            <p className="text-xl font-bold text-white">{avgSwbi}</p>
          </div>
        </Card>
      </div>

      {/* At-Risk Alert Banner */}
      {highRisk > 0 && (
        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-xl text-red-400 flex-shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-red-300 font-semibold text-sm">
              {highRisk} student{highRisk > 1 ? 's' : ''} at high risk
            </p>
            <p className="text-red-400/60 text-xs mt-0.5">
              Please send feedback or escalate to the counseling center.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, roll number or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'high', 'medium', 'low'].map(r => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${
                riskFilter === r
                  ? r === 'high' ? 'bg-red-500/20 border border-red-500/30 text-red-300'
                  : r === 'medium' ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
                  : r === 'low' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                  : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {r === 'all' ? 'All' : `${r} risk`}
            </button>
          ))}
        </div>
      </Card>

      {/* Students Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Users className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">No students found</p>
          <p className="text-sm mt-1 text-slate-600">No students are assigned to you yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(student => (
            <StudentCard
              key={student.student_id}
              student={student}
              onFeedback={setFeedbackTarget}
            />
          ))}
        </div>
      )}
    </div>
  );
}
