import React from 'react';
import { motion } from 'motion/react';
import { 
  ClipboardList, 
  Users, 
  MonitorPlay, 
  FileText, 
  FileSearch, 
  BookOpen,
  Calculator
} from 'lucide-react';

interface TeacherHomeProps {
  onNavigate: (view: string) => void;
}

export default function TeacherHome({ onNavigate }: TeacherHomeProps) {
  const tools = [
    { id: 'attendance', label: 'Daily Attendance', icon: ClipboardList, desc: 'Record and track student attendance.', color: 'from-emerald-600 to-teal-600' },
    { id: 'quiz', label: 'Quiz Generator', icon: ClipboardList, desc: 'Generate multi-difficulty quizzes instantly.', color: 'from-blue-600 to-cyan-600' },
    { id: 'selector', label: 'Student Selector', icon: Users, desc: 'Randomly pick students for participation.', color: 'from-purple-600 to-pink-600' },
    { id: 'lessons', label: 'Plan Lessons', icon: MonitorPlay, desc: 'Design structured, engaging lesson plans.', color: 'from-orange-600 to-yellow-600' },
    { id: 'test-paper', label: 'Test Papers', icon: FileText, desc: 'Create full-length exam papers.', color: 'from-green-600 to-emerald-600' },
    { id: 'sample-paper', label: 'Sample Papers', icon: FileSearch, desc: 'Generate practice papers for students.', color: 'from-indigo-600 to-purple-600' },
    { id: 'resources', label: 'Resources Bank', icon: BookOpen, desc: 'Access NCERT and reference materials.', color: 'from-teal-600 to-blue-600' },
    { id: 'calculator', label: 'Calculator', icon: Calculator, desc: 'Standard & percentage calculation tools.', color: 'from-gray-600 to-slate-600' },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <header>
        <h1 className="text-xl md:text-2xl font-black text-[#1a237e] uppercase tracking-tight mb-1">Quick Access Toolkit</h1>
        <p className="text-[#4b5563] text-xs md:text-sm font-bold">Manage your academic workflows and AI-powered generators.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tools.map((tool, index) => (
          <motion.button
            key={tool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -3, backgroundColor: '#f0f7ff', borderColor: '#3949ab' }}
            onClick={() => onNavigate(tool.id)}
            className="group bg-white p-5 md:p-6 rounded-xl text-center border border-[#e9ecef] shadow-sm transition-all relative overflow-hidden flex flex-col items-center gap-3"
          >
            <div className={`w-12 h-12 rounded-xl bg-[#f0f2ff] flex items-center justify-center border border-[#e9ecef] group-hover:bg-[#1a237e] group-hover:text-white transition-colors`}>
              <tool.icon className="w-5 h-5 text-[#1a237e] group-hover:text-white" />
            </div>
            
            <h2 className="text-sm font-black text-[#1a1a1a] uppercase tracking-tighter">{tool.label}</h2>
            <p className="text-[#4b5563] text-[10px] leading-snug font-bold line-clamp-2">{tool.desc}</p>
          </motion.button>
        ))}
      </div>

      <div className="bg-[#e7f5ff] p-10 rounded-xl border border-[#a5d8ff] text-center shadow-inner">
        <h3 className="text-[#1a237e] font-black text-xs uppercase tracking-widest mb-2">School Wisdom</h3>
        <p className="text-[#1a237e] italic font-serif text-lg">"Light and Truth" – St Michael's School, Bhind</p>
      </div>
    </div>
  );
}
