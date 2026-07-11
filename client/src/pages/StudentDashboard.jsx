import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler
} from 'chart.js';
import { BookOpen, Target, Activity, MessageCircle, AlertCircle, PlayCircle, Loader2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    profile: {},
    attempted_count: 0,
    avg_score: 0,
    unread_feedback: 0,
    recentFeedback: [],
    pendingQuizzes: [],
    swbiHistory: []
  });
  const [sendingSignal, setSendingSignal] = useState(false);

  const loadDashboardData = async () => {
    try {
      const response = await api.get('/students/dashboard');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching student dashboard:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleAcknowledgeFeedback = async (feedbackId) => {
    try {
      const response = await api.post(`/students/acknowledge-feedback/${feedbackId}`);
      if (response.data.success) {
        toast.success('Feedback acknowledged');
        loadDashboardData();
      }
    } catch (err) {
      toast.error('Failed to acknowledge feedback');
    }
  };

  const handleSendDistressSignal = async () => {
    if (!window.confirm('Are you sure you want to send a distress signal? Your assigned mentor and admin counselors will be notified to assist you immediately.')) {
      return;
    }
    setSendingSignal(true);
    try {
      const response = await api.post('/students/distress-signal');
      if (response.data.success) {
        toast.success('Distress signal sent! A counselor will reach out to you shortly.');
        loadDashboardData();
      }
    } catch (err) {
      toast.error('Failed to send distress signal');
    } finally {
      setSendingSignal(false);
    }
  };

  const chartData = {
    labels: data.swbiHistory.map(h => {
      const d = new Date(h.label);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }),
    datasets: [{
      label: 'SWBI Index',
      data: data.swbiHistory.map(h => parseFloat(h.score)),
      fill: true,
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      borderColor: 'rgba(99, 102, 241, 0.8)',
      tension: 0.4,
      pointBackgroundColor: 'rgba(99, 102, 241, 1)',
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { 
        min: 0,
        max: 100,
        grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
        ticks: { color: '#94a3b8' } 
      },
      x: { 
        grid: { display: false },
        ticks: { color: '#94a3b8' } 
      }
    },
    plugins: { legend: { display: false } }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p>Loading student dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400 mb-2">
            Welcome back, {data.profile.name}! 👋
          </h1>
          <p className="text-slate-400">Roll Number: {data.profile.roll_number} • Semester {data.profile.semester}</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 border rounded-full font-medium text-sm shadow-sm ${
          data.profile.risk_level === 'high' ? 'bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]' :
          data.profile.risk_level === 'medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
          'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            data.profile.risk_level === 'high' ? 'bg-red-400' :
            data.profile.risk_level === 'medium' ? 'bg-amber-400' :
            'bg-emerald-400'
          }`} />
          <span className="capitalize">{data.profile.risk_level} Risk Profile</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="flex items-center gap-4 hover:shadow-indigo-500/10 transition-shadow">
          <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Quizzes Attempted</p>
            <p className="text-2xl font-bold text-white">{data.attempted_count}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 hover:shadow-cyan-500/10 transition-shadow">
          <div className="p-3 bg-cyan-500/20 rounded-xl text-cyan-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Average Score</p>
            <p className="text-2xl font-bold text-white">{data.avg_score}%</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 hover:shadow-emerald-500/10 transition-shadow">
          <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400 border-b border-slate-700 pb-1 mb-1">SWBI Score</p>
            <p className="text-2xl font-bold text-white">{data.profile.swbi_score}<span className="text-sm font-normal text-slate-500 ml-1">/100</span></p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 hover:shadow-violet-500/10 transition-shadow">
          <div className="p-3 bg-violet-500/20 rounded-xl text-violet-400">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400">New Feedback</p>
            <p className="text-2xl font-bold text-white">{data.unread_feedback}</p>
          </div>
        </Card>
      </div>

      {/* Charts & Lists Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 flex flex-col min-h-[400px]">
          <h3 className="text-lg font-semibold text-white mb-6">Recent Well-Being (SWBI) Trend</h3>
          <div className="flex-1 w-full relative">
            {data.swbiHistory.length === 0 ? (
              <p className="text-slate-500 py-20 text-center">No SWBI trend reports recorded yet.</p>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">Pending Quizzes</h3>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full">{data.pendingQuizzes.length} items</span>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px]">
            {data.pendingQuizzes.length === 0 ? (
              <p className="text-slate-500 text-sm py-8 text-center">No pending assessments.</p>
            ) : (
              data.pendingQuizzes.map((q) => (
                <div 
                  key={q.id} 
                  onClick={() => navigate(`/quiz/${q.id}`)}
                  className="group p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-slate-200 group-hover:text-white transition-colors">{q.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{q.total_questions} questions • {q.duration_mins} mins • <span className="capitalize">{q.difficulty}</span></p>
                  </div>
                  <PlayCircle className="w-8 h-8 text-indigo-500/50 group-hover:text-indigo-400 transition-colors flex-shrink-0 ml-2" />
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Teacher Feedback */}
        <Card className="lg:col-span-3">
          <h3 className="text-lg font-semibold text-white mb-4">Feedback from Guidance Mentor</h3>
          {data.recentFeedback.length === 0 ? (
            <p className="text-slate-500 text-sm">No recent counselor feedback.</p>
          ) : (
            <div className="space-y-4">
              {data.recentFeedback.map((f) => (
                <div key={f.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white text-sm">{f.teacher_name}</span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-indigo-400 capitalize">{f.category} feedback</span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-500">{new Date(f.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-300 text-sm mt-2">{f.feedback_text}</p>
                  </div>
                  {!f.student_ack ? (
                    <Button 
                      onClick={() => handleAcknowledgeFeedback(f.id)} 
                      size="sm" 
                      variant="secondary"
                    >
                      Acknowledge
                    </Button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-medium px-2 py-1 bg-emerald-500/10 rounded-lg">Acknowledged</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Distress CTA */}
      <div className="mt-8">
        <div className="bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20 rounded-2xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl text-red-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Need Support?</h3>
              <p className="text-slate-400 text-sm">Reach out to the counseling center completely anonymously.</p>
            </div>
          </div>
          <button 
            onClick={handleSendDistressSignal}
            disabled={sendingSignal}
            className="px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 font-medium rounded-xl transition-all flex items-center gap-2"
          >
            {sendingSignal ? 'Sending Signal...' : 'Send Distress Signal'}
          </button>
        </div>
      </div>
    </div>
  );
}
