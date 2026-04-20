import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Mail, Lock, User, GraduationCap, Info, Loader2 } from 'lucide-react';
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
  
  // States for post-social login role selection
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
        // Stop and show role selection if new user
        setPendingSocialUser(user);
        setShowRoleSelection(true);
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google login not enabled. Please fix in Firebase Console.');
      } else {
        setError(err.message || 'Google login failed');
      }
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
        fullName: pendingSocialUser.displayName || 'Guest User',
        email: pendingSocialUser.email || '',
        role: role, // Use selected role
        userClass: null,
        section: null,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', pendingSocialUser.uid), profile);
      onSuccess(profile);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
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
            fullName: userCredential.user.displayName || 'User',
            email: userCredential.user.email || email,
            role: 'student',
            userClass: null,
            section: null,
            createdAt: new Date().toISOString()
          });
        }
      } else {
        // Signup logic
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
      console.error('Auth Error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Login method not enabled in Firebase Console. Enable Email/Password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try logging in.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a]/50 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-[320px] rounded-[28px] overflow-hidden shadow-2xl border border-[#f1f3f5] max-h-[95vh] overflow-y-auto"
      >
        <div className="p-6">
          {showRoleSelection ? (
            <div className="space-y-6 text-center">
              <div className="w-10 h-10 bg-[#f0f2ff] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#e9ecef]">
                <GraduationCap className="w-5 h-5 text-[#1a237e]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1a1a1a] tracking-tight">Final Step</h2>
                <p className="text-[#636e72] text-[11px] font-medium mt-1">Select your academic role to continue.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setRole('teacher')}
                  className={`py-3 rounded-2xl border text-[10px] font-bold transition-all ${
                    role === 'teacher' ? 'bg-[#1a237e] text-white border-[#1a237e]' : 'bg-[#f8f9fa] text-[#636e72] border-transparent'
                  }`}
                >
                  TEACHER
                </button>
                <button
                  onClick={() => setRole('student')}
                  className={`py-3 rounded-2xl border text-[10px] font-bold transition-all ${
                    role === 'student' ? 'bg-[#1a237e] text-white border-[#1a237e]' : 'bg-[#f8f9fa] text-[#636e72] border-transparent'
                  }`}
                >
                  STUDENT
                </button>
              </div>

              <button
                onClick={handleSocialRoleSelected}
                disabled={loading}
                className="w-full bg-[#1a237e] text-white font-bold py-3 rounded-2xl transition-all text-[12px] shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'COMPLETE REGISTRATION'}
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-5">
                <div className="w-10 h-10 bg-[#1a237e] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#1a237e]/10">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-[#1a1a1a] tracking-tight">
                  {isLogin ? 'Welcome back' : 'New Registry'}
                </h2>
                <p className="text-[#636e72] text-[11px] font-medium mt-0.5">
                  {isLogin ? 'Access your dashboard' : 'Join St. Michael\'s Portal'}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-[#e9ecef] rounded-2xl text-[12px] font-semibold text-[#1a1a1a] hover:bg-[#f8f9fa] transition-all disabled:opacity-50"
                >
                  <GoogleIcon />
                  Google Access
                </button>

                <div className="relative py-1.5">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#f1f3f5]"></div></div>
                  <div className="relative flex justify-center text-[9px] font-bold bg-white px-3 text-[#adb5bd] uppercase tracking-widest">or email</div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  {!isLogin && (
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#adb5bd]" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-[#f8f9fa] border border-transparent rounded-2xl py-2.5 pl-10 pr-4 text-[12px] font-semibold text-[#1a1a1a] focus:bg-white focus:border-[#1a237e] outline-none transition-all placeholder:text-[#adb5bd] placeholder:font-normal"
                        placeholder="Real Name"
                      />
                    </div>
                  )}

                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#adb5bd]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#f8f9fa] border border-transparent rounded-2xl py-2.5 pl-10 pr-4 text-[12px] font-semibold text-[#1a1a1a] focus:bg-white focus:border-[#1a237e] outline-none transition-all placeholder:text-[#adb5bd] placeholder:font-normal"
                      placeholder="Email ID"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#adb5bd]" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#f8f9fa] border border-transparent rounded-2xl py-2.5 pl-10 pr-4 text-[12px] font-semibold text-[#1a1a1a] focus:bg-white focus:border-[#1a237e] outline-none transition-all placeholder:text-[#adb5bd] placeholder:font-normal"
                      placeholder="Security Code"
                    />
                  </div>

                  {!isLogin && (
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setRole('teacher')}
                        className={`py-2 rounded-xl border text-[9px] font-bold transition-all ${
                          role === 'teacher' ? 'bg-[#1a237e] text-white border-[#1a237e]' : 'bg-[#f8f9fa] text-[#636e72] border-transparent'
                        }`}
                      >
                        TEACHER
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('student')}
                        className={`py-2 rounded-xl border text-[9px] font-bold transition-all ${
                          role === 'student' ? 'bg-[#1a237e] text-white border-[#1a237e]' : 'bg-[#f8f9fa] text-[#636e72] border-transparent'
                        }`}
                      >
                        STUDENT
                      </button>
                    </div>
                  )}

                  {error && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2">
                      <Info className="w-3 h-3 text-red-500 shrink-0" />
                      <p className="text-red-700 text-[9px] font-bold leading-tight">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1a237e] hover:bg-[#1a237e]/90 text-white font-bold py-3 rounded-2xl transition-all text-[12px] shadow-lg shadow-[#1a237e]/10 disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLogin ? 'Access Portal' : 'Register')}
                  </button>
                </form>
              </div>

              <div className="mt-5 text-center space-y-3">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-[11px] font-semibold text-[#636e72] hover:text-[#1a237e] transition-colors"
                >
                  {isLogin ? "Need an account? Join Registry" : "Already registered? Login"}
                </button>
                
                <button
                  onClick={onContinueGuest}
                  className="block w-full py-2.5 rounded-2xl border border-[#e9ecef] text-[10px] font-bold text-[#636e72] uppercase tracking-widest hover:bg-[#f8f9fa] transition-all"
                >
                  Guest Access
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
