import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, RotateCcw, UserCircle, Check, ArrowLeft, 
  Plus, X, Trash2, Search, Sparkles, Star, RefreshCw,
  UserPlus, Play, Trophy, HelpCircle
} from 'lucide-react';
import { supabaseStorage } from '../../lib/supabaseStorage';

interface Student {
  id: string;
  fullName: string;
}

interface StudentSelectorProps {
  onBack?: () => void;
  defaultClass?: string | null;
  defaultSection?: string | null;
}

// Deterministic soft powder blue / cyan shade generator based on student name strings
const getPastelColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const lightness = 92 + (Math.abs(hash) % 4); // 92% to 95% light
  const hue = 195 + (Math.abs(hash) % 20); // 195 to 215 (soft ocean / powder blue range)
  return `hsl(${hue}, 85%, ${lightness}%)`;
};

const getDeepColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = 195 + (Math.abs(hash) % 20);
  return `hsl(${hue}, 80%, 25%)`;
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function StudentSelector({ onBack, defaultClass, defaultSection }: StudentSelectorProps) {
  // Use the passed class/section or default constants
  const teacherClass = defaultClass || 'X';
  const teacherSection = defaultSection || 'A';

  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [calledIds, setCalledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [flashName, setFlashName] = useState<string>('');

  const fetchStudents = async () => {
    setLoading(true);
    setCalledIds(new Set()); // Reset session called roster
    setSelectedIdx(null);
    setFlashName('');
    try {
      let fetchedStudents: Student[] = [];
      const studentsList = await supabaseStorage.getStudents(teacherClass, teacherSection);
      fetchedStudents = studentsList.map(s => ({
        id: s.id,
        fullName: s.name
      }));
      
      // Filter out absent students from today's attendance checks for fair play
      try {
        const today = new Date().toISOString().split('T')[0];
        const attDoc = await supabaseStorage.getAttendance(teacherClass, teacherSection, today);
        if (attDoc) {
          const records = attDoc.records || {};
          if (Object.keys(records).length > 0) {
            fetchedStudents = fetchedStudents.filter(s => {
              const status = records[s.id];
              return status === 'P' || status === 'L';
            });
          }
        }
      } catch (e) {
        console.warn("Could not fetch today's attendance list:", e);
      }

      fetchedStudents.sort((a, b) => a.fullName.localeCompare(b.fullName));
      setStudents(fetchedStudents);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [teacherClass, teacherSection]);

  const filteredStudents = students.filter(student => 
    student.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = () => {
    if (students.length === 0) return;

    let remaining = students.filter(s => !calledIds.has(s.id));
    if (remaining.length === 0) {
      setCalledIds(new Set());
      remaining = [...students];
    }

    setIsSpinning(true);
    setSelectedIdx(null);
    
    let tickerCount = 0;
    const tickerLimit = 20;
    
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * students.length);
      const randomPupil = students[randomIdx];
      setFlashName(randomPupil.fullName);
      
      tickerCount++;
      
      if (tickerCount >= tickerLimit) {
        clearInterval(interval);
        
        const luckyStudent = remaining[Math.floor(Math.random() * remaining.length)];
        const luckyIdx = students.findIndex(s => s.id === luckyStudent.id);
        
        setSelectedIdx(luckyIdx);
        setFlashName(luckyStudent.fullName);
        setCalledIds(prev => {
          const next = new Set(prev);
          next.add(luckyStudent.id);
          return next;
        });
        setIsSpinning(false);
      }
    }, 90);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    try {
      const student = await supabaseStorage.addStudent(
        newStudentName.trim(),
        teacherClass,
        teacherSection
      );
      
      const newStudent: Student = {
        id: student.id,
        fullName: student.name
      };
      setStudents(prev => [...prev, newStudent].sort((a, b) => a.fullName.localeCompare(b.fullName)));
    } catch (err) {
      console.error("Failed to insert student into database:", err);
      // Fallback local representation
      const newStudent: Student = {
        id: `local-${Date.now()}`,
        fullName: newStudentName.trim()
      };
      setStudents(prev => [...prev, newStudent].sort((a, b) => a.fullName.localeCompare(b.fullName)));
    }

    setNewStudentName('');
    setShowAddForm(false);
  };

  const removeStudent = async (id: string) => {
    try {
      await supabaseStorage.deleteStudent(id);
    } catch (err) {
      console.error("Error executing delete command:", err);
    }
    setStudents(prev => prev.filter(s => s.id !== id));
    if (selectedIdx !== null && students[selectedIdx]?.id === id) {
      setSelectedIdx(null);
    }
  };

  const resetRosterCycle = () => {
    setCalledIds(new Set());
    setSelectedIdx(null);
    setFlashName('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 selection:bg-sky-100/80">
      
      {/* TOP HEADER STATUS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 text-neutral-500 hover:text-slate-950 hover:bg-slate-100 rounded-full transition-all duration-200 cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase font-sans">
              Student Selector
            </h1>
            <p className="text-slate-400 font-mono font-bold text-[9px] uppercase tracking-wider mt-1.5">
              Class {teacherClass}-{teacherSection} · {students.length} Pupils Synced
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={resetRosterCycle}
            disabled={calledIds.size === 0}
            className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Cycle
          </button>
        </div>
      </div>

      {/* DUAL PARTITION SYSTEM CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* PARTITION 1: CLASS ROSTER DIRECTORY & SPOTLIGHT (LEFT SIDE OVERVIEW) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
              Class Roster List ({filteredStudents.length})
            </h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-xs font-black text-sky-600 hover:text-sky-700 flex items-center gap-1 uppercase tracking-wider transition-colors cursor-pointer"
            >
              {showAddForm ? <X className="w-3 h-3" /> : <Plus className="w-3.5 h-3.5" />}
              {showAddForm ? 'Close' : 'Add Name'}
            </button>
          </div>

          {/* Quick Register Foldout Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddStudent}
                className="overflow-hidden bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2.5"
              >
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Register New Candidate</div>
                <input
                  type="text"
                  placeholder="e.g. Richard Feynman"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-sky-300 rounded-lg px-3 py-1.5 font-bold text-xs text-slate-800 outline-none transition-all"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newStudentName.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-black uppercase tracking-wider text-[9px] py-2.5 rounded-lg transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                >
                  Confirm Registration
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Filter names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-transparent focus:border-slate-300 rounded-xl pl-9 pr-8 py-2 font-bold text-xs text-slate-700 outline-none transition-all duration-200"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Roster scrollable pane */}
          <div className="max-h-[300px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar dropdown-scroll">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
                <p className="font-mono text-[8.5px] uppercase tracking-wider">Syncing roster database...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-slate-400 border border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">No students correspond to query</p>
              </div>
            ) : (
              filteredStudents.map((student) => {
                const studentListIdx = students.findIndex(s => s.id === student.id);
                const isSelected = selectedIdx === studentListIdx;
                const hasBeenCalled = calledIds.has(student.id);
                
                const avatarBg = getPastelColor(student.fullName);
                const avatarTextColor = getDeepColor(student.fullName);

                return (
                  <motion.div
                    key={student.id}
                    whileHover={{ scale: 1.01, x: 2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      if (!isSpinning) {
                        setSelectedIdx(studentListIdx);
                      }
                    }}
                    className={`p-2 rounded-xl border flex items-center gap-3 relative cursor-pointer select-none transition-all group ${
                      isSelected 
                        ? 'border-sky-300 bg-sky-50/30 shadow-sm ring-1 ring-sky-300/10' 
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    {/* Compact Circle Avatar */}
                    <div 
                      style={{ backgroundColor: avatarBg, color: avatarTextColor }}
                      className="w-7 h-7 rounded bg-sky-50 flex items-center justify-center font-black text-[9px] uppercase shadow-sm shrink-0 relative"
                    >
                      {getInitials(student.fullName)}
                      {hasBeenCalled && !isSelected && (
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center border border-white text-[8px] font-bold shadow-sm">
                          ✓
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <h4 className={`font-bold text-slate-800 text-[10.5px] truncate uppercase tracking-tight transition-all duration-150 ${
                        hasBeenCalled && !isSelected ? 'opacity-35 line-through text-slate-400' : ''
                      }`}>
                        {student.fullName}
                      </h4>
                    </div>

                    {/* Left Checked marker */}
                    {isSelected && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-sky-50 text-sky-600 rounded-full p-0.5 border border-sky-100">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                    )}

                    {/* Trash on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Remove ${student.fullName} permanently from Class ${teacherClass}-${teacherSection}?`)) {
                          removeStudent(student.id);
                        }
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all cursor-pointer"
                      title="Deregister pupil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* SPOTLIGHT SCREEN: APPEARS ONLY BELOW THE LIST IN THE LEFT PARTITION */}
          <div className="pt-4 border-t border-slate-100">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span className="font-extrabold uppercase text-[9px] tracking-wider text-slate-400">Session Called Roster</span>
              <span className="font-mono font-black text-indigo-600 bg-indigo-50/70 border border-indigo-100/50 px-2.5 py-0.5 rounded-full">
                {calledIds.size} / {students.length} Called
              </span>
            </div>
          </div>
        </div>

        {/* PARTITION 2: RAPID SELECTOR STAGE (RIGHT MAIN SPACE) - MINIMAL ROLL BUTTON & RESULT */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] p-6 flex flex-col items-center justify-center min-h-[320px] relative overflow-hidden">
          {/* Subtle gradient bar decoration */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-400 via-sky-400 to-purple-400" />
          
          <div className="relative z-10 w-full flex flex-col items-center justify-center space-y-6">
            <div className="text-center space-y-1">
              <span className="inline-block text-[9px] text-indigo-600 font-mono font-black uppercase tracking-[0.2em] bg-indigo-50 px-2.5 py-0.5 rounded-full">
                Raffle Loader
              </span>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
                Spotlight Candidate
              </p>
            </div>

            {/* Crucial Single Select Button - Minimalist and easy click */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSelect}
              disabled={isSpinning || students.length === 0}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-black uppercase tracking-[0.15em] text-[10.5px] flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer transition-all border border-indigo-500/20"
            >
              {isSpinning ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-white text-transparent stroke-white" />
              )}
              <span>{isSpinning ? 'Rolling...' : 'Roll'}</span>
            </motion.button>
            
            {/* Show decision result immediately under the button */}
            <div className="w-full pt-1">
              <AnimatePresence mode="wait">
                {isSpinning ? (
                  <motion.div
                    key="rolling-inner"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center space-y-1"
                  >
                    <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-500 animate-pulse block">
                      Selecting...
                    </span>
                    <h5 className="text-sm font-black text-slate-700 uppercase truncate">
                      {flashName || 'Waiting...'}
                    </h5>
                  </motion.div>
                ) : selectedIdx !== null && students[selectedIdx] ? (
                  <motion.div
                    key="chosen-inner"
                    initial={{ opacity: 0, scale: 0.98, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className="p-4.5 bg-gradient-to-tr from-indigo-50 via-indigo-50/50 to-purple-50/30 border border-indigo-100/60 rounded-xl text-center space-y-1.5 relative overflow-hidden shadow-sm"
                  >
                    <div className="flex justify-center gap-1 text-indigo-500">
                      <Sparkles className="w-3 h-3 fill-indigo-200/50" />
                      <Trophy className="w-3.5 h-3.5 fill-indigo-200/50 text-indigo-600" />
                      <Sparkles className="w-3 h-3 fill-indigo-200/50" />
                    </div>
                    <div>
                      <span className="inline-block text-[8px] text-indigo-600 font-extrabold uppercase tracking-widest bg-white border border-indigo-100 px-2 py-0.5 rounded-full mb-1">
                        Chosen Pupil
                      </span>
                      <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                        {students[selectedIdx].fullName}
                      </h4>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-4 bg-slate-50/50 border border-dashed border-slate-200/60 rounded-xl text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">No Student Selected</p>
                    <p className="text-[8px] text-slate-400 font-medium normal-case mt-0.5">Click "Roll" to select a random name dynamically.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            <div className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-wider text-center pt-2">
              Grade {teacherClass}-{teacherSection} Code-Roster
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
