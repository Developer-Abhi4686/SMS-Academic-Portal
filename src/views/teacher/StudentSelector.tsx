import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, RotateCcw, UserCircle, Edit3, Check, ArrowLeft, Plus, X, Trash2, Search } from 'lucide-react';
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

const CLASSES = [
  'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'
];

export default function StudentSelector({ onBack, defaultClass, defaultSection }: StudentSelectorProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [calledIds, setCalledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  
  // Filter state
  const [filterClass, setFilterClass] = useState(defaultClass || 'X');
  const [filterSection, setFilterSection] = useState(defaultSection || 'A');

  const fetchStudents = async () => {
    setLoading(true);
    setCalledIds(new Set()); // Reset called list on filter change
    try {
      let fetchedStudents: Student[] = [];
      
      const studentsList = await supabaseStorage.getStudents(filterClass, filterSection);
      fetchedStudents = studentsList.map(s => ({
        id: s.id,
        fullName: s.name
      }));
      
      // Filter out ABSENT students based on today's attendance
      try {
        const today = new Date().toISOString().split('T')[0];
        const attDoc = await supabaseStorage.getAttendance(filterClass, filterSection, today);
        if (attDoc) {
          const records = attDoc.records || {};
          // If attendance is marked for this class, strictly only show Present or Late
          if (Object.keys(records).length > 0) {
            fetchedStudents = fetchedStudents.filter(s => {
              const status = records[s.id];
              return status === 'P' || status === 'L';
            });
          }
        }
      } catch (e) {
        console.warn("Could not fetch today's attendance for filtering:", e);
      }

      // Sort alphabetically
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
  }, [filterClass, filterSection]);

  const filteredStudents = students.filter(student => 
    student.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = () => {
    if (students.length === 0) return;

    // Determine remaining students
    let remaining = students.filter(s => !calledIds.has(s.id));
    
    // If everyone was called, reset the cycle
    if (remaining.length === 0) {
      setCalledIds(new Set());
      remaining = [...students];
    }

    setIsSpinning(true);
    setSelectedIdx(null);
    
    let count = 0;
    const interval = setInterval(() => {
      // During animation, we can show any student for effect
      setSelectedIdx(Math.floor(Math.random() * students.length));
      count++;
      
      if (count > 20) {
        clearInterval(interval);
        
        // Pick final from remaining list
        const luckyStudent = remaining[Math.floor(Math.random() * remaining.length)];
        const luckyIdx = students.findIndex(s => s.id === luckyStudent.id);
        
        setSelectedIdx(luckyIdx);
        setCalledIds(prev => {
          const next = new Set(prev);
          next.add(luckyStudent.id);
          return next;
        });
        setIsSpinning(false);
      }
    }, 100);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    try {
      const student = await supabaseStorage.addStudent(
        newStudentName.trim(),
        filterClass,
        filterSection
      );
      
      const newStudent: Student = {
        id: student.id,
        fullName: student.name
      };
      setStudents(prev => [...prev, newStudent].sort((a, b) => a.fullName.localeCompare(b.fullName)));
    } catch (err) {
      console.error("Failed to insert student into Supabase:", err);
      // Fallback local insert
      const newStudent: Student = {
        id: `manual-${Date.now()}`,
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
      console.error("Error executing delete command in Supabase:", err);
    }
    setStudents(prev => prev.filter(s => s.id !== id));
    if (selectedIdx !== null && students[selectedIdx]?.id === id) {
      setSelectedIdx(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-[#0066CC] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#0066CC] font-black text-xs uppercase tracking-widest">Accessing Student Database...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 text-[#0066CC] hover:bg-black/5 rounded-xl transition-colors"
            title="Go Back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="p-3 rounded-2xl bg-black/5 text-[#0066CC] border border-neutral-200">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#0066CC] uppercase tracking-tight">Student Selector</h1>
            <p className="text-[#57534e] font-bold text-xs uppercase tracking-widest">
              {students.length} Students Active
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-[#0066CC] text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#0055B3] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      <div className="bg-black/5 p-4 rounded-2xl border border-[#0066CC]/10 flex flex-wrap gap-4 items-end mb-6">
        <div className="flex-1 min-w-[300px] w-full mb-2">
          <label className="block text-[10px] font-black text-[#0066CC] uppercase tracking-widest mb-2 pl-1">Search Student</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#57534e]" />
            <input 
              type="text"
              placeholder="Type student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#dee2e6] rounded-xl pl-11 pr-4 py-2 font-bold text-[#0066CC] focus:ring-2 ring-[#0066CC]/20 outline-none"
            />
          </div>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-[10px] font-black text-[#0066CC] uppercase tracking-widest mb-2 pl-1">Target Class</label>
          <select 
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="w-full bg-white border border-[#dee2e6] rounded-xl px-4 py-2 font-bold text-[#0066CC] focus:ring-2 ring-[#0066CC]/20 outline-none appearance-none cursor-pointer"
          >
            {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-[10px] font-black text-[#0066CC] uppercase tracking-widest mb-2 pl-1">Target Section</label>
          <select 
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="w-full bg-white border border-[#dee2e6] rounded-xl px-4 py-2 font-bold text-[#0066CC] focus:ring-2 ring-[#0066CC]/20 outline-none appearance-none cursor-pointer"
          >
            {['A', 'B', 'C', 'D', 'E'].map(sec => <option key={sec} value={sec}>{sec}</option>)}
          </select>
        </div>
        <button 
          onClick={fetchStudents}
          className="p-3 bg-white border border-[#dee2e6] rounded-xl text-[#0066CC] hover:bg-white/80 transition-colors"
          title="Refresh List"
        >
          <RotateCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <form onSubmit={handleAddStudent} className="bg-white p-6 rounded-2xl border-2 border-[#0066CC] flex gap-3">
              <input
                autoFocus
                type="text"
                placeholder="Enter Student Full Name"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                className="flex-1 bg-[#f8f9fa] border-none rounded-xl px-4 py-2 font-bold text-[#0066CC] focus:ring-2 ring-[#0066CC]/20 outline-none"
              />
              <button
                type="submit"
                className="bg-[#0066CC] text-white px-6 rounded-xl font-bold uppercase text-xs"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="p-2 text-[#636e72] hover:text-red-500"
              >
                <X className="w-6 h-6" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredStudents.map((student, idx) => (
          <motion.div
            key={student.id}
            animate={{
              scale: selectedIdx === idx ? 1.05 : 1,
              backgroundColor: selectedIdx === idx ? '#f5f5f7' : '#ffffff',
              borderColor: selectedIdx === idx ? '#0066CC' : '#e9ecef'
            }}
            className="p-6 rounded-2xl border flex flex-col items-center gap-4 group relative overflow-hidden shadow-sm"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${selectedIdx === idx ? 'bg-[#0066CC] text-white' : 'bg-[#fdfcfb] text-[#0066CC] border border-[#dee2e6]'} ${calledIds.has(student.id) && selectedIdx !== idx ? 'opacity-40' : ''}`}>
              <UserCircle className="w-8 h-8" />
            </div>

            <div className="flex flex-col items-center gap-1">
              <span className={`font-extrabold text-[#1a1a1a] text-base transition-opacity ${calledIds.has(student.id) && selectedIdx !== idx ? 'opacity-40' : ''}`}>
                {student.fullName}
              </span>
              {calledIds.has(student.id) && selectedIdx !== idx && (
                <span className="text-[9px] font-black text-[#636e72] uppercase tracking-tighter">Called</span>
              )}
            </div>
            
            <button
              onClick={() => removeStudent(student.id)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Remove from list"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {selectedIdx === idx && !isSpinning && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-2 left-2 bg-[#00b8d4] rounded-full p-1 border-2 border-white shadow-sm"
              >
                <Check className="w-4 h-4 text-white font-black" />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <button
        onClick={handleSelect}
        disabled={isSpinning || students.length === 0}
        className="w-full bg-gradient-to-r from-[#0066CC] to-[#0055B3] hover:opacity-90 text-white py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-lg uppercase tracking-widest shadow-lg transition-all disabled:opacity-50"
      >
        <RotateCcw className={`w-6 h-6 ${isSpinning ? 'animate-spin' : ''}`} />
        {isSpinning ? 'Selecting...' : 'Select Student'}
      </button>

      {selectedIdx !== null && !isSpinning && students[selectedIdx] && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8 bg-black/5 border border-neutral-200 rounded-2xl"
        >
          <p className="text-[#0066CC] text-[10px] uppercase tracking-widest font-black mb-1">Selected Student</p>
          <h3 className="text-3xl font-black text-[#0066CC] uppercase">{students[selectedIdx].fullName}</h3>
          <p className="text-[#57534e] font-bold text-xs mt-2 uppercase">Ready to answer your question!</p>
        </motion.div>
      )}
    </div>
  );
}
