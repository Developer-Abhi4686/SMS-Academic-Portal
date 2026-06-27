import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  BookOpen, 
  ClipboardList, 
  GraduationCap, 
  LayoutDashboard, 
  Library, 
  Lightbulb, 
  MessageSquare, 
  Settings, 
  FileText, 
  Users, 
  FileSearch,
  BookMarked,
  Lock,
  Download,
  Smartphone,
  X,
  Share,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { UserRole, UserProfile, RunningApp } from './types';
import LandingPage from './components/LandingPage';
import DashboardLayout from './components/DashboardLayout';
import ClassSelection from './components/ClassSelection';

// View Imports (we'll implement these next)
import TeacherHome from './views/teacher/TeacherHome';
import GeneratorHub from './views/teacher/GeneratorHub';
import CloudVault from './views/teacher/CloudVault';
import QuizGenerator from './views/teacher/QuizGenerator';
import StudentSelector from './views/teacher/StudentSelector';
import Resources from './views/shared/Resources';
import LessonPlanner from './views/teacher/LessonPlanner';
import AttendanceManager from './views/teacher/AttendanceManager';
import Submissions from './views/teacher/Submissions';
import RemoteDrop from './views/shared/RemoteDrop';

import StudentHome from './views/student/StudentHome';
import DoubtSolver from './views/student/DoubtSolver';
import AssignmentAssistant from './views/student/AssignmentAssistant';
import Analyze from './views/student/Analyze';
import StudentSubmissions from './views/student/StudentSubmissions';
import { clearSessionStates } from './lib/hooks';

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize state from localStorage for persistence on reload
  const [userClass, setUserClass] = useState<string | null>(() => localStorage.getItem('sms_userClass'));
  const [userSection, setUserSection] = useState<string | null>(() => localStorage.getItem('sms_userSection'));
  const [role, setRole] = useState<UserRole>(() => localStorage.getItem('sms_role') as UserRole);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(true);
  const [viewLoading, setViewLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const currentView = location.pathname.split('/')[1] || 'home';
  const isUserAuthenticated = true;

  // --- PWA Installation state and listeners ---
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallPopup, setShowInstallPopup] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Check display mode
    const checkIsStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (navigator as any).standalone 
      || document.referrer.includes('android-app://');
    setIsStandalone(checkIsStandalone);

    const handleBeforePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      if (!checkIsStandalone) {
        // If not installed, let's trigger a popup for downloading the app on first time open
        const hasPrompted = localStorage.getItem('sms_has_seen_install_prompt_v3');
        if (!hasPrompted) {
          const timeout = setTimeout(() => {
            setShowInstallPopup(true);
          }, 3500); // 3.5 seconds delay
          return () => clearTimeout(timeout);
        }
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforePrompt);
    
    window.addEventListener('appinstalled', () => {
      console.log('St. Michael\'s Portal was installed successfully!');
      setIsStandalone(true);
      setDeferredPrompt(null);
      setShowInstallPopup(false);
      setShowIosGuide(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforePrompt);
    };
  }, []);

  // Handle Apple/iOS standalone check & guided prompt
  useEffect(() => {
    const checkIsStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (navigator as any).standalone;
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    if (isIos && !checkIsStandalone) {
      const hasPrompted = localStorage.getItem('sms_has_seen_install_prompt_v3');
      if (!hasPrompted) {
        const timeout = setTimeout(() => {
          setShowInstallPopup(true);
        }, 3500);
        return () => clearTimeout(timeout);
      }
    }
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsStandalone(true);
        setDeferredPrompt(null);
      }
      setShowInstallPopup(false);
      localStorage.setItem('sms_has_seen_install_prompt_v3', 'true');
    } else {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIos) {
        setShowIosGuide(true);
        setShowInstallPopup(false);
      } else {
        alert("To download the app, tap your browser's options menu (triple dots or share icon) and select 'Add to Home Screen' or 'Install App'.");
        setShowInstallPopup(false);
        localStorage.setItem('sms_has_seen_install_prompt_v3', 'true');
      }
    }
  };

  const handleDismissPopup = () => {
    setShowInstallPopup(false);
    localStorage.setItem('sms_has_seen_install_prompt_v3', 'true');
  };

  const isIosUser = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const showInstallButton = !isStandalone && (deferredPrompt !== null || isIosUser);

  // Multitasking: Track running apps state
  const [runningApps, setRunningApps] = useState<RunningApp[]>([]);

  // Synchronize current URL view with runningApps
  useEffect(() => {
    const isSpecialSetupRoute = currentView === 'select-class' || currentView === 'select-role' || location.pathname.startsWith('/drop/');
    if (currentView !== 'home' && !isSpecialSetupRoute) {
      setRunningApps(prev => {
        const exists = prev.find(a => a.id === currentView);
        const maxZ = prev.reduce((max, a) => Math.max(max, a.zIndex), 0);
        if (exists) {
          // If already running, unminimize and bring to front
          return prev.map(a => a.id === currentView ? { ...a, minimized: false, zIndex: maxZ + 1 } : a);
        } else {
          // Cap list to max 2 items, so appending the new one results in exactly 3
          let cappedPrev = prev;
          if (prev.length >= 3) {
            cappedPrev = prev.slice(prev.length - 2);
          }
          return [...cappedPrev, { id: currentView, minimized: false, maximized: true, zIndex: maxZ + 1 }];
        }
      });
    }
  }, [currentView, location.pathname]);

  const handleMinimizeApp = (id: string) => {
    setRunningApps(prev => prev.map(a => a.id === id ? { ...a, minimized: true } : a));
    navigate('/');
  };

  const handleRestoreApp = (id: string) => {
    setRunningApps(prev => {
      const maxZ = prev.reduce((max, a) => Math.max(max, a.zIndex), 0);
      return prev.map(a => a.id === id ? { ...a, minimized: false, zIndex: maxZ + 1 } : a);
    });
    navigate(`/${id}`);
  };

  const handleCloseApp = (id: string) => {
    setRunningApps(prev => prev.filter(a => a.id !== id));
    navigate('/');
  };

  const handleToggleMaximizeApp = (id: string) => {
    setRunningApps(prev => prev.map(a => a.id === id ? { ...a, maximized: !a.maximized } : a));
  };

  const renderAppContent = (id: string, closeSelf: () => void) => {
    switch (id) {
      case 'generator':
        return <GeneratorHub userClass={userClass} />;
      case 'vault':
        return <CloudVault defaultClass={userClass} defaultSection={userSection} />;
      case 'selector':
        return <StudentSelector defaultClass={userClass} defaultSection={userSection} />;
      case 'attendance':
        return <AttendanceManager userClass={userClass} userSection={userSection} role={role} />;
      case 'lessons':
        return <LessonPlanner userClass={userClass} />;
      case 'submissions':
        return <Submissions userClass={userClass} userSection={userSection} />;
      case 'doubt':
        return <DoubtSolver userClass={userClass} />;
      case 'assignment':
        return <AssignmentAssistant userClass={userClass} />;
      case 'analyze':
        return <Analyze userClass={userClass} />;
      case 'student-submissions':
        return <StudentSubmissions userClass={userClass} userSection={userSection} />;
      case 'resources':
        return <Resources role={role || 'student'} userClass={userClass} />;
      default:
        return null;
    }
  };

  const setCurrentView = (view: string) => {
    navigate(view === 'home' ? '/' : `/${view}`);
  };

  const handleBack = () => {
    navigate('/');
  };

  // Persistence effects
  useEffect(() => {
    if (userClass) localStorage.setItem('sms_userClass', userClass);
    else localStorage.removeItem('sms_userClass');
  }, [userClass]);

  useEffect(() => {
    if (userSection) localStorage.setItem('sms_userSection', userSection);
    else localStorage.removeItem('sms_userSection');
  }, [userSection]);

  useEffect(() => {
    if (role) localStorage.setItem('sms_role', role);
    else localStorage.removeItem('sms_role');
  }, [role]);

  // Handle routing based on selection state
  useEffect(() => {
    if (!authInitialized || loading || !isUserAuthenticated) return;

    // Bypass setup for drop route
    if (location.pathname.startsWith('/drop/')) return;

    const isSelectingClass = location.pathname === '/select-class';
    const isSelectingRole = location.pathname === '/select-role';

    if (!userClass && !isSelectingClass) {
      navigate('/select-class', { replace: true });
    } else if (userClass && !role && !isSelectingRole && location.pathname !== '/select-class') {
      navigate('/select-role', { replace: true });
    } else if (userClass && role && (isSelectingClass || isSelectingRole)) {
      navigate('/', { replace: true });
    }
  }, [userClass, role, authInitialized, loading, location.pathname, isUserAuthenticated]);

  // Set up a clean, reactive local user profile when class and role are chosen
  useEffect(() => {
    if (userClass && role) {
      setUserProfile({
        uid: `guest-${role}-${userClass}-${userSection || 'all'}`.replace(/\s+/g, '-').toLowerCase(),
        fullName: role === 'teacher' ? 'Faculty Member' : 'Student Scholar',
        email: role === 'teacher' ? 'faculty@stmichaels.edu' : 'student@stmichaels.edu',
        role: role,
        userClass: userClass,
        section: userSection,
        createdAt: new Date().toISOString()
      });
    } else {
      setUserProfile(null);
    }
  }, [role, userClass, userSection]);

  // Show dashboard loader when role is selected
  useEffect(() => {
    if (role && currentView === 'home' && !viewLoading) {
      setViewLoading(true);
      const timer = setTimeout(() => setViewLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [role, currentView]);

  useEffect(() => {
    // Check if splash has already been shown in this session
    const hasShownSplash = sessionStorage.getItem('zehn-splash-shown');
    
    if (hasShownSplash) {
      setLoading(false);
      return;
    }

    if (authInitialized) {
      // Once auth is initialized, clear loading after a small premium delay for visual smoothness
      const timer = setTimeout(() => {
        setLoading(false);
        sessionStorage.setItem('zehn-splash-shown', 'true');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [authInitialized]);

  // View transition effect - MUST be before any early returns
  useEffect(() => {
    if (authInitialized && !loading) {
      setViewLoading(true);
      const timer = setTimeout(() => setViewLoading(false), 200);
      return () => clearTimeout(timer);
    }
  }, [currentView, authInitialized, loading]);

  const handleSetRole = (newRole: UserRole) => {
    setRole(newRole);
  };

  const handleLogout = () => {
    // Clear all persistent and session-based state
    clearSessionStates();
    
    // Reset App state
    setRole(null);
    setUserClass(null);
    setUserSection(null);
    setUserProfile(null);
    
    // Ensure UI is clean
    window.scrollTo(0, 0);
    
    // Redirect to entry screen
    navigate('/select-class');
  };

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="min-h-screen bg-[#F8F8FA] flex flex-col items-center justify-center relative overflow-hidden font-sans select-none"
        >
          {/* Inject style block for authentic Google/Gmail-style rubber-band linear loading bar */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes gmail-loader-stretch {
              0% {
                left: -35%;
                right: 100%;
              }
              60% {
                left: 30%;
                right: -10%;
              }
              100% {
                left: 100%;
                right: -35%;
              }
            }
            .gmail-loading-indicator {
              position: absolute;
              top: 0;
              bottom: 0;
              background-color: #6B6998; /* Muted Amethyst brand color */
              border-radius: 9999px;
              animation: gmail-loader-stretch 1.0s infinite cubic-bezier(0.4, 0.0, 0.2, 1);
            }
          `}} />

          {/* Central content mimicking the clean Gmail logo workspace */}
          <div className="flex flex-col items-center justify-center -translate-y-6 relative z-10 w-full max-w-sm px-6">
            
            {/* Clean, Floating School Badge */}
            <motion.div 
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-brand flex items-center justify-center mb-6"
            >
              <GraduationCap className="w-16 h-16 text-brand" strokeWidth={1.5} />
            </motion.div>

            {/* School branding */}
            <motion.div
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="text-center mb-8"
            >
              <h2 className="text-xl font-bold tracking-tight text-primary">
                St. Michael's Academic Portal
              </h2>
            </motion.div>

            {/* The signature Google/Gmail-style thin indeterminate progress bar */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="w-[180px] h-[3px] bg-slate-100 rounded-full overflow-hidden relative"
            >
              <div className="gmail-loading-indicator" />
            </motion.div>
          </div>

          {/* Clean modern Google-style footer */}
          <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center justify-center gap-1 pointer-events-none text-center">
            <span className="text-[9px] font-mono tracking-[0.3em] uppercase text-muted/60">
              St. Michael's
            </span>
            <span className="text-xs font-semibold tracking-wide text-primary">
              Engineered by - Abhi Shama(9-d)
            </span>
          </div>
        </motion.div>
      ) : location.pathname.startsWith('/drop/') ? (
        <motion.div
          key="drop-routes"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Routes>
            <Route path="/drop/:vaultId" element={<RemoteDrop />} />
          </Routes>
        </motion.div>
      ) : !userClass ? (
        <motion.div
          key="class-selection-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="min-h-screen"
        >
          <ClassSelection 
            onClassSelect={(cls, sec) => {
              setUserClass(cls);
              setUserSection(sec);
            }} 
          />
        </motion.div>
      ) : !role ? (
        <motion.div
          key="role-selection-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="min-h-screen"
        >
          <LandingPage 
            onSelectRole={handleSetRole} 
            onBack={() => {
              setUserClass(null);
              setUserSection(null);
            }}
          />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="min-h-screen"
        >
          <DashboardLayout 
            role={role} 
            currentView={currentView} 
            onNavigate={setCurrentView}
            onLogout={handleLogout}
            userClass={userClass}
            userSection={userSection}
            userProfile={userProfile}
            runningApps={runningApps}
            onMinimizeApp={handleMinimizeApp}
            onRestoreApp={handleRestoreApp}
            onCloseApp={handleCloseApp}
            onToggleMaximizeApp={handleToggleMaximizeApp}
            renderAppContent={renderAppContent}
            showInstallButton={showInstallButton}
            onInstall={handleInstallApp}
          >
            <AnimatePresence mode="wait">
              {viewLoading ? (
                <motion.div
                  key="dashboard-loader"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-[calc(100vh-120px)] flex flex-col items-center justify-center gap-6"
                >
                  <div className="relative">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 border-2 border-dashed border-accent/30 rounded-full"
                    ></motion.div>
                    <motion.div 
                      animate={{ rotate: -360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 border-t-2 border-accent rounded-full absolute top-0 left-0"
                    ></motion.div>
                  </div>
                  <p className="text-muted text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Syncing Portal</p>
                </motion.div>
              ) : (
                <motion.div
                  key={`${role}-${location.pathname}`}
                  initial={{ opacity: 0, y: 12, scale: 0.995 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.995 }}
                  transition={{ type: "spring", stiffness: 110, damping: 18, mass: 0.8 }}
                  className="p-6"
                >
                  <Routes>
                    <Route path="/select-class" element={
                      <ClassSelection 
                        onClassSelect={(cls, sec) => {
                          setUserClass(cls);
                          setUserSection(sec);
                          navigate('/select-role');
                        }} 
                      />
                    } />
                    <Route path="/select-role" element={
                      <LandingPage 
                        onSelectRole={handleSetRole} 
                        onBack={() => {
                          setUserClass(null);
                          setUserSection(null);
                          navigate('/select-class');
                        }}
                      />
                    } />

                    <Route path="/*" element={
                      role === 'teacher' ? <TeacherHome onNavigate={setCurrentView} /> : <StudentHome onNavigate={setCurrentView} />
                    } />
                  </Routes>
                </motion.div>
              )}
            </AnimatePresence>
          </DashboardLayout>

          {/* Custom PWA Promotion Installation Popup */}
          <AnimatePresence>
            {showInstallPopup && (
              <div className="fixed inset-0 bg-[#0F0E17]/60 backdrop-blur-md z-[999] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 30 }}
                  className="bg-white max-w-md w-full rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col relative"
                >
                  <button 
                    onClick={handleDismissPopup}
                    className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer group"
                  >
                    <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                  </button>

                  <div className="bg-gradient-to-tr from-[#6B6998] to-[#4F4B78] p-8 text-white flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <GraduationCap className="w-40 h-40 rotate-12" />
                    </div>
                    
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 border border-white/20 backdrop-blur-sm">
                      <Smartphone className="w-8 h-8 text-accent animate-bounce" />
                    </div>

                    <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-2 backdrop-blur-md">
                      <Sparkles className="w-3 h-3 text-accent" />
                      <span>PWA Enabled</span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-center tracking-tight leading-none mb-1">
                      St. Michael's Portal
                    </h3>
                    <p className="text-xs text-white/80 font-medium text-center">Install on your device home screen</p>
                  </div>

                  <div className="p-8 flex flex-col gap-6 bg-slate-50/50">
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-3.5 items-start">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20 text-emerald-600 font-bold text-xs select-none">✓</div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">Fast & Native Response</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">Launch instantly right from your desktop or phone home screen without browser overhead.</p>
                        </div>
                      </div>

                      <div className="flex gap-3.5 items-start">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20 text-emerald-600 font-bold text-xs select-none">✓</div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">Advanced Doubt solver & Tools</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">Quick access to NCERT dynamic doubt solvers, notes generators, remote drops and smart calculations!</p>
                        </div>
                      </div>

                      <div className="flex gap-3.5 items-start">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20 text-emerald-600 font-bold text-xs select-none">✓</div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">Durable Offline Access</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">App resources, curriculum sync, and previous materials are cached offline securely.</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={handleInstallApp}
                        className="flex-1 bg-[#6B6998] hover:bg-[#5A5887] text-white py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-[#6B6998]/20 transition-all cursor-pointer active:scale-95"
                      >
                        <Download className="w-4 h-4 text-accent" />
                        <span>Download App</span>
                      </button>
                      <button
                        onClick={handleDismissPopup}
                        className="bg-slate-200/60 hover:bg-slate-200/80 text-slate-600 hover:text-slate-800 py-3.5 px-6 rounded-2xl font-bold text-sm transition-all cursor-pointer active:scale-95"
                      >
                        Maybe Later
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Custom Guided Installation Popup for Apple iOS users */}
          <AnimatePresence>
            {showIosGuide && (
              <div className="fixed inset-0 bg-[#0F0E17]/60 backdrop-blur-md z-[999] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 30 }}
                  className="bg-white max-w-sm w-full rounded-[2.5rem] shadow-2xl p-8 border border-slate-100 flex flex-col relative text-center"
                >
                  <button 
                    onClick={() => setShowIosGuide(false)}
                    className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer group"
                  >
                    <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                  </button>

                  <div className="w-16 h-16 bg-[#AEACCC]/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#AEACCC]/30">
                    <Share className="w-7 h-7 text-[#6B6998] animate-pulse" />
                  </div>

                  <h3 className="text-xl font-black text-slate-800 tracking-tight leading-snug mb-2">
                    Install on iOS Safari
                  </h3>
                  
                  <p className="text-xs text-slate-500 leading-relaxed mb-6">
                    Apple requires installing manually. Pin the official portal to your iOS device homescreen in two tiny steps:
                  </p>

                  <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-100/80 flex flex-col gap-4 mb-6">
                    <div className="flex gap-3 items-center">
                      <div className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-100 text-[#6B6998] font-bold text-xs select-none">1</div>
                      <p className="text-xs text-slate-600 leading-snug">
                        Tap the general <span className="font-bold underline text-slate-700">Share button</span> at the bottom (or top) of Safari's toolbar.
                      </p>
                    </div>

                    <div className="flex gap-3 items-center">
                      <div className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-100 text-[#6B6998] font-bold text-xs select-none">2</div>
                      <p className="text-xs text-slate-600 leading-snug">
                        Scroll down then tap <span className="font-bold text-slate-800 underline">Add to Home Screen</span> with the square plus icon.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowIosGuide(false)}
                    className="bg-[#6B6998] hover:bg-[#5A5887] text-white py-3.5 rounded-2xl font-black text-sm transition-all cursor-pointer w-full active:scale-95"
                  >
                    Got It, Thanks!
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
