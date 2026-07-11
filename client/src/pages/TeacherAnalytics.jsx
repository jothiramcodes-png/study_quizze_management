import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Bar, Line
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  Title, Tooltip, Filler, Legend
} from 'chart.js';
import {
  BarChart2, TrendingUp, Users, Target, AlertCircle, Activity, Loader2
} from 'lucide-react';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  Title, Tooltip, Filler, Legend
);

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
    x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
  },
};

export default function TeacherAnalytics() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [students, setStudents] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState([]);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [dashRes, studentsRes, analyticsRes] = await Promise.all([
        api.get('/teachers/dashboard'),
        api.get('/teachers/students'),
        api.get('/teachers/analytics'),
      ]);
      if (dashRes.data.success) setSummary(dashRes.data.data);
      if (studentsRes.data.success) setStudents(studentsRes.data.data);
      if (analyticsRes.data.success) setWeeklyTrend(analyticsRes.data.data.weeklyTrend || []);
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // Risk distribution for pie-like bar
  const riskCounts = {
    high: students.filter(s => s.risk_level === 'high').length,
    medium: students.filter(s => s.risk_level === 'medium').length,
    low: students.filter(s => s.risk_level === 'low').length,
  };

  // SWBI distribution buckets
  const swbiBuckets = { '0-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
  students.forEach(s => {
    const score = parseFloat(s.swbi_score) || 0;
    if (score <= 40) swbiBuckets['0-40']++;
    else if (score <= 60) swbiBuckets['41-60']++;
    else if (score <= 80) swbiBuckets['61-80']++;
    else swbiBuckets['81-100']++;
  });

  const riskBarData = {
    labels: ['High Risk', 'Medium Risk', 'Low Risk'],
    datasets: [{
      data: [riskCounts.high, riskCounts.medium, riskCounts.low],
      backgroundColor: [
        'rgba(239,68,68,0.6)', 'rgba(245,158,11,0.6)', 'rgba(16,185,129,0.6)'
      ],
      borderColor: [
        'rgba(239,68,68,0.8)', 'rgba(245,158,11,0.8)', 'rgba(16,185,129,0.8)'
      ],
      borderWidth: 1,
      borderRadius: 8,
    }]
  };

  const swbiBarData = {
    labels: Object.keys(swbiBuckets),
    datasets: [{
      label: 'Students',
      data: Object.values(swbiBuckets),
      backgroundColor: 'rgba(99,102,241,0.5)',
      borderColor: 'rgba(99,102,241,0.8)',
      borderWidth: 1,
      borderRadius: 8,
    }]
  };

  const weeklyLineData = {
    labels: weeklyTrend.map(w => `Week ${w.week?.split('-')[1] || w.week}`),
    datasets: [{
      label: 'Avg Score',
      data: weeklyTrend.map(w => parseFloat(w.avg_score || 0).toFixed(1)),
      fill: true,
      backgroundColor: 'rgba(99,102,241,0.08)',
      borderColor: 'rgba(99,102,241,0.7)',
      tension: 0.4,
      pointBackgroundColor: 'rgba(99,102,241,1)',
      pointRadius: 4,
    }]
  };

  const weeklyLineOptions = {
    ...chartDefaults,
    scales: {
      ...chartDefaults.scales,
      y: { ...chartDefaults.scales.y, min: 0, max: 100, ticks: { color: '#94a3b8', callback: v => `${v}%` } }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
          Class Analytics
        </h1>
        <p className="text-slate-400">Well-being and performance insights for your assigned students.</p>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400"><Users className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-slate-400">Total Students</p>
              <p className="text-xl font-bold text-white">{summary.total_students}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/20 rounded-xl text-red-400"><AlertCircle className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-slate-400">At-Risk Students</p>
              <p className="text-xl font-bold text-white">{summary.at_risk_count}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 rounded-xl text-cyan-400"><Target className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-slate-400">Class Avg Score</p>
              <p className="text-xl font-bold text-white">{summary.avg_score}%</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-500/20 rounded-xl text-violet-400"><Activity className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-slate-400">Feedback Given</p>
              <p className="text-xl font-bold text-white">{summary.feedback_given}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Performance Trend */}
        <Card className="flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">Weekly Performance Trend</h3>
          </div>
          <div className="h-64">
            {weeklyTrend.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                No weekly data available yet
              </div>
            ) : (
              <Line data={weeklyLineData} options={weeklyLineOptions} />
            )}
          </div>
        </Card>

        {/* Risk Distribution */}
        <Card className="flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold text-white">Risk Level Distribution</h3>
          </div>
          <div className="h-64">
            {students.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                No student data available
              </div>
            ) : (
              <Bar data={riskBarData} options={chartDefaults} />
            )}
          </div>
        </Card>
      </div>

      {/* SWBI Score Distribution */}
      <Card className="flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <BarChart2 className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-semibold text-white">SWBI Score Distribution</h3>
          <span className="ml-auto text-xs text-slate-500">Well-Being Index Buckets</span>
        </div>
        <div className="h-64">
          {students.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              No student data available
            </div>
          ) : (
            <Bar data={swbiBarData} options={{
              ...chartDefaults,
              plugins: {
                ...chartDefaults.plugins,
                tooltip: {
                  callbacks: { label: ctx => ` ${ctx.parsed.y} student${ctx.parsed.y !== 1 ? 's' : ''}` }
                }
              }
            }} />
          )}
        </div>
      </Card>

      {/* Student Performance Table */}
      <Card>
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" />
          Student Overview
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-800">
                <th className="pb-3 text-xs font-medium text-slate-500 pr-4">Name</th>
                <th className="pb-3 text-xs font-medium text-slate-500 pr-4">Roll No.</th>
                <th className="pb-3 text-xs font-medium text-slate-500 pr-4">SWBI Score</th>
                <th className="pb-3 text-xs font-medium text-slate-500 pr-4">Semester</th>
                <th className="pb-3 text-xs font-medium text-slate-500">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">No students assigned</td>
                </tr>
              ) : (
                students.map(s => {
                  const risk = riskConfig[s.risk_level] || riskConfig.low;
                  return (
                    <tr key={s.student_id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 pr-4 text-slate-200 font-medium">{s.name}</td>
                      <td className="py-3 pr-4 text-slate-400">{s.roll_number}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                parseFloat(s.swbi_score) >= 70 ? 'bg-emerald-400' :
                                parseFloat(s.swbi_score) >= 50 ? 'bg-amber-400' : 'bg-red-400'
                              }`}
                              style={{ width: `${s.swbi_score || 0}%` }}
                            />
                          </div>
                          <span className="text-slate-300 text-xs">{s.swbi_score ?? '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-slate-400">{s.semester}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${risk.bg} ${risk.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
                          {s.risk_level}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

const riskConfig = {
  high: { label: 'High Risk', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', dot: 'bg-red-400' },
  medium: { label: 'Medium Risk', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', dot: 'bg-amber-400' },
  low: { label: 'Low Risk', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400' },
};
