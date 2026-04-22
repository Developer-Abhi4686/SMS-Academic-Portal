import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardList, RotateCcw, ArrowLeft, Check, Save, UserCheck, Edit3, X } from 'lucide-react';
import { collection, query, where, getDocs, doc, setDoc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserProfile } from '../../types';

interface Student {
  id: string;
  fullName: string;
}

interface AttendanceRecord {
  [studentId: string]: 'P' | 'A' | 'L';
}

interface AttendanceManagerProps {
  onBack?: () => void;
  userClass: string | null;
  userSection: string | null;
}

interface StudentStats {
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

export default function AttendanceManager({ onBack, userClass, userSection }: AttendanceManagerProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryRecord, setSelectedHistoryRecord] = useState<any>(null);
  const [today] = useState(new Date().toISOString().split('T')[0]);

  const fetchHistory = async () => {
    if (!userClass || !userSection) return;
    setLoadingHistory(true);
    try {
      const q = query(
        collection(db, 'attendance'),
        where('class', '==', userClass),
        where('section', '==', userSection)
      );
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort manually to avoid index error
      records.sort((a: any, b: any) => {
        return (b.date || '').localeCompare(a.date || '');
      });

      setHistory(records);
      setShowHistory(true);
    } catch (err) {
      console.error("History fetch failed:", err);
      alert("Could not load attendance history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let fetchedStudents: Student[] = [];
      
      // Check for custom collections (Mapping Roman to Arabic for dynamic support)
      const romanToArabic: Record<string, string> = {
        'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5',
        'VI': '6', 'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10',
        'XI': '11', 'XII': '12'
      };

      const arabicClass = (userClass && romanToArabic[userClass]) || userClass || '';
      const customCollectionName = `students_${arabicClass}${userSection}`;

      try {
        const customQ = query(collection(db, customCollectionName));
        const customSnapshot = await getDocs(customQ);
        if (!customSnapshot.empty) {
          fetchedStudents = customSnapshot.docs.map(doc => ({
            id: doc.id,
            fullName: doc.data().name || doc.data().fullName || 'Unknown Student'
          }));
        }
      } catch (e) {
        console.warn(`Custom collection ${customCollectionName} fetch failed, falling back...`);
      }

      // Fallback to standard users collection if no students found in custom collection
      if (fetchedStudents.length === 0) {
        const q = query(
          collection(db, 'users'), 
          where('role', '==', 'student'),
          where('userClass', '==', userClass),
          where('section', '==', userSection)
        );
        const querySnapshot = await getDocs(q);
        fetchedStudents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          fullName: (doc.data() as UserProfile).fullName
        }));
      }
      
      fetchedStudents.sort((a, b) => a.fullName.localeCompare(b.fullName));
      setStudents(fetchedStudents);

      // Fetch today's records if they exist
      const docId = `${userClass}_${userSection}_${today}`;
      const attDoc = await getDoc(doc(db, 'attendance', docId));
      if (attDoc.exists()) {
        setAttendance(attDoc.data().records || {});
        setIsSubmitted(true); // Mark as submitted if records exist
      }
    } catch (err) {
      console.error("Failed to fetch students/attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userClass && userSection) {
      fetchStudents();
    }
  }, [userClass, userSection]);

  const markAttendance = (studentId: string, status: 'P' | 'A' | 'L') => {
    if (isSubmitted) return; // Prevent change if submitted
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const docId = `${userClass}_${userSection}_${today}`;
      await setDoc(doc(db, 'attendance', docId), {
        class: userClass,
        section: userSection,
        date: today,
        updatedAt: new Date().toISOString(),
        records: attendance
      }, { merge: true });
      setIsSubmitted(true);
      alert("Attendance submitted successfully!");
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to sync attendance. Please check permissions.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-[#1a237e] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#1a237e] font-black text-xs uppercase tracking-widest">Opening Registry...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 text-[#1a237e] hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="p-3 rounded-2xl bg-blue-50 text-[#1a237e] border border-blue-100">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#1a237e] uppercase tracking-tight">Attendance</h1>
            <p className="text-[#57534e] font-bold text-xs uppercase tracking-widest">
              Student Registry • {today}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isSubmitted ? (
            <button
              onClick={() => setIsSubmitted(false)}
              className="flex items-center gap-2 bg-blue-50 text-[#1a237e] px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-100 transition-all border border-[#1a237e]/10 shadow-sm"
            >
              <Edit3 className="w-4 h-4" />
              Edit Registry
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-[#1a237e] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#283593] transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <RotateCcw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Submitting...' : 'Submit attendance'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#e9ecef] shadow-sm overflow-hidden">
        <div className="p-4 bg-neutral-50 border-b border-[#e9ecef] flex justify-between items-center">
          <span className="text-[10px] font-black text-[#1a237e] uppercase tracking-widest">Student Information</span>
          <span className="text-[10px] font-black text-[#1a237e] uppercase tracking-widest">Status (P/A/L)</span>
        </div>
        <div className="divide-y divide-[#f1f2f6]">
          {students.map((student) => (
            <div key={student.id} className="p-4 flex items-center justify-between hover:bg-blue-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#1a237e] font-black text-xs border border-[#1a237e]/10">
                  {student.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold text-[#2d3436] text-sm flex items-center gap-2">
                    {student.fullName}
                  </h4>
                </div>
              </div>

              <div className="flex gap-2">
                {[
                  { value: 'P', color: 'bg-emerald-500', label: 'Present' },
                  { value: 'A', color: 'bg-rose-500', label: 'Absent' },
                  { value: 'L', color: 'bg-amber-500', label: 'Late' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => markAttendance(student.id, opt.value as any)}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all
                      ${attendance[student.id] === opt.value 
                        ? `${opt.color} text-white shadow-md scale-110` 
                        : 'bg-neutral-100 text-[#636e72] hover:bg-neutral-200'}
                      ${isSubmitted ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
                    `}
                    title={opt.label}
                  >
                    {opt.value}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {students.length === 0 && (
            <div className="p-20 text-center">
              <p className="text-[#636e72] text-sm font-bold uppercase">No students found for this class.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 p-6 bg-[#f8f9fa] rounded-2xl border-2 border-dashed border-neutral-200">
        <div className="text-center">
          <p className="text-2xl font-black text-emerald-600">{Object.values(attendance).filter(v => v === 'P').length}</p>
          <p className="text-[10px] font-black text-[#636e72] uppercase tracking-widest">Present</p>
        </div>
        <div className="w-px h-8 bg-neutral-200"></div>
        <div className="text-center">
          <p className="text-2xl font-black text-rose-600">{Object.values(attendance).filter(v => v === 'A').length}</p>
          <p className="text-[10px] font-black text-[#636e72] uppercase tracking-widest">Absent</p>
        </div>
        <div className="w-px h-8 bg-neutral-200"></div>
        <div className="text-center">
          <p className="text-2xl font-black text-amber-600">{Object.values(attendance).filter(v => v === 'L').length}</p>
          <p className="text-[10px] font-black text-[#636e72] uppercase tracking-widest">Late</p>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={fetchHistory}
          disabled={loadingHistory}
          className="flex items-center gap-2 bg-white text-[#1a237e] border border-blue-100 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-sm"
        >
          {loadingHistory ? (
            <RotateCcw className="w-4 h-4 animate-spin" />
          ) : (
            <ClipboardList className="w-4 h-4" />
          )}
          {loadingHistory ? 'Loading...' : 'View Attendance History'}
        </button>
      </div>

      {/* History Modal Overlay */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1c1917]/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl relative"
            >
              <button 
                onClick={() => setShowHistory(false)}
                className="absolute top-8 right-8 text-[#57534e] hover:text-[#1a237e] p-2 z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="p-8 border-b border-[#e7e5e4]">
                <h3 className="text-2xl font-black uppercase tracking-tighter text-[#1a237e]">Attendance History</h3>
                <p className="text-sm font-bold text-[#57534e] uppercase tracking-widest mt-1">Class {userClass}-{userSection}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <AnimatePresence mode="wait">
                  {selectedHistoryRecord ? (
                    <motion.div
                      key="details"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <button 
                        onClick={() => setSelectedHistoryRecord(null)}
                        className="flex items-center gap-2 text-[#1a237e] font-black text-[10px] uppercase tracking-widest mb-6 hover:translate-x-[-4px] transition-transform"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        Back to history list
                      </button>
                      
                      <div className="bg-[#f8f9fa] rounded-2xl p-6 border border-[#e7e5e4] mb-8">
                         <p className="text-sm font-black text-[#1a237e] uppercase tracking-tighter">Detailed Records for {selectedHistoryRecord.date}</p>
                      </div>

                      <div className="space-y-3">
                        {students.map(student => {
                          const status = selectedHistoryRecord.records?.[student.id];
                          const statusConfig = {
                            P: { color: 'bg-emerald-500', label: 'Present' },
                            A: { color: 'bg-rose-500', label: 'Absent' },
                            L: { color: 'bg-amber-500', label: 'Late' }
                          }[status as 'P' | 'A' | 'L'] || { color: 'bg-neutral-200', label: 'Not Marked' };

                          return (
                            <div key={student.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#e7e5e4]">
                              <span className="font-bold text-[#2d3436] text-sm">{student.fullName}</span>
                              <div className={`px-4 py-1.5 rounded-full text-white text-[10px] font-black uppercase tracking-widest ${statusConfig.color}`}>
                                {statusConfig.label}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-6"
                    >
                      {history.map((record) => {
                        const stats = {
                          p: Object.values(record.records || {}).filter(v => v === 'P').length,
                          a: Object.values(record.records || {}).filter(v => v === 'A').length,
                          l: Object.values(record.records || {}).filter(v => v === 'L').length,
                        };
                        return (
                          <button
                            key={record.id} 
                            onClick={() => setSelectedHistoryRecord(record)}
                            className="w-full text-left bg-[#f8f9fa] rounded-2xl p-6 border border-[#e7e5e4] flex items-center justify-between group hover:border-[#1a237e]/30 transition-all hover:bg-blue-50/30 active:scale-[0.98]"
                          >
                            <div>
                              <p className="text-base font-black text-[#1a237e] group-hover:underline">{record.date}</p>
                              <p className="text-[10px] font-bold text-[#57534e] uppercase tracking-widest mt-1">Synced on {new Date(record.updatedAt).toLocaleTimeString()}</p>
                            </div>
                            <div className="flex gap-6">
                               <div className="text-center">
                                 <p className="text-lg font-black text-emerald-600">{stats.p}</p>
                                 <p className="text-[9px] font-black text-[#57534e] uppercase tracking-tighter">P</p>
                               </div>
                               <div className="text-center">
                                 <p className="text-lg font-black text-rose-600">{stats.a}</p>
                                 <p className="text-[9px] font-black text-[#57534e] uppercase tracking-tighter">A</p>
                               </div>
                               <div className="text-center">
                                 <p className="text-lg font-black text-amber-600">{stats.l}</p>
                                 <p className="text-[9px] font-black text-[#57534e] uppercase tracking-tighter">L</p>
                               </div>
                            </div>
                          </button>
                        );
                      })}

                      {history.length === 0 && (
                        <div className="text-center py-12">
                          <p className="text-[#57534e] font-bold uppercase tracking-widest">No past records found.</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
