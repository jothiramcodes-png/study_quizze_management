import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Brain, Clock, Loader2, CheckCircle2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({}); // { questionId: optionId }
  const [timeLeft, setTimeLeft] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState(null);

  const timerRef = useRef(null);
  const secondsElapsed = useRef(0);

  useEffect(() => {
    const startQuizFlow = async () => {
      try {
        // 1. Fetch Quiz details
        const quizRes = await api.get(`/quizzes/${id}`);
        if (!quizRes.data.success) {
          toast.error('Failed to load quiz');
          navigate('/dashboard');
          return;
        }

        const quizData = quizRes.data.data;
        setQuiz(quizData);
        setQuestions(quizData.questions || []);
        setTimeLeft(quizData.duration_mins * 60);

        // 2. Start attempt in DB
        const attemptRes = await api.post(`/quizzes/${id}/attempt/start`);
        if (attemptRes.data.success) {
          setAttemptId(attemptRes.data.data.attemptId);
        } else {
          toast.error('Could not start attempt');
          navigate('/dashboard');
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error('Quiz start error:', err);
        toast.error(err.response?.data?.message || 'Failed to start quiz');
        navigate('/dashboard');
      }
    };

    startQuizFlow();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id, navigate]);

  // Start timer interval once loaded
  useEffect(() => {
    if (loading || isCompleted) return;

    timerRef.current = setInterval(() => {
      secondsElapsed.current += 1;
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, isCompleted]);

  const handleOptionSelect = (questionId, optionId) => {
    setSelectedOptions(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleAutoSubmit = () => {
    toast.error('Time is up! Submitting your quiz answers...');
    submitQuiz();
  };

  const submitQuiz = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setLoading(true);

    // Format answers
    const answersArray = questions.map(q => ({
      question_id: q.id,
      selected_option_id: selectedOptions[q.id] || null
    }));

    try {
      const response = await api.post(`/quizzes/attempt/${attemptId}/submit`, {
        answers: answersArray,
        timeTakenSecs: secondsElapsed.current
      });

      if (response.data.success) {
        setResults(response.data.data);
        setIsCompleted(true);
        toast.success('Quiz submitted successfully!');
      }
    } catch (err) {
      console.error('Quiz submission failed:', err);
      toast.error('Failed to submit quiz. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  if (loading && !isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm">Preparing assessment context...</p>
      </div>
    );
  }

  if (isCompleted && results) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full" />
          
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Quiz Completed!</h2>
            <p className="text-slate-400 text-sm mb-8">"{quiz?.title}" results have been processed.</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Your Score</p>
                <p className="text-2xl font-bold text-white">{results.score} / {results.totalMarks}</p>
                <p className="text-xs text-indigo-400 mt-1">({results.percentage}%)</p>
              </div>
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">SWBI Impact</p>
                <p className={`text-2xl font-bold ${
                  results.swbiDelta >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {results.swbiDelta >= 0 ? `+${results.swbiDelta}` : results.swbiDelta} pts
                </p>
                <p className="text-xs text-slate-400 mt-1">Well-being index updated</p>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button onClick={() => navigate('/dashboard')} className="px-8 py-3">
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const answeredCount = Object.keys(selectedOptions).length;
  const progressPercent = (answeredCount / questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
            <Brain className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-md font-bold text-white line-clamp-1">{quiz?.title}</h1>
            <p className="text-xs text-slate-500 capitalize">{quiz?.quiz_type} • {quiz?.difficulty}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg text-slate-300 font-semibold border border-slate-700">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="font-mono text-sm">{formatTime(timeLeft)}</span>
          </div>
          <button 
            onClick={() => {
              if (window.confirm('Are you sure you want to exit? Your current progress will not be saved.')) {
                navigate('/dashboard');
              }
            }}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-slate-850 h-1">
        <div 
          className="bg-indigo-500 h-1 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Workspace */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left Side: Question Sheet */}
        <div className="md:col-span-3 space-y-6">
          <Card padding="p-6 md:p-8" className="bg-slate-900/60 border border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Question {currentIdx + 1} of {questions.length}
              </span>
              <span className="text-xs text-slate-500">
                {currentQuestion.marks} Marks
              </span>
            </div>

            <h2 className="text-lg md:text-xl font-bold text-white mb-8 leading-relaxed">
              {currentQuestion.question_text}
            </h2>

            {/* Answer Options */}
            <div className="space-y-4">
              {currentQuestion.options?.map((opt) => {
                const isSelected = selectedOptions[currentQuestion.id] === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleOptionSelect(currentQuestion.id, opt.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${
                      isSelected
                        ? 'bg-indigo-500/15 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                        : 'bg-slate-850/50 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {opt.option_label}
                    </div>
                    <span className="text-sm font-medium">{opt.option_text}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(prev => prev - 1)}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>

            {currentIdx < questions.length - 1 ? (
              <Button
                onClick={() => setCurrentIdx(prev => prev + 1)}
                className="flex items-center gap-2"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (window.confirm('Are you sure you want to finish and submit your answers?')) {
                    submitQuiz();
                  }
                }}
                className="px-6 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Submit Assessment
              </Button>
            )}
          </div>
        </div>

        {/* Right Side: Grid Nav Navigator */}
        <div className="space-y-6">
          <Card padding="p-6" className="bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-4">Question Navigator</h3>
            
            <div className="grid grid-cols-5 gap-3">
              {questions.map((q, idx) => {
                const isAnswered = selectedOptions[q.id] !== undefined;
                const isCurrent = idx === currentIdx;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                      isCurrent
                        ? 'border-2 border-indigo-500 text-white bg-indigo-500/10'
                        : isAnswered
                        ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300'
                        : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-750'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3.5 h-3.5 rounded-lg border-2 border-indigo-500 bg-indigo-500/10" />
                <span>Current Question</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3.5 h-3.5 rounded-lg bg-indigo-600/20 border border-indigo-500/40" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3.5 h-3.5 rounded-lg bg-slate-800 border border-slate-700" />
                <span>Unvisited / Unanswered</span>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
