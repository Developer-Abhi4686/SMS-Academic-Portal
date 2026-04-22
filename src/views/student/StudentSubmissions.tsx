import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Image as ImageIcon, 
  Upload, 
  Send, 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle2,
  X,
  FileDown
} from 'lucide-react';
import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';

interface StudentSubmissionsProps {
  onBack?: () => void;
  userClass: string | null;
  userSection: string | null;
}

export default function StudentSubmissions({ onBack, userClass, userSection }: StudentSubmissionsProps) {
  const [step, setStep] = useState<'form' | 'type' | 'content' | 'success'>('form');
  const [formData, setFormData] = useState({
    name: '',
    admnNo: '',
    filledClass: '',
    filledSection: ''
  });
  const [permType, setPermType] = useState<'Leave Application' | 'Letter' | 'Other'>('Leave Application');
  const [submissionMethod, setSubmissionMethod] = useState<'text' | 'file' | 'photo'>('text');
  const [textValue, setTextValue] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalize = (val: string | null) => (val || '').trim().toUpperCase();
    
    if (normalize(formData.filledClass) !== normalize(userClass) || 
        normalize(formData.filledSection) !== normalize(userSection)) {
      setShowError(true);
      return;
    }
    setStep('type');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size too large. Please upload less than 2MB.");
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const finalSubmit = async () => {
    setLoading(true);
    try {
      const studentId = auth.currentUser?.uid || 'anonymous-' + Date.now();
      const normalizedName = formData.name.trim();
      const normalizedAdmn = formData.admnNo.trim();
      
      await addDoc(collection(db, 'submissions'), {
        studentId: studentId,
        studentName: normalizedName,
        admnNo: normalizedAdmn,
        class: userClass,
        section: userSection,
        type: permType,
        method: submissionMethod,
        content: submissionMethod === 'text' ? textValue : fileBase64,
        fileName: fileName,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setStep('success');
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Submission failed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-10 rounded-[3rem] border border-[#e7e5e4] shadow-sm space-y-8"
          >
            <div className="flex items-center gap-4 mb-4">
              {onBack && (
                <button onClick={onBack} className="p-3 bg-neutral-50 rounded-xl text-[#1a237e]">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h2 className="text-2xl font-black text-[#1a237e] uppercase tracking-tighter">Submission Form</h2>
                <p className="text-[10px] font-black text-[#57534e] uppercase tracking-widest mt-1">Identity Verification Required</p>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[#57534e] ml-2">Full Name</label>
                <input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#f8f9fa] p-5 rounded-2xl border border-transparent focus:border-[#1a237e] outline-none font-bold"
                  placeholder="Enter your name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[#57534e] ml-2">Admission Number</label>
                <input 
                  required
                  value={formData.admnNo}
                  onChange={e => setFormData({...formData, admnNo: e.target.value})}
                  className="w-full bg-[#f8f9fa] p-5 rounded-2xl border border-transparent focus:border-[#1a237e] outline-none font-bold"
                  placeholder="e.g. 5421"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-[#57534e] ml-2">Class</label>
                  <input 
                    required
                    value={formData.filledClass}
                    onChange={e => setFormData({...formData, filledClass: e.target.value})}
                    className="w-full bg-[#f8f9fa] p-5 rounded-2xl border border-transparent focus:border-[#1a237e] outline-none font-bold"
                    placeholder="e.g. IX"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-[#57534e] ml-2">Section</label>
                  <input 
                    required
                    value={formData.filledSection}
                    onChange={e => setFormData({...formData, filledSection: e.target.value})}
                    className="w-full bg-[#f8f9fa] p-5 rounded-2xl border border-transparent focus:border-[#1a237e] outline-none font-bold"
                    placeholder="e.g. D"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#1a237e] text-white py-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-[#283593] transition-all"
              >
                Next Step
              </button>
            </form>
          </motion.div>
        )}

        {step === 'type' && (
          <motion.div
            key="type"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <button onClick={() => setStep('form')} className="flex items-center gap-2 text-[#1a237e] font-black text-[10px] uppercase tracking-widest">
              <ArrowLeft className="w-4 h-4" /> Go back
            </button>
            <h2 className="text-3xl font-black text-[#1a237e] uppercase tracking-tighter">Choose Document Type</h2>
            <div className="grid grid-cols-1 gap-4">
              {['Leave Application', 'Letter', 'Other'].map(type => (
                <button
                  key={type}
                  onClick={() => { setPermType(type as any); setStep('content'); }}
                  className="p-8 bg-white rounded-3xl border border-[#e7e5e4] hover:border-[#1a237e] transition-all flex items-center justify-between group"
                >
                  <span className="text-xl font-black text-[#1c1917] group-hover:text-[#1a237e]">{type}</span>
                  <FileText className="w-6 h-6 text-[#57534e] opacity-20 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'content' && (
          <motion.div
            key="content"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-10 rounded-[3rem] border border-[#e7e5e4] shadow-sm space-y-8"
          >
            <header className="flex justify-between items-start">
               <button onClick={() => setStep('type')} className="p-3 bg-neutral-50 rounded-xl">
                 <ArrowLeft className="w-4 h-4" />
               </button>
               <div className="text-right">
                 <h2 className="text-2xl font-black text-[#1a237e] uppercase tracking-tighter">{permType}</h2>
                 <p className="text-[10px] font-black text-[#57534e] uppercase tracking-widest">Select Submission Method</p>
               </div>
            </header>

            <div className="flex gap-4 p-2 bg-[#f8f9fa] rounded-2xl border border-[#e7e5e4]">
              {[
                { id: 'text', icon: FileText, label: 'Write Text' },
                { id: 'file', icon: Upload, label: 'Upload File' },
                { id: 'photo', icon: ImageIcon, label: 'Add Photo' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setSubmissionMethod(m.id as any)}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl transition-all ${
                    submissionMethod === m.id ? 'bg-[#1a237e] text-white shadow-lg' : 'text-[#57534e] hover:bg-white'
                  }`}
                >
                  <m.icon className="w-5 h-5" />
                  <span className="text-[8px] font-black uppercase tracking-widest">{m.label}</span>
                </button>
              ))}
            </div>

            <div className="min-h-[200px]">
              {submissionMethod === 'text' && (
                <textarea
                  autoFocus
                  value={textValue}
                  onChange={e => setTextValue(e.target.value)}
                  placeholder="Type your content here..."
                  className="w-full bg-[#f8f9fa] p-6 rounded-3xl border-2 border-transparent focus:border-[#1a237e] outline-none min-h-[200px] font-medium"
                />
              )}

              {(submissionMethod === 'file' || submissionMethod === 'photo') && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-[200px] bg-[#f8f9fa] border-2 border-dashed border-[#e7e5e4] rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#1a237e] transition-all"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept={submissionMethod === 'photo' ? 'image/*' : '*'} 
                    onChange={handleFileChange}
                  />
                  {fileName ? (
                    <>
                      <FileDown className="w-10 h-10 text-emerald-500" />
                      <p className="font-black text-xs text-[#1a237e] px-4 truncate max-w-full">{fileName}</p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#1a237e] shadow-sm">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#57534e]">
                        Click to upload {submissionMethod}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={finalSubmit}
              disabled={loading || (submissionMethod === 'text' ? !textValue.trim() : !fileBase64)}
              className="w-full bg-[#1a237e] text-white py-6 rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-[#283593] disabled:opacity-50"
            >
              {loading ? <Upload className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? 'Submitting...' : 'Send Submission'}
            </button>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-4xl font-black text-[#1a237e] uppercase tracking-tighter mb-4 italic">Success!</h2>
            <p className="text-[#57534e] font-medium max-w-sm mx-auto mb-10">
              Your documentation has been synced with the teacher's dashboard. Please wait for official review.
            </p>
            <button
              onClick={onBack}
              className="px-10 py-5 bg-[#1a237e] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg"
            >
              Back to Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#1c1917]/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white p-10 rounded-[2.5rem] max-w-sm w-full text-center space-y-6"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-[#1a237e] uppercase tracking-tighter">Class Mismatch</h3>
              <p className="text-sm font-medium text-[#57534e] leading-relaxed">
                The Class and Section you entered do not match your current session. Please select the right class.
              </p>
              <button
                onClick={() => setShowError(false)}
                className="w-full bg-[#1a237e] text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px]"
              >
                Correct Details
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
