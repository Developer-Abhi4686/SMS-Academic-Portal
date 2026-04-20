import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, ShieldCheck, Lock, ArrowRight, X, Sun, Moon } from 'lucide-react';
import { UserRole } from '../types';

interface LandingPageProps {
  onSelectRole: (role: UserRole) => void;
}

export default function LandingPage({ onSelectRole }: LandingPageProps) {
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const TEACHER_ACCESS_KEY = 'admin1234';

  const [step, setStep] = useState<'access_key' | 'security_pin'>('access_key');

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'access_key') {
      if (password === TEACHER_ACCESS_KEY) {
        setStep('security_pin');
        setPassword(''); // Clear for PIN
        setError(false);
      } else {
        setError(true);
        setTimeout(() => setError(false), 2000);
      }
    } else {
      // Calculate real-time PIN: hhmm (12-hour format)
      const now = new Date();
      let hours = now.getHours() % 12;
      hours = hours ? hours : 12; // Handle 12:00 (0 -> 12)
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
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] px-4 font-['Segoe_UI',Roboto,Helvetica,Arial,sans-serif] relative overflow-hidden transition-colors duration-300">
      <div className="max-w-4xl w-full text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12"
        >
          <div className="flex justify-center mb-6">
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-20 h-20 bg-gradient-to-br from-[#1a237e] to-[#3949ab] rounded-[2rem] flex items-center justify-center shadow-xl border-4 border-white"
            >
              <ShieldCheck className="w-10 h-10 text-white" />
            </motion.div>
          </div>
          <h1 className="text-5xl font-black mb-2 text-[#1a237e] uppercase tracking-tighter">
            SMS Academīc Portal
          </h1>
          <p className="text-[#636e72] font-black text-[10px] uppercase tracking-[0.3em] bg-[#1a237e]/5 inline-block px-4 py-1.5 rounded-full border border-[#1a237e]/10">Academic Excellence &bull; Bhind</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <motion.button
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowPasswordPrompt(true)}
            className="bg-white p-12 rounded-[2.5rem] border border-[#e9ecef] shadow-xl hover:shadow-2xl flex flex-col items-center gap-6 hover:border-[#3949ab] transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 text-[#636e72]">
              <ShieldCheck className="w-20 h-20" />
            </div>
            <div className="w-20 h-20 bg-[#f0f2ff] rounded-3xl flex items-center justify-center group-hover:bg-[#3949ab] group-hover:text-white transition-all duration-500 transform group-hover:rotate-12">
              <ShieldCheck className="w-10 h-10 text-[#3949ab] group-hover:text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-[#1a237e] uppercase tracking-tighter">Teacher Portal</h2>
              <p className="text-[#636e72] text-[10px] font-bold uppercase tracking-widest opacity-60">Admin & Curriculum</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectRole('student')}
            className="bg-white p-12 rounded-[2.5rem] border border-[#e9ecef] shadow-xl hover:shadow-2xl flex flex-col items-center gap-6 hover:border-[#1a237e] transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 text-[#636e72]">
              <GraduationCap className="w-20 h-20" />
            </div>
            <div className="w-20 h-20 bg-[#f0f2ff] rounded-3xl flex items-center justify-center group-hover:bg-[#1a237e] group-hover:text-white transition-all duration-500 transform group-hover:-rotate-12">
              <GraduationCap className="w-10 h-10 text-[#1a237e] group-hover:text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-[#1a237e] uppercase tracking-tighter">Student Access</h2>
              <p className="text-[#636e72] text-[10px] font-bold uppercase tracking-widest opacity-60">Growth & Resources</p>
            </div>
          </motion.button>
        </div>

        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 text-[#636e72] text-[9px] font-black uppercase tracking-[0.2em] opacity-40 text-center"
        >
          SMS Academīc Portal designed for St. Michael's By Abhi Sharma(9-d)
        </motion.footer>
      </div>

      <AnimatePresence>
        {showPasswordPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a237e]/40 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative border border-[#1a237e]/10"
            >
              <button 
                onClick={() => setShowPasswordPrompt(false)}
                className="absolute top-6 right-6 text-[#636e72] hover:text-[#1a237e] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#f0f2ff] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-[#1a237e]" />
                </div>
                <h3 className="text-2xl font-black text-[#1a237e] uppercase tracking-tighter">
                  {step === 'access_key' ? 'Portal Verification' : 'Identity Confirmed'}
                </h3>
                <p className="text-[#636e72] text-xs font-bold uppercase tracking-wider mt-2">
                  {step === 'access_key' ? 'Enter Teacher Access Key' : 'Enter Secondary Security PIN'}
                </p>
              </div>

              <form onSubmit={handleTeacherLogin} className="space-y-6">
                <div className="relative">
                  <input
                    autoFocus
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-6 py-4 bg-[#f8f9fa] rounded-xl border-2 transition-all outline-none text-center font-black tracking-[0.3em] text-[#1a237e] ${
                      error ? 'border-red-500 animate-shake' : 'border-[#e9ecef] focus:border-[#1a237e]'
                    }`}
                  />
                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center mt-3"
                    >
                      {step === 'access_key' ? 'Invalid Access Key' : 'Invalid Security PIN'}
                    </motion.p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#1a237e] text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 hover:bg-[#3949ab] transition-all shadow-lg hover:shadow-[#1a237e]/30"
                >
                  {step === 'access_key' ? 'Confirm Identity' : 'Unlock Portal'}
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
