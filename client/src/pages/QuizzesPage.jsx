import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  CheckSquare, PlayCircle, Clock, BarChart2, BookOpen,
  Loader2, Search, Filter, Zap, Target, Brain
} from 'lucide-react';

const difficultyConfig = {
  easy: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400' },
  hard: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', dot: 'bg-red-400' },
};

const typeConfig = {
  ai_generated: { label: 'AI Generated', icon: Brain, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  manual: { label: 'Manual', icon: BookOpen, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  swbi_assessment: { label: 'SWBI Assessment', icon: Target, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
};

export default function QuizzesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [quizzesRes, attemptsRes] = await Promise.all([
        api.get('/quizzes'),
        api.get('/students/attempts'),
      ]);
      if (quizzesRes.data.success) setQuizzes(quizzesRes.data.data);
      if (attemptsRes.data.success) setAttempts(attemptsRes.data.data);
    } catch (err) {
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const completedQuizIds = new Set(
    attempts.filter(a => a.status === 'completed').map(a => a.quiz_id)
  );

  const filtered = quizzes.filter(q => {
    const matchSearch =
      q.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDiff = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
    const matchType = typeFilter === 'all' || q.quiz_type === typeFilter;
    return matchSearch && matchDiff && matchType;
  });

  const pending = filtered.filter(q => !completedQuizIds.has(q.id));
  const completed = filtered.filter(q => completedQuizIds.has(q.id));

  const handleStartQuiz = (quizId) => {
    navigate(`/quiz/${quizId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p>Loading quizzes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400 mb-2">
          My Quizzes
        </h1>
        <p className="text-slate-400">Browse and attempt your assigned quizzes and assessments.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400"><CheckSquare className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">Total Available</p>
            <p className="text-2xl font-bold text-white">{quizzes.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400"><Zap className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">Pending</p>
            <p className="text-2xl font-bold text-white">
              {quizzes.filter(q => !completedQuizIds.has(q.id)).length}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400"><Target className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">Completed</p>
            <p className="text-2xl font-bold text-white">{completedQuizIds.size}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search quizzes by title or topic..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <select
            value={difficultyFilter}
            onChange={e => setDifficultyFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500/50 cursor-pointer"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500/50 cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="manual">Manual</option>
            <option value="ai_generated">AI Generated</option>
            <option value="swbi_assessment">SWBI Assessment</option>
          </select>
        </div>
      </Card>

      {/* Pending Quizzes */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Pending ({pending.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {pending.map(quiz => {
              const diff = difficultyConfig[quiz.difficulty] || difficultyConfig.easy;
              const type = typeConfig[quiz.quiz_type] || typeConfig.manual;
              const TypeIcon = type.icon;
              return (
                <div
                  key={quiz.id}
                  className="group relative bg-slate-900/60 border border-slate-700/60 hover:border-indigo-500/40 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 cursor-pointer"
                  onClick={() => handleStartQuiz(quiz.id)}
                >
                  {/* Type badge */}
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium mb-3 ${type.bg} ${type.color}`}>
                    <TypeIcon className="w-3 h-3" />
                    {type.label}
                  </div>

                  <h3 className="font-semibold text-white text-base mb-1 group-hover:text-indigo-200 transition-colors">
                    {quiz.title}
                  </h3>
                  {quiz.description && (
                    <p className="text-slate-500 text-sm mb-3 line-clamp-2">{quiz.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5" />{quiz.total_questions} Qs
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />{quiz.duration_mins} min
                    </span>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${diff.bg} ${diff.color} font-medium`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
                      {quiz.difficulty}
                    </span>
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 rounded-xl font-medium text-sm transition-all group-hover:scale-[1.01]">
                    <PlayCircle className="w-4 h-4" /> Start Quiz
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Quizzes */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Completed ({completed.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {completed.map(quiz => {
              const attempt = attempts.find(a => a.quiz_id === quiz.id && a.status === 'completed');
              const diff = difficultyConfig[quiz.difficulty] || difficultyConfig.easy;
              return (
                <div
                  key={quiz.id}
                  className="relative bg-slate-900/30 border border-slate-800/60 rounded-2xl p-5 opacity-70"
                >
                  <div className="absolute top-4 right-4 flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Completed
                  </div>
                  <h3 className="font-semibold text-slate-300 text-base mb-1 pr-20">{quiz.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-600 mb-3">
                    <span className="flex items-center gap-1"><CheckSquare className="w-3 h-3" />{quiz.total_questions} Qs</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{quiz.duration_mins} min</span>
                    <span className={`flex items-center gap-1 capitalize ${diff.color}`}>{quiz.difficulty}</span>
                  </div>
                  {attempt && (
                    <div className="space-y-3 mt-3">
                      <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-xl">
                        <BarChart2 className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-400">
                          Score: <span className={`font-bold ${
                            attempt.percentage >= 80 ? 'text-emerald-400' :
                            attempt.percentage >= 50 ? 'text-amber-400' : 'text-red-400'
                          }`}>{parseFloat(attempt.percentage || 0).toFixed(1)}%</span>
                        </span>
                        <span className="text-xs text-slate-600 ml-auto">
                          {new Date(attempt.completed_at).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate(`/quiz/attempt/${attempt.id}`)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-300 rounded-xl text-xs font-semibold transition-all"
                      >
                        Review Answers
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <CheckSquare className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">No quizzes found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
