import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ClipboardList, RotateCcw, ArrowLeft, Check, Save, UserCheck, Edit3 } from 'lucide-react';
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
  const [today] = useState(new Date().toISOString().split('T')[0]);

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
          <div className="p-3 rounded-2xl bg-[#e3f2fd] text-[#1565c0] border border-[#bbdefb]">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#1a237e] uppercase tracking-tight">Attendance</h1>
            <p className="text-[#636e72] font-bold text-xs uppercase tracking-widest">
              Daily Registry • {today}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isSubmitted ? (
            <button
              onClick={() => setIsSubmitted(false)}
              className="flex items-center gap-2 bg-[#f0f2ff] text-[#1a237e] px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#e0e4ff] transition-all border border-[#1a237e]/10 shadow-sm"
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
            <div key={student.id} className="p-4 flex items-center justify-between hover:bg-[#f8f9fa] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#f0f2ff] flex items-center justify-center text-[#1a237e] font-black text-xs border border-[#1a237e]/10">
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
    </div>
  );
}
