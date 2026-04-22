import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Mail, Lock, User, GraduationCap, Info, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthModalProps {
  onSuccess: (profile: UserProfile | null) => void;
  onContinueGuest: () => void;
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
    <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" />
  </svg>
);

export default function AuthModal({ onSuccess, onContinueGuest }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [pendingSocialUser, setPendingSocialUser] = useState<any>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        onSuccess(userDoc.data() as UserProfile);
      } else {
        setPendingSocialUser(user);
        setShowRoleSelection(true);
      }
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialRoleSelected = async () => {
    if (!pendingSocialUser) return;
    setLoading(true);
    try {
      const profile: UserProfile = {
        uid: pendingSocialUser.uid,
        fullName: pendingSocialUser.displayName || 'Guest Identity',
        email: pendingSocialUser.email || '',
        role: role,
        userClass: null,
        section: null,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', pendingSocialUser.uid), profile);
      onSuccess(profile);
    } catch (err: any) {
      setError(err.message || 'Verification system failure');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
          onSuccess(userDoc.data() as UserProfile);
        } else {
          onSuccess({
            uid: userCredential.user.uid,
            fullName: userCredential.user.displayName || 'Academic User',
            email: userCredential.user.email || email,
            role: 'student',
            userClass: null,
            section: null,
            createdAt: new Date().toISOString()
          });
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: fullName });
        
        const profile: UserProfile = {
          uid: userCredential.user.uid,
          fullName,
          email,
          role,
          userClass: null,
          section: null,
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', userCredential.user.uid), profile);
        onSuccess(profile);
      }
    } catch (err: any) {
       setError(err.message || 'Authentication sequence failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1c1917]/40 backdrop-blur-[12px] z-[100] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-[#fdfcfb] w-full max-w-sm rounded-[3rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.2)] border border-[#e7e5e4] max-h-[92vh] flex flex-col"
      >
        <div className="p-10 md:p-12 overflow-y-auto custom-scrollbar">
          {showRoleSelection ? (
            <div className="space-y-10">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-[#fff7ed] rounded-[1.5rem] flex items-center justify-center mx-auto text-[#943a1a] shadow-inner mb-2">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">Final <span className="font-editorial text-[#943a1a]">Verification</span></h2>
                <p className="text-[#57534e] text-xs font-bold uppercase tracking-widest opacity-60 leading-relaxed px-4">Identify your academic status to initialize dashboard.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setRole('teacher')}
                  className={`flex items-center justify-between p-6 rounded-[1.5rem] border-2 transition-all ${
                    role === 'teacher' ? 'bg-[#943a1a] border-[#943a1a] text-white' : 'bg-white border-[#e7e5e4] text-[#1c1917]'
                  }`}
                >
                  <span className="text-[11px] font-black uppercase tracking-widest leading-none">Institutional Staff</span>
                  <div className={`w-2 h-2 rounded-full ${role === 'teacher' ? 'bg-white' : 'bg-[#e7e5e4]'}`} />
                </button>
                <button
                  onClick={() => setRole('student')}
                  className={`flex items-center justify-between p-6 rounded-[1.5rem] border-2 transition-all ${
                    role === 'student' ? 'bg-[#943a1a] border-[#943a1a] text-white' : 'bg-white border-[#e7e5e4] text-[#1c1917]'
                  }`}
                >
                  <span className="text-[11px] font-black uppercase tracking-widest leading-none">Matriculated Student</span>
                  <div className={`w-2 h-2 rounded-full ${role === 'student' ? 'bg-white' : 'bg-[#e7e5e4]'}`} />
                </button>
              </div>

              <button
                onClick={handleSocialRoleSelected}
                disabled={loading}
                className="w-full bg-[#943a1a] text-white py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-[#943a1a]/30 disabled:opacity-50 hover:bg-[#c2410c] transition-all flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Finalize Access <ArrowRight className="w-3 h-3" /></>}
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <header className="text-center space-y-3">
                <div className="w-12 h-12 bg-[#943a1a] rounded-[1.25rem] flex items-center justify-center mx-auto text-white shadow-xl shadow-[#943a1a]/20 mb-2">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter">
                  {isLogin ? 'Secure' : 'New'} <span className="font-editorial text-[#943a1a]">{isLogin ? 'Access' : 'Registry'}</span>
                </h2>
                <div className="flex items-center justify-center gap-2">
                   <Sparkles className="w-3 h-3 text-[#f59e0b] opacity-40" />
                   <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#57534e] opacity-40">SMS Institutional Node</p>
                </div>
              </header>

              <div className="space-y-4">
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-4 py-4 bg-white border border-[#e7e5e4] rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest text-[#1c1917] hover:bg-[#f7f5f2] transition-all disabled:opacity-50 shadow-sm"
                >
                  <GoogleIcon />
                  Google Authentication
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#e7e5e4]"></div></div>
                  <div className="relative flex justify-center text-[8px] font-black bg-[#fdfcfb] px-4 text-[#adb5bd] uppercase tracking-[0.4em]">Direct Link</div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="relative group">
                      <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#943a1a] pointer-events-none group-focus-within:scale-110 transition-transform" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-[#f7f5f2] border-none rounded-[1.25rem] py-4 pl-14 pr-6 text-[12px] font-bold text-[#1c1917] focus:ring-2 ring-[#943a1a]/10 outline-none transition-all placeholder:text-[#adb5bd]"
                        placeholder="ALPHABETIC NAME"
                      />
                    </div>
                  )}

                  <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#943a1a] pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#f7f5f2] border-none rounded-[1.25rem] py-4 pl-14 pr-6 text-[12px] font-bold text-[#1c1917] focus:ring-2 ring-[#943a1a]/10 outline-none transition-all placeholder:text-[#adb5bd]"
                      placeholder="NETWORK ADDRESS (EMAIL)"
                    />
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#943a1a] pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#f7f5f2] border-none rounded-[1.25rem] py-4 pl-14 pr-6 text-[12px] font-bold text-[#1c1917] focus:ring-2 ring-[#943a1a]/10 outline-none transition-all placeholder:text-[#adb5bd]"
                      placeholder="ACCESS KEY"
                    />
                  </div>

                  {!isLogin && (
                    <div className="flex p-1 bg-[#f7f5f2] rounded-2xl gap-1">
                      <button
                        type="button"
                        onClick={() => setRole('teacher')}
                        className={`flex-1 py-3 rounded-xl text-[9px] font-black tracking-widest transition-all ${
                          role === 'teacher' ? 'bg-[#943a1a] text-white shadow-md' : 'text-[#57534e]'
                        }`}
                      >
                        STAFF
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('student')}
                        className={`flex-1 py-3 rounded-xl text-[9px] font-black tracking-widest transition-all ${
                          role === 'student' ? 'bg-[#943a1a] text-white shadow-md' : 'text-[#57534e]'
                        }`}
                      >
                        STUDENT
                      </button>
                    </div>
                  )}

                  {error && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3">
                      <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-red-700 text-[10px] font-bold leading-relaxed">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#943a1a] py-5 rounded-[1.25rem] font-black uppercase tracking-[0.2em] text-[10px] text-white shadow-xl shadow-[#943a1a]/20 hover:bg-[#c2410c] transition-all disabled:opacity-50 mt-4"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (isLogin ? 'Initiate Session' : 'Create Account')}
                  </button>
                </form>
              </div>

              <div className="pt-4 space-y-6 text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-[#57534e] hover:text-[#943a1a] transition-all"
                >
                  {isLogin ? "Transition to Registry" : "Return to Access Node"}
                </button>
                
                <div className="h-px w-10 bg-[#e7e5e4] mx-auto opacity-40" />
                
                <button
                  onClick={onContinueGuest}
                  className="text-[9px] font-black uppercase tracking-[0.4em] text-[#adb5bd] hover:text-[#943a1a] transition-all"
                >
                  Bypass (Guest)
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
