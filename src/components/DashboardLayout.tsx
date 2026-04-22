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
  Calculator as CalculatorIcon,
  ShieldCheck,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
    { id: 'attendance', label: 'Attendance', icon: ClipboardList },
    { id: 'quiz', label: 'Quiz Engine', icon: BrainCircuit },
    { id: 'selector', label: 'Student Randomizer', icon: Users },
    { id: 'resources', label: 'Digital Library', icon: Library },
    { id: 'lessons', label: 'Lesson Planner', icon: FileSearch },
    { id: 'test-paper', label: 'Test Papers', icon: FileText },
    { id: 'sample-paper', label: 'Sample Papers', icon: FileText },
    { id: 'calculator', label: 'Academic Calc', icon: CalculatorIcon },
    { id: 'submissions', label: 'Submissions', icon: FileText },
  ];

  const studentMenuItems = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'doubt', label: 'Doubt Solver', icon: Lightbulb },
    { id: 'calculator', label: 'Calculator', icon: CalculatorIcon },
    { id: 'assignment', label: 'Assignment Assistant', icon: MessageSquare },
    { id: 'resources', label: 'Digital Library', icon: BookOpen },
    { id: 'analyze', label: 'Progress Analyze', icon: FileSearch },
    { id: 'student-submissions', label: 'Submission', icon: ShieldCheck },
  ];

  const menuItems = role === 'teacher' ? teacherMenuItems : studentMenuItems;

  return (
    <div className="flex h-screen bg-[#f8f9fa] text-[#1c1917] overflow-hidden p-0 md:p-3 selection:bg-[#1a237e] selection:text-white">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#1c1917]/40 backdrop-blur-sm z-[60] md:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Modern Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-72 bg-white md:bg-[#f8f9fa] flex flex-col transition-all duration-500 md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:w-64 lg:w-72 md:p-4
      `}>
        <div className="flex flex-col h-full bg-white md:rounded-[2.5rem] border border-[#e7e5e4] shadow-sm overflow-hidden">
          {/* Logo Section */}
          <div className="p-8 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1a237e] rounded-xl flex items-center justify-center text-white shadow-lg shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-editorial text-lg text-[#1a237e]">Student</h1>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">St. Michael's</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
            <p className="px-4 text-[9px] font-black uppercase tracking-[0.2em] text-[#57534e] mb-2 opacity-50">Main Menu</p>
            {menuItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group relative text-xs font-bold uppercase tracking-widest ${
                  currentView === item.id 
                    ? "bg-[#1a237e] text-white shadow-lg shadow-[#1a237e]/20" 
                    : "text-[#57534e] hover:bg-blue-50 hover:text-[#1a237e]"
                }`}
              >
                <item.icon className={`w-4 h-4 ${currentView === item.id ? 'text-white' : 'text-[#57534e] opacity-40 group-hover:opacity-100'}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User Profile Summary */}
          <div className="p-6 mt-auto">
            <div className="bg-[#f8f9fa] rounded-[2rem] p-4 border border-[#e7e5e4] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-[#e7e5e4] shadow-sm">
                  <UserCircle className="w-6 h-6 text-[#1a237e]" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] font-black uppercase truncate text-[#1c1917]">
                    {userProfile?.fullName || 'User'}
                  </p>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-[#1a237e]">
                    Class {userClass}-{userSection || 'A'}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-center mb-4 text-[#57534e] opacity-40">Credit: Abhi Sharma(9-D)</p>
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-50 text-red-600 border border-red-100 font-black text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm"
            >
              <LogOut className="w-3 h-3" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8f9fa] md:p-4">
        {/* Modern Command Header */}
        <header className="h-[80px] bg-white md:rounded-[2rem] border border-[#e7e5e4] px-6 md:px-10 flex items-center justify-between shadow-sm z-10 mb-4 shrink-0">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-[#1a237e] md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden lg:flex items-center gap-3 text-[#57534e] opacity-40">
              <Search className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Academic Toolsearch</span>
            </div>
            <div className="h-4 w-px bg-[#e7e5e4] hidden lg:block" />
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black uppercase tracking-tighter text-[#1a237e]">
                {menuItems.find(i => i.id === currentView)?.label}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#57534e]">St. Michaels Portal</span>
              <span className="text-[10px] font-bold italic font-editorial text-[#1a237e]">"Light and Truth"</span>
            </div>
            <div className="w-10 h-10 bg-[#f8f9fa] rounded-xl flex items-center justify-center border border-[#e7e5e4]">
              <MessageSquare className="w-4 h-4 text-[#1a237e]" />
            </div>
          </div>
        </header>

        {/* Dynamic Content Surface */}
        <div className="flex-1 bg-white md:rounded-[2.5rem] border border-[#e7e5e4] overflow-hidden relative shadow-inner">
          <div className="absolute inset-0 overflow-y-auto p-6 md:p-12 custom-scrollbar">
            {children}
            
            {/* Contextual Footer Info */}
            <div className="mt-24 pt-8 border-t border-[#f8f9fa] flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#57534e] opacity-30">
                SMS Student Hub &bull; Credit: Abhi Sharma(9-D)
              </p>
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#57534e] opacity-30">
                Designed for St. Michael's School Bhind
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Floating AI Assistant Integration */}
      {currentView === 'home' && (
        <div className="fixed bottom-10 right-10 z-[100]">
           <AIChatOverlay role={role} />
        </div>
      )}
    </div>
  );
}
