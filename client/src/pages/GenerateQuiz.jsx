import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sparkles, Brain, Loader2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function GenerateQuiz() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    difficulty: 'medium',
    numQuestions: 5,
    quizType: 'academic'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Generating AI Quiz... This may take up to a minute.');

    try {
      const response = await api.post('/ai/generate-quiz', formData);
      if (response.data.success) {
        toast.success('Quiz generated successfully!', { id: toastId });
        navigate(`/quiz-preview/${response.data.data.quizId}`);
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.error(error.response?.data?.message || 'Failed to generate quiz. Please try again.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-2">
          AI Quiz Generator
        </h1>
        <p className="text-slate-400">Instantly generate high-quality assessments for your students.</p>
      </div>

      <Card className="p-8 border-violet-500/20 shadow-[0_0_30px_rgba(139,92,246,0.05)]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Topic or Subject Matter</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Brain className="h-5 w-5 text-violet-400" />
              </div>
              <input 
                type="text" 
                required
                value={formData.topic}
                onChange={(e) => setFormData({...formData, topic: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all placeholder:text-slate-600"
                placeholder="e.g. Data Structures and Algorithms, Cellular Biology, etc."
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Difficulty Level</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                disabled={loading}
              >
                <option value="easy">Easy (Beginner)</option>
                <option value="medium">Medium (Intermediate)</option>
                <option value="hard">Hard (Advanced)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Number of Questions</label>
              <select
                value={formData.numQuestions}
                onChange={(e) => setFormData({...formData, numQuestions: parseInt(e.target.value)})}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                disabled={loading}
              >
                <option value={3}>3 Questions (Quick Test)</option>
                <option value={5}>5 Questions (Standard)</option>
                <option value={10}>10 Questions (Comprehensive)</option>
              </select>
            </div>
          </div>

          <Button 
            type="submit" 
            fullWidth 
            className="mt-8 h-12 text-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 border-none shadow-[0_0_20px_rgba(139,92,246,0.3)]" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Generating Quiz...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Generate Magic Quiz
              </span>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
