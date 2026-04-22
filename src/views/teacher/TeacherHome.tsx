import React from 'react';
import { motion } from 'motion/react';
import { 
  ClipboardList, 
  Users, 
  MonitorPlay, 
  FileText, 
  FileSearch, 
  BookOpen,
  Calculator,
  BrainCircuit,
  ArrowUpRight,
  Sparkles,
  ArrowRight,
  ChevronRight,
  FileDown
} from 'lucide-react';

interface TeacherHomeProps {
  onNavigate: (view: string) => void;
}

export default function TeacherHome({ onNavigate }: TeacherHomeProps) {
  return (
    <div className="space-y-12">
      {/* Intro Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#1a237e]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1a237e]">Teacher Dashboard</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
            Student <span className="font-editorial text-[#1a237e]">Service</span>
          </h1>
          <p className="max-w-md text-[#57534e] text-sm font-medium">
            Welcome back to the Command Center. Manage your curriculum, students, and AI generators with precision.
          </p>
        </div>
        
        <div className="hidden md:block text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#57534e] opacity-40">Active Session</p>
          <p className="font-editorial italic text-xl text-[#1a237e]">2026—2027 Year</p>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 auto-rows-[160px]">
        {/* Attendance - Wide/Featured */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          onClick={() => onNavigate('attendance')}
          className="md:col-span-3 lg:col-span-6 row-span-1 bg-[#1a237e] text-white p-8 rounded-[2.5rem] flex items-center justify-between group overflow-hidden relative shadow-xl shadow-[#1a237e]/20"
        >
          <div className="relative z-10 text-left">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-1">Attendance Manager</h2>
            <p className="text-[10px] uppercase tracking-widest font-bold opacity-80">Track daily student presence</p>
          </div>
          <div className="relative z-10 w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
        </motion.button>

        {/* Quiz Engine - Square */}
        <motion.button
          whileHover={{ scale: 0.98 }}
          onClick={() => onNavigate('quiz')}
          className="md:col-span-3 lg:col-span-3 row-span-1 bg-white border border-[#e7e5e4] p-6 rounded-[2.5rem] flex flex-col justify-between hover:border-[#1a237e] transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#1a237e]">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#57534e] opacity-20 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">Quiz Engine</h2>
            <p className="text-[9px] font-bold text-[#57534e] mt-1 opacity-60">AI Question Generator</p>
          </div>
        </motion.button>

        {/* Student Randomizer - Square */}
        <motion.button
          whileHover={{ scale: 0.98 }}
          onClick={() => onNavigate('selector')}
          className="md:col-span-3 lg:col-span-3 row-span-1 bg-white border border-[#e7e5e4] p-6 rounded-[2.5rem] flex flex-col justify-between hover:border-[#1a237e] transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-[#f8f9fa] rounded-xl flex items-center justify-center text-[#1a237e]">
              <Users className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#57534e] opacity-20 group-hover:opacity-100 transition-all" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">Randomizer</h2>
            <p className="text-[9px] font-bold text-[#57534e] mt-1 opacity-60">Pick lucky student</p>
          </div>
        </motion.button>

        {/* Lesson Planner - Tall */}
        <motion.button
          whileHover={{ scale: 0.98 }}
          onClick={() => onNavigate('lessons')}
          className="md:col-span-3 lg:col-span-4 row-span-2 bg-[#f8f9fa] border border-[#e7e5e4] p-10 rounded-[3rem] flex flex-col justify-between hover:border-[#1a237e] transition-all group"
        >
          <div className="space-y-6">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-[#1a237e] shadow-sm border border-[#e7e5e4]">
              <MonitorPlay className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Lesson <br />Architect</h2>
              <p className="text-xs font-medium text-[#57534e] mt-4 leading-relaxed group-hover:text-[#1c1917]">
                Design high-impact, engaging curriculum structures for any subject.
              </p>
            </div>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-[#1a237e] flex items-center gap-2">
            Configure Structure <ArrowRight className="w-3 h-3" />
          </div>
        </motion.button>

        {/* Paper Generators Section */}
        <motion.button
          whileHover={{ scale: 0.98 }}
          onClick={() => onNavigate('test-paper')}
          className="md:col-span-3 lg:col-span-4 row-span-1 border border-[#e7e5e4] p-6 rounded-[2.5rem] flex items-center gap-6 hover:bg-white hover:border-[#1a237e] transition-all"
        >
          <div className="w-12 h-12 bg-[#1a237e]/5 rounded-2xl flex items-center justify-center text-[#1a237e]">
            <FileText className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-black uppercase tracking-widest">Test Papers</h2>
            <p className="text-[9px] font-bold text-[#57534e] opacity-60">Generate Exam Sheets</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 0.98 }}
          onClick={() => onNavigate('sample-paper')}
          className="md:col-span-3 lg:col-span-4 row-span-1 border border-[#e7e5e4] p-6 rounded-[2.5rem] flex items-center gap-6 hover:bg-white hover:border-[#1a237e] transition-all"
        >
          <div className="w-12 h-12 bg-amber-500/5 rounded-2xl flex items-center justify-center text-amber-600">
            <FileSearch className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-black uppercase tracking-widest">Sample Papers</h2>
            <p className="text-[9px] font-bold text-[#57534e] opacity-60">Practice Assignments</p>
          </div>
        </motion.button>

        {/* Library & Calculator */}
        <motion.button
          whileHover={{ scale: 0.98 }}
          onClick={() => onNavigate('resources')}
          className="md:col-span-3 lg:col-span-4 row-span-1 bg-[#1c1917] text-white p-6 rounded-[2.5rem] flex items-center justify-between group overflow-hidden"
        >
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-black uppercase tracking-widest">Library</h2>
              <p className="text-[8px] font-bold uppercase opacity-50">NCERT Hub</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 opacity-40 group-hover:translate-x-2 transition-transform relative z-10" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 0.98 }}
          onClick={() => onNavigate('calculator')}
          className="md:col-span-3 lg:col-span-4 row-span-1 border border-[#e7e5e4] p-6 rounded-[2.5rem] flex items-center justify-between group transition-all hover:bg-[#f8f9fa] hover:border-[#1a237e]"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#f8f9fa] rounded-xl flex items-center justify-center text-[#1a237e]">
              <Calculator className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-black uppercase tracking-widest">Student Calc</h2>
              <p className="text-[8px] font-bold text-[#57534e] opacity-60 uppercase">Math Utility</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#57534e] group-hover:translate-x-1 transition-transform" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 0.98 }}
          onClick={() => onNavigate('submissions')}
          className="md:col-span-3 lg:col-span-4 row-span-1 border border-[#e7e5e4] p-6 rounded-[2.5rem] flex items-center justify-between group transition-all hover:bg-[#f8f9fa] hover:border-[#1a237e]"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <FileDown className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-black uppercase tracking-widest">Submissions</h2>
              <p className="text-[8px] font-bold text-[#57534e] opacity-60 uppercase">Student Docs</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#57534e] group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>

      {/* Editorial Footer */}
      <footer className="text-center py-12">
        <div className="h-px w-[100px] bg-[#e7e5e4] mx-auto mb-6" />
        <p className="font-editorial italic text-2xl text-[#1a237e]">"Light and Truth"</p>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#57534e] mt-2">St. Michael's School &bull; Bhind</p>
      </footer>
    </div>
  );
}
