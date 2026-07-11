import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Loader2, ArrowLeft, Brain, Clock, Target, Calendar,
  CheckCircle2, XCircle, HelpCircle, Check, X, AlertCircle
} from 'lucide-react';

const scoreColorClass = (pct) => {
  if (pct >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (pct >= 50) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-red-400 bg-red-500/10 border-red-500/20';
};

const diffConfig = {
  easy: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  medium: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  hard: { color: 'text-red-400 bg-red-500/10 border-red-500/20' }
};

export default function QuizReviewPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await api.get(`/quizzes/attempt/${attemptId}`);
        if (response.data.success) {
          setAttempt(response.data.data.attempt);
          setQuestions(response.data.data.questions);
        } else {
          toast.error('Failed to load review details');
          navigate('/dashboard');
        }
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Error loading attempt review');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [attemptId, navigate]);

  const scrollToQuestion = (idx) => {
    const el = document.getElementById(`q-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p>Loading attempt review...</p>
      </div>
    );
  }

  if (!attempt) return null;

  const scorePct = parseFloat(attempt.percentage || 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Back navigation */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
              {attempt.quiz_type} Quiz
            </span>
            <span className={`px-2.5 py-0.5 rounded text-xs font-semibold capitalize border ${diffConfig[attempt.difficulty]?.color || 'bg-slate-800'}`}>
              {attempt.difficulty}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{attempt.title}</h1>
          <p className="text-slate-400 text-sm">{attempt.description || 'No description provided.'}</p>
        </div>

        {/* Score Ring / Block */}
        <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl border shadow-lg ${scoreColorClass(scorePct)}`}>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">Attempt Score</p>
            <p className="text-3xl font-extrabold">{scorePct.toFixed(1)}%</p>
            <p className="text-xs font-semibold mt-0.5">{attempt.score} / {attempt.total_marks} Marks</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400"><Target className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-500">Student</p>
            <p className="text-sm font-bold text-white truncate max-w-[120px]">{attempt.student_name}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400"><Clock className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-500">Time Taken</p>
            <p className="text-sm font-bold text-white">{Math.floor(attempt.time_taken_secs / 60)}m {attempt.time_taken_secs % 60}s</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400"><Calendar className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-500">Completed On</p>
            <p className="text-sm font-bold text-white">{new Date(attempt.completed_at || attempt.started_at).toLocaleDateString()}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400"><Brain className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-500">SWBI Impact</p>
            <p className={`text-sm font-bold ${parseFloat(attempt.swbi_delta) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {parseFloat(attempt.swbi_delta) >= 0 ? `+${attempt.swbi_delta}` : attempt.swbi_delta} pts
            </p>
          </div>
        </Card>
      </div>

      {/* AI Feedback Banner */}
      {attempt.ai_feedback && (
        <Card className="border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex gap-4">
            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400 h-10 w-10 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">AI Performance Summary</h4>
              <p className="text-slate-300 text-sm leading-relaxed">{attempt.ai_feedback}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left column: Questions */}
        <div className="lg:col-span-3 space-y-6">
          {questions.map((q, idx) => {
            const isCorrect = q.student_answer?.is_correct === 1;
            const hasSelected = q.student_answer !== null;
            const selectedOptId = q.student_answer?.selected_option;

            return (
              <div
                key={q.id}
                id={`q-${idx}`}
                className={`bg-slate-900/40 border rounded-2xl p-6 transition-all space-y-5 relative scroll-mt-24 ${
                  hasSelected ? (isCorrect ? 'border-emerald-500/20 hover:border-emerald-500/35' : 'border-red-500/20 hover:border-red-500/35') : 'border-slate-800'
                }`}
              >
                {/* Question Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Question {idx + 1}</span>
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${
                      hasSelected ? (isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400') : 'bg-slate-800 text-slate-400'
                    }`}>
                      {hasSelected ? (
                        isCorrect ? (
                          <><Check className="w-3.5 h-3.5" /> Correct</>
                        ) : (
                          <><X className="w-3.5 h-3.5" /> Incorrect</>
                        )
                      ) : (
                        'Not Attempted'
                      )}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}</span>
                </div>

                <h3 className="font-bold text-white text-base md:text-lg leading-relaxed">{q.question_text}</h3>

                {/* Options List */}
                <div className="space-y-3">
                  {q.options?.map((opt) => {
                    const isSelected = selectedOptId === opt.id;
                    const isCorrectOption = opt.is_correct === 1;

                    let optionStyle = 'bg-slate-850/50 border-slate-800 text-slate-300';
                    let icon = null;

                    if (isSelected) {
                      if (isCorrectOption) {
                        optionStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-200';
                        icon = <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
                      } else {
                        optionStyle = 'bg-red-500/15 border-red-500 text-red-200';
                        icon = <X className="w-4 h-4 text-red-400 flex-shrink-0" />;
                      }
                    } else if (isCorrectOption) {
                      // Highlight correct answer if the student was wrong
                      optionStyle = 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300';
                      icon = <Check className="w-4 h-4 text-emerald-400/80 flex-shrink-0" />;
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-4 rounded-xl border flex items-center justify-between gap-4 text-sm font-medium ${optionStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isSelected
                              ? (isCorrectOption ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white')
                              : (isCorrectOption ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400')
                          }`}>
                            {opt.option_label}
                          </div>
                          <span>{opt.option_text}</span>
                        </div>
                        {icon}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="mt-4 p-4 bg-slate-800/35 border border-slate-800 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                      <AlertCircle className="w-4 h-4" /> Explanation
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right column: Sticky Navigation Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <Card className="bg-slate-900 border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-4">Review Navigator</h3>
              
              <div className="grid grid-cols-5 gap-2.5">
                {questions.map((q, idx) => {
                  const isCorrect = q.student_answer?.is_correct === 1;
                  const hasSelected = q.student_answer !== null;

                  return (
                    <button
                      key={q.id}
                      onClick={() => scrollToQuestion(idx)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                        hasSelected
                          ? (isCorrect
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                            : 'bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30')
                          : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-750'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
                <div className="flex items-center gap-2.5 text-xs text-slate-400">
                  <div className="w-3.5 h-3.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40" />
                  <span>Correct Answer</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-400">
                  <div className="w-3.5 h-3.5 rounded-lg bg-red-500/20 border border-red-500/40" />
                  <span>Incorrect Answer</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-400">
                  <div className="w-3.5 h-3.5 rounded-lg bg-slate-800 border border-slate-700" />
                  <span>Not Attempted</span>
                </div>
              </div>
            </Card>
            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white rounded-xl font-semibold text-sm transition-all"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
