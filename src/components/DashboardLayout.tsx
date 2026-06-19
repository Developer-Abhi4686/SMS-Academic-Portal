import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  ChevronUp,
  MonitorPlay,
  FileSearch,
  MessageSquare,
  LayoutGrid,
  Menu,
  X,
  Calculator as CalculatorIcon,
  ShieldCheck,
  Search,
  Sparkles,
  Cloud,
  FolderLock,
  UserCircle,
  Power,
  Wifi,
  Battery,
  Calendar,
  Clock,
  Lock,
  Compass,
  Monitor,
  Volume2,
  Settings,
  Bell,
  Cpu,
  Mic,
  MicOff,
  VolumeX,
  Send,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole, UserProfile } from '../types';
import { getGeminiResponse, prompts } from '../lib/geminiService';
import MarkdownRenderer from './MarkdownRenderer';

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

function ClockDisplay() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span>
      {time.toLocaleTimeString('en-US', { 
        hour12: true, 
        hour: '2-digit', 
        minute: '2-digit' 
      })}
    </span>
  );
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
  
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);
  const [menuBarDropdown, setMenuBarDropdown] = useState<string | null>(null);
  const [isWidgetPanelOpen, setIsWidgetPanelOpen] = useState(true);
  const [currentDateState, setCurrentDateState] = useState(new Date());
  const [isDockHidden, setIsDockHidden] = useState(false);

  // macOS Window States: 'normal' | 'maximized' | 'minimized'
  const [windowState, setWindowState] = useState<'normal' | 'maximized' | 'minimized'>('maximized');

  useEffect(() => {
    if (currentView !== 'home') {
      setWindowState('maximized');
    }
  }, [currentView]);

  const isActualDockHidden = isDockHidden || (currentView !== 'home' && windowState === 'maximized');

  // Dynamic Island Tab State: 'dashboard' | 'siri'
  const [islandTab, setIslandTab] = useState<'dashboard' | 'siri'>('dashboard');

  // AI Chat (Zehn AI Assistant) States
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Siri Voice Model States
  const [isListening, setIsListening] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isSiriSpeaking, setIsSiriSpeaking] = useState(false);
  const [speechMuted, setSpeechMuted] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load welcome message on role change
  useEffect(() => {
    setMessages([]);
  }, [role]);

  // Keep scroll focused on newest messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, islandTab, isAiLoading]);

  // Speech Recognition model setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechRecognitionSupported(true);
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setIsListening(true);
          setIsUserSpeaking(false);
          if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
          }
        };

        rec.onend = () => {
          setIsListening(false);
          setIsUserSpeaking(false);
        };

        rec.onspeechstart = () => {
          setIsUserSpeaking(true);
        };

        rec.onspeechend = () => {
          setIsUserSpeaking(false);
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputText(transcript);
            handleSendToSiri(transcript);
          }
        };

        rec.onerror = (err: any) => {
          console.error("Speech recognition error:", err);
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, [messages, role]);

  // Auto-start listening when the dynamic island is expanded
  useEffect(() => {
    if (isIslandExpanded) {
      if (speechRecognitionSupported && recognitionRef.current && !isListening) {
        setIsUserSpeaking(false);
        const timer = setTimeout(() => {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.warn("Auto-start speech recognition error:", e);
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    } else {
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn("Auto-stop speech recognition error:", e);
        }
      }
      setIsUserSpeaking(false);
      stopSpeaking();
    }
  }, [isIslandExpanded, speechRecognitionSupported]);

  // Handle Siri vocal output
  const speakResponse = (text: string) => {
    if (speechMuted || typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    // Clean HTML/Markdown characters so voice synth sounds organic
    const cleanSpoken = text
      .replace(/[*_#`~:-]/g, ' ')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/<\/?[^>]+(>|$)/g, "")
      .substring(0, 300) // keep vocal response concise and natural
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpoken);
    
    // Choose voice - Siri alike
    const voices = window.speechSynthesis.getVoices();
    const siriVoice = voices.find(v => 
      v.name.includes("Google UK English Female") || 
      v.name.includes("Siri") || 
      v.name.includes("Google US English") || 
      (v.lang.startsWith("en") && v.name.toLowerCase().includes("female"))
    );
    if (siriVoice) {
      utterance.voice = siriVoice;
    }
    utterance.rate = 1.05;
    utterance.pitch = 1.1;

    utterance.onstart = () => setIsSiriSpeaking(true);
    utterance.onend = () => setIsSiriSpeaking(false);
    utterance.onerror = () => setIsSiriSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSiriSpeaking(false);
    }
  };

  const toggleListening = () => {
    if (!speechRecognitionSupported || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Speech recognition state reload", e);
        recognitionRef.current.stop();
      }
    }
  };

  const executeVoiceCommand = (transcript: string) => {
    const text = transcript.toLowerCase();
    
    if (text.includes("attendance") || text.includes("present record") || text.includes("roll call") || text.includes("presentee")) {
      onNavigate("attendance");
      return "Sure, switching to the Attendance tracker.";
    } else if (text.includes("student selector") || text.includes("pick a student") || text.includes("choose a student") || text.includes("randomizer")) {
      onNavigate("selector");
      return "Got it! Launching the Student Selector.";
    } else if (text.includes("generator") || text.includes("create quiz") || text.includes("generate paper") || text.includes("exam questions")) {
      onNavigate("generator");
      return "Opening curriculum Generators workspace.";
    } else if (text.includes("resource") || text.includes("library") || text.includes("ncert") || text.includes("book")) {
      onNavigate("resources");
      return "Accessing the NCERT Digital Archives.";
    } else if (text.includes("lesson planner") || text.includes("plan a lesson") || text.includes("lesson plan")) {
      onNavigate("home");
      return "That tool is no longer available on this workstation.";
    } else if (text.includes("calculator") || text.includes("arithmetic") || text.includes("math") || text.includes("calculate") || text.includes("solve equation")) {
      onNavigate("calculator");
      return "Sure! Coming up with the Calculator.";
    } else if (text.includes("student submission") || text.includes("my submission") || text.includes("track submission")) {
      onNavigate("student-submissions");
      return "Opening your personal submissions dashboard.";
    } else if (text.includes("submission") || text.includes("registry monitor") || text.includes("show file submissions")) {
      onNavigate("submissions");
      return "Opening class submissions registry monitor.";
    } else if (text.includes("vault") || text.includes("secure vault") || text.includes("locker") || text.includes("archive")) {
      onNavigate("vault");
      return "Opening your Secure Cloud Vault.";
    } else if (text.includes("doubt") || text.includes("solve doubt") || text.includes("stuck on concept") || text.includes("ask siri")) {
      onNavigate("doubt");
      return "Launching the AI Doubt Solver.";
    } else if (text.includes("assistant") || text.includes("solver") || text.includes("lab") || text.includes("draft writer") || text.includes("assignment")) {
      onNavigate("assignment");
      return "Opening your Draft Solver Lab.";
    } else if (text.includes("analysis") || text.includes("analyze") || text.includes("stats") || text.includes("growth index")) {
      onNavigate("analyze");
      return "Redirecting to your growth analytics dashboard.";
    } else if (text.includes("desktop") || text.includes("home") || text.includes("finder") || text.includes("main screen") || text.includes("go back")) {
      onNavigate("home");
      return "Returning to your tranquil desktop surface.";
    } else if (text.includes("logout") || text.includes("sign out") || text.includes("exit")) {
      onLogout();
      return "Logging out of the St. Michael's Academic suite.";
    } else if (text.includes("hide dock") || text.includes("minimize dock") || text.includes("collapse dock") || text.includes("hide menu")) {
      setIsDockHidden(true);
      return "Hiding the system Dock. Tap the caret button at the bottom to restore it.";
    } else if (text.includes("show dock") || text.includes("restore dock") || text.includes("open dock") || text.includes("bring back dock")) {
      setIsDockHidden(false);
      return "Restoring the system Dock to your screen.";
    }
    
    return null;
  };

  const handleSendToSiri = async (text: string = inputText) => {
    const trimmedText = text.trim();
    if (!trimmedText || isAiLoading) return;

    // Direct voice navigation and control interception
    const commandResponse = executeVoiceCommand(trimmedText);

    const userMsg = {
      id: Date.now().toString(),
      text: trimmedText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsAiLoading(true);

    if (commandResponse) {
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        text: commandResponse,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
      speakResponse(commandResponse);
      setIsAiLoading(false);
      return;
    }

    try {
      const historyStr = messages
        .map(m => `${m.sender === 'user' ? 'User' : 'Zehn'}: ${m.text}`)
        .join('\n');

      const fullPrompt = `${historyStr}\nUser: ${trimmedText}\nZehn:`;
      const systemPrompt = role === 'teacher' ? prompts.teacherSchoolCompanion : prompts.schoolCompanion;
      const aiResponse = await getGeminiResponse(fullPrompt, systemPrompt, userClass);

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
      speakResponse(aiResponse);
    } catch (err) {
      console.error("Zehn Siri Chat Error:", err);
      const errorMsg = {
        id: (Date.now() + 2).toString(),
        text: "I couldn't reach the academic grid. Please ensure your Gemini key is active and try again.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateState(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const teacherMenuItems = [
    { id: 'home', label: 'Finder', icon: LayoutDashboard, gradient: 'from-[#1A1A1A] to-[#6B6998]' },
    { id: 'attendance', label: 'Attendance', icon: ClipboardList, gradient: 'from-[#6B6998] to-[#9E9EB7]' },
    { id: 'selector', label: 'Student Selector', icon: Users, gradient: 'from-[#1A1A1A] to-[#9E9EB7]' },
    { id: 'generator', label: 'Generators', icon: Sparkles, gradient: 'from-[#6B6998] to-[#1A1A1A]' },
    { id: 'resources', label: 'Resources', icon: Library, gradient: 'from-[#9E9EB7] to-[#6B6998]' },
    { id: 'calculator', label: 'Calculator', icon: CalculatorIcon, gradient: 'from-[#6B6998] to-[#9E9EB7]' },
    { id: 'submissions', label: 'Submissions', icon: FileText, gradient: 'from-[#1A1A1A] to-[#9E9EB7]' },
    { id: 'vault', label: 'Vault', icon: FolderLock, gradient: 'from-[#9E9EB7] to-[#1A1A1A]' },
  ];

  const studentMenuItems = [
    { id: 'home', label: 'Finder', icon: LayoutDashboard, gradient: 'from-[#1A1A1A] to-[#6B6998]' },
    { id: 'doubt', label: 'Doubt Solve', icon: Lightbulb, gradient: 'from-[#6B6998] to-[#9E9EB7]' },
    { id: 'calculator', label: 'Calculator', icon: CalculatorIcon, gradient: 'from-[#1A1A1A] to-[#9E9EB7]' },
    { id: 'assignment', label: 'Assignments', icon: MessageSquare, gradient: 'from-[#6B6998] to-[#1A1A1A]' },
    { id: 'resources', label: 'Resources', icon: BookOpen, gradient: 'from-[#9E9EB7] to-[#6B6998]' },
    { id: 'analyze', label: 'Analysis', icon: FileSearch, gradient: 'from-[#1A1A1A] to-[#6B6998]' },
    { id: 'student-submissions', label: 'Submissions', icon: ShieldCheck, gradient: 'from-[#6B6998] to-[#9E9EB7]' },
  ];

  const menuItems = role === 'teacher' ? teacherMenuItems : studentMenuItems;

  // Render the widget space when home is active
  const renderDesktopWidgets = () => {
    const dayName = currentDateState.toLocaleDateString('en-US', { weekday: 'long' });
    const dayNum = currentDateState.getDate();
    const monthName = currentDateState.toLocaleDateString('en-US', { month: 'long' });
    const yearNum = currentDateState.getFullYear();

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto pt-16">
        {/* Widget 1: Mac Style Minimal Glass Clock & Calendar */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white/50 backdrop-blur-2xl border border-[#9E9EB7]/20 rounded-[2.5rem] p-8 text-[#1A1A1A] flex flex-col justify-between h-56 shadow-[0_20px_50px_-10px_rgba(107,105,152,0.06)] relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#6B6998]/5 rounded-bl-full -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6B6998]">Calendar</span>
              <span className="text-3xl font-black mt-1 tracking-tight text-[#1A1A1A]">{dayName}</span>
              <span className="text-xs font-semibold text-[#9E9EB7] uppercase tracking-widest mt-0.5">{monthName} {dayNum}, {yearNum}</span>
            </div>
            <div className="w-12 h-12 bg-[#6B6998]/10 rounded-2xl flex items-center justify-center text-[#6B6998]">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-5xl font-black font-mono tracking-tighter text-[#1A1A1A]"><ClockDisplay /></span>
          </div>
        </motion.div>

        {/* Widget 2: Scholar Welcome & Stats */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/50 backdrop-blur-2xl border border-[#9E9EB7]/20 rounded-[2.5rem] p-8 text-[#1A1A1A] flex flex-col justify-between h-56 shadow-[0_20px_50px_-10px_rgba(107,105,152,0.06)] relative overflow-hidden group"
        >
          <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-[#6B6998]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6B6998]">Profile Space</span>
              <span className="text-2xl font-black mt-2 tracking-tight text-[#1A1A1A] line-clamp-1">
                {userProfile?.fullName || 'Academic Explorer'}
              </span>
              <span className="text-xs font-semibold text-[#9E9EB7] uppercase tracking-wider mt-1">{role === 'teacher' ? 'Faculty Admin' : `Class ${userClass || 'N/A'}-${userSection || ''}`}</span>
            </div>
            <div className="w-12 h-12 bg-[#6B6998]/10 rounded-2xl overflow-hidden flex items-center justify-center text-[#6B6998]">
              <UserCircle className="w-8 h-8 opacity-80" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-[#9E9EB7] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#6B6998] animate-pulse" />
            <span>St. Michael's Portal Secure Link</span>
          </div>
        </motion.div>

        {/* Widget 3: Launchpad Suggestion Core */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white/50 backdrop-blur-2xl border border-[#9E9EB7]/20 rounded-[2.5rem] p-8 text-[#1A1A1A] flex flex-col justify-between h-56 shadow-[0_20px_50px_-10px_rgba(107,105,152,0.06)] relative overflow-hidden group col-span-1 md:col-span-2 lg:col-span-1"
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6B6998]">Quick Tips</span>
              <h4 className="text-lg font-black mt-2 tracking-tight text-[#1A1A1A]">Launcher Active</h4>
              <p className="text-xs font-medium text-[#9E9EB7] leading-relaxed mt-1">
                All functions are accessible instantly from the system Dock at the bottom.
              </p>
            </div>
            <div className="w-10 h-10 bg-[#6B6998]/15 text-[#6B6998] rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="border-t border-[#9E9EB7]/15 pt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#9E9EB7]">
            <span>Powered by Gemini AI</span>
            <span className="text-[9px] bg-[#6B6998]/10 text-[#6B6998] px-2 py-0.5 rounded-full font-mono uppercase tracking-normal">macOS 27</span>
          </div>
        </motion.div>
      </div>
    );
  };

  const currentActiveLabel = menuItems.find(i => i.id === currentView)?.label || 'Finder';

  const holderClasses = windowState === 'maximized'
    ? "absolute inset-0 top-8 flex items-center justify-center z-30 select-text p-0"
    : "absolute inset-x-4 md:inset-x-8 top-16 bottom-[100px] flex items-center justify-center z-30 select-text p-1";

  const windowClasses = windowState === 'maximized'
    ? "w-full h-full bg-white/75 backdrop-blur-3xl rounded-none border-none shadow-none flex flex-col overflow-hidden relative"
    : "w-full max-w-5xl h-full bg-white/60 backdrop-blur-3xl rounded-[2.5rem] border border-[#9E9EB7]/25 shadow-[0_30px_70px_rgba(107,105,152,0.1)] flex flex-col overflow-hidden relative";

  return (
    <div className="w-screen h-screen relative overflow-hidden select-none font-sans flex flex-col text-[#1A1A1A] isolate">
      
      {/* 1. Operating System Wallpaper */}
      <div className="absolute inset-0 overflow-hidden -z-10 bg-[#F8F8FA]" />
      
      {/* 2. Top macOS Menu Bar */}
      <header className="fixed top-0 inset-x-0 h-8 bg-transparent text-[#1A1A1A] flex items-center justify-between px-4 text-xs font-semibold z-50 select-none">
        <div className="flex items-center gap-4">
          {/* Logo / Apple Equivalent drop */}
          <button 
            onClick={() => setMenuBarDropdown(menuBarDropdown === 'system' ? null : 'system')}
            className="hover:bg-[#6B6998]/10 px-2 py-1 rounded transition-colors flex items-center justify-center text-[#6B6998] group active:scale-95"
          >
            <ShieldCheck className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
          </button>

          <span className="font-bold text-[#1A1A1A] tracking-wide">
            St. Michael's
          </span>

          <div className="hidden md:flex items-center gap-1 text-[#1A1A1A]/75">
            <a 
              href="https://sketchfab.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:bg-[#6B6998]/10 px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              3D Models
            </a>
            <button className="hover:bg-[#6B6998]/10 px-2.5 py-1 rounded transition-colors">Experimental Lab</button>
          </div>
        </div>

        {/* Center menu spacing occupied visually by the dynamic island below */}
        <div className="w-20" />

        {/* Menu Bar Right Controls */}
        <div className="flex items-center gap-3">
          {/* Class Section badge */}
          {userClass && (
            <div className="bg-[#1A1A1A]/10 px-2.5 py-0.5 rounded-full text-[10px] font-mono border border-[#1A1A1A]/15 flex items-center gap-1.5 backdrop-blur-md text-[#1A1A1A] font-bold">
              <span className="opacity-60 text-[8px] uppercase tracking-wider font-sans font-black text-[#1A1A1A]">Class</span>
              <span>{userClass}-{userSection || ''}</span>
            </div>
          )}
        </div>

        {/* Dropdown Modals / Menus inside macOS topbar */}
        <AnimatePresence>
          {menuBarDropdown === 'system' && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuBarDropdown(null)} />
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-4 top-9 w-64 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-4 text-white z-50 text-left"
              >
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm">St. Michael's Portal</h4>
                    <p className="text-[10px] text-white/60 font-mono">Build v2.10.26</p>
                  </div>
                </div>

                <div className="py-2.5 space-y-1 text-xs">
                  <div className="px-2 py-1.5 hover:bg-white/10 rounded-lg cursor-pointer flex items-center justify-between" onClick={() => { onNavigate('home'); setMenuBarDropdown(null); }}>
                    <span>Launcher Desktop</span>
                    <span className="text-[9px] font-mono text-white/40">⌘D</span>
                  </div>
                  <div className="px-2 py-1.5 hover:bg-white/10 rounded-lg cursor-pointer flex items-center justify-between" onClick={() => { setIsIslandExpanded(true); setMenuBarDropdown(null); }}>
                    <span>Portal Status Vitals</span>
                    <span className="text-[9px] font-mono text-white/40">⌘I</span>
                  </div>
                  <div className="px-2 py-1.5 hover:bg-white/10 rounded-lg cursor-pointer flex items-center justify-between text-red-400 hover:text-red-300" onClick={() => { onLogout(); setMenuBarDropdown(null); }}>
                    <span>Switch Role / Lock...</span>
                    <span className="text-[9px] font-mono text-white/40">⌘L</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex flex-col gap-1 text-[9px] font-bold text-white/40 uppercase tracking-widest pl-1">
                  <span>Owner: {userProfile?.fullName || 'Academic Explorer'}</span>
                </div>
              </motion.div>
            </>
          )}

          {menuBarDropdown === 'help' && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuBarDropdown(null)} />
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-32 top-9 w-60 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-4 text-white z-50 text-left"
              >
                <h4 className="font-bold text-xs pb-1 uppercase tracking-wider text-cyan-300">System Information</h4>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  This academic portal operates on offline persistence. Choose tools from the system Dock below. Minimizing (Yellow button) or closing (Red button) returns you to this beautiful unified launcher screen.
                </p>
                <button 
                  onClick={() => setMenuBarDropdown(null)} 
                  className="mt-3 w-full bg-white/10 text-[10px] uppercase tracking-widest font-bold py-1.5 rounded-lg hover:bg-white/20"
                >
                  Clear Help
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* 3. Dynamic Island Prototype (Always Available top-center) */}
      <div className="fixed top-11 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <motion.div 
          onClick={() => {
            setIsIslandExpanded(!isIslandExpanded);
          }}
          animate={{ 
            width: isIslandExpanded ? 320 : 120,
            height: isIslandExpanded ? 150 : 32,
            borderRadius: 9999,
          }}
          transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
          className="border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-start overflow-hidden cursor-pointer text-white bg-[#1A1A1A] select-none px-4 py-2 hover:shadow-[0_0_15px_rgba(107,105,152,0.25)]"
        >
          <AnimatePresence mode="wait">
            {!isIslandExpanded ? (
              <motion.div 
                key="compact"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="w-full h-full flex items-center justify-center"
              >
                {/* Minimized: Displaying formatted date elegantly without dots or stars */}
                <span className="text-[9.5px] font-bold tracking-[0.06em] text-[#9E9EB7] uppercase font-mono">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
                </span>
              </motion.div>
            ) : (
              <motion.div 
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, delay: 0.02 }}
                className="w-full h-full"
              >
                {/* Completely blank maximized state */}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* 4. Desktop Surface (Only renders when desktop is "tidy" or active app is minimized) */}
      <div className="flex-1 w-full relative z-20 overflow-hidden px-4 md:px-12 pb-32 pt-20 select-text text-[#1A1A1A]">
        {/* Render Desktop Widgets if no app is active OR if the active app is minimized */}
        {(currentView === 'home' || windowState === 'minimized') && (
          <motion.div
            key="tidy-desktop"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="w-full h-full"
          >
            {renderDesktopWidgets()}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {currentView !== 'home' && (
            /* Inside MacOS Window Frame when specific tool is loaded */
            <motion.div
              key="macos-window-holder"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: windowState === 'minimized' ? 0 : 1,
                scale: windowState === 'minimized' ? 0.3 : 1,
                y: windowState === 'minimized' ? 400 : 0,
                pointerEvents: windowState === 'minimized' ? 'none' : 'auto'
              }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: "spring", stiffness: 220, damping: 25 }}
              className={holderClasses}
            >
              <motion.div 
                initial={{ scale: 0.94, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                className={windowClasses}
              >
                {/* Window title bar (macOS top-panel chrome) */}
                <div className="h-14 border-b border-[#9E9EB7]/15 flex items-center justify-between px-6 select-none shrink-0 bg-white/20">
                  {/* Standard Traffic-Light buttons with authentic MacBook colors */}
                  <div className="flex items-center gap-2 group/traffic">
                    <button 
                      onClick={() => onNavigate('home')} 
                      className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#FF5F56]/20 flex items-center justify-center text-[7px] font-black text-transparent hover:group-hover/traffic:text-red-900/60 transition-colors relative"
                      title="Close"
                    >
                      ✕
                    </button>
                    <button 
                      onClick={() => setWindowState('minimized')} 
                      className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#FFBD2E]/20 flex items-center justify-center text-[7px] font-black text-transparent hover:group-hover/traffic:text-amber-950/60 transition-colors relative"
                      title="Minimize"
                    >
                      —
                    </button>
                    <button 
                      onClick={() => setWindowState(prev => prev === 'maximized' ? 'normal' : 'maximized')}
                      className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#27C93F]/20 flex items-center justify-center text-[5px] font-black text-transparent hover:group-hover/traffic:text-green-950/60 transition-colors relative"
                      title="Maximize"
                    >
                      ⤢
                    </button>
                  </div>

                  {/* Window Title & Icon */}
                  <div className="flex items-center gap-2.5">
                    {React.createElement(menuItems.find(i => i.id === currentView)?.icon || ShieldCheck, { className: 'w-4 h-4 text-[#6B6998]' })}
                    <span className="text-[11px] font-black text-[#1A1A1A] uppercase tracking-[0.2em] font-mono">
                      {menuItems.find(i => i.id === currentView)?.label}
                    </span>
                  </div>

                  {/* Right balanced visual block */}
                  <div className="w-16 flex justify-end">
                    <span className="text-[9px] font-mono text-[#9E9EB7] font-bold uppercase tracking-widest">Active</span>
                  </div>
                </div>

                {/* Main scrollable body panel for custom rendered tools */}
                <div className="flex-1 overflow-y-auto px-6 md:px-12 py-10 custom-scrollbar scroll-smooth bg-white/35 text-[#1A1A1A]">
                  {children}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. Translucent Bottom macOS Dock */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
        <motion.nav 
          initial={{ y: 150, opacity: 0 }}
          animate={{ y: isActualDockHidden ? 150 : 0, opacity: isActualDockHidden ? 0 : 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
          className="px-5 py-3.5 rounded-[2.5rem] bg-white/10 border border-white/20 backdrop-blur-[35px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-end gap-3.5 select-none relative"
        >
          {menuItems.filter(item => item.id !== 'home').map((item) => {
            const IconComponent = item.icon;
            const isOpen = currentView === item.id;
            
            // Generate tailored high-fidelity macOS styled application logo mockups
            let customLogo = null;
            if (item.id === 'home') {
              customLogo = (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-white to-[#F5F4F0] flex items-center justify-center border border-white/20 shadow-lg relative p-2 overflow-hidden">
                  {/* Subtle shadow overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-black/5 pointer-events-none" />
                  {/* Layered Orange and Gold House Icon */}
                  <svg className="w-8 h-8 select-none" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Outer Orange house layer */}
                    <path d="M 50 12 L 15 44 L 15 85 L 85 85 L 85 44 Z" fill="#FA824C" />
                    <path d="M 80 38 L 80 20 L 70 20 L 70 29 Z" fill="#FA824C" />
                    {/* Middle Yellow house layer */}
                    <path d="M 50 28 L 27 50 L 27 78 L 73 78 L 73 50 Z" fill="#FECD45" />
                    {/* Inner White house layer */}
                    <path d="M 50 44 L 40 56 L 40 70 L 60 70 L 60 56 Z" fill="#FFFFFF" />
                  </svg>
                </div>
              );
            } else if (item.id === 'attendance') {
              customLogo = (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-white to-[#F5F4F0] relative overflow-hidden flex items-center justify-center border border-white/20 shadow-lg p-2 group-hover:scale-105 transition-transform">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-black/5 pointer-events-none" />
                  <svg className="w-8 h-8 select-none" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Ring binder loops */}
                    <rect x="22" y="6" width="8" height="20" rx="4" fill="#0F356B" />
                    <rect x="40" y="6" width="8" height="20" rx="4" fill="#0F356B" />
                    <rect x="58" y="6" width="8" height="20" rx="4" fill="#0F356B" />
                    <rect x="76" y="6" width="8" height="20" rx="4" fill="#0F356B" />

                    {/* Outer calendar folder body */}
                    <rect x="12" y="18" width="76" height="72" rx="14" fill="#FFFFFF" stroke="#0F356B" strokeWidth="7" />
                    
                    {/* Dark blue Header block */}
                    <path d="M 15.5 36 L 84.5 36 L 84.5 28 A 10 10 0 0 0 74.5 18 L 25.5 18 A 10 10 0 0 0 15.5 28 Z" fill="#0F356B" />

                    {/* Checkmark in the center of the white area */}
                    <path d="M 34 62 L 46 74 L 70 44" stroke="#0F356B" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                </div>
              );
            } else if (item.id === 'selector') {
              customLogo = (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E1E24] to-[#0D0D11] relative overflow-hidden flex items-center justify-center border border-white/10 shadow-lg">
                  {/* Wheel container/border */}
                  <div className="w-9 h-9 rounded-full border border-white/20 relative flex items-center justify-center shadow-lg bg-gradient-to-br from-[#2D2D30] to-[#1B1B1D] p-[1.5px]">
                    {/* Interactive colored segments */}
                    <svg className="w-full h-full select-none rotate-45 animate-[spin_40s_linear_infinite]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="50" cy="50" r="48" fill="#1C1C1E" stroke="#2C2C2E" strokeWidth="2" />
                      {/* Segment 1: Red-Pink */}
                      <path d="M50,50 L50,2 A48,48 0 0,1 98,50 Z" fill="url(#wheel-pink)" />
                      {/* Segment 2: Orange-Yellow */}
                      <path d="M50,50 L98,50 A48,48 0 0,1 50,98 Z" fill="url(#wheel-orange)" />
                      {/* Segment 3: Cyan-Blue */}
                      <path d="M50,50 L50,98 A48,48 0 0,1 2,50 Z" fill="url(#wheel-cyan)" />
                      {/* Segment 4: Purple-Violet */}
                      <path d="M50,50 L2,50 A48,48 0 0,1 50,2 Z" fill="url(#wheel-purple)" />
                      
                      <defs>
                        <radialGradient id="wheel-pink" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#FB7185" />
                          <stop offset="100%" stopColor="#F43F5E" />
                        </radialGradient>
                        <radialGradient id="wheel-orange" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#FBBF24" />
                          <stop offset="100%" stopColor="#F59E0B" />
                        </radialGradient>
                        <radialGradient id="wheel-cyan" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#22D3EE" />
                          <stop offset="100%" stopColor="#06B6D4" />
                        </radialGradient>
                        <radialGradient id="wheel-purple" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#C084FC" />
                          <stop offset="100%" stopColor="#818CF8" />
                        </radialGradient>
                      </defs>
                    </svg>
                    {/* Metallic physical/glassy center core */}
                    <div className="absolute w-3.5 h-3.5 rounded-full bg-gradient-to-br from-white via-neutral-300 to-neutral-500 shadow-md flex items-center justify-center border border-white/40">
                      {/* Small center rivet pin */}
                      <div className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
                    </div>
                    {/* Chrome pointer needle */}
                    <div className="absolute top-0.5 w-1 h-3 bg-white shadow-sm rounded-t-sm" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                </div>
              );
            } else if (item.id === 'generator') {
              customLogo = (
                <div className="w-12 h-12 rounded-2xl bg-[#000000] relative overflow-hidden flex items-center justify-center border border-white/10 shadow-lg">
                  {/* Glowing fluid colorful mesh circles with high blur */}
                  <div className="absolute inset-0 flex items-center justify-center scale-110 opacity-95">
                    {/* Gradient light spots reacting with high contrast */}
                    <div className="absolute w-8 h-8 rounded-full bg-[#10B981] blur-[7px] mix-blend-screen opacity-70 animate-pulse" 
                         style={{ transform: 'translate(4px, -4px)', animationDuration: '4s' }} />
                    <div className="absolute w-8 h-8 rounded-full bg-[#38BDF8] blur-[7px] mix-blend-screen opacity-85" 
                         style={{ transform: 'translate(-4px, -4px)' }} />
                    <div className="absolute w-9 h-9 rounded-full bg-[#EC4899] blur-[8px] mix-blend-screen opacity-90 animate-pulse" 
                         style={{ transform: 'translate(4px, 4px)', animationDuration: '3s' }} />
                    <div className="absolute w-7 h-7 rounded-full bg-[#A855F7] blur-[6px] mix-blend-screen opacity-85" 
                         style={{ transform: 'translate(-3px, 5px)' }} />
                  </div>
                  {/* Glossy overlay with physical Apple Siri glass ring */}
                  <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.55)_100%)]" />
                  <div className="w-7 h-7 rounded-full border border-white/20 bg-white/5 backdrop-blur-[1.5px] shadow-[0_0_8px_rgba(255,255,255,0.2)] flex items-center justify-center">
                    {/* Center glowing element */}
                    <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#818CF8] to-[#C084FC] blur-[1px]" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                </div>
              );
            } else if (item.id === 'resources') {
              customLogo = (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#FFA734] to-[#FF6B00] relative overflow-hidden flex items-center justify-center border border-white/15 shadow-lg p-1.5">
                  <div className="absolute inset-[1px] bg-white/5 rounded-xl pointer-events-none" />
                  <svg className="w-7 h-7 text-white select-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 21c-1.2-1.2-2.8-2-4.5-2H2V3h5.5c1.4 0 2.7.6 3.5 1.5.8-.9 2.1-1.5 3.5-1.5H22v16h-5.5c-1.7 0-3.3.8-4.5 2z" 
                          fill="white" 
                          opacity="0.95"
                    />
                    <path d="M12 5v14.5" stroke="#FFA734" strokeWidth="1" />
                  </svg>
                </div>
              );
            } else if (item.id === 'calculator') {
              customLogo = (
                <div className="w-12 h-12 rounded-2xl bg-[#F0F0F0] relative overflow-hidden flex flex-col justify-between border border-white/10 shadow-lg p-0">
                  <div className="grid grid-cols-2 grid-rows-2 h-full w-full gap-[0.5px] bg-black/10">
                    <div className="bg-[#FE9F09] flex items-center justify-center text-white font-semibold text-[15px] select-none">+</div>
                    <div className="bg-[#FE9F09] flex items-center justify-center text-white font-semibold text-[15px] select-none">−</div>
                    <div className="bg-[#FE9F09] flex items-center justify-center text-white font-semibold text-[15px] select-none">×</div>
                    <div className="bg-[#D1D1D6] flex items-center justify-center text-neutral-600 font-semibold text-[15px] select-none">=</div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                </div>
              );
            } else if (item.id === 'submissions' || item.id === 'student-submissions') {
              customLogo = (
                <div className="w-12 h-12 rounded-2xl bg-[#FFFCF0] relative overflow-hidden flex flex-col border border-white/25 shadow-lg">
                  {/* Note header yellow segment */}
                  <div className="h-[12px] bg-[#FFCC00] w-full border-b border-[#E5B800] relative flex items-center justify-center">
                    {/* Mini binding ring comb dashed effect */}
                    <div className="absolute -bottom-[2.5px] flex justify-between w-[85%] px-0.5 pointer-events-none">
                      <div className="w-[3px] h-[3px] bg-neutral-400 rounded-full" />
                      <div className="w-[3px] h-[3px] bg-neutral-400 rounded-full" />
                      <div className="w-[3px] h-[3px] bg-neutral-400 rounded-full" />
                      <div className="w-[3px] h-[3px] bg-neutral-400 rounded-full" />
                      <div className="w-[3px] h-[3px] bg-neutral-400 rounded-full" />
                    </div>
                  </div>
                  {/* Paper content with elegant handwriting text representation */}
                  <div className="flex-1 p-1.5 flex flex-col justify-start gap-1 relative">
                    <div className="absolute left-[7px] top-0 bottom-0 w-[0.5px] bg-[#FF3B30] opacity-25" />
                    <div className="w-5/6 h-[1px] bg-[#E5E5EA] ml-2" />
                    <div className="w-11/12 h-[1px] bg-[#E5E5EA] ml-2" />
                    <div className="w-2/3 h-[1px] bg-[#E5E5EA] ml-2" />
                    <div className="w-10/12 h-[1px] bg-[#E5E5EA] ml-2" />
                  </div>
                </div>
              );
            } else if (item.id === 'vault') {
              customLogo = (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#37A3FF] via-[#007AFF] to-[#015FC3] relative overflow-hidden flex items-center justify-center border border-white/20 shadow-lg p-2">
                  <div className="absolute inset-[1px] bg-white/10 rounded-xl pointer-events-none" />
                  {/* Super polished Apple iCloud look with light shine */}
                  <svg className="w-8 h-8 text-white select-none filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.18)]" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path 
                      d="M 28 65 A 13 13 0 0 1 28 39 A 18 18 0 0 1 61 29 A 15 15 0 0 1 78 43 A 14 14 0 0 1 75 65 Z" 
                      fill="white" 
                      opacity="0.96"
                    />
                    <path 
                      d="M 33 65 C 33 65 31 54 43 52 C 55 50 57 39 66 41 C 75 43 77 52 77 52 A 11 11 0 0 1 73 65 Z" 
                      fill="url(#cloud-gloss)" 
                      opacity="0.22"
                    />
                    <defs>
                      <linearGradient id="cloud-gloss" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FFFFFF" />
                        <stop offset="100%" stopColor="#B3D7FF" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                </div>
              );
            } else if (item.id === 'doubt') {
              customLogo = (
                <div className="w-12 h-12 rounded-2xl relative overflow-hidden flex items-center justify-center border border-white/10 shadow-lg">
                  <img 
                    src="/doubt_solve_logo.jpg" 
                    alt="Doubt Solve Logo" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover select-none pointer-events-none scale-[1.38]" 
                  />
                </div>
              );
            } else if (item.id === 'assignment') {
              customLogo = (
                <div className="w-12 h-12 rounded-2xl relative overflow-hidden flex items-center justify-center border border-white/10 shadow-lg">
                  <img 
                    src="/solver_logo.jpg" 
                    alt="Assignments Logo" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover select-none pointer-events-none scale-[1.38]" 
                  />
                </div>
              );
            } else if (item.id === 'analyze') {
              customLogo = (
                <div className="w-12 h-12 rounded-2xl bg-[#1C1C1E] relative overflow-hidden flex items-center justify-center border border-white/10 shadow-lg select-none">
                  <div className="w-8 h-5 flex items-end gap-1">
                    <div className="w-1.5 h-2 bg-emerald-400 rounded-sm" />
                    <div className="w-1.5 h-3.5 bg-emerald-400 rounded-sm" />
                    <div className="w-1.5 h-5 bg-emerald-400 rounded-sm" />
                    <div className="w-1.5 h-3 bg-emerald-400 rounded-sm" />
                  </div>
                </div>
              );
            } else {
              customLogo = (
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg overflow-hidden relative transition-shadow duration-300 bg-gradient-to-tr ${item.gradient}`}>
                  <IconComponent className="w-6 h-6 drop-shadow-md" />
                </div>
              );
            }

            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  if (currentView === item.id) {
                    setWindowState(prev => prev === 'minimized' ? 'maximized' : 'minimized');
                  } else {
                    onNavigate(item.id);
                    setWindowState('maximized');
                  }
                }}
                whileHover={{ y: -12, scale: 1.25 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 200, damping: 20, mass: 0.8 }}
                className="group relative flex flex-col items-center justify-center animate-none"
              >
                {/* Custom Mac App container */}
                <div className={`relative ${isOpen ? 'ring-2 ring-white/65 rounded-2xl shadow-xl' : ''}`}>
                  {customLogo}
                </div>

                {/* macOS dynamic launch indicator dot under active icons */}
                {isOpen ? (
                  <motion.div 
                    layoutId="dock-dot"
                    className="absolute -bottom-1.5 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                  />
                ) : (
                  <div className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-white/25 group-hover:bg-white/60 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                )}

                {/* Standalone macOS tool-tips on app hover */}
                <span className="opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap shadow-md transition-all duration-300 pointer-events-none tracking-wider">
                  {item.label}
                </span>
              </motion.button>
            );
          })}

          {/* Clickable charcoal black separating line (no box or circle) */}
          <div 
            onClick={() => setIsDockHidden(true)}
            className="w-[2px] h-8 bg-[#1A1A1A] self-center mx-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity" 
            title="Hide Dock"
          />

          {/* Quick Sign out / Power off Trigger */}
          <motion.button
            onClick={onLogout}
            whileHover={{ y: -12, scale: 1.25 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, mass: 0.8 }}
            className="group relative flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#2F80ED] to-[#0056C6] relative overflow-hidden flex items-center justify-center border border-white/20 shadow-lg p-1">
              {/* Beautiful sky-to-dark-blue gradient logout with arrow */}
              <svg className="w-8 h-8 text-white select-none" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Elegant door outline with thick rounded terminals */}
                <path 
                  d="M9 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H9" 
                  stroke="white" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                {/* Outgoing arrow */}
                <path 
                  d="M16 17L21 12L16 7" 
                  stroke="white" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                <path 
                  d="M21 12H9" 
                  stroke="white" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              </svg>
            </div>

            <span className="opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-[#1A1A1A] text-[#9E9EB7] border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap shadow-md transition-all duration-300 pointer-events-none tracking-wider">
              Logout Portal
            </span>
          </motion.button>
        </motion.nav>
      </div>

      {/* 6. Restore Dock trigger caretaker */}
      <AnimatePresence>
        {isActualDockHidden && (
          <motion.button
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            whileHover={{ scale: 1.35, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsDockHidden(false);
              if (windowState === 'maximized') {
                setWindowState('normal');
              }
            }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 text-[#1A1A1A] font-black text-3xl cursor-pointer bg-transparent border-none p-2 select-none"
            title="Restore Dock"
          >
            ^
          </motion.button>
        )}
      </AnimatePresence>

      {/* Dynamic island replaces the floating assistant completely */}

    </div>
  );
}
