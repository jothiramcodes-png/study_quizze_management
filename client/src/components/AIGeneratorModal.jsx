import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, X, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AIGeneratorModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [quizType, setQuizType] = useState('academic');
  const [numQuestions, setNumQuestions] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);

  if (!isOpen) return null;

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setIsLoading(true);
    setGeneratedQuiz(null);

    try {
      const response = await api.post('/ai/generate-quiz', {
        topic,
        difficulty,
        quizType,
        numQuestions
      });

      if (response.data.success) {
        setGeneratedQuiz(response.data.data);
        toast.success('Quiz generated and saved successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setTopic('');
    setGeneratedQuiz(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[100px] pointer-events-none rounded-full" />
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
              <Brain className="w-6 h-6 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Gemini AI Generator</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {generatedQuiz ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Quiz Ready!</h3>
              <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                "{generatedQuiz.title}" has been created and saved to the database.
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="secondary" onClick={handleReset}>Close</Button>
                <Button onClick={() => {
                  onClose();
                  navigate(`/quiz-preview/${generatedQuiz.quizId}`);
                }}>View Quiz</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Quiz Topic</label>
                <input 
                  type="text" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Data Structures, Stress Management, Machine Learning..."
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Quiz Type</label>
                  <select 
                    value={quizType}
                    onChange={(e) => setQuizType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                    disabled={isLoading}
                  >
                    <option value="academic">Academic Assessment</option>
                    <option value="wellness">Mental Well-being</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty</label>
                  <select 
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                    disabled={isLoading}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="adaptive">Adaptive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Number of Questions: <span className="text-indigo-400 font-bold">{numQuestions}</span>
                </label>
                <input 
                  type="range" 
                  min="3" 
                  max="15" 
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  className="w-full accent-indigo-500"
                  disabled={isLoading}
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
                <Button type="submit" disabled={isLoading} className="min-w-[160px]">
                  {isLoading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-5 h-5 mr-2" /> Generate Quiz</>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
