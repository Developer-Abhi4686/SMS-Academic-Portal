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
  HelpCircle,
  PenTool,
  LogOut,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  MonitorPlay,
  FileSearch,
  MessageSquare,
  MessageCircle,
  LayoutGrid,
  Menu,
  X,
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
  Bot,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole, UserProfile, RunningApp } from '../types';
import { getGeminiResponse, prompts } from '../lib/geminiService';
import MarkdownRenderer from './MarkdownRenderer';
import WindowFrame from './WindowFrame';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: UserRole;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  userClass: string | null;
  userSection: string | null;
  userProfile: UserProfile | null;
  
  // Multitasking props
  runningApps: RunningApp[];
  onMinimizeApp: (id: string) => void;
  onRestoreApp: (id: string) => void;
  onCloseApp: (id: string) => void;
  onToggleMaximizeApp: (id: string) => void;
  renderAppContent: (id: string, closeSelf: () => void) => React.ReactNode;

  // PWA props
  showInstallButton?: boolean;
  onInstall?: () => void;
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
  userProfile,
  runningApps,
  onMinimizeApp,
  onRestoreApp,
  onCloseApp,
  onToggleMaximizeApp,
  renderAppContent,
  showInstallButton = false,
  onInstall
}: DashboardLayoutProps) {
  
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const [menuBarDropdown, setMenuBarDropdown] = useState<string | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [isWidgetPanelOpen, setIsWidgetPanelOpen] = useState(true);
  const [currentDateState, setCurrentDateState] = useState(new Date());
  const [isDockHidden, setIsDockHidden] = useState(false);
  const [isDockOverrideShowing, setIsDockOverrideShowing] = useState(false);
  const desktopRef = useRef<HTMLDivElement>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [isMobileFinderOpen, setIsMobileFinderOpen] = useState(false);
  const [showMobileLogoMenu, setShowMobileLogoMenu] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeApp = runningApps.find(a => a.id === currentView);
  const isCurrentMaximized = activeApp ? activeApp.maximized && !activeApp.minimized : false;
  const isActualDockHidden = isDockHidden || (currentView !== 'home' && isCurrentMaximized && !isDockOverrideShowing);

  // Automatically slide down dock (reset override showing) when the current application changes
  useEffect(() => {
    setIsDockOverrideShowing(false);
  }, [currentView]);

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
      return "The Calculator is no longer available on this workstation.";
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
    { id: 'submissions', label: 'Submissions', icon: FileText, gradient: 'from-[#1A1A1A] to-[#9E9EB7]' },
    { id: 'vault', label: 'Vault', icon: FolderLock, gradient: 'from-[#9E9EB7] to-[#1A1A1A]' },
  ];

  const studentMenuItems = [
    { id: 'home', label: 'Finder', icon: LayoutDashboard, gradient: 'from-[#1A1A1A] to-[#6B6998]' },
    { id: 'doubt', label: 'Doubt Solve', icon: HelpCircle, gradient: 'from-[#6B6998] to-[#9E9EB7]' },
    { id: 'assignment', label: 'Assignments', icon: PenTool, gradient: 'from-[#6B6998] to-[#1A1A1A]' },
    { id: 'resources', label: 'Resources', icon: BookOpen, gradient: 'from-[#9E9EB7] to-[#6B6998]' },
    { id: 'analyze', label: 'Analysis', icon: FileSearch, gradient: 'from-[#1A1A1A] to-[#6B6998]' },
    { id: 'student-submissions', label: 'Submissions', icon: GraduationCap, gradient: 'from-[#6B6998] to-[#9E9EB7]' },
  ];

  const menuItems = role === 'teacher' ? teacherMenuItems : studentMenuItems;

  // Render the widget space when home is active
  const renderDesktopWidgets = () => {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none overflow-hidden">
        {/* Soft powder blue glowing light coming from the back in the center of the text and spreading out */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full bg-[radial-gradient(circle,rgba(224,242,254,0.55)_0%,rgba(186,230,253,0.18)_40%,rgba(240,249,255,0.02)_70%)] pointer-events-none blur-2xl opacity-90" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, type: "spring", stiffness: 80 }}
          className="text-center select-none relative z-10 pointer-events-auto"
        >
          <h1 className="text-5xl md:text-7xl font-sans font-black tracking-tight text-[#1A1A1A] uppercase antialiased drop-shadow-[0_2px_15px_rgba(186,230,253,0.4)]">
            Welcome Back
          </h1>
        </motion.div>
      </div>
    );
  };

  const currentActiveLabel = menuItems.find(i => i.id === currentView)?.label || 'Finder';

  return (
    <div className="w-screen h-screen relative overflow-hidden select-none font-sans flex flex-col text-[#1A1A1A] isolate">
      
      {/* 1. Operating System Wallpaper - Glowing Blurry Aesthetic Abstract Canvas */}
      <div className="absolute inset-0 overflow-hidden -z-20 bg-[#F2F2FA]">
        {/* Layer 1: Global smooth background gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#E6E5F3] via-[#F2F2FA] to-[#EDF2F7]" />
        
        {/* Layer 2: Glowing Blurry Abstract Aesthetic Blobs with high visibility */}
        {/* Top-Right Glowing Amethyst/Violet Blob */}
        <div className="absolute -top-24 -right-24 w-[750px] h-[750px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.38)_0%,rgba(139,92,246,0.12)_45%,transparent_75%)] pointer-events-none blur-[85px] opacity-100 animate-pulse duration-10000" />
        
        {/* Center-Left Golden Butter Yellow Blob */}
        <div className="absolute top-[15%] left-[5%] w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(253,186,116,0.52)_0%,rgba(253,186,116,0.15)_45%,transparent_75%)] pointer-events-none blur-[75px] opacity-100" />
        
        {/* Bottom-Left Radiant Sage Mint Green Blob */}
        <div className="absolute -bottom-24 -left-24 w-[850px] h-[850px] rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.48)_0%,rgba(52,211,153,0.15)_50%,transparent_75%)] pointer-events-none blur-[95px] opacity-100" />
        
        {/* Bottom-Right Vivid Sky Aura Blob */}
        <div className="absolute -bottom-16 -right-16 w-[750px] h-[750px] rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.46)_0%,rgba(14,165,233,0.15)_45%,transparent_75%)] pointer-events-none blur-[90px] opacity-100" />

        {/* Center-Right Soft Radiant Magenta Splash */}
        <div className="absolute top-[35%] right-[10%] w-[650px] h-[650px] rounded-full bg-[radial-gradient(circle,rgba(244,63,94,0.32)_0%,rgba(244,63,94,0.1)_45%,transparent_75%)] pointer-events-none blur-[85px] opacity-95" />
      </div>
      
      {/* 1b. Soft vibrant sky blue/violet glow behind the dynamic island */}
      <div className={`fixed top-0 left-1/2 -translate-x-1/2 -translate-y-20 w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.65)_0%,rgba(99,102,241,0.18)_45%,transparent_70%)] pointer-events-none blur-3xl transition-all duration-500 z-10 ${
        isCurrentMaximized && !isIslandExpanded ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
      }`} />

      {/* 1c. Soft bright yellowish-amber glow behind the dock (just in the home screen, blending beautifully) */}
      {currentView === 'home' && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 translate-y-16 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.5)_0%,rgba(253,244,191,0.22)_45%,transparent_70%)] pointer-events-none blur-3xl opacity-100 z-10 transition-all duration-500 animate-pulse" />
      )}
      
      {/* 2. Top macOS Menu Bar */}
      <header className="fixed top-0 inset-x-0 h-8 bg-transparent text-[#1A1A1A] flex items-center justify-between px-4 text-xs font-semibold z-50 select-none">
        <div className="flex items-center gap-4 relative">
          {/* Logo / Apple Equivalent drop - Clickable on mobile */}
          <div 
            onClick={() => {
              if (isMobile) {
                setShowMobileLogoMenu(prev => !prev);
              }
            }}
            className={`px-2 py-1 rounded flex items-center justify-center gap-2 text-[#6B6998] transition-colors ${
              isMobile ? 'hover:bg-[#6B6998]/10 cursor-pointer active:scale-95' : 'select-none pointer-events-none cursor-default'
            }`}
          >
            <GraduationCap className="w-4 h-4" strokeWidth={1.5} />
            <span className="font-bold text-[#1A1A1A] tracking-wide text-xs">
              St. Michael's
            </span>
          </div>

          {/* Mobile Logo Menu Dropdown */}
          <AnimatePresence>
            {isMobile && showMobileLogoMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMobileLogoMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-2 top-8 w-44 bg-white/95 backdrop-blur-xl border border-[#9E9EB7]/30 rounded-2xl shadow-xl p-2 z-50 flex flex-col gap-1 text-[#1A1A1A] select-none"
                >
                  <p className="text-[9px] font-black uppercase text-[#6B6998] tracking-widest px-2 py-1 border-b border-[#9E9EB7]/10 mb-1">
                    St. Michael's Hub
                  </p>
                  
                  <a 
                    href="https://sketchfab.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={() => setShowMobileLogoMenu(false)}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#6B6998]/10 rounded-xl transition-all font-bold text-[10px] cursor-pointer text-[#1A1A1A]"
                  >
                    <Compass className="w-3.5 h-3.5 text-[#6B6998]" />
                    <span>3D Models</span>
                  </a>

                  <button
                    onClick={() => {
                      setShowCreditModal(true);
                      setShowMobileLogoMenu(false);
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#6B6998]/10 rounded-xl text-left w-full transition-all font-bold text-[10px] cursor-pointer text-[#6B6998]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Creator Credit</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <div className="hidden md:flex items-center gap-1.5 text-[#1A1A1A]/75">
            <a 
              href="https://sketchfab.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:bg-[#6B6998]/10 px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              3D Models
            </a>
            <button
              onClick={() => setShowCreditModal(true)}
              className="hover:bg-[#6B6998]/10 px-2.5 py-1 rounded transition-colors cursor-pointer text-[#6B6998] font-bold"
            >
              Creator Credit
            </button>
          </div>
        </div>

        {/* Center menu spacing occupied visually by the dynamic island below */}
        <div className="w-20" />

        {/* Menu Bar Right Controls */}
        <div className="flex items-center gap-3">
          {/* Download App/PWA button */}
          {showInstallButton && onInstall && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: "spring", stiffness: 150, damping: 25 }}
              onClick={onInstall}
              className="bg-[#6B6998] hover:bg-[#5A5887] text-white px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-sans border border-transparent flex items-center gap-1.5 backdrop-blur-md font-bold shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-accent animate-bounce" />
              <span>Download App</span>
            </motion.button>
          )}

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
                    <GraduationCap className="w-6 h-6 text-white" strokeWidth={1.5} />
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

      {/* 3. Dynamic Island Prototype (Always Available top-center with smooth spring transitions) */}
      {isIslandExpanded && (
        <div 
          className="fixed inset-0 z-40 bg-transparent cursor-default animate-fade-in"
          onClick={() => setIsIslandExpanded(false)}
        />
      )}

      <motion.div 
        animate={{ 
          top: isIslandExpanded ? 56 : (isCurrentMaximized ? 6 : 44),
          scale: 1,
          opacity: 1
        }}
        transition={{ type: "spring", stiffness: 180, damping: 24 }}
        className="fixed left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 pointer-events-auto"
      >
        {/* Left satellite circle for 2nd minimized app */}
        {!isIslandExpanded && runningApps.filter(a => a.minimized).length >= 2 && (
          <motion.div
            initial={{ scale: 0, opacity: 0, x: 12 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0, opacity: 0, x: 12 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            onClick={(e) => {
              e.stopPropagation();
              const mApps = runningApps.filter(a => a.minimized);
              if (mApps[1]) {
                onRestoreApp(mApps[1].id);
              }
            }}
            className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-cyan-400 cursor-pointer shadow-[0_10px_25px_rgba(0,0,0,0.3)] hover:scale-110 active:scale-95 transition-all shrink-0"
            title={`Restore ${menuItems.find(i => i.id === runningApps.filter(a => a.minimized)[1]?.id)?.label || 'App'}`}
          >
            {React.createElement(menuItems.find(i => i.id === runningApps.filter(a => a.minimized)[1]?.id)?.icon || Sparkles, { className: 'w-4 h-4' })}
          </motion.div>
        )}

        {/* Main central Dynamic Island pill */}
        <motion.div 
          onClick={() => {
            setIsIslandExpanded(!isIslandExpanded);
          }}
          animate={{ 
            width: isIslandExpanded 
              ? 260 
              : activeApp && !activeApp.minimized
                ? (isCurrentMaximized ? 64 : 120) 
                : runningApps.filter(a => a.minimized).length >= 3
                  ? 150 
                  : 120,
            height: isIslandExpanded ? 260 : (isCurrentMaximized && !activeApp?.minimized ? 20 : 32),
            borderRadius: isIslandExpanded ? 24 : 16,
          }}
          transition={{ type: "spring", stiffness: 180, damping: 24, mass: 1 }}
          className={`border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-center overflow-hidden cursor-pointer text-white bg-[#1A1A1A] select-none hover:shadow-[0_0_15px_rgba(107,105,152,0.25)] ${
            isCurrentMaximized && !isIslandExpanded && !activeApp?.minimized ? 'px-2 py-0' : 'px-4 py-2'
          }`}
        >
          <AnimatePresence mode="wait">
            {!isIslandExpanded ? (
              <motion.div 
                key="compact"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="w-full h-full flex items-center justify-center text-white"
              >
                {runningApps.filter(a => a.minimized).length >= 3 ? (
                  /* 3rd minimized app fills the central space, info and logo represent it */
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      const mApps = runningApps.filter(a => a.minimized);
                      if (mApps[2]) {
                        onRestoreApp(mApps[2].id);
                      }
                    }}
                    className="flex items-center gap-2 max-w-full justify-center text-center truncate"
                  >
                    {React.createElement(menuItems.find(i => i.id === runningApps.filter(a => a.minimized)[2]?.id)?.icon || Sparkles, { className: 'w-3.5 h-3.5 text-cyan-400 shrink-0' })}
                    <span className="text-[8.5px] font-black uppercase text-white truncate font-mono tracking-wider">
                      {menuItems.find(i => i.id === runningApps.filter(a => a.minimized)[2]?.id)?.label || 'App'}
                    </span>
                  </div>
                ) : (
                  /* Standard display when under 3 apps are minimized */
                  <span className={`font-bold uppercase font-mono truncate text-center w-full transition-all duration-300 ${
                    isCurrentMaximized ? 'text-[7.5px] tracking-normal text-[#9E9EB7]/80' : 'text-[9.5px] tracking-[0.06em] text-[#9E9EB7]'
                  }`}>
                    {isCurrentMaximized 
                      ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
                      : new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()
                    }
                  </span>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, delay: 0.02 }}
                className="w-full h-full text-white text-xs text-left select-none flex flex-col justify-center p-1"
                onClick={(e) => {
                  e.stopPropagation(); // Stop clicking card from toggling island
                }}
              >
                {runningApps.length === 0 ? (
                  <motion.div 
                    key="clock-expanded"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col justify-between p-3.5 h-full"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                      <span className="text-[9px] uppercase tracking-[0.25em] font-black text-cyan-400 font-mono">System Clock</span>
                      <span className="text-[8.5px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider font-mono">Live</span>
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center justify-center py-4 text-center">
                      <span className="text-2xl font-mono font-bold tracking-widest text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.25)]">
                        {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                      </span>
                      <span className="text-[10px] uppercase font-black tracking-wider text-[#9E9EB7] mt-3 block">
                        {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                      <div className="mt-4 flex items-center gap-1.5 text-[8px] font-black tracking-widest font-mono text-cyan-400/80 bg-cyan-500/5 px-2.5 py-1 rounded-full border border-cyan-500/10 uppercase">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span>St. Michael's Portal</span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="running-apps-expanded"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col justify-between p-2 h-full"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                      <span className="text-[9px] uppercase tracking-[0.25em] font-black text-[#9E9EB7] font-mono">System Secure</span>
                      <span className="text-[8.5px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider font-mono">Active</span>
                    </div>
                    
                    <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[170px] pr-1 custom-scrollbar flex flex-col justify-start">
                      {runningApps.map(app => {
                        const item = menuItems.find(i => i.id === app.id);
                        if (!item) return null;
                        const IconComp = item.icon;
                        return (
                          <div 
                            key={app.id} 
                            onClick={() => {
                              onRestoreApp(app.id);
                              setIsIslandExpanded(false);
                            }}
                            className="flex items-center justify-between bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-all cursor-pointer group/item border border-white/5"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center text-cyan-400 shrink-0">
                                <IconComp className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-[10px] font-black text-white uppercase tracking-wider truncate font-mono">{item.label}</span>
                              {app.minimized && (
                                <span className="text-[7.5px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider font-mono shrink-0">MIN</span>
                              )}
                            </div>
                            
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                onCloseApp(app.id); 
                                if (runningApps.length <= 1) {
                                  setIsIslandExpanded(false);
                                }
                              }}
                              className="p-1 px-2.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all cursor-pointer text-[9px] font-bold uppercase font-mono bg-white/5 hover:bg-white/10"
                              title="Close App"
                            >
                              Close
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right satellite circle for 1st minimized app */}
        {!isIslandExpanded && runningApps.filter(a => a.minimized).length >= 1 && (
          <motion.div
            initial={{ scale: 0, opacity: 0, x: -12 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0, opacity: 0, x: -12 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            onClick={(e) => {
              e.stopPropagation();
              const mApps = runningApps.filter(a => a.minimized);
              if (mApps[0]) {
                onRestoreApp(mApps[0].id);
              }
            }}
            className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-cyan-400 cursor-pointer shadow-[0_10px_25px_rgba(0,0,0,0.3)] hover:scale-110 active:scale-95 transition-all shrink-0"
            title={`Restore ${menuItems.find(i => i.id === runningApps.filter(a => a.minimized)[0]?.id)?.label || 'App'}`}
          >
            {React.createElement(menuItems.find(i => i.id === runningApps.filter(a => a.minimized)[0]?.id)?.icon || Sparkles, { className: 'w-4 h-4' })}
          </motion.div>
        )}
      </motion.div>

      {/* 4. Desktop Surface (Only renders when desktop is "tidy" or active app is minimized) */}
      <div 
        ref={desktopRef}
        className="flex-1 w-full relative z-20 overflow-hidden px-4 md:px-12 pb-32 pt-20 select-text text-[#1A1A1A]"
      >
        {/* Render Desktop Widgets if no app is active OR if the active app is minimized */}
        {!runningApps.some(app => !app.minimized) && (
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

        <AnimatePresence>
          {runningApps.map((app, index) => {
            const item = menuItems.find(i => i.id === app.id);
            const isFocused = currentView === app.id;

            return (
              <WindowFrame
                key={app.id}
                app={app}
                index={index}
                isFocused={isFocused}
                item={item}
                onClose={() => onCloseApp(app.id)}
                onMinimize={() => onMinimizeApp(app.id)}
                onToggleMaximize={() => onToggleMaximizeApp(app.id)}
                onFocus={() => onRestoreApp(app.id)}
                dragConstraintsRef={desktopRef}
              >
                {renderAppContent(app.id, () => onCloseApp(app.id))}
              </WindowFrame>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 5. Translucent Bottom macOS Dock */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto max-w-[95vw]">
        <motion.nav 
          initial={{ y: 150, opacity: 0 }}
          animate={{ y: isActualDockHidden ? 150 : 0, opacity: isActualDockHidden ? 0 : 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
          className="px-3 sm:px-5 py-2.5 sm:py-3.5 rounded-[1.75rem] sm:rounded-[2.5rem] bg-white/10 border border-white/20 backdrop-blur-[35px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-end gap-2 sm:gap-3.5 select-none relative max-w-full overflow-x-auto scrollbar-none pb-3 sm:pb-3.5"
        >
          {(() => {
            const allDockApps = menuItems.filter(item => item.id !== 'home');
            const dockAppsToRender = isMobile ? allDockApps.slice(0, 3) : allDockApps;

            return dockAppsToRender.map((item) => {
              const IconComponent = item.icon;
              const isOpen = runningApps.some(a => a.id === item.id);
              
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
                      <svg className="w-full h-full select-none rotate-45" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#8B5CF6] via-[#6D28D9] to-[#4C1D95] relative overflow-hidden flex items-center justify-center border border-white/25 shadow-lg select-none">
                    <div className="absolute inset-[1px] bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                    <div className="absolute w-5 h-5 bg-purple-400/40 rounded-full blur-md opacity-75" />
                    <svg className="w-6.5 h-6.5 text-white filter drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.3)] relative z-10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                    </svg>
                  </div>
                );
              } else if (item.id === 'assignment') {
                customLogo = (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#0EA5E9] via-[#0284C7] to-[#0369A1] relative overflow-hidden flex items-center justify-center border border-white/25 shadow-lg select-none">
                    <div className="absolute inset-[1px] bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                    <div className="absolute w-5 h-5 bg-sky-300/40 rounded-full blur-md opacity-75" />
                    <svg className="w-6.5 h-6.5 text-white filter drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.3)] relative z-10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
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
                    const runningApp = runningApps.find(a => a.id === item.id);
                    const isAppOpen = !!runningApp;
                    if (isAppOpen) {
                      if (runningApp.minimized) {
                        onRestoreApp(item.id);
                      } else if (currentView === item.id) {
                        onMinimizeApp(item.id);
                      } else {
                        onRestoreApp(item.id);
                      }
                    } else {
                      onNavigate(item.id);
                    }
                  }}
                  whileHover={{ 
                    y: -1, 
                    scale: 1.015, 
                    filter: "brightness(1.01) drop-shadow(0px 2px 4px rgba(255,255,255,0.04))" 
                  }}
                  whileTap={{ scale: 0.99, y: 0 }}
                  transition={{ type: "spring", stiffness: 150, damping: 25 }}
                  className="group relative flex flex-col items-center justify-center animate-none shrink-0"
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
                  <span className="opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap shadow-md transition-all duration-300 pointer-events-none tracking-wider font-sans">
                    {item.label}
                  </span>
                </motion.button>
              );
            });
          })()}

          {/* Special Finder App Drawer Launcher Button on Mobile */}
          {isMobile && (
            <motion.button
              onClick={() => setIsMobileFinderOpen(prev => !prev)}
              whileHover={{ 
                y: -1, 
                scale: 1.015, 
                filter: "brightness(1.01) drop-shadow(0px 2px 4px rgba(168,85,247,0.06))" 
              }}
              whileTap={{ scale: 0.99, y: 0 }}
              transition={{ type: "spring", stiffness: 150, damping: 25 }}
              className="group relative flex flex-col items-center justify-center animate-none shrink-0"
              title="Finder"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#A855F7] via-[#7C3AED] to-[#5B21B6] relative overflow-hidden flex items-center justify-center border border-white/25 shadow-lg select-none">
                  <div className="absolute inset-[1px] bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                  <div className="absolute w-5 h-5 bg-purple-300/40 rounded-full blur-md opacity-75" />
                  <LayoutGrid className="w-6.5 h-6.5 text-white filter drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.3)] relative z-10" strokeWidth={2.5} />
                </div>
              </div>
              <span className="opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap shadow-md transition-all duration-300 pointer-events-none tracking-wider font-sans">
                Finder
              </span>
            </motion.button>
          )}

          {/* Clickable charcoal black separating line (no box or circle) */}
          <div 
            onClick={() => {
              if (isDockOverrideShowing) {
                setIsDockOverrideShowing(false);
              } else {
                setIsDockHidden(true);
              }
            }}
            className="w-[2px] h-8 bg-[#1A1A1A] self-center mx-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity shrink-0" 
            title="Hide Dock"
          />

          {/* Quick Sign out / Power off Trigger */}
          <motion.button
            onClick={onLogout}
            whileHover={{ 
              y: -1, 
              scale: 1.015, 
              filter: "brightness(1.01) drop-shadow(0px 2px 4px rgba(0,86,198,0.05))" 
            }}
            whileTap={{ scale: 0.99, y: 0 }}
            transition={{ type: "spring", stiffness: 150, damping: 25 }}
            className="group relative flex flex-col items-center justify-center shrink-0"
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

            <span className="opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-[#1A1A1A] text-[#9E9EB7] border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap shadow-md transition-all duration-300 pointer-events-none tracking-wider font-sans">
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
            whileHover={{ scale: 1.03, y: -1, backgroundColor: 'rgba(255, 255, 255, 0.35)' }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 150, damping: 25 }}
            onClick={() => {
              if (isCurrentMaximized) {
                setIsDockOverrideShowing(true);
              } else {
                setIsDockHidden(false);
              }
            }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 p-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] cursor-pointer flex items-center justify-center transition-all duration-300 hover:border-white/20 select-none group"
            title="Restore Dock"
          >
            <ChevronUp className="w-5 h-5 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Dynamic island replaces the floating assistant completely */}

      {/* Creator Credit Modal */}
      <AnimatePresence>
        {showCreditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreditModal(false)}
              className="absolute inset-0 bg-[#1A1A1A]/40 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-8 text-[#1A1A1A] z-10 flex flex-col gap-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-[#1A1A1A]">About the Creator</h3>
                    <p className="text-xs text-[#6B6998] font-bold uppercase tracking-wider">Student & Developer</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCreditModal(false)}
                  className="w-8 h-8 rounded-full bg-[#1A1A1A]/5 hover:bg-[#1A1A1A]/10 flex items-center justify-center text-[#1A1A1A]/60 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-[#1A1A1A]/80">
                  Hi! I'm <strong className="text-[#6B6998] font-black text-base">Abhi Shama</strong> from <strong className="text-primary">Class 9-D</strong>!
                </p>
                <p className="text-sm leading-relaxed text-[#1A1A1A]/80">
                  Welcome to my app built for St. Michael's School! I am actively <strong className="text-primary font-bold">learning to code</strong> and enjoying every step of this journey.
                </p>
                <p className="text-sm leading-relaxed text-[#1A1A1A]/80">
                  Building this portal has been a wonderful experience. I love learning new things, designing interfaces, and using code to create platforms that help teachers and students alike. Thank you for visiting!
                </p>

                <div className="bg-[#6B6998]/5 border border-[#6B6998]/10 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold text-xs select-none">
                    9D
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Designed with passion</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">St. Michael's School, Bhind</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-2">
                <button 
                  onClick={() => setShowCreditModal(false)}
                  className="w-full bg-[#6B6998] text-white py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#5C5A8A] transition-all shadow-lg shadow-[#6B6998]/20"
                >
                  Awesome!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Finder Drawer (Launchpad) */}
      <AnimatePresence>
        {isMobile && isMobileFinderOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop blur overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFinderOpen(false)}
              className="absolute inset-0 bg-[#1A1A1A]/40 backdrop-blur-md"
            />
            
            {/* Drawer Panel */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white/90 backdrop-blur-3xl border-t border-white/30 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.15)] p-6 text-[#1A1A1A] z-10 flex flex-col gap-6"
            >
              {/* Drawer Handle Accent */}
              <div className="w-12 h-1.5 bg-neutral-300 rounded-full mx-auto" />

              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#6B6998]/10 rounded-xl">
                    <LayoutGrid className="w-5 h-5 text-[#6B6998]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold tracking-tight text-[#1A1A1A]">App Finder</h3>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5">St. Michael's Launchpad</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileFinderOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#1A1A1A]/5 hover:bg-[#1A1A1A]/10 flex items-center justify-center text-[#1A1A1A]/60 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid list of remaining apps */}
              <div className="grid grid-cols-4 gap-4 px-2 py-1 max-h-[50vh] overflow-y-auto scrollbar-none pb-8">
                {(() => {
                  const allDockApps = menuItems.filter(item => item.id !== 'home');
                  const remainingAppsList = allDockApps.slice(3);

                  if (remainingAppsList.length === 0) {
                    return (
                      <div className="col-span-4 text-center py-8 text-neutral-400 font-medium text-xs">
                        No additional applications detected.
                      </div>
                    );
                  }

                  return remainingAppsList.map((item) => {
                    const IconComponent = item.icon;
                    const isOpen = runningApps.some(a => a.id === item.id);
                    
                    // Custom logos exact duplication for completeness & high-fidelity matching
                    let customLogo = null;
                    if (item.id === 'attendance') {
                      customLogo = (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-white to-[#F5F4F0] relative overflow-hidden flex items-center justify-center border border-white/20 shadow-md p-2">
                          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-black/5 pointer-events-none" />
                          <svg className="w-8 h-8 select-none" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="22" y="6" width="8" height="20" rx="4" fill="#0F356B" />
                            <rect x="40" y="6" width="8" height="20" rx="4" fill="#0F356B" />
                            <rect x="58" y="6" width="8" height="20" rx="4" fill="#0F356B" />
                            <rect x="76" y="6" width="8" height="20" rx="4" fill="#0F356B" />
                            <rect x="12" y="18" width="76" height="72" rx="14" fill="#FFFFFF" stroke="#0F356B" strokeWidth="7" />
                            <path d="M 15.5 36 L 84.5 36 L 84.5 28 A 10 10 0 0 0 74.5 18 L 25.5 18 A 10 10 0 0 0 15.5 28 Z" fill="#0F356B" />
                            <path d="M 34 62 L 46 74 L 70 44" stroke="#0F356B" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          </svg>
                        </div>
                      );
                    } else if (item.id === 'selector') {
                      customLogo = (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E1E24] to-[#0D0D11] relative overflow-hidden flex items-center justify-center border border-white/10 shadow-md">
                          <div className="w-9 h-9 rounded-full border border-white/20 relative flex items-center justify-center shadow-lg bg-gradient-to-br from-[#2D2D30] to-[#1B1B1D] p-[1.5px]">
                            <svg className="w-full h-full select-none rotate-45" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="50" cy="50" r="48" fill="#1C1C1E" stroke="#2C2C2E" strokeWidth="2" />
                              <path d="M50,50 L50,2 A48,48 0 0,1 98,50 Z" fill="url(#wheel-pink-f)" />
                              <path d="M50,50 L98,50 A48,48 0 0,1 50,98 Z" fill="url(#wheel-orange-f)" />
                              <path d="M50,50 L50,98 A48,48 0 0,1 2,50 Z" fill="url(#wheel-cyan-f)" />
                              <path d="M50,50 L2,50 A48,48 0 0,1 50,2 Z" fill="url(#wheel-purple-f)" />
                              <defs>
                                <radialGradient id="wheel-pink-f" cx="50%" cy="50%" r="50%">
                                  <stop offset="0%" stopColor="#FB7185" />
                                  <stop offset="100%" stopColor="#F43F5E" />
                                </radialGradient>
                                <radialGradient id="wheel-orange-f" cx="50%" cy="50%" r="50%">
                                  <stop offset="0%" stopColor="#FBBF24" />
                                  <stop offset="100%" stopColor="#F59E0B" />
                                </radialGradient>
                                <radialGradient id="wheel-cyan-f" cx="50%" cy="50%" r="50%">
                                  <stop offset="0%" stopColor="#22D3EE" />
                                  <stop offset="100%" stopColor="#06B6D4" />
                                </radialGradient>
                                <radialGradient id="wheel-purple-f" cx="50%" cy="50%" r="50%">
                                  <stop offset="0%" stopColor="#C084FC" />
                                  <stop offset="100%" stopColor="#818CF8" />
                                </radialGradient>
                              </defs>
                            </svg>
                            <div className="absolute w-3.5 h-3.5 rounded-full bg-gradient-to-br from-white via-neutral-300 to-neutral-500 shadow-md flex items-center justify-center border border-white/40">
                              <div className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
                            </div>
                            <div className="absolute top-0.5 w-1 h-3 bg-white shadow-sm rounded-t-sm" />
                          </div>
                        </div>
                      );
                    } else if (item.id === 'generator') {
                      customLogo = (
                        <div className="w-12 h-12 rounded-2xl bg-[#000000] relative overflow-hidden flex items-center justify-center border border-white/10 shadow-md">
                          <div className="absolute inset-0 flex items-center justify-center scale-110 opacity-95">
                            <div className="absolute w-8 h-8 rounded-full bg-[#10B981] blur-[7px] mix-blend-screen opacity-70 animate-pulse" style={{ transform: 'translate(4px, -4px)', animationDuration: '4s' }} />
                            <div className="absolute w-8 h-8 rounded-full bg-[#38BDF8] blur-[7px] mix-blend-screen opacity-85" style={{ transform: 'translate(-4px, -4px)' }} />
                            <div className="absolute w-9 h-9 rounded-full bg-[#EC4899] blur-[8px] mix-blend-screen opacity-90 animate-pulse" style={{ transform: 'translate(4px, 4px)', animationDuration: '3s' }} />
                            <div className="absolute w-7 h-7 rounded-full bg-[#A855F7] blur-[6px] mix-blend-screen opacity-85" style={{ transform: 'translate(-3px, 5px)' }} />
                          </div>
                          <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.55)_100%)]" />
                          <div className="w-7 h-7 rounded-full border border-white/20 bg-white/5 backdrop-blur-[1.5px] shadow-[0_0_8px_rgba(255,255,255,0.2)] flex items-center justify-center">
                            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#818CF8] to-[#C084FC] blur-[1px]" />
                          </div>
                        </div>
                      );
                    } else if (item.id === 'resources') {
                      customLogo = (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#FFA734] to-[#FF6B00] relative overflow-hidden flex items-center justify-center border border-white/15 shadow-md p-1.5">
                          <svg className="w-7 h-7 text-white select-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 21c-1.2-1.2-2.8-2-4.5-2H2V3h5.5c1.4 0 2.7.6 3.5 1.5.8-.9 2.1-1.5 3.5-1.5H22v16h-5.5c-1.7 0-3.3.8-4.5 2z" fill="white" opacity="0.95" />
                          </svg>
                        </div>
                      );
                    } else if (item.id === 'calculator') {
                      customLogo = (
                        <div className="w-12 h-12 rounded-2xl bg-[#F0F0F0] relative overflow-hidden flex flex-col justify-between border border-white/10 shadow-md p-0">
                          <div className="grid grid-cols-2 grid-rows-2 h-full w-full gap-[0.5px] bg-black/10">
                            <div className="bg-[#FE9F09] flex items-center justify-center text-white font-semibold text-xs select-none">+</div>
                            <div className="bg-[#FE9F09] flex items-center justify-center text-white font-semibold text-xs select-none">−</div>
                            <div className="bg-[#FE9F09] flex items-center justify-center text-white font-semibold text-xs select-none">×</div>
                            <div className="bg-[#D1D1D6] flex items-center justify-center text-neutral-600 font-semibold text-xs select-none">=</div>
                          </div>
                        </div>
                      );
                    } else if (item.id === 'submissions' || item.id === 'student-submissions') {
                      customLogo = (
                        <div className="w-12 h-12 rounded-2xl bg-[#FFFCF0] relative overflow-hidden flex flex-col border border-white/25 shadow-md">
                          <div className="h-[12px] bg-[#FFCC00] w-full border-b border-[#E5B800] relative flex items-center justify-center">
                            <div className="absolute -bottom-[2.5px] flex justify-between w-[85%] px-0.5 pointer-events-none">
                              <div className="w-[2px] h-[2px] bg-neutral-400 rounded-full" />
                              <div className="w-[2px] h-[2px] bg-neutral-400 rounded-full" />
                              <div className="w-[2px] h-[2px] bg-neutral-400 rounded-full" />
                              <div className="w-[2px] h-[2px] bg-neutral-400 rounded-full" />
                            </div>
                          </div>
                          <div className="flex-1 p-1 flex flex-col justify-start gap-1 relative">
                            <div className="absolute left-[5px] top-0 bottom-0 w-[0.5px] bg-[#FF3B30] opacity-25" />
                            <div className="w-5/6 h-[1px] bg-[#E5E5EA] ml-1.5" />
                            <div className="w-11/12 h-[1px] bg-[#E5E5EA] ml-1.5" />
                            <div className="w-2/3 h-[1px] bg-[#E5E5EA] ml-1.5" />
                          </div>
                        </div>
                      );
                    } else if (item.id === 'vault') {
                      customLogo = (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#37A3FF] via-[#007AFF] to-[#015FC3] relative overflow-hidden flex items-center justify-center border border-white/20 shadow-md p-2">
                          <svg className="w-8 h-8 text-white select-none filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.18)]" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M 28 65 A 13 13 0 0 1 28 39 A 18 18 0 0 1 61 29 A 15 15 0 0 1 78 43 A 14 14 0 0 1 75 65 Z" fill="white" opacity="0.96" />
                          </svg>
                        </div>
                      );
                    } else if (item.id === 'doubt') {
                      customLogo = (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#8B5CF6] via-[#6D28D9] to-[#4C1D95] relative overflow-hidden flex items-center justify-center border border-white/25 shadow-md">
                          <div className="absolute w-5 h-5 bg-purple-400/40 rounded-full blur-md opacity-75" />
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                          </svg>
                        </div>
                      );
                    } else if (item.id === 'assignment') {
                      customLogo = (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#0EA5E9] via-[#0284C7] to-[#0369A1] relative overflow-hidden flex items-center justify-center border border-white/25 shadow-md">
                          <div className="absolute w-5 h-5 bg-sky-300/40 rounded-full blur-md opacity-75" />
                          <svg className="w-6.5 h-6.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </div>
                      );
                    } else if (item.id === 'analyze') {
                      customLogo = (
                        <div className="w-12 h-12 rounded-2xl bg-[#1C1C1E] relative overflow-hidden flex items-center justify-center border border-white/10 shadow-md">
                          <div className="w-8 h-5 flex items-end gap-1">
                            <div className="w-1.5 h-2 bg-emerald-400 rounded-sm" />
                            <div className="w-1.5 h-3.5 bg-emerald-400 rounded-sm" />
                            <div className="w-1.5 h-5 bg-emerald-400 rounded-sm" />
                          </div>
                        </div>
                      );
                    } else {
                      customLogo = (
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md overflow-hidden relative bg-gradient-to-tr ${item.gradient}`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                      );
                    }

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          const runningApp = runningApps.find(a => a.id === item.id);
                          const isAppOpen = !!runningApp;
                          if (isAppOpen) {
                            if (runningApp.minimized) {
                              onRestoreApp(item.id);
                            } else if (currentView === item.id) {
                              onMinimizeApp(item.id);
                            } else {
                              onRestoreApp(item.id);
                            }
                          } else {
                            onNavigate(item.id);
                          }
                          setIsMobileFinderOpen(false);
                        }}
                        className="flex flex-col items-center gap-2 p-3.5 hover:bg-[#6B6998]/10 active:scale-95 transition-all rounded-3xl"
                      >
                        <div className={`relative ${isOpen ? 'ring-2 ring-violet-500 rounded-2xl shadow-lg' : ''}`}>
                          {customLogo}
                          {isOpen && (
                            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-violet-600 rounded-full shadow-[0_0_4px_rgba(109,40,217,0.5)]" />
                          )}
                        </div>
                        <span className="text-[10px] font-extrabold text-neutral-700 text-center tracking-wide line-clamp-1 w-full truncate">
                          {item.label}
                        </span>
                      </button>
                    );
                  });
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
