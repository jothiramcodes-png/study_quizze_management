import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  MessageSquare, CheckCircle, Clock, Star,
  Loader2, GraduationCap, AlertCircle, BookOpen, Activity
} from 'lucide-react';

const categoryConfig = {
  academic: { label: 'Academic', icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  behavioral: { label: 'Behavioral', icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  emotional: { label: 'Emotional', icon: Star, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  general: { label: 'General', icon: MessageSquare, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
};

function FeedbackCard({ feedback, onAcknowledge }) {
  const cat = categoryConfig[feedback.category] || categoryConfig.general;
  const CatIcon = cat.icon;
  const isNew = !feedback.is_read;

  return (
    <div className={`relative bg-slate-900/60 border rounded-2xl p-5 transition-all duration-300 ${
      isNew ? 'border-indigo-500/40 shadow-lg shadow-indigo-500/5' : 'border-slate-700/60'
    }`}>
      {isNew && (
        <span className="absolute top-4 right-4 flex items-center gap-1 text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full border border-indigo-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" /> New
        </span>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-4 pr-16">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
          {feedback.teacher_name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">{feedback.teacher_name}</span>
            <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color}`}>
              <CatIcon className="w-2.5 h-2.5" /> {cat.label}
            </span>
            <span className="text-xs text-slate-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(feedback.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Message */}
      <div className="mb-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/40">
        <p className="text-slate-300 text-sm leading-relaxed">{feedback.feedback_text}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {feedback.is_read && (
            <span className="text-xs text-slate-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-slate-600" /> Read
            </span>
          )}
        </div>
        {!feedback.student_ack ? (
          <button
            onClick={() => onAcknowledge(feedback.id)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-medium transition-all"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Acknowledge
          </button>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <CheckCircle className="w-3.5 h-3.5" /> Acknowledged
          </span>
        )}
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const res = await api.get('/students/feedback');
      if (res.data.success) setFeedback(res.data.data);
    } catch (err) {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await api.post(`/students/acknowledge-feedback/${id}`);
      toast.success('Feedback acknowledged!');
      setFeedback(prev =>
        prev.map(f => f.id === id ? { ...f, student_ack: 1 } : f)
      );
    } catch (err) {
      toast.error('Failed to acknowledge feedback');
    }
  };

  const filtered = categoryFilter === 'all'
    ? feedback
    : feedback.filter(f => f.category === categoryFilter);

  const unread = feedback.filter(f => !f.is_read).length;
  const unacknowledged = feedback.filter(f => !f.student_ack).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p>Loading feedback...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400 mb-2">
          Teacher Feedback
        </h1>
        <p className="text-slate-400">Personal guidance and notes from your assigned mentor.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400"><MessageSquare className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">Total Feedback</p>
            <p className="text-xl font-bold text-white">{feedback.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400"><AlertCircle className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">Unread</p>
            <p className="text-xl font-bold text-white">{unread}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/20 rounded-xl text-violet-400"><Clock className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">Pending Ack.</p>
            <p className="text-xl font-bold text-white">{unacknowledged}</p>
          </div>
        </Card>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'academic', 'behavioral', 'emotional', 'general'].map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              categoryFilter === cat
                ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300'
                : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {cat === 'all' ? `All (${feedback.length})` : `${cat} (${feedback.filter(f => f.category === cat).length})`}
          </button>
        ))}
      </div>

      {/* Feedback Cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <MessageSquare className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">No feedback yet</p>
            <p className="text-sm mt-1 text-slate-600">Your mentor's guidance will appear here</p>
          </div>
        ) : (
          filtered.map(f => (
            <FeedbackCard
              key={f.id}
              feedback={f}
              onAcknowledge={handleAcknowledge}
            />
          ))
        )}
      </div>
    </div>
  );
}
