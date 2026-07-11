import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  FileText, CheckCircle, XCircle, Clock, Target,
  Loader2, Search, ChevronDown, ChevronUp, BarChart2, TrendingUp
} from 'lucide-react';

const scoreColor = (pct) => {
  if (pct >= 80) return 'text-emerald-400';
  if (pct >= 50) return 'text-amber-400';
  return 'text-red-400';
};

const scoreBg = (pct) => {
  if (pct >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
  if (pct >= 50) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
};

function AttemptCard({ attempt }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const pct = parseFloat(attempt.percentage || 0);

  return (
    <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl overflow-hidden transition-all duration-300 hover:border-slate-600/80">
      <div
        className="p-5 flex items-center gap-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Score ring */}
        <div className={`w-14 h-14 rounded-2xl border flex-shrink-0 flex flex-col items-center justify-center ${scoreBg(pct)}`}>
          <span className={`text-lg font-bold leading-none ${scoreColor(pct)}`}>
            {pct.toFixed(0)}
          </span>
          <span className="text-[10px] text-slate-500">%</span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm truncate">{attempt.title}</h3>
          <p className="text-xs text-slate-500 mt-0.5 capitalize">{attempt.topic} • {attempt.quiz_type?.replace('_', ' ')}</p>
        </div>

        <div className="hidden md:flex items-center gap-6 text-xs text-slate-500 mx-4">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            <span>{attempt.correct_answers}/{attempt.total_questions} correct</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{attempt.time_taken_mins ? `${attempt.time_taken_mins} min` : '—'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${
            attempt.status === 'completed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
            attempt.status === 'in_progress' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
            'text-red-400 bg-red-500/10 border-red-500/20'
          }`}>
            {attempt.status === 'completed' ? <CheckCircle className="w-3 h-3 inline mr-1" /> : <XCircle className="w-3 h-3 inline mr-1" />}
            {attempt.status?.replace('_', ' ')}
          </span>
          <span className="text-xs text-slate-600">
            {new Date(attempt.started_at).toLocaleDateString()}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-0 border-t border-slate-800/60">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Score</p>
              <p className={`text-xl font-bold ${scoreColor(pct)}`}>{pct.toFixed(1)}%</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Correct</p>
              <p className="text-xl font-bold text-white">{attempt.correct_answers || 0}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Total Qs</p>
              <p className="text-xl font-bold text-white">{attempt.total_questions || 0}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Time Taken</p>
              <p className="text-xl font-bold text-white">{attempt.time_taken_mins || '—'}<span className="text-xs font-normal text-slate-500 ml-1">min</span></p>
            </div>
          </div>
          {attempt.ai_feedback && (
            <div className="mt-4 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
              <p className="text-xs text-indigo-400 font-semibold mb-1">AI Feedback</p>
              <p className="text-sm text-slate-300">{attempt.ai_feedback}</p>
            </div>
          )}
          {attempt.status === 'completed' && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/quiz/attempt/${attempt.id}`);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-300 rounded-xl text-xs font-semibold transition-all"
              >
                Review Quiz Details
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AttemptHistory() {
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadAttempts();
  }, []);

  const loadAttempts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/students/attempts');
      if (res.data.success) setAttempts(res.data.data);
    } catch (err) {
      toast.error('Failed to load attempt history');
    } finally {
      setLoading(false);
    }
  };

  const filtered = attempts.filter(a => {
    const matchSearch = a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.topic?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const completed = attempts.filter(a => a.status === 'completed');
  const avgScore = completed.length > 0
    ? (completed.reduce((sum, a) => sum + parseFloat(a.percentage || 0), 0) / completed.length).toFixed(1)
    : 0;
  const bestScore = completed.length > 0
    ? Math.max(...completed.map(a => parseFloat(a.percentage || 0))).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p>Loading attempt history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400 mb-2">
          Attempt History
        </h1>
        <p className="text-slate-400">A complete record of all your quiz attempts and performance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400"><FileText className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">Total Attempts</p>
            <p className="text-xl font-bold text-white">{attempts.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400"><CheckCircle className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">Completed</p>
            <p className="text-xl font-bold text-white">{completed.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/20 rounded-xl text-cyan-400"><BarChart2 className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">Avg Score</p>
            <p className="text-xl font-bold text-white">{avgScore}%</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400"><TrendingUp className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">Best Score</p>
            <p className="text-xl font-bold text-white">{bestScore}%</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by quiz title or topic..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500/50 cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="in_progress">In Progress</option>
          <option value="abandoned">Abandoned</option>
        </select>
      </Card>

      {/* Attempts List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <FileText className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">No attempts found</p>
            <p className="text-sm mt-1 text-slate-600">Complete a quiz to see your history here</p>
          </div>
        ) : (
          filtered.map(attempt => (
            <AttemptCard key={attempt.id} attempt={attempt} />
          ))
        )}
      </div>
    </div>
  );
}
