import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CheckCircle2, ArrowLeft, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function QuizPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const response = await api.get(`/quizzes/${id}/preview`);
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching quiz preview:', err);
        toast.error(err.response?.data?.message || 'Failed to load quiz preview');
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p>Loading quiz preview...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-slate-400">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-lg">Quiz not found or you don't have access.</p>
        <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const { quiz, questions } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">{quiz.title}</h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Preview Mode
            </span>
          </div>
          <p className="text-slate-400">{quiz.topic} • {quiz.total_questions} Questions • {quiz.duration_mins} Mins</p>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-300">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm">You are viewing the quiz in Preview Mode. Correct answers are highlighted in green.</p>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((q, idx) => (
          <Card key={q.id} className="overflow-hidden border border-slate-700/60 bg-slate-800/40">
            <div className="p-6">
              <h3 className="text-lg font-medium text-white mb-6">
                <span className="text-indigo-400 font-bold mr-2">Q{idx + 1}.</span> 
                {q.question_text}
              </h3>
              
              <div className="space-y-3 pl-8">
                {q.options.map(opt => {
                  const isCorrect = opt.is_correct === 1;
                  return (
                    <div 
                      key={opt.id} 
                      className={`relative flex items-center p-4 rounded-xl border transition-all ${
                        isCorrect 
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                          : 'bg-slate-900/50 border-slate-700/50 text-slate-300'
                      }`}
                    >
                      <div className="flex-1 font-medium">{opt.option_text}</div>
                      {isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 ml-3" />
                      )}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="mt-6 ml-8 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold mb-2">
                    <Sparkles className="w-4 h-4" /> AI Explanation
                  </div>
                  <p className="text-sm text-indigo-200/80 leading-relaxed">
                    {q.explanation}
                  </p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
