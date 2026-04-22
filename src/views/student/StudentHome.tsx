import React from 'react';
import { motion } from 'motion/react';
import { 
  Lightbulb, 
  MessageSquare, 
  BookOpen, 
  FileSearch,
  Zap,
  Calculator,
  ArrowRight,
  Sparkles,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';

interface StudentHomeProps {
  onNavigate: (view: string) => void;
}

export default function StudentHome({ onNavigate }: StudentHomeProps) {
  return (
    <div className="space-y-12">
      {/* Editorial Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-px bg-[#1a237e]/30" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1a237e]">Student Hub</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85]">
            Pursue <br /> 
            <span className="text-[#1a237e] font-editorial italic lowercase tracking-tight capitalize">Wisdom.</span>
          </h1>
          <p className="max-w-md text-[#57534e] text-sm font-medium leading-relaxed">
            Your high-tech companion for navigating school life at St. Michael's School.
          </p>
        </div>

        <div className="flex flex-col items-start lg:items-end gap-2">
          <div className="flex items-center gap-3 p-4 bg-[#f8f9fa] border border-[#e7e5e4] rounded-[2rem] shadow-sm">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-[#1a237e] shadow-inner">
              <Zap className="w-5 h-5 flex-shrink-0" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#57534e] opacity-40">Motto</p>
              <p className="font-serif italic text-base text-[#1c1917]">"Light and Truth"</p>
            </div>
          </div>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-5 auto-rows-[180px]">
        
        {/* Doubt Solver - Large Highlight */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          onClick={() => onNavigate('doubt')}
          className="md:col-span-3 lg:col-span-8 row-span-2 bg-gradient-to-br from-[#1a237e] to-[#283593] text-white p-12 rounded-[3.5rem] flex flex-col justify-between group relative overflow-hidden shadow-2xl shadow-[#1a237e]/20"
        >
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <Sparkles className="w-8 h-8 mb-6" />
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none mb-3">AI Doubt <br />Solver</h2>
              <p className="text-sm font-medium opacity-80 max-w-[280px]">
                Stuck on a concept? Get instant, simplified explanations tailored to your grade.
              </p>
            </div>
            <div className="w-20 h-20 bg-white/10 rounded-[2.5rem] backdrop-blur-md flex items-center justify-center border border-white/20">
              <Lightbulb className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <div className="relative z-10 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] group-hover:gap-5 transition-all">
            Get Clarity Now <ArrowRight className="w-4 h-4" />
          </div>

          <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-amber-500/10 rounded-full blur-[80px]" />
          <div className="absolute top-[-20%] left-[-20%] w-64 h-64 bg-white/5 rounded-full blur-[80px]" />
        </motion.button>

        {/* Assignment Assistant - Medium */}
        <motion.button
          whileHover={{ scale: 0.98 }}
          onClick={() => onNavigate('assignment')}
          className="md:col-span-3 lg:col-span-4 row-span-1 bg-white border border-[#e7e5e4] p-8 rounded-[3rem] flex flex-col justify-between hover:border-[#1a237e] transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1a237e]">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="bg-blue-50 px-3 py-1 rounded-full text-[8px] font-black uppercase text-[#1a237e] tracking-widest">Helper</div>
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">Homework Aid</h2>
            <p className="text-[10px] font-bold text-[#57534e] mt-1 opacity-50">Assignment Assistant</p>
          </div>
        </motion.button>

        {/* Digital Library - Medium */}
        <motion.button
          whileHover={{ scale: 0.98 }}
          onClick={() => onNavigate('resources')}
          className="md:col-span-3 lg:col-span-4 row-span-1 bg-[#f8f9fa] border border-[#e7e5e4] p-8 rounded-[3rem] flex flex-col justify-between hover:border-[#1a237e] transition-all group"
        >
          <div className="flex justify-between items-center">
            <BookOpen className="w-6 h-6 text-[#1a237e]" />
            <ArrowRight className="w-4 h-4 text-[#57534e] opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">Digital Library</h2>
            <p className="text-[10px] font-bold text-[#57534e] mt-1 opacity-50">NCERT Hub</p>
          </div>
        </motion.button>

        {/* Analyze - Square */}
        <motion.button
          whileHover={{ scale: 0.98 }}
          onClick={() => onNavigate('analyze')}
          className="md:col-span-3 lg:col-span-4 row-span-1 bg-[#1c1917] text-white p-8 rounded-[3rem] flex items-center justify-between group overflow-hidden"
        >
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
              <FileSearch className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h2 className="text-base font-black uppercase tracking-widest">Progress</h2>
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Growth Analyzer</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-white opacity-40 group-hover:translate-x-1 transition-all" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#1a237e]/20 rounded-full blur-[40px]" />
        </motion.button>

        {/* Calculator - Small/Inline */}
        <motion.button
          whileHover={{ scale: 0.98 }}
          onClick={() => onNavigate('calculator')}
          className="md:col-span-3 lg:col-span-4 row-span-1 border border-[#e7e5e4] p-8 rounded-[3rem] flex items-center justify-center gap-6 hover:bg-blue-50 hover:border-[#1a237e] transition-all group"
        >
          <Calculator className="w-6 h-6 text-[#1a237e]" />
          <span className="text-sm font-black uppercase tracking-[0.2em] text-[#1c1917]">Student Calculator</span>
        </motion.button>

        {/* Permissions - Square */}
        <motion.button
          whileHover={{ scale: 0.98 }}
          onClick={() => onNavigate('student-submissions')}
          className="md:col-span-3 lg:col-span-4 row-span-1 bg-white border border-[#e7e5e4] p-8 rounded-[3rem] flex flex-col justify-between hover:border-[#1a237e] transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">Submission</h2>
            <p className="text-[10px] font-bold text-[#57534e] mt-1 opacity-50">Docs & Applications</p>
          </div>
        </motion.button>

        {/* Decorative Quote - Square */}
        <div className="hidden lg:flex md:col-span-3 lg:col-span-4 row-span-1 bg-blue-50 p-8 rounded-[3rem] border border-[#1a237e]/10 flex-col items-center justify-center text-center">
          <GraduationCap className="w-6 h-6 text-[#1a237e] mb-4 opacity-40" />
          <p className="font-editorial italic text-xl text-[#1a237e] leading-tight mb-2">"Light and Truth"</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-[#57534e]">St. Michael's school</p>
        </div>
      </div>

      {/* Decorative Section */}
      <div className="relative h-[200px] w-full rounded-[4rem] overflow-hidden group">
        <img 
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2670&auto=format&fit=crop" 
          alt="Creative Collaboration" 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1c1917] via-[#1c1917]/20 to-transparent" />
        <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 flex items-center gap-6">
          <p className="text-white text-3xl md:text-4xl font-black uppercase tracking-tighter">Your Future <br /> <span className="font-editorial text-[#f59e0b]">Begins Here.</span></p>
        </div>
      </div>
    </div>
  );
}
