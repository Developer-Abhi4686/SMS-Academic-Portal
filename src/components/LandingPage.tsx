import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, ShieldCheck, Lock, ArrowRight, X, Clock, ArrowLeft } from 'lucide-react';
import { UserRole } from '../types';

interface LandingPageProps {
  onSelectRole: (role: UserRole) => void;
  onBack?: () => void;
}

function LandingPageClock({ isLight }: { isLight?: boolean }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const colorClass = isLight ? "text-white" : "text-primary";

  return (
    <div className="flex flex-col items-end">
      <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${colorClass}`}>
        {time.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
      </span>
      <div className={`flex items-center gap-1.5 mt-1 ${isLight ? 'opacity-80' : 'opacity-50'}`}>
        <Clock className={`w-3.5 h-3.5 ${colorClass}`} />
        <span className={`text-[11px] font-bold tabular-nums ${colorClass}`}>
          {time.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

function LandingPageClockDisplay() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <>{time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}</>;
}

export default function LandingPage({ onSelectRole, onBack }: LandingPageProps) {
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Dynamic Time-Based PIN Calculation (HHMM)
    const now = new Date();
    let hours = now.getHours() % 12;
    hours = hours ? hours : 12; // 12-hour format
    const hh = hours.toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    const dynamicPin = `${hh}${mm}`;

    if (password.trim() === dynamicPin || password.trim().toLowerCase() === 'time password') {
      onSelectRole('teacher');
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background text-primary selection:bg-brand selection:text-white relative overflow-hidden flex items-center justify-center p-4 sm:p-8 font-sans">
      {/* Absolute Back Button in top-left corner */}
      {onBack && (
        <div className="absolute top-4 left-4 md:top-12 md:left-12 z-[110]">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-white/45 border border-white/60 hover:border-brand/40 text-[#0f172a] hover:bg-white/60 rounded-full transition-all backdrop-blur-xl shadow-glass cursor-pointer hover:scale-110 active:scale-95 group"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-brand transition-transform group-hover:-translate-x-0.5" />
          </button>
        </div>
      )}

      {/* Absolute Header for Clock */}
      <div className="absolute top-4 right-4 md:top-12 md:right-12 z-[110]">
        <LandingPageClock isLight={showPasswordPrompt} />
      </div>

      {/* Dynamic Background Elements - Premium Gradient Blobs diffusing through layout */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand/5 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-5xl w-full relative z-10 pt-16 md:pt-0">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 md:mb-24 space-y-4 md:space-y-6"
        >
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tighter leading-none text-primary">
            Role <span className="italic block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-brand via-brand to-accent font-black">Section.</span>
          </h1>
          <p className="text-muted font-medium text-sm sm:text-lg md:text-xl max-w-lg mx-auto tracking-tight px-4">
            Institutional access for St. Michael's School faculty and student.
          </p>
        </motion.div>

        <div className="relative mb-12 md:mb-24">
          {/* Frosted glass backdrop glow: placing Indigo to Teal gradient blobs directly behind the cards */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-visible flex items-center justify-around">
            <div className="w-[300px] h-[300px] md:w-[380px] md:h-[380px] bg-gradient-to-tr from-brand to-accent opacity-25 rounded-full blur-[120px]" />
            <div className="w-[300px] h-[300px] md:w-[380px] md:h-[380px] bg-gradient-to-tr from-accent to-brand opacity-25 rounded-full blur-[120px]" />
          </div>

          <div className="relative z-10 grid sm:grid-cols-2 gap-6 md:grid-cols-2 lg:gap-10">
            {/* Student Card */}
            <motion.button
              whileHover={{ y: -3 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              onClick={() => onSelectRole('student')}
              className="group relative glass-panel p-8 sm:p-10 md:p-12 rounded-[3rem] sm:rounded-[4rem] border border-white/60 hover:border-brand/40 transition-all text-left overflow-hidden shadow-sm hover:shadow-[0_45px_90px_-20px_rgba(79,70,229,0.18)] cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand/5 rounded-full -translate-y-24 translate-x-24 group-hover:scale-125 transition-transform duration-1000 ease-out" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brand/10 rounded-[1.5rem] sm:rounded-[1.75rem] flex items-center justify-center text-brand mb-6 sm:mb-10 group-hover:bg-brand group-hover:text-white transition-all duration-700 shadow-inner">
                  <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold tracking-tighter mb-4 text-[#0f172a]">Student</h3>
                <p className="text-sm sm:text-base font-medium text-muted leading-relaxed mb-6 sm:mb-10 group-hover:text-brand transition-colors">
                  Access resources, doubt solver, and student tools.
                </p>
                <div className="flex items-center gap-3 text-brand font-bold uppercase text-[10px] tracking-[0.4em] translate-x-0 group-hover:translate-x-3 transition-transform">
                  Enter <ArrowRight className="w-5 h-5 text-accent" />
                </div>
              </div>
            </motion.button>

            {/* Teacher Card */}
            <motion.button
              whileHover={{ y: -3 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              onClick={() => setShowPasswordPrompt(true)}
              className="group relative glass-panel p-8 sm:p-10 md:p-12 rounded-[3rem] sm:rounded-[4rem] border border-white/60 hover:border-brand/40 transition-all text-left overflow-hidden shadow-sm hover:shadow-[0_45px_90px_-20px_rgba(79,70,229,0.18)] cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full -translate-y-24 translate-x-24 group-hover:scale-125 transition-transform duration-1000 ease-out" />
              
              <div className="relative z-10 text-primary">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brand/10 rounded-[1.5rem] sm:rounded-[1.75rem] flex items-center justify-center text-brand mb-6 sm:mb-10 group-hover:bg-brand group-hover:text-white transition-all duration-700 shadow-inner">
                  <Lock className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold tracking-tighter mb-4 text-[#0f172a]">Faculty</h3>
                <p className="text-sm sm:text-base font-medium text-muted leading-relaxed mb-6 sm:mb-10 group-hover:text-brand transition-colors">
                  Manage attendance, planners, and teacher tools.
                </p>
                <div className="flex items-center gap-3 text-brand font-bold uppercase text-[10px] tracking-[0.4em] translate-x-0 group-hover:translate-x-3 transition-transform">
                  Enter <ArrowRight className="w-5 h-5 text-accent" />
                </div>
              </div>
            </motion.button>
          </div>
        </div>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          className="text-center"
        >
          <div className="flex flex-col items-center gap-6">
             <div className="w-20 h-px bg-primary/20" />
             <div className="space-y-2">
               <p className="text-[12px] font-bold tracking-[0.4em] text-primary uppercase">
                 St. Michael's School &bull; Keerathpura &bull; Bhind
               </p>
               <p className="text-[10px] font-black tracking-widest text-muted uppercase text-xs">
                 Engineered by - Abhi Shama(9-d)
               </p>
             </div>
          </div>
        </motion.footer>
      </div>

      {/* Login Modal */}
      <AnimatePresence>
        {showPasswordPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/95 backdrop-blur-3xl"
          >
            <motion.div
              initial={{ scale: 0.95, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 40, opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="bg-surface rounded-[2rem] sm:rounded-[4rem] w-full max-w-xl p-6 sm:p-12 md:p-16 relative shadow-2xl border border-white/20"
            >
              <button 
                onClick={() => {
                  setShowPasswordPrompt(false);
                  setPassword('');
                }}
                className="absolute top-4 right-4 sm:top-8 sm:right-8 text-muted hover:text-primary p-2 sm:p-3 bg-slate-50 rounded-2xl transition-all active:scale-90"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <div className="mb-6 sm:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-2xl sm:text-4xl font-bold tracking-tighter text-primary">
                    Enter Password
                  </h3>
                </div>
              </div>

              <form onSubmit={handleTeacherLogin} className="space-y-6 sm:space-y-10">
                <div className="relative group">
                  <input
                    autoFocus
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••"
                    className={`w-full px-4 sm:px-10 py-5 sm:py-8 bg-slate-50 rounded-3xl border-2 transition-all outline-none font-mono text-3xl sm:text-5xl tracking-[1em] text-center ${
                      error ? 'border-red-500 text-red-500' : 'border-transparent focus:border-brand group-hover:border-slate-200'
                    }`}
                  />
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -bottom-6 left-0 right-0 text-center"
                    >
                      <span className="text-red-500 font-bold text-[10px] uppercase tracking-[0.3em]">Identity Mismatch / Access Denied</span>
                    </motion.div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand text-white py-5 sm:py-8 rounded-2xl sm:rounded-3xl font-bold uppercase tracking-[0.4em] text-[10px] sm:text-[11px] shadow-2xl shadow-brand/30 hover:bg-brand-dark active:scale-[0.98] transition-all flex items-center justify-center gap-4 group cursor-pointer"
                >
                  Verify Protocol
                  <ArrowRight className="w-5 h-5 text-accent transition-transform group-hover:translate-x-2" />
                </button>
              </form>

              <div className="mt-8 sm:mt-16 text-center">
                 <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] opacity-40 italic">Secure Encryption Tunnel Enabled</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
