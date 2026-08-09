import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler
} from 'chart.js';
import { Users, AlertTriangle, FileCheck, MessageSquare, TrendingUp, Search, X, Loader2, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_students: 0,
    at_risk_count: 0,
    avg_score: 0,
    feedback_given: 0,
    quizzes: [],
    recent_attempts: []
  });
  const [students, setStudents] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('quizzes');
  
  // Student detail state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState({
    results: [],
    history: [],
    loading: false
  });
  const [feedbackCategory, setFeedbackCategory] = useState('general');
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, studentsRes, trendRes] = await Promise.all([
        api.get('/teachers/dashboard'),
        api.get('/teachers/students'),
        api.get('/teachers/analytics')
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (studentsRes.data.success) setStudents(studentsRes.data.data);
      if (trendRes.data.success) setWeeklyTrend(trendRes.data.data.weeklyTrend || []);
    } catch (err) {
      console.error('Error loading teacher dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setStudentDetails({ results: [], history: [], loading: true });
    try {
      const [resultsRes, historyRes] = await Promise.all([
        api.get(`/teachers/students/${student.student_id}/results`),
        api.get(`/teachers/students/${student.student_id}/swbi`)
      ]);
      setStudentDetails({
        results: resultsRes.data.success ? resultsRes.data.data : [],
        history: historyRes.data.success ? historyRes.data.data : [],
        loading: false
      });
    } catch (err) {
      console.error('Error loading student details:', err);
      toast.error('Failed to load student details');
      setStudentDetails(prev => ({ ...prev, loading: false }));
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      toast.error('Please enter feedback');
      return;
    }
    setSubmittingFeedback(true);
    try {
      const response = await api.post('/teachers/feedback', {
        student_id: selectedStudent.student_id,
        category: feedbackCategory,
        feedback_text: feedbackText
      });
      if (response.data.success) {
        toast.success('Feedback submitted successfully!');
        setFeedbackText('');
        // Refresh dashboard metrics
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chartData = {
    labels: weeklyTrend.map(w => `Week ${w.week.split('-')[1] || w.week}`),
    datasets: [{
      label: 'Class Average %',
      data: weeklyTrend.map(w => parseFloat(w.avg_score || 0)),
      borderColor: 'rgba(139, 92, 246, 0.8)',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      fill: true,
      tension: 0.4,
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
        <p>Loading teacher dashboard data...</p>
      </div>
    );
  }

  // Render detail view if a student is selected
  if (selectedStudent) {
    const studentHistoryData = {
      labels: studentDetails.history.map(h => {
        const d = new Date(h.report_date);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'SWBI Well-being Score',
          data: studentDetails.history.map(h => parseFloat(h.swbi_score || 0)),
          borderColor: 'rgba(16, 185, 129, 0.8)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Academic Score %',
          data: studentDetails.history.map(h => parseFloat(h.academic_score || 0)),
          borderColor: 'rgba(99, 102, 241, 0.8)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
        }
      ]
    };

    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedStudent(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Student List
        </button>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{selectedStudent.name}</h1>
            <p className="text-slate-400">Roll No: {selectedStudent.roll_number} • Semester {selectedStudent.semester}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Current Risk Status:</span>
            <span className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
              selectedStudent.risk_level === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]' :
              selectedStudent.risk_level === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {selectedStudent.risk_level} Risk
            </span>
          </div>
        </div>

        {studentDetails.loading ? (
          <div className="flex justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mr-2" /> Loading student details...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart of Student SWBI vs Academic */}
            <Card className="lg:col-span-2 flex flex-col min-h-[350px]">
              <h3 className="text-lg font-semibold text-white mb-6">Well-being vs Academic Trend</h3>
              <div className="flex-1 relative w-full">
                <Line 
                  data={studentHistoryData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: { min: 0, max: 100, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                      x: { grid: { display: false } }
                    }
                  }} 
                />
              </div>
            </Card>

            {/* Submit Feedback Form */}
            <Card className="flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-6">Send Student Feedback</h3>
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                    <select
                      value={feedbackCategory}
                      onChange={(e) => setFeedbackCategory(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="general">General Support</option>
                      <option value="academic">Academic Intervention</option>
                      <option value="emotional">Emotional Well-being</option>
                      <option value="social">Social integration</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Feedback Message</label>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      rows="4"
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                      placeholder="Write encouraging feedback or warning details..."
                    ></textarea>
                  </div>
                  <Button type="submit" className="w-full" disabled={submittingFeedback}>
                    {submittingFeedback ? 'Submitting...' : 'Send Feedback Message'}
                  </Button>
                </form>
              </div>
            </Card>

            {/* Quiz Attempt History Table */}
            <Card className="lg:col-span-3">
              <h3 className="text-lg font-semibold text-white mb-4">Quiz Attempt History</h3>
              {studentDetails.results.length === 0 ? (
                <p className="text-slate-500 text-sm py-4">No quiz attempts recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-800/50 text-slate-400 uppercase text-xs">
                      <tr>
                        <th className="p-4">Quiz Name</th>
                        <th className="p-4">Topic</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Score</th>
                        <th className="p-4">Percentage</th>
                        <th className="p-4">Date Taken</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {studentDetails.results.map((att) => (
                        <tr key={att.id} className="hover:bg-slate-800/30">
                          <td className="p-4 font-medium text-white">{att.title}</td>
                          <td className="p-4">{att.topic}</td>
                          <td className="p-4 capitalize">{att.quiz_type}</td>
                          <td className="p-4">{att.score} / {att.total_marks}</td>
                          <td className="p-4">{att.percentage}%</td>
                          <td className="p-4">{new Date(att.completed_at || att.started_at).toLocaleDateString()}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              att.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>{att.status}</span>
                          </td>
                          <td className="p-4 text-right">
                            {att.status === 'completed' && (
                              <button
                                onClick={() => navigate(`/quiz/attempt/${att.id}`)}
                                className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 rounded-lg text-xs font-semibold transition-all"
                              >
                                View Details
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-2">
            Teacher Dashboard
          </h1>
          <p className="text-slate-400">Overview of your students' performance and well-being.</p>
        </div>
        <button className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 font-medium text-sm hover:bg-slate-700 transition-colors flex items-center gap-2">
          Generate Class Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="flex items-center gap-4 border-l-4 border-l-violet-500">
          <div className="p-3 bg-violet-500/20 rounded-xl text-violet-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400">My Students</p>
            <p className="text-2xl font-bold text-white">{stats.total_students}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 border-l-4 border-l-red-500">
          <div className="p-3 bg-red-500/20 rounded-xl text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400">At Risk</p>
            <p className="text-2xl font-bold text-white">{stats.at_risk_count}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 border-l-4 border-l-cyan-500">
          <div className="p-3 bg-cyan-500/20 rounded-xl text-cyan-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400 border-b border-slate-700 pb-1 mb-1">Avg Score</p>
            <p className="text-2xl font-bold text-white">{stats.avg_score}%</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 border-l-4 border-l-indigo-500">
          <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Feedback Given</p>
            <p className="text-2xl font-bold text-white">{stats.feedback_given}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2 flex flex-col min-h-[400px]">
          <h3 className="text-lg font-semibold text-white mb-6">Class Performance Trend</h3>
          <div className="flex-1 w-full relative">
            {weeklyTrend.length === 0 ? (
              <p className="text-slate-500 py-20 text-center">No weekly performance trend logs recorded yet.</p>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>
        </Card>

        {/* Search Student & Click details list */}
        <Card className="flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4">Guidance Student List</h3>
          
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 text-sm text-white rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-violet-500"
              placeholder="Search by name or roll number..."
            />
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] pr-2">
            {filteredStudents.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No students found.</p>
            ) : (
              filteredStudents.map((s) => (
                <div 
                  key={s.student_id} 
                  onClick={() => handleSelectStudent(s)}
                  className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-violet-500 hover:bg-slate-800 transition-all flex justify-between items-center cursor-pointer group"
                >
                  <div>
                    <p className="font-medium text-slate-200 group-hover:text-white transition-colors">{s.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{s.roll_number} • Sem {s.semester}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">SWBI: {s.swbi_score}</span>
                    <div className={`w-3 h-3 rounded-full ${
                      s.risk_level === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 
                      s.risk_level === 'medium' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 
                      'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                    }`} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Tabs for Quiz & Student Results */}
      <div className="space-y-4 pt-6 border-t border-slate-800/60">
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 -mb-[2px] ${
              activeTab === 'quizzes'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Quiz Performance Overview
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 -mb-[2px] ${
              activeTab === 'students'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Student Quiz Results
          </button>
        </div>

        {activeTab === 'quizzes' ? (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Quiz Performance Overview</h3>
                <p className="text-xs text-slate-500 mt-1">Average scores and completion metrics for all assessments in your school.</p>
              </div>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-500/20">{stats.quizzes?.length || 0} Quizzes</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/50 text-slate-400 uppercase text-xs">
                  <tr>
                    <th className="p-4">Quiz Title</th>
                    <th className="p-4">Topic</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Difficulty</th>
                    <th className="p-4">Questions</th>
                    <th className="p-4">Total Marks</th>
                    <th className="p-4">Attempts</th>
                    <th className="p-4">Class Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(stats.quizzes || []).map((q) => (
                    <tr key={q.id} className="hover:bg-slate-800/30 transition-all">
                      <td className="p-4 font-semibold text-white">{q.title}</td>
                      <td className="p-4 text-slate-300">{q.topic}</td>
                      <td className="p-4 capitalize text-slate-400">{q.quiz_type}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                          q.difficulty === 'hard' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          q.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{q.total_questions}</td>
                      <td className="p-4 text-slate-400">{q.total_marks}</td>
                      <td className="p-4 font-medium text-slate-300">{q.attempts_count}</td>
                      <td className={`p-4 font-bold ${
                        parseFloat(q.avg_score) >= 80 ? 'text-emerald-400' :
                        parseFloat(q.avg_score) >= 50 ? 'text-amber-400' : 
                        parseFloat(q.avg_score) > 0 ? 'text-red-400' : 'text-slate-500'
                      }`}>
                        {q.avg_score > 0 ? `${q.avg_score}%` : '—'}
                      </td>
                    </tr>
                  ))}
                  {(!stats.quizzes || stats.quizzes.length === 0) && (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-slate-500">No quizzes created yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Student Quiz Results</h3>
                <p className="text-xs text-slate-500 mt-1">Detailed scores and completion details for recent student quiz attempts.</p>
              </div>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-500/20">{stats.recent_attempts?.length || 0} Attempts</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/50 text-slate-400 uppercase text-xs">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Roll Number</th>
                    <th className="p-4">Quiz Title</th>
                    <th className="p-4">Topic</th>
                    <th className="p-4">Score</th>
                    <th className="p-4">Percentage</th>
                    <th className="p-4">Completed Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(stats.recent_attempts || []).map((att) => (
                    <tr key={att.id} className="hover:bg-slate-800/30 transition-all">
                      <td className="p-4 font-semibold text-white">{att.student_name}</td>
                      <td className="p-4 text-slate-400 font-medium">{att.roll_number}</td>
                      <td className="p-4 text-white font-medium">{att.quiz_title}</td>
                      <td className="p-4 text-slate-300">{att.topic}</td>
                      <td className="p-4 text-slate-300">{att.score} / {att.total_marks}</td>
                      <td className={`p-4 font-bold ${
                        att.percentage >= 80 ? 'text-emerald-400' :
                        att.percentage >= 50 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {att.percentage.toFixed(1)}%
                      </td>
                      <td className="p-4 text-slate-400">
                        {att.completed_at ? new Date(att.completed_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                          att.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {att.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {att.status === 'completed' && (
                          <button
                            onClick={() => navigate(`/quiz/attempt/${att.id}`)}
                            className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 rounded-xl text-xs font-semibold transition-all"
                          >
                            Review
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!stats.recent_attempts || stats.recent_attempts.length === 0) && (
                    <tr>
                      <td colSpan="9" className="p-8 text-center text-slate-500">No attempts logged yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
