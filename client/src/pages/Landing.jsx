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

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full px-4 mb-20">
          {/* Student Portal Card */}
          <Link to="/login?role=student" className="group glass-card rounded-2xl p-8 text-left glass-card-hover relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-cyan-500/20" />
            <div className="w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6">
              <GraduationCap className="w-7 h-7 text-cyan-400" />
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 mb-4 w-fit">
              For Learners
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Student Portal</h3>
            <p className="text-slate-400 mb-8 flex-1">Take AI-generated quizzes, view your well-being scores, and get personalized feedback from teachers.</p>
            <div className="flex items-center text-cyan-400 font-medium group-hover:translate-x-2 transition-transform">
              Access Portal <ArrowRight className="w-5 h-5 ml-2" />
            </div>
          </Link>

          {/* Teacher Portal Card */}
          <Link to="/login?role=teacher" className="group glass-card rounded-2xl p-8 text-left glass-card-hover relative overflow-hidden flex flex-col h-full mt-0 md:-mt-8 mb-0 md:mb-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-violet-500/20" />
            <div className="w-14 h-14 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6">
              <Users className="w-7 h-7 text-violet-400" />
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 mb-4 w-fit">
              For Educators
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Teacher Portal</h3>
            <p className="text-slate-400 mb-8 flex-1">Monitor your students' mental health, review quiz attempts, and identify at-risk students early.</p>
            <div className="flex items-center text-violet-400 font-medium group-hover:translate-x-2 transition-transform">
              Access Portal <ArrowRight className="w-5 h-5 ml-2" />
            </div>
          </Link>

          {/* Admin Portal Card */}
          <Link to="/login?role=admin" className="group glass-card rounded-2xl p-8 text-left glass-card-hover relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-indigo-500/20" />
            <div className="w-14 h-14 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
              <ShieldCheck className="w-7 h-7 text-indigo-400" />
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 mb-4 w-fit">
              For Management
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Admin Portal</h3>
            <p className="text-slate-400 mb-8 flex-1">Generate new quizzes using Gemini AI, manage departments, and view college-wide analytics.</p>
            <div className="flex items-center text-indigo-400 font-medium group-hover:translate-x-2 transition-transform">
              Access Portal <ArrowRight className="w-5 h-5 ml-2" />
            </div>
          </Link>
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