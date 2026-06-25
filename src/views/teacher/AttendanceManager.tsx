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
  AlertCircle,
  ArrowRight,
  Plus
} from 'lucide-react';
import { supabaseStorage } from '../../lib/supabaseStorage';
import { createClient } from '../../../utils/supabase/client';

const supabase = createClient();

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
  const [error, setError] = useState<string | null>(null);
  
  // Selection Mode State
  const [isSelectingDate, setIsSelectingDate] = useState(true);
  const [selDay, setSelDay] = useState(new Date().getDate().toString());
  const [selMonth, setSelMonth] = useState((new Date().getMonth() + 1).toString());
  const [selYear, setSelYear] = useState(new Date().getFullYear().toString());

  // Add Student State
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentClass, setNewStudentClass] = useState(userClass || '');
  const [newStudentSection, setNewStudentSection] = useState(userSection || '');
  const [isAddingLoading, setIsAddingLoading] = useState(false);

  useEffect(() => {
    if (userClass) setNewStudentClass(userClass);
    if (userSection) setNewStudentSection(userSection);
  }, [userClass, userSection]);

  const getReconstructedDate = () => {
    const d = selDay.padStart(2, '0');
    const m = selMonth.padStart(2, '0');
    return `${selYear}-${m}-${d}`;
  };

  const isEditable = () => {
    const selectedDateStr = getReconstructedDate();
    const selectedDate = new Date(selectedDateStr);
    const now = new Date();
    // Use reset hours for comparing dates only
    const selectedMidnight = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffInDays = Math.abs((nowMidnight.getTime() - selectedMidnight.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays <= 1; // Within 1 day (today or yesterday)
  };

  const fetchStudentsAndAttendance = async () => {
    setLoading(true);
    setAttendance({});
    setIsSubmitted(false);
    setError(null);
    const targetDate = getReconstructedDate();

    try {
      let fetchedStudents: Student[] = [];
      const data = await supabaseStorage.getStudents(userClass || '', userSection || '');
      fetchedStudents = data.map(s => ({
        id: s.id,
        fullName: s.name
      }));
      
      if (fetchedStudents.length === 0) {
        setError(`No students found for Class ${userClass}-${userSection}.`);
        setLoading(false);
        return;
      }

      const uniqueStudents = Array.from(new Map(fetchedStudents.map(s => [s.id, s])).values());
      uniqueStudents.sort((a, b) => a.fullName.localeCompare(b.fullName));
      setStudents(uniqueStudents);

      // 2. Fetch Attendance for the target date
      const attRow = await supabaseStorage.getAttendance(userClass || '', userSection || '', targetDate);
      if (attRow) {
        const savedRecords = attRow.records || {};
        const validRecords: AttendanceRecord = {};
        uniqueStudents.forEach(s => {
          if (savedRecords[s.id]) validRecords[s.id] = savedRecords[s.id];
        });
        setAttendance(validRecords);
        setIsSubmitted(true);
      }
      
      setIsSelectingDate(false);
    } catch (err: any) {
      console.error("Fetch failed:", err);
      setError(err.message || "Access denied or database error.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newStudentName.trim()) return;
    setIsAddingLoading(true);
    try {
      const selectedClass = (newStudentClass || '').trim().toUpperCase();
      const selectedSection = (newStudentSection || '').trim().toUpperCase();

      await supabaseStorage.addStudent(
        newStudentName.trim(),
        selectedClass,
        selectedSection
      );

      alert('Student added successfully!');
      setNewStudentName('');
      setError(null);
      // Refresh local list/view
      await fetchStudentsAndAttendance();
    } catch (err: any) {
      console.error("Failed to add student:", err);
      alert(`Failed to add student: ${err.message || 'Unknown error'}`);
    } finally {
      setIsAddingLoading(false);
    }
  };

  const markAttendance = (studentId: string, status: 'P' | 'A' | 'L') => {
    if (isSubmitted || !isEditable()) return;
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const formattedDate = getReconstructedDate();

      const filteredRecords = students.reduce((acc, s) => {
        acc[s.id] = attendance[s.id] || 'A';
        return acc;
      }, {} as AttendanceRecord);

      let savedToCloud = true;
      let dbErrorMessage = '';
      try {
        await supabaseStorage.saveAttendance(
          userClass || '',
          userSection || '',
          formattedDate,
          filteredRecords
        );
      } catch (dbErr: any) {
        console.error('Cloud database save failed, fallback used:', dbErr);
        savedToCloud = false;
        dbErrorMessage = dbErr?.message || JSON.stringify(dbErr);
      }

      if (savedToCloud) {
        alert('Attendance saved successfully to database!');
      } else {
        alert(`Attendance saved to local cache. (Database save failed: ${dbErrorMessage})`);
      }
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Submission failed:', err);
      alert(`Submission failed: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (isSelectingDate) {
    return (
      <div className="max-w-xl mx-auto py-6 sm:py-12 px-4 sm:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 sm:p-10 rounded-3xl sm:rounded-[3.5rem] space-y-8 sm:space-y-12 shadow-2xl"
        >
          <header className="flex flex-col items-center text-center gap-4">
             <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-primary backdrop-blur-sm border border-primary/10 shadow-inner">
               <Calendar className="w-8 h-8 sm:w-10 sm:h-10" />
             </div>
             <div>
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tighter text-primary">Class Attendance</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent mt-2">Class {userClass}-{userSection}</p>
             </div>
          </header>

          <div className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-3 gap-3 sm:gap-6">
              <div className="space-y-2">
                <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted ml-1 sm:ml-3">Day</label>
                <select 
                  value={selDay}
                  onChange={e => setSelDay(e.target.value)}
                  className="w-full bg-white/50 border border-white/40 p-3 sm:p-5 rounded-xl sm:rounded-3xl focus:border-accent outline-none font-bold text-center text-sm sm:text-lg backdrop-blur-sm"
                >
                  {Array.from({length: 31}, (_, i) => (i + 1).toString()).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted ml-1 sm:ml-3">Month</label>
                <select 
                  value={selMonth}
                  onChange={e => setSelMonth(e.target.value)}
                  className="w-full bg-white/50 border border-white/40 p-3 sm:p-5 rounded-xl sm:rounded-3xl focus:border-accent outline-none font-bold text-center text-sm sm:text-lg backdrop-blur-sm"
                >
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => (
                    <option key={m} value={(idx + 1).toString()}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted ml-1 sm:ml-3">Year</label>
                <select 
                  value={selYear}
                  onChange={e => setSelYear(e.target.value)}
                  className="w-full bg-white/50 border border-white/40 p-3 sm:p-5 rounded-xl sm:rounded-3xl focus:border-accent outline-none font-bold text-center text-sm sm:text-lg backdrop-blur-sm"
                >
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y.toString()}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 text-red-600 p-4 rounded-xl sm:rounded-2xl flex items-center gap-3 border border-red-100"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={fetchStudentsAndAttendance}
              disabled={loading}
              className="w-full bg-primary text-white py-4 sm:py-6 rounded-2xl sm:rounded-3xl font-bold uppercase text-[10px] sm:text-[11px] tracking-[0.4em] shadow-2xl shadow-primary/20 flex items-center justify-center gap-4 hover:bg-primary-dark transition-all disabled:opacity-50"
            >
              {loading ? <RotateCcw className="w-5 h-5 animate-spin text-accent" /> : <ClipboardList className="w-5 h-5 text-accent" />}
              {loading ? 'Loading...' : 'Open Attendance'}
            </button>
            
            {onBack && (
              <button
                 onClick={onBack}
                 className="w-full bg-white/50 text-muted py-3 sm:py-5 rounded-2xl sm:rounded-3xl font-bold uppercase text-[9px] sm:text-[10px] tracking-[0.3em] border border-white/40 backdrop-blur-sm"
              >
                Go Back
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-[#0066CC] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#0066CC] font-black text-xs uppercase tracking-widest tracking-[0.2em]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => setIsSelectingDate(true)}
            className="p-3 bg-white/50 hover:bg-white rounded-2xl transition-all border border-white/40 shadow-sm"
          >
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-accent uppercase tracking-[0.3em]">Selected Date</span>
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h1 className="text-4xl font-bold tracking-tighter text-primary">{getReconstructedDate()}</h1>
            <p className="text-muted font-bold text-[10px] uppercase tracking-widest mt-1">
               Class: {userClass}-{userSection}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {!isEditable() ? (
            <div className="flex items-center gap-2 bg-white/40 backdrop-blur-sm px-6 py-4 rounded-[2rem] font-bold text-[10px] uppercase tracking-widest border border-white/20 text-muted">
              <Lock className="w-4 h-4 text-accent" />
              Locked (Past 24h)
            </div>
          ) : isSubmitted ? (
            <button
              onClick={() => setIsSubmitted(false)}
              className="flex items-center gap-3 bg-white/60 hover:bg-white px-8 py-4 rounded-[2rem] font-bold text-[10px] uppercase tracking-widest transition-all border border-white shadow-sm text-primary"
            >
              <Edit3 className="w-4 h-4 text-accent" />
              Edit
            </button>
          ) : (
            <button
              onClick={saveAttendance}
              disabled={saving}
              className="flex items-center gap-3 bg-primary text-white px-10 py-5 rounded-[2.5rem] font-bold text-[10px] uppercase tracking-[0.3em] hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
            >
              {saving ? <RotateCcw className="w-4 h-4 animate-spin text-accent" /> : <Save className="w-4 h-4 text-accent" />}
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          )}
        </div>
      </div>

      {!isEditable() && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 glass-panel bg-amber-500/5 border-amber-500/20 p-6 rounded-[2rem] flex items-center gap-4"
        >
           <AlertCircle className="w-6 h-6 text-amber-600" />
           <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 leading-relaxed">
             Warning: Past records cannot be changed.
           </p>
        </motion.div>
      )}

      <div className="glass-panel rounded-[2rem] sm:rounded-[3.5rem] overflow-hidden">
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-white/20 flex justify-between items-center bg-white/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-muted uppercase tracking-[0.3em]">Student List</span>
            {!isAddingStudent && (
              <button
                onClick={() => setIsAddingStudent(true)}
                className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 active:scale-95 cursor-pointer animate-fade-in"
              >
                <Plus className="w-3 h-3" />
                Add Student
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-accent" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">{students.length} Students</span>
          </div>
        </div>
        <AnimatePresence>
          {isAddingStudent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden bg-white/50 border-b border-white/10"
            >
              <form onSubmit={handleAddStudent} className="px-4 sm:px-8 py-6 flex flex-col gap-4">
                <div className="text-xs font-bold uppercase tracking-wider text-muted mb-1">Add New Student Profile</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Name field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      placeholder="Enter student's full name"
                      className="w-full bg-white/80 border border-white/60 px-4 py-2.5 rounded-xl font-medium text-sm focus:border-accent outline-none text-primary"
                      autoFocus
                      disabled={isAddingLoading}
                    />
                  </div>

                  {/* Class field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Class (Grade)</label>
                    <input
                      type="text"
                      value={newStudentClass}
                      onChange={(e) => setNewStudentClass(e.target.value)}
                      placeholder="e.g. IX"
                      className="w-full bg-white/80 border border-white/60 px-4 py-2.5 rounded-xl font-medium text-sm focus:border-accent outline-none text-primary"
                      disabled={isAddingLoading}
                    />
                  </div>

                  {/* Section field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Section</label>
                    <input
                      type="text"
                      value={newStudentSection}
                      onChange={(e) => setNewStudentSection(e.target.value)}
                      placeholder="e.g. A"
                      className="w-full bg-white/80 border border-white/60 px-4 py-2.5 rounded-xl font-medium text-sm focus:border-accent outline-none text-primary"
                      disabled={isAddingLoading}
                    />
                  </div>
                </div>

                <div className="flex justify-end items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingStudent(false);
                      setNewStudentName('');
                    }}
                    className="px-4 py-2.5 bg-white/50 hover:bg-white text-muted border border-white/60 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                    disabled={isAddingLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingLoading || !newStudentName.trim() || !newStudentClass.trim() || !newStudentSection.trim()}
                    className="px-6 py-2.5 bg-primary text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    {isAddingLoading ? 'Saving...' : 'Add Student'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="divide-y divide-white/10">
          {students.map((student, idx) => (
            <motion.div 
              key={student.id} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/30 transition-colors group"
            >
              <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center text-primary font-bold text-lg sm:text-xl border border-primary/5 transition-all shadow-inner shrink-0">
                  {student.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-primary text-base sm:text-lg tracking-tight">{student.fullName}</h4>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto justify-end">
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
                      w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all relative shrink-0
                      ${attendance[student.id] === opt.value 
                        ? `${opt.color} text-white shadow-lg scale-105 sm:scale-110 border-transparent` 
                        : 'bg-white/40 text-muted border border-white/60 hover:border-accent hover:text-accent'}
                      ${(isSubmitted || !isEditable()) ? 'cursor-not-allowed opacity-40' : 'cursor-pointer active:scale-90'}
                    `}
                  >
                    {opt.value}
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mx-4 glass-panel p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-10">
        <div className="flex items-center gap-6 sm:gap-11">
          <div className="text-center">
            <p className="text-2xl sm:text-4xl font-bold tracking-tighter text-emerald-500">
              {students.filter(s => attendance[s.id] === 'P').length}
            </p>
            <p className="text-[9px] sm:text-[10px] font-bold text-muted uppercase tracking-[0.2em] mt-1 sm:mt-2">Present</p>
          </div>
          <div className="w-px h-10 sm:h-12 bg-white/20" />
          <div className="text-center">
            <p className="text-2xl sm:text-4xl font-bold tracking-tighter text-rose-500">
              {students.filter(s => attendance[s.id] === 'A').length}
            </p>
            <p className="text-[9px] sm:text-[10px] font-bold text-muted uppercase tracking-[0.2em] mt-1 sm:mt-2">Absent</p>
          </div>
          <div className="w-px h-10 sm:h-12 bg-white/20" />
          <div className="text-center">
            <p className="text-2xl sm:text-4xl font-bold tracking-tighter text-amber-500">
              {students.filter(s => attendance[s.id] === 'L').length}
            </p>
            <p className="text-[9px] sm:text-[10px] font-bold text-muted uppercase tracking-[0.2em] mt-1 sm:mt-2">Late</p>
          </div>
        </div>
      </div>
    </div>
  );
}
