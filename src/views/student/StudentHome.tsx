import React from 'react';
import { motion } from 'motion/react';
import { 
  Lightbulb, 
  MessageSquare, 
  BookOpen, 
  FileSearch,
  Zap,
  Calculator
} from 'lucide-react';

interface StudentHomeProps {
  onNavigate: (view: string) => void;
}

export default function StudentHome({ onNavigate }: StudentHomeProps) {
  const tools = [
    { id: 'doubt', label: 'Doubt Solver', icon: Lightbulb, desc: 'Get instant clarity on any subject matter.', color: 'from-yellow-400 to-orange-500' },
    { id: 'assignment', label: 'Assignment Assistant', icon: MessageSquare, desc: 'Get help with your homework and projects.', color: 'from-blue-400 to-indigo-500' },
    { id: 'resources', label: 'Digital Library', icon: BookOpen, desc: 'Official NCERT books and study materials.', color: 'from-green-400 to-teal-500' },
    { id: 'calculator', label: 'Math Tools', icon: Calculator, desc: 'Standard & percentage calculation tools.', color: 'from-orange-400 to-red-500' },
    { id: 'analyze', label: 'Analyze Progress', icon: FileSearch, desc: 'Identify your strengths and areas to improve.', color: 'from-pink-500 to-rose-500' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1a237e] uppercase tracking-tight mb-1">Student Portal</h1>
          <p className="text-[#636e72] text-sm font-medium">Your personalized AI companion for academic excellence.</p>
        </div>
        <div className="hidden md:flex p-4 bg-white border border-[#e9ecef] rounded-xl items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-[#f0f2ff] flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#1a237e]" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-[#636e72]">Academic Motto</p>
            <p className="text-sm font-bold text-[#2d3436]">Light and Truth</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool, index) => (
          <motion.button
            key={tool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -3, backgroundColor: '#f0f7ff', borderColor: '#3949ab' }}
            onClick={() => onNavigate(tool.id)}
            className="group bg-white p-8 rounded-xl text-left border border-[#e9ecef] shadow-sm transition-all relative overflow-hidden flex flex-col gap-4"
          >
            <div className={`w-14 h-14 rounded-xl bg-[#f8f9fa] border border-[#e9ecef] flex items-center justify-center shadow-inner group-hover:bg-[#1a237e] transition-colors`}>
              <tool.icon className="w-7 h-7 text-[#1a237e] group-hover:text-white" />
            </div>
            
            <div>
              <h2 className="text-lg font-bold text-[#2d3436] mb-1">{tool.label}</h2>
              <p className="text-[#636e72] text-xs leading-loose font-medium max-w-xs">{tool.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-xl border border-[#e9ecef] shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4">
            <h3 className="text-lg font-bold text-[#1a237e]">Stuck on a problem?</h3>
            <p className="text-[#636e72] text-xs font-medium leading-relaxed">Our AI assistants are specialized in providing simple, humanized explanations for your curriculum.</p>
            <button 
              onClick={() => onNavigate('doubt')}
              className="bg-gradient-to-r from-[#1a237e] to-[#3949ab] text-white px-8 py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all shadow-md hover:opacity-90"
            >
              Get Help Now
            </button>
          </div>
          <div className="w-full md:w-80 h-48 bg-[#f8f9fa] rounded-xl border border-[#e9ecef] overflow-hidden flex items-center justify-center">
            <img 
              src="https://picsum.photos/seed/studying/800/600" 
              alt="Student focused on studying" 
              className="w-full h-full object-cover opacity-90"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
