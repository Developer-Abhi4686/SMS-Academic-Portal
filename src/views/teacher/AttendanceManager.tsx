import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, 
  RotateCcw, 
  ArrowLeft, 
  Check, 
  Save, 
  UserCheck, 
  Edit3, 
  X, 
  Calendar,
  Lock,
  AlertCircle
} from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Selection Mode State
  const [isSelectingDate, setIsSelectingDate] = useState(true);
  const [selDay, setSelDay] = useState(new Date().getDate().toString());
  const [selMonth, setSelMonth] = useState((new Date().getMonth() + 1).toString());
  const [selYear, setSelYear] = useState(new Date().getFullYear().toString());

  const getReconstructedDate = () => {
    const d = selDay.padStart(2, '0');
    const m = selMonth.padStart(2, '0');
    return `${selYear}-${m}-${d}`;
  };

  const isEditable = () => {
    const selectedDateStr = getReconstructedDate();
    const selectedDate = new Date(selectedDateStr);
    const now = new Date();
    const diffInHours = (now.getTime() - selectedDate.getTime()) / (1000 * 60 * 60);
    return diffInHours <= 24 && diffInHours >= -24; // Within 24 hours of the target day
  };

  const fetchStudentsAndAttendance = async () => {
    setLoading(true);
    setAttendance({});
    setIsSubmitted(false);
    const targetDate = getReconstructedDate();

    try {
      let fetchedStudents: Student[] = [];
      
      const romanToArabic: Record<string, string> = {
        'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5',
        'VI': '6', 'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10',
        'XI': '11', 'XII': '12'
      };

      const arabicClass = (userClass && romanToArabic[userClass]) || userClass || '';
      const customCollectionName = `students_${arabicClass}${userSection}`;

      // 1. Fetch Students
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
        console.warn(`Custom fetch fallback...`);
      }

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
      
      const uniqueStudents = Array.from(new Map(fetchedStudents.map(s => [s.id, s])).values());
      uniqueStudents.sort((a, b) => a.fullName.localeCompare(b.fullName));
      setStudents(uniqueStudents);

      // 2. Fetch Attendance for the target date
      const docId = `${userClass}_${userSection}_${targetDate}`;
      const attDoc = await getDoc(doc(db, 'attendance', docId));
      if (attDoc.exists()) {
        const savedRecords = attDoc.data().records || {};
        const validRecords: AttendanceRecord = {};
        uniqueStudents.forEach(s => {
          if (savedRecords[s.id]) validRecords[s.id] = savedRecords[s.id];
        });
        setAttendance(validRecords);
        setIsSubmitted(true);
      }
      
      setIsSelectingDate(false);
    } catch (err) {
      console.error("Fetch failed:", err);
      alert("Error accessing database.");
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = (studentId: string, status: 'P' | 'A' | 'L') => {
    if (isSubmitted || !isEditable()) return;
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const targetDate = getReconstructedDate();
      const docId = `${userClass}_${userSection}_${targetDate}`;
      
      const filteredRecords = students.reduce((acc, s) => {
        if (attendance[s.id]) acc[s.id] = attendance[s.id];
        return acc;
      }, {} as AttendanceRecord);

      await setDoc(doc(db, 'attendance', docId), {
        class: userClass,
        section: userSection,
        date: targetDate,
        updatedAt: new Date().toISOString(),
        records: filteredRecords
      }, { merge: true });

      alert("Data synchronized successfully!");
      // Reset to entry interface
      setIsSelectingDate(true);
      setAttendance({});
      setIsSubmitted(false);
    } catch (err) {
      alert("Submission failed.");
    } finally {
      setSaving(false);
    }
  };

  if (isSelectingDate) {
    return (
      <div className="max-w-xl mx-auto py-12 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-[3rem] border border-neutral-100 shadow-2xl space-y-12"
        >
          <header className="flex flex-col items-center text-center gap-4">
             <div className="w-16 h-16 bg-[#1a237e] text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-blue-200">
               <Calendar className="w-8 h-8" />
             </div>
             <div>
               <h2 className="text-3xl font-black uppercase tracking-tighter text-[#1a237e]">Sync Registry</h2>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#57534e] mt-2">Class {userClass}-{userSection} Dashboard</p>
             </div>
          </header>

          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#57534e] ml-2">Day</label>
                <select 
                  value={selDay}
                  onChange={e => setSelDay(e.target.value)}
                  className="w-full bg-[#f8f9fa] p-5 rounded-2xl border border-transparent focus:border-[#1a237e] outline-none font-bold appearance-none text-center"
                >
                  {Array.from({length: 31}, (_, i) => (i + 1).toString()).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#57534e] ml-2">Month</label>
                <select 
                  value={selMonth}
                  onChange={e => setSelMonth(e.target.value)}
                  className="w-full bg-[#f8f9fa] p-5 rounded-2xl border border-transparent focus:border-[#1a237e] outline-none font-bold appearance-none text-center"
                >
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => (
                    <option key={m} value={(idx + 1).toString()}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#57534e] ml-2">Year</label>
                <select 
                  value={selYear}
                  onChange={e => setSelYear(e.target.value)}
                  className="w-full bg-[#f8f9fa] p-5 rounded-2xl border border-transparent focus:border-[#1a237e] outline-none font-bold appearance-none text-center"
                >
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y.toString()}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={fetchStudentsAndAttendance}
              disabled={loading}
              className="w-full bg-[#1a237e] text-white py-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100 flex items-center justify-center gap-3 hover:bg-[#283593] transition-all"
            >
              {loading ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              {loading ? 'Accessing...' : 'Open Registry'}
            </button>
            
            <button
               onClick={onBack}
               className="w-full bg-white text-[#57534e] py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-neutral-100"
            >
              Cancel Operation
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-[#1a237e] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#1a237e] font-black text-xs uppercase tracking-widest tracking-[0.2em]">Syncing Archives...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSelectingDate(true)}
            className="p-2 -ml-2 text-[#1a237e] hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="p-3 rounded-2xl bg-blue-50 text-[#1a237e] border border-blue-100">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#1a237e] uppercase tracking-tight">Registry</h1>
            <p className="text-[#57534e] font-bold text-xs uppercase tracking-widest">
              {getReconstructedDate()} • {userClass}-{userSection}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {!isEditable() ? (
            <div className="flex items-center gap-2 bg-[#f8f9fa] text-[#57534e] px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest border border-neutral-200">
              <Lock className="w-4 h-4" />
              Locked (24h+)
            </div>
          ) : isSubmitted ? (
            <button
              onClick={() => setIsSubmitted(false)}
              className="flex items-center gap-2 bg-blue-50 text-[#1a237e] px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-100 transition-all border border-[#1a237e]/10"
            >
              <Edit3 className="w-4 h-4" />
              Modify
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-[#1a237e] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#283593] transition-all shadow-lg disabled:opacity-50"
            >
              {saving ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Syncing...' : 'Submit'}
            </button>
          )}
        </div>
      </div>

      {!isEditable() && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-4">
           <AlertCircle className="w-5 h-5 text-amber-600" />
           <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
             Warning: Temporal Lock Active. This document is over 24 hours old and cannot be modified.
           </p>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-[#e9ecef] shadow-sm overflow-hidden">
        <div className="p-5 bg-[#fcfcfc] border-b border-[#e9ecef] flex justify-between items-center">
          <span className="text-[10px] font-black text-[#1a237e] uppercase tracking-widest">Student Entry</span>
          <span className="text-[10px] font-black text-[#1a237e] uppercase tracking-widest">Status Mapping</span>
        </div>
        <div className="divide-y divide-[#f1f2f6]">
          {students.map((student) => (
            <div key={student.id} className="p-5 flex items-center justify-between hover:bg-blue-50/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#1a237e] font-black group-hover:scale-110 transition-transform border border-blue-100">
                  {student.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold text-[#1a1a1a] text-base">{student.fullName}</h4>
                </div>
              </div>

              <div className="flex gap-2.5">
                {[
                  { value: 'P', color: 'bg-emerald-500', label: 'Present' },
                  { value: 'A', color: 'bg-rose-500', label: 'Absent' },
                  { value: 'L', color: 'bg-amber-500', label: 'Late' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    disabled={isSubmitted || !isEditable()}
                    onClick={() => markAttendance(student.id, opt.value as any)}
                    className={`
                      w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm transition-all
                      ${attendance[student.id] === opt.value 
                        ? `${opt.color} text-white shadow-lg scale-110` 
                        : 'bg-[#f8f9fa] text-[#57534e] hover:bg-[#1a237e]/5'}
                      ${(isSubmitted || !isEditable()) ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
                    `}
                  >
                    {opt.value}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-6 p-8 bg-[#f8f9fa] rounded-[2.5rem] border-2 border-dashed border-neutral-200">
        <div className="flex items-center gap-8">
          <div className="text-center group">
            <p className="text-3xl font-black text-emerald-600">
              {students.filter(s => attendance[s.id] === 'P').length}
            </p>
            <p className="text-[10px] font-black text-[#636e72] uppercase tracking-[0.2em] mt-1">Present</p>
          </div>
          <div className="w-px h-10 bg-neutral-200"></div>
          <div className="text-center group">
            <p className="text-3xl font-black text-rose-600">
              {students.filter(s => attendance[s.id] === 'A').length}
            </p>
            <p className="text-[10px] font-black text-[#636e72] uppercase tracking-[0.2em] mt-1">Absent</p>
          </div>
          <div className="w-px h-10 bg-neutral-200"></div>
          <div className="text-center group">
            <p className="text-3xl font-black text-amber-600">
              {students.filter(s => attendance[s.id] === 'L').length}
            </p>
            <p className="text-[10px] font-black text-[#636e72] uppercase tracking-[0.2em] mt-1">Late</p>
          </div>
        </div>
        <div className="pt-4 border-t border-neutral-200 w-full text-center">
            <p className="text-[10px] font-bold text-[#57534e] uppercase tracking-widest leading-loose">
              Document Scope: {Object.keys(attendance).filter(id => students.some(s => s.id === id)).length} / {students.length} Records Marked
            </p>
        </div>
      </div>
    </div>
  );
}
