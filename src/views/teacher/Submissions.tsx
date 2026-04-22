import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Search, 
  ArrowLeft, 
  Clock, 
  Eye, 
  CheckCircle, 
  XCircle,
  FileDown,
  User,
  Calendar,
  X,
  FolderOpen,
  Filter,
  ArrowRight
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  admnNo: string;
  class: string;
  section: string;
  type: string;
  method: 'text' | 'file' | 'photo';
  content: string;
  fileName?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

interface SubmissionsProps {
  onBack?: () => void;
  userClass: string | null;
  userSection: string | null;
}

export default function Submissions({ onBack, userClass, userSection }: SubmissionsProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentAdmn, setSelectedStudentAdmn] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'submissions'),
        where('class', '==', userClass),
        where('section', '==', userSection)
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Submission));
      
      // Sort in memory to avoid index requirements
      docs.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setSubmissions(docs);
    } catch (error) {
      console.error("Fetch failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userClass && userSection) {
      fetchSubmissions();
    }
  }, [userClass, userSection]);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'submissions', id), { status });
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
      if (selectedSub?.id === id) {
        setSelectedSub({ ...selectedSub, status });
      }
    } catch (err) {
      alert("Update failed");
    }
  };

  // Group submissions by student (admnNo)
  const groupedSubmissions = submissions.reduce((acc, sub) => {
    const key = (sub.admnNo || '').trim().toUpperCase();
    if (!acc[key]) {
      acc[key] = {
        studentName: sub.studentName,
        admnNo: sub.admnNo,
        items: []
      };
    }
    acc[key].items.push(sub);
    return acc;
  }, {} as Record<string, { studentName: string, admnNo: string, items: Submission[] }>);

  const studentsList = Object.values(groupedSubmissions);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-[#1a237e] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#1a237e] font-black text-xs uppercase tracking-widest">Scanning Repository...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          {onBack && (
            <button onClick={onBack} className="p-4 bg-white border border-[#e7e5e4] text-[#1a237e] rounded-2xl shadow-sm">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1a237e]">Student Record Management</span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Documentation <span className="font-editorial text-[#1a237e]">Folders</span></h1>
            <p className="text-[#57534e] text-xs font-medium">Registry for Class {userClass}-{userSection}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List View */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="wait">
            {!selectedStudentAdmn ? (
              <motion.div
                key="student-list"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {studentsList.map((student) => {
                  const pendingCount = student.items.filter(i => i.status === 'pending').length;
                  const normalizedAdmn = student.admnNo.trim().toUpperCase();
                  return (
                    <button
                      key={normalizedAdmn}
                      onClick={() => setSelectedStudentAdmn(normalizedAdmn)}
                      className="w-full text-left bg-white p-8 rounded-[3rem] border border-[#e7e5e4] transition-all flex flex-col justify-between group hover:border-[#1a237e] hover:shadow-2xl hover:translate-y-[-4px]"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-blue-50 flex items-center justify-center text-[#1a237e] group-hover:bg-[#1a237e] group-hover:text-white transition-colors">
                          <FolderOpen className="w-8 h-8" />
                        </div>
                        {pendingCount > 0 && (
                          <div className="px-4 py-2 bg-rose-500 text-white rounded-full shadow-lg shadow-rose-200">
                            <span className="text-[8px] font-black uppercase tracking-widest">{pendingCount} New Items</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-[#1c1917] uppercase tracking-tighter leading-tight group-hover:text-[#1a237e] transition-colors">
                          {student.studentName}
                        </h3>
                        <p className="text-[9px] font-black text-[#57534e] uppercase tracking-[0.2em] mt-2 opacity-50">
                          Admn No: {student.admnNo} &bull; {student.items.length} Files
                        </p>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="submission-list"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-8">
                  <button 
                    onClick={() => setSelectedStudentAdmn(null)}
                    className="flex items-center gap-3 text-[#1a237e] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform bg-white px-5 py-3 rounded-full border border-[#e7e5e4] shadow-sm"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Close Student Folder
                  </button>
                  <p className="text-[10px] font-black font-mono text-[#57534e] uppercase tracking-widest opacity-40">Classified Documents Only</p>
                </div>

                <div className="bg-[#1a237e] rounded-[3rem] p-10 text-white shadow-xl relative overflow-hidden mb-8">
                  <div className="absolute top-[-20px] right-[-20px] opacity-10">
                    <FolderOpen className="w-48 h-48" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Internal Registry For</p>
                    <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">{groupedSubmissions[selectedStudentAdmn].studentName}</h2>
                    <div className="flex items-center gap-4 mt-6">
                       <span className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">ID: {selectedStudentAdmn}</span>
                       <span className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">{groupedSubmissions[selectedStudentAdmn].items.length} Submissions Found</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {groupedSubmissions[selectedStudentAdmn].items.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSub(sub)}
                      className="w-full text-left bg-white p-6 rounded-[2.5rem] border border-[#e7e5e4] transition-all flex items-center justify-between group hover:border-[#1a237e] hover:shadow-lg"
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm ${
                          sub.status === 'approved' ? 'bg-emerald-500' : sub.status === 'rejected' ? 'bg-red-500' : 'bg-[#1a237e]'
                        }`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-[#1a237e] uppercase tracking-tighter">{sub.type}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[9px] font-bold text-[#57534e] uppercase tracking-widest">{sub.createdAt?.toDate().toLocaleDateString()}</span>
                            <span className="w-1 h-1 bg-neutral-200 rounded-full" />
                            <span className="text-[9px] font-black text-[#1a237e] uppercase tracking-widest">{sub.method}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest border transition-colors ${
                          sub.status === 'approved' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 
                          sub.status === 'rejected' ? 'border-red-500 text-red-600 bg-red-50' : 
                          'border-[#1a237e]/20 text-[#1a237e] bg-[#f8f9fa]'
                        }`}>
                          {sub.status}
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#1a237e] opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {submissions.length === 0 && (
            <div className="text-center py-20 bg-neutral-50 rounded-[3rem] border-2 border-dashed border-neutral-200">
              <Clock className="w-12 h-12 text-[#57534e] opacity-20 mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest text-[#57534e] opacity-40">No Folders Created Yet</p>
            </div>
          )}
        </div>

        {/* Status / Detail Card Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[3rem] border border-[#e7e5e4] p-8 shadow-sm h-fit sticky top-8">
            <h2 className="text-xl font-black text-[#1a237e] uppercase tracking-tighter mb-8 border-b border-neutral-100 pb-4">Activity Summary</h2>
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-blue-50 p-6 rounded-[2rem]">
                <div>
                  <p className="text-2xl font-black text-[#1a237e]">{submissions.filter(s => s.status === 'pending').length}</p>
                  <p className="text-[10px] font-black text-[#57534e] uppercase tracking-widest mt-1">Pending Docs</p>
                </div>
                <Clock className="w-8 h-8 text-[#1a237e] opacity-30" />
              </div>
              
              <div className="flex justify-between items-center bg-emerald-50 p-6 rounded-[2rem]">
                <div>
                  <p className="text-2xl font-black text-emerald-600">{submissions.filter(s => s.status === 'approved').length}</p>
                  <p className="text-[10px] font-black text-[#57534e] uppercase tracking-widest mt-1">Approved</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-600 opacity-30" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Submission Viewer Overlay */}
      <AnimatePresence>
        {selectedSub && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1c1917]/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
            >
              <button onClick={() => setSelectedSub(null)} className="absolute top-8 right-8 text-[#57534e] hover:text-[#1a237e] p-2 z-10">
                <X className="w-6 h-6" />
              </button>

              <div className="p-10 border-b border-[#e7e5e4] flex flex-col md:flex-row justify-between gap-6">
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter text-[#1a237e]">{selectedSub.type}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#57534e]">
                      <User className="w-4 h-4" />
                      <span>{selectedSub.studentName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-[#57534e]">
                      <Calendar className="w-4 h-4" />
                      <span>{selectedSub.createdAt?.toDate().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => updateStatus(selectedSub.id, 'approved')}
                    className="flex-1 px-8 py-3 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-all shadow-lg"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => updateStatus(selectedSub.id, 'rejected')}
                    className="flex-1 px-8 py-3 bg-red-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 transition-all shadow-lg"
                  >
                    Reject
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[#fcfcfc]">
                <div className="bg-white border border-[#e7e5e4] rounded-[2.5rem] p-10 shadow-sm min-h-[400px]">
                  {selectedSub.method === 'text' ? (
                    <div className="whitespace-pre-wrap font-medium text-[#1c1917] leading-relaxed">
                      {selectedSub.content}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-8">
                       <img 
                        src={selectedSub.content} 
                        className="max-w-full rounded-2xl shadow-xl border border-neutral-100" 
                        alt="Submission Content" 
                       />
                       <a 
                        href={selectedSub.content} 
                        download={selectedSub.fileName || "submission"}
                        className="flex items-center gap-3 px-8 py-4 bg-[#f8f9fa] rounded-2xl font-black uppercase tracking-widest text-xs border border-neutral-200 hover:bg-white"
                       >
                         <FileDown className="w-4 h-4" /> Save Copy
                       </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
