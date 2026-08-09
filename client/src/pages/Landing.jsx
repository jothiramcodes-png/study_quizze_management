import { Link } from 'react-router-dom';
import { Brain, Sparkles, GraduationCap, Users, ShieldCheck, ArrowRight, Activity, TrendingUp, BookOpen } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-900 bg-grid-pattern relative overflow-hidden flex flex-col">
      {/* Background glowing blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/20 blur-[120px] pointer-events-none" />

      {/* Navbar Placeholder */}
      <nav className="w-full p-6 flex justify-between items-center relative z-10 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
            <Brain className="w-8 h-8 text-indigo-400" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">MindTrack AI</span>
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="px-6 py-2.5 rounded-full font-medium text-slate-300 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link to="/login" className="px-6 py-2.5 rounded-full font-medium text-white bg-gradient-primary shadow-lg shadow-indigo-500/25">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10 mt-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-indigo-500/30 text-indigo-300 text-sm font-medium mb-8">
          <Sparkles className="w-4 h-4" />
          <span>Powered by Gemini AI</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight mb-6 text-white">
          Supporting Student Well-Being with <span className="text-gradient from-indigo-400 to-cyan-400">Intelligent Insights</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-16 leading-relaxed">
          A comprehensive ecosystem connecting students, teachers, and administrators. 
          Monitor mental health, track academic progress, and provide early support through AI-generated assessments.
        </p>

        {/* Unified Portal Card */}
        <div className="max-w-xl w-full px-4 mb-20 animate-fadeIn">
          <div className="group glass-card rounded-3xl p-10 text-center glass-card-hover relative overflow-hidden flex flex-col items-center">
            {/* Background blur blobs */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-indigo-500/20" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl -ml-10 -mb-10 transition-all group-hover:bg-violet-500/20" />
            
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
            </div>

            <h3 className="text-3xl font-extrabold text-white mb-3">Unified Portal Access</h3>
            <p className="text-slate-400 mb-8 max-w-sm">
              Sign in to access your dashboard. The system will automatically direct you to your personalized workspace (Student, Teacher, or Admin) based on your account.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Link 
                to="/login" 
                className="flex-1 px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-primary shadow-lg shadow-indigo-500/20 text-center flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Sign In <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                to="/register" 
                className="flex-1 px-8 py-3.5 rounded-xl font-semibold text-slate-300 hover:text-white bg-slate-800/40 border border-slate-700/60 hover:bg-slate-800 text-center flex items-center justify-center transition-all"
              >
                Register Here
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full border-t border-slate-800 pt-10 pb-16">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 mb-3 text-emerald-400">
              <Activity className="w-6 h-6" />
            </div>
            <h4 className="text-3xl font-bold text-white mb-1">Real-time</h4>
            <span className="text-sm text-slate-400 uppercase tracking-wider font-medium">Well-being Tracking</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 mb-3 text-blue-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h4 className="text-3xl font-bold text-white mb-1">AI-Powered</h4>
            <span className="text-sm text-slate-400 uppercase tracking-wider font-medium">Predictive Analytics</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 mb-3 text-amber-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="text-3xl font-bold text-white mb-1">Seamless</h4>
            <span className="text-sm text-slate-400 uppercase tracking-wider font-medium">Academic Integration</span>
          </div>
        </div>
      </main>
    </div>
  );
}