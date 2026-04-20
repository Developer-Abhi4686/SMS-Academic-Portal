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
import AuthModal from './components/AuthModal';
import { auth, db } from './lib/firebase';
import { ShieldCheck, LogOut } from 'lucide-react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// View Imports (we'll implement these next)
import TeacherHome from './views/teacher/TeacherHome';
import QuizGenerator from './views/teacher/QuizGenerator';
import StudentSelector from './views/teacher/StudentSelector';
import Resources from './views/shared/Resources';
import LessonPlanner from './views/teacher/LessonPlanner';
import AttendanceManager from './views/teacher/AttendanceManager';
import TestPaperGenerator from './views/teacher/TestPaperGenerator';
import SamplePaperGenerator from './views/teacher/SamplePaperGenerator';
import Calculator from './views/shared/Calculator';

import StudentHome from './views/student/StudentHome';
import DoubtSolver from './views/student/DoubtSolver';
import AssignmentAssistant from './views/student/AssignmentAssistant';
import Analyze from './views/student/Analyze';
import ProfileView from './views/shared/ProfileView';
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
  const [authInitialized, setAuthInitialized] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const currentView = location.pathname.split('/')[1] || 'home';

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
    if (!authInitialized || loading) return;

    const isSelectingClass = location.pathname === '/select-class';
    const isSelectingRole = location.pathname === '/select-role';

    if (!userClass && !isSelectingClass) {
      navigate('/select-class', { replace: true });
    } else if (userClass && !role && !isSelectingRole && location.pathname !== '/select-class') {
      navigate('/select-role', { replace: true });
    } else if (userClass && role && (isSelectingClass || isSelectingRole)) {
      navigate('/', { replace: true });
    }
  }, [userClass, role, authInitialized, loading, location.pathname]);

  // Sync role and class from profile if available
  useEffect(() => {
    if (userProfile) {
      if (userProfile.role && !role) setRole(userProfile.role);
      if (userProfile.userClass && !userClass) setUserClass(userProfile.userClass);
      if (userProfile.section && !userSection) setUserSection(userProfile.section);
    }
  }, [userProfile]);

  useEffect(() => {
    // Start with a reliable local guest identity to ensure immediate access
    const explorerProfile: UserProfile = {
      uid: 'local-explorer',
      fullName: 'Academic Explorer',
      email: 'explorer@stmichaels.edu',
      role: null,
      userClass: null,
      section: null,
      createdAt: new Date().toISOString()
    };
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            setUserProfile(profile);
          } else {
            const profile: UserProfile = {
              uid: user.uid,
              fullName: 'Academic Explorer',
              email: 'guest@stmichaels.edu',
              role: null,
              userClass: null,
              section: null,
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', user.uid), profile);
            setUserProfile(profile);
          }
        } catch (error) {
          console.error("Firestore profile check failed:", error);
          setUserProfile(explorerProfile);
        }
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.warn("Anonymous Authentication disabled.");
          setUserProfile(explorerProfile);
        }
      }
      setAuthInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  // Show dashboard loader when role is selected
  useEffect(() => {
    if (role && currentView === 'home' && !viewLoading) {
      setViewLoading(true);
      const timer = setTimeout(() => setViewLoading(false), 1000);
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
      const timer = setTimeout(() => {
        setLoading(false);
        sessionStorage.setItem('zehn-splash-shown', 'true');
      }, 1500); // Slightly longer for the initial "wow" factor
      return () => clearTimeout(timer);
    }
  }, [authInitialized]);

  // View transition effect - MUST be before any early returns
  useEffect(() => {
    if (authInitialized && !loading) {
      setViewLoading(true);
      const timer = setTimeout(() => setViewLoading(false), 600);
      return () => clearTimeout(timer);
    }
  }, [currentView, authInitialized, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center overflow-hidden transition-colors duration-300">
        <div className="relative flex flex-col items-center">
          {/* Minimalist modern loader */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col items-center gap-6"
          >
            <div className="relative w-20 h-20 flex items-center justify-center">
              <motion.div 
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-[#1a237e]/5 rounded-full"
              />
              <ShieldCheck className="w-10 h-10 text-[#1a237e] relative z-10" />
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <h1 className="text-xl font-black text-[#1a237e] uppercase tracking-[0.2em] leading-none">
                SMS Academīc
              </h1>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="h-[1px] bg-[#1a237e]/30 w-full"
              />
              <p className="text-[8px] text-[#636e72] font-black uppercase tracking-[0.4em] pt-1">
                Initializing Node
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // No real auth modal needed
  if (showAuth && !userProfile && false) {
    return (
      <AuthModal 
        onSuccess={(profile) => {
          if (profile) {
            setUserProfile(profile);
            setRole(profile.role);
            setUserClass(profile.userClass);
          }
          setShowAuth(false);
        }} 
        onContinueGuest={() => setShowAuth(false)} 
      />
    );
  }

  const handleSetRole = async (newRole: UserRole) => {
    setRole(newRole);
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          role: newRole
        }, { merge: true });
        
        // Update local profile too
        setUserProfile(prev => prev ? { ...prev, role: newRole } : null);
      } catch (err) {
        console.error("Failed to update role in Firestore:", err);
      }
    }
  };

  if (!userClass) {
    return <ClassSelection 
      onClassSelect={(cls, sec) => {
        setUserClass(cls);
        setUserSection(sec);
      }} 
    />;
  }

  if (!role) {
    return <LandingPage 
      onSelectRole={handleSetRole} 
    />;
  }

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      clearSessionStates();
      setRole(null);
      setUserClass(null);
      setUserSection(null);
      setUserProfile(null);
      localStorage.removeItem('sms_role');
      localStorage.removeItem('sms_userClass');
      localStorage.removeItem('sms_userSection');
      navigate('/select-class');
    }
  };

  return (
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
                className="w-16 h-16 border-2 border-dashed border-[#1a237e]/30 rounded-full"
              ></motion.div>
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-t-2 border-[#1a237e] rounded-full absolute top-0 left-0"
              ></motion.div>
            </div>
            <p className="text-[#636e72] text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Syncing Academy Node</p>
          </motion.div>
        ) : (
          <motion.div
            key={`${role}-${location.pathname}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
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
                />
              } />

              <Route path="/" element={
                role === 'teacher' ? <TeacherHome onNavigate={setCurrentView} /> : <StudentHome onNavigate={setCurrentView} />
              } />
              <Route path="/profile" element={<ProfileView userProfile={userProfile} onNavigate={setCurrentView} />} />
              
              {/* Teacher Routes */}
              <Route path="/quiz" element={<QuizGenerator userClass={userClass} onBack={handleBack} />} />
              <Route 
          path="/selector" 
          element={<StudentSelector onBack={handleBack} defaultClass={userClass} defaultSection={userSection} />} 
        />
              <Route 
                path="/attendance" 
                element={<AttendanceManager onBack={handleBack} userClass={userClass} userSection={userSection} />} 
              />
              <Route path="/lessons" element={<LessonPlanner userClass={userClass} onBack={handleBack} />} />
              <Route path="/test-paper" element={<TestPaperGenerator userClass={userClass} onBack={handleBack} />} />
              <Route path="/sample-paper" element={<SamplePaperGenerator userClass={userClass} onBack={handleBack} />} />
              
              {/* Student Routes */}
              <Route path="/doubt" element={<DoubtSolver userClass={userClass} onBack={handleBack} />} />
              <Route path="/assignment" element={<AssignmentAssistant userClass={userClass} onBack={handleBack} />} />
              <Route path="/analyze" element={<Analyze userClass={userClass} onBack={handleBack} />} />
              
              {/* Shared */}
              <Route path="/resources" element={<Resources role={role || 'student'} userClass={userClass} onBack={handleBack} />} />
              <Route path="/calculator" element={<Calculator onBack={handleBack} />} />
            </Routes>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
