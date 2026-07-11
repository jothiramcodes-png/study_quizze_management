import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  MessageSquare, BookOpen, Activity, Star,
  Loader2, Users, CheckCircle, Clock, Filter, Search
} from 'lucide-react';

const categoryConfig = {
  academic: { label: 'Academic', icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  behavioral: { label: 'Behavioral', icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  emotional: { label: 'Emotional', icon: Star, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  general: { label: 'General', icon: MessageSquare, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  social: { label: 'Social', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
};

export default function FeedbackHistory() {
  const [loading, setLoading] = useState(true);
  const [allFeedback, setAllFeedback] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/teachers/my-feedback');
      if (res.data.success) setAllFeedback(res.data.data);
    } catch (err) {
      toast.error('Failed to load feedback history');
    } finally {
      setLoading(false);
    }
  };

  const filtered = allFeedback.filter(f => {
    const matchSearch =
      f.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.feedback_text?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = categoryFilter === 'all' || f.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const readCount = allFeedback.filter(f => f.is_read).length;
  const ackCount = allFeedback.filter(f => f.student_ack).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p>Loading feedback history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
          Feedback Sent
        </h1>
        <p className="text-slate-400">All guidance messages you have sent to your students.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400"><MessageSquare className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">Total Sent</p>
            <p className="text-xl font-bold text-white">{allFeedback.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400"><Clock className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">Read by Student</p>
            <p className="text-xl font-bold text-white">{readCount}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/20 rounded-xl text-cyan-400"><CheckCircle className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">Acknowledged</p>
            <p className="text-xl font-bold text-white">{ackCount}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/20 rounded-xl text-violet-400"><Users className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">Unique Students</p>
            <p className="text-xl font-bold text-white">{new Set(allFeedback.map(f => f.roll_number)).size}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by student name or message..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
          {['all', 'academic', 'behavioral', 'emotional', 'general', 'social'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
                categoryFilter === cat
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </Card>

      {/* Feedback List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <MessageSquare className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">No feedback found</p>
            <p className="text-sm mt-1 text-slate-600">
              {allFeedback.length === 0
                ? 'Send feedback from the My Students page'
                : 'Try adjusting your search or filter'}
            </p>
          </div>
        ) : (
          filtered.map(f => {
            const cat = categoryConfig[f.category] || categoryConfig.general;
            const CatIcon = cat.icon;
            return (
              <div
                key={f.id}
                className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-5 transition-all hover:border-slate-600/80"
              >
                <div className="flex items-start gap-4">
                  {/* Student avatar */}
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {f.student_name?.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-semibold text-white">{f.student_name}</span>
                      <span className="text-xs text-slate-500">{f.roll_number}</span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color}`}>
                        <CatIcon className="w-2.5 h-2.5" /> {cat.label}
                      </span>
                      <span className="ml-auto text-xs text-slate-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Message */}
                    <p className="text-slate-300 text-sm leading-relaxed">{f.feedback_text}</p>

                    {/* Status row */}
                    <div className="flex items-center gap-4 mt-3 pt-2 border-t border-slate-800/40">
                      <span className={`flex items-center gap-1 text-xs ${f.is_read ? 'text-emerald-400' : 'text-slate-600'}`}>
                        <CheckCircle className="w-3 h-3" />
                        {f.is_read ? 'Read' : 'Unread'}
                      </span>
                      <span className={`flex items-center gap-1 text-xs ${f.student_ack ? 'text-cyan-400' : 'text-slate-600'}`}>
                        <CheckCircle className="w-3 h-3" />
                        {f.student_ack ? 'Acknowledged' : 'Not acknowledged'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
