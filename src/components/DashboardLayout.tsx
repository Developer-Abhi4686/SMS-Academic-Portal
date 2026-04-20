import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Library, 
  Users, 
  FileText, 
  ClipboardList, 
  BrainCircuit, 
  Lightbulb,
  LogOut,
  ChevronRight,
  MonitorPlay,
  FileSearch,
  MessageSquare,
  Menu,
  X,
  Sun,
  Moon,
  Calculator as CalculatorIcon,
  BookMarked
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserRole, UserProfile } from '../types';
import { UserCircle } from 'lucide-react';
import AIChatOverlay from './AIChatOverlay';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: UserRole;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  userClass: string | null;
  userSection: string | null;
  userProfile: UserProfile | null;
}

export default function DashboardLayout({ 
  children, 
  role, 
  currentView, 
  onNavigate, 
  onLogout,
  userClass,
  userSection,
  userProfile
}: DashboardLayoutProps) {
  
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  
  const teacherMenuItems = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Daily Attendance', icon: ClipboardList },
    { id: 'quiz', label: 'Quiz Generator', icon: ClipboardList },
    { id: 'selector', label: 'Student Selector', icon: Users },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'lessons', label: 'Plan Lessons', icon: MonitorPlay },
    { id: 'test-paper', label: 'Test Paper Generator', icon: FileText },
    { id: 'sample-paper', label: 'Sample Paper Generator', icon: FileSearch },
    { id: 'calculator', label: 'Calculator', icon: CalculatorIcon },
  ];

  const studentMenuItems = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'doubt', label: 'Doubt Solver', icon: Lightbulb },
    { id: 'calculator', label: 'Calculator', icon: CalculatorIcon },
    { id: 'assignment', label: 'Assignment Assistant', icon: MessageSquare },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'analyze', label: 'Analyze', icon: FileSearch },
  ];

  const menuItems = role === 'teacher' ? teacherMenuItems : studentMenuItems;

  return (
    <div className="flex h-screen bg-[#f8f9fa] text-[#2d3436] overflow-hidden font-['Segoe_UI',Roboto,Helvetica,Arial,sans-serif]">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#e9ecef] flex flex-col transition-transform duration-300 md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:shadow-sm'}
      `}>
        <div className="p-6 border-b border-[#e9ecef]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${role === 'teacher' ? 'bg-[#3949ab] text-white' : 'bg-[#1a237e] text-white'} font-bold shadow-sm`}>
                {role === 'teacher' ? "T" : "S"}
              </div>
              <div>
                <h1 className="font-extrabold text-sm uppercase tracking-wider text-[#1a237e]">
                  {role === 'teacher' ? "Teacher's Corner" : "Student's Corner"}
                </h1>
                <p className="text-[9px] uppercase tracking-widest text-[#1a237e] font-bold">St Michael's School</p>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 md:hidden text-[#636e72] hover:bg-[#f8f9fa] rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1 py-4 custom-scrollbar">
          {menuItems.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                onNavigate(item.id);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group relative text-sm font-semibold ${
                currentView === item.id 
                  ? "bg-gradient-to-r from-[#1a237e] to-[#3949ab] text-white shadow-md" 
                  : "text-[#636e72] hover:bg-[#f0f2ff] hover:text-[#1a237e]"
              }`}
            >
              <item.icon className={`w-4 h-4 transition-colors ${
                currentView === item.id 
                  ? 'text-white'
                  : 'text-[#636e72] group-hover:text-[#1a237e]'
              }`} />
              <span>{item.label}</span>
              {currentView === item.id && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute right-0 w-1 h-4 bg-[#00b8d4] rounded-l-full"
                />
              )}
            </motion.button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#e9ecef]">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-red-50 text-red-600 border border-red-100 font-bold text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all duration-300 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Portal</span>
          </motion.button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        <header className="h-[70px] bg-white border-b border-[#e9ecef] px-4 md:px-8 flex items-center justify-between shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-[#1a237e] md:hidden hover:bg-[#f0f2ff] rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-sm md:text-lg font-bold text-[#1a237e] flex items-center gap-1.5 sm:gap-2">
              <span className="truncate max-w-[120px] sm:max-w-none">{menuItems.find(i => i.id === currentView)?.label}</span>
              <span className="text-[9px] md:text-xs font-normal text-[#636e72] px-1.5 sm:px-2 py-0.5 bg-[#f1f3f5] rounded-full border border-[#dee2e6] whitespace-nowrap">SMS Academīc</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
             <div className="bg-[#f1f3f5] px-3 md:px-4 py-1.5 rounded-full border border-[#dee2e6] text-[10px] md:text-xs font-bold text-[#1a237e] shadow-sm flex items-center gap-2 md:gap-3">
                <span className="opacity-60">{userClass}-{userSection}</span>
                <span className="w-px h-3 bg-[#dee2e6] hidden sm:block"></span>
                <span className="hidden sm:inline">👤 Admin Abhi</span>
             </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-[#f8f9fa]">
          {children}
        </div>
        
        {/* Persistent Credit Footer */}
        <footer className="bg-white border-t border-[#e9ecef] py-4 px-4 md:px-8 text-center shrink-0 z-10">
          <p className="text-[#636e72] text-[9px] md:text-xs font-bold uppercase tracking-[0.15em] md:tracking-widest leading-relaxed">
            SMS Academīc Portal designed for St. Michael's By Abhi Sharma(9-d)
          </p>
        </footer>
      </main>
      {currentView === 'home' && <AIChatOverlay role={role} />}
    </div>
  );
}
