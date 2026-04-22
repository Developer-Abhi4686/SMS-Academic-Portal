import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, ShieldCheck, Lock, ArrowRight, X } from 'lucide-react';
import { UserRole } from '../types';

interface LandingPageProps {
  onSelectRole: (role: UserRole) => void;
}

export default function LandingPage({ onSelectRole }: LandingPageProps) {
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [step, setStep] = useState<'access_key' | 'security_pin'>('access_key');

  const TEACHER_ACCESS_KEY = 'admin1234';

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'access_key') {
      if (password === TEACHER_ACCESS_KEY) {
        setStep('security_pin');
        setPassword('');
        setError(false);
      } else {
        setError(true);
        setTimeout(() => setError(false), 2000);
      }
    } else {
      const now = new Date();
      let hours = now.getHours() % 12;
      hours = hours ? hours : 12;
      const hh = hours.toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      const dynamicPin = `${hh}${mm}`;

      if (password === dynamicPin) {
        onSelectRole('teacher');
      } else {
        setError(true);
        setTimeout(() => setError(false), 2000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfcfb] text-[#1c1917] selection:bg-[#1a237e] selection:text-white relative overflow-hidden flex items-center justify-center p-6">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#1a237e]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#f59e0b]/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#1a237e] rounded-2xl flex items-center justify-center text-white shadow-xl">
              <ShieldCheck className="w-7 h-7" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
            Identity <span className="text-[#1a237e]">Confirmation.</span>
          </h1>
          <p className="text-[#57534e] font-medium italic font-editorial text-xl max-w-lg mx-auto">
            Please select your role to continue.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Student Card */}
          <motion.button
            whileHover={{ y: -10 }}
            onClick={() => onSelectRole('student')}
            className="group relative bg-white p-10 rounded-[3rem] border-2 border-[#e7e5e4] hover:border-[#1a237e] transition-all text-left overflow-hidden shadow-sm hover:shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700" />
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1a237e] mb-8 group-hover:bg-[#1a237e] group-hover:text-white transition-colors duration-500">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-2 group-hover:text-[#1a237e] transition-colors">Student</h3>
              <p className="text-sm font-medium text-[#57534e] leading-relaxed mb-8 opacity-80 group-hover:opacity-100">
                Access your doubt solvers, resources, and assignment assistants.
              </p>
              <div className="flex items-center gap-2 text-[#1a237e] font-black uppercase text-[10px] tracking-widest translate-x-0 group-hover:translate-x-2 transition-transform">
                <span>Enter as Student</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.button>

          {/* Teacher Card */}
          <motion.button
            whileHover={{ y: -10 }}
            onClick={() => setShowPasswordPrompt(true)}
            className="group relative bg-[#1a237e] p-10 rounded-[3rem] border-2 border-transparent transition-all text-left overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700" />
            
            <div className="relative z-10 text-white">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-8 group-hover:bg-white group-hover:text-[#1a237e] transition-colors duration-500">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">Teacher</h3>
              <p className="text-sm font-medium text-white/70 leading-relaxed mb-8 group-hover:text-white transition-colors">
                Manage attendance, generate quizzes, and plan lessons.
              </p>
              <div className="flex items-center gap-2 text-white font-black uppercase text-[10px] tracking-widest translate-x-0 group-hover:translate-x-2 transition-transform">
                <span>Secure Teacher Auth</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          className="text-center"
        >
          <p className="text-[10px] uppercase font-black tracking-[0.3em] text-[#57534e]">
            Developed by <span className="text-[#1a237e]">Abhi Sharma(9-D)</span> &bull; Motto: "Light and Truth"
          </p>
        </motion.div>
      </div>

      {/* Login Modal */}
      <AnimatePresence>
        {showPasswordPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c1917]/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              className="bg-white rounded-[3rem] w-full max-w-md p-12 relative shadow-2xl"
            >
              <button 
                onClick={() => {
                  setShowPasswordPrompt(false);
                  setStep('access_key');
                  setPassword('');
                }}
                className="absolute top-8 right-8 text-[#57534e] hover:text-[#1a237e] p-2"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-10">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1a237e] mb-6">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tighter text-[#1a237e]">
                  {step === 'access_key' ? 'Verification I' : 'Verification II'}
                </h3>
                <p className="text-sm font-medium text-[#57534e] mt-2 italic font-editorial text-lg">
                  {step === 'access_key' ? 'Enter standard educator access key.' : 'Enter dynamic security pin from node.'}
                </p>
              </div>

              <form onSubmit={handleTeacherLogin} className="space-y-8">
                <div>
                  <input
                    autoFocus
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-8 py-6 bg-[#f8f9fa] rounded-2xl border-2 transition-all outline-none font-mono text-2xl tracking-[0.5em] text-center ${
                      error ? 'border-red-500 text-red-500' : 'border-transparent focus:border-[#1a237e]'
                    }`}
                  />
                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 font-black text-[10px] uppercase text-center mt-4 tracking-widest"
                    >
                      Security Alert: Access Denied
                    </motion.p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#1a237e] text-white py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:bg-[#283593] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  Authorize
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
