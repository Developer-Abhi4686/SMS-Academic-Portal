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
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { UserRole, UserProfile } from './types';
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
import Calculator from './views/shared/Calculator';
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

  const setCurrentView = (view: string) => {
    navigate(view === 'home' ? '/' : `/${view}`);
  };

  const handleBack = () => navigate(-1);

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
                SM'S Academic Portal
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
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
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

                    <Route path="/" element={
                      role === 'teacher' ? <TeacherHome onNavigate={setCurrentView} /> : <StudentHome onNavigate={setCurrentView} />
                    } />
                    
                    {/* Teacher Routes */}
                    <Route path="/generator" element={<GeneratorHub userClass={userClass} onBack={handleBack} />} />
                    <Route path="/vault" element={<CloudVault onBack={handleBack} />} />
                    <Route 
                      path="/selector" 
                      element={<StudentSelector onBack={handleBack} defaultClass={userClass} defaultSection={userSection} />} 
                    />
                    <Route 
                      path="/attendance" 
                      element={<AttendanceManager onBack={handleBack} userClass={userClass} userSection={userSection} />} 
                    />
                    <Route path="/lessons" element={<LessonPlanner userClass={userClass} onBack={handleBack} />} />
                    <Route path="/submissions" element={<Submissions userClass={userClass} userSection={userSection} onBack={handleBack} />} />
                    
                    {/* Student Routes */}
                    <Route path="/doubt" element={<DoubtSolver userClass={userClass} onBack={handleBack} />} />
                    <Route path="/assignment" element={<AssignmentAssistant userClass={userClass} onBack={handleBack} />} />
                    <Route path="/analyze" element={<Analyze userClass={userClass} onBack={handleBack} />} />
                    <Route path="/student-submissions" element={<StudentSubmissions userClass={userClass} userSection={userSection} onBack={handleBack} />} />
                    
                    {/* Shared */}
                    <Route path="/resources" element={<Resources role={role || 'student'} userClass={userClass} onBack={handleBack} />} />
                    <Route path="/calculator" element={<Calculator onBack={handleBack} />} />
                  </Routes>
                </motion.div>
              )}
            </AnimatePresence>
          </DashboardLayout>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
