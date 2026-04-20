import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, RotateCcw, UserCircle, Edit3, Check, ArrowLeft, Plus, X, Trash2, Search } from 'lucide-react';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserProfile } from '../../types';

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
  'Nursery', 'LKG', 'UKG', 
  'I', 'II', 'III', 'IV', 'V', 
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
      
      // Dynamic collection check based on class and section
      const romanToArabic: Record<string, string> = {
        'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5',
        'VI': '6', 'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10',
        'XI': '11', 'XII': '12'
      };

      const arabicClass = romanToArabic[filterClass] || filterClass;
      const customCollectionName = `students_${arabicClass}${filterSection}`;

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
        console.warn(`Collection ${customCollectionName} fetch failed or empty, falling back...`);
      }

      // Fallback to standard users collection if no students found in class-specific collection
      if (fetchedStudents.length === 0) {
        const q = query(
          collection(db, 'users'), 
          where('role', '==', 'student'),
          where('userClass', '==', filterClass),
          where('section', '==', filterSection)
        );
        const querySnapshot = await getDocs(q);
        fetchedStudents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          fullName: (doc.data() as UserProfile).fullName
        }));
      }
      
      // Filter out ABSENT students based on today's attendance
      // NOTE: Only hides marked absents. If attendance isn't marked, attDoc won't exist or records will be empty.
      try {
        const today = new Date().toISOString().split('T')[0];
        const docId = `${filterClass}_${filterSection}_${today}`;
        const attDoc = await getDoc(doc(db, 'attendance', docId));
        if (attDoc.exists()) {
          const data = attDoc.data();
          const records = data.records || {};
          // Only filter if there are actually records marked
          if (Object.keys(records).length > 0) {
            fetchedStudents = fetchedStudents.filter(s => records[s.id] !== 'A');
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

    const newStudent: Student = {
      id: `manual-${Date.now()}`,
      fullName: newStudentName.trim()
    };

    setStudents(prev => [...prev, newStudent]);
    setNewStudentName('');
    setShowAddForm(false);
    // Note: In a production app, we would sync this to a specific "Students" collection
    // but for this portal, manual additions are kept in the session state for safety.
  };

  const removeStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    if (selectedIdx !== null && students[selectedIdx]?.id === id) {
      setSelectedIdx(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-[#1a237e] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#1a237e] font-black text-xs uppercase tracking-widest">Accessing Student Database...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 text-[#1a237e] hover:bg-[#f0f2ff] rounded-xl transition-colors"
            title="Go Back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="p-3 rounded-2xl bg-[#f0f2ff] text-[#1a237e] border border-[#e9ecef]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#1a237e] uppercase tracking-tight">Student Selector</h1>
            <p className="text-[#636e72] font-bold text-xs uppercase tracking-widest">
              {students.length} Students in List
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-[#1a237e] text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#283593] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      <div className="bg-[#f0f2ff] p-4 rounded-2xl border border-[#1a237e]/10 flex flex-wrap gap-4 items-end mb-6">
        <div className="flex-1 min-w-[300px] w-full mb-2">
          <label className="block text-[10px] font-black text-[#1a237e] uppercase tracking-widest mb-2 pl-1">Search Student</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#636e72]" />
            <input 
              type="text"
              placeholder="Type student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#dee2e6] rounded-xl pl-11 pr-4 py-2 font-bold text-[#1a237e] focus:ring-2 ring-[#1a237e]/20 outline-none"
            />
          </div>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-[10px] font-black text-[#1a237e] uppercase tracking-widest mb-2 pl-1">Target Class</label>
          <select 
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="w-full bg-white border border-[#dee2e6] rounded-xl px-4 py-2 font-bold text-[#1a237e] focus:ring-2 ring-[#1a237e]/20 outline-none appearance-none cursor-pointer"
          >
            {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-[10px] font-black text-[#1a237e] uppercase tracking-widest mb-2 pl-1">Target Section</label>
          <select 
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="w-full bg-white border border-[#dee2e6] rounded-xl px-4 py-2 font-bold text-[#1a237e] focus:ring-2 ring-[#1a237e]/20 outline-none appearance-none cursor-pointer"
          >
            {['A', 'B', 'C', 'D', 'E'].map(sec => <option key={sec} value={sec}>{sec}</option>)}
          </select>
        </div>
        <button 
          onClick={fetchStudents}
          className="p-3 bg-white border border-[#dee2e6] rounded-xl text-[#1a237e] hover:bg-white/80 transition-colors"
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
            <form onSubmit={handleAddStudent} className="bg-white p-6 rounded-2xl border-2 border-[#1a237e] flex gap-3">
              <input
                autoFocus
                type="text"
                placeholder="Enter Student Full Name"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                className="flex-1 bg-[#f8f9fa] border-none rounded-xl px-4 py-2 font-bold text-[#1a237e] focus:ring-2 ring-[#1a237e]/20 outline-none"
              />
              <button
                type="submit"
                className="bg-[#1a237e] text-white px-6 rounded-xl font-bold uppercase text-xs"
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
              backgroundColor: selectedIdx === idx ? '#f0f2ff' : '#ffffff',
              borderColor: selectedIdx === idx ? '#1a237e' : '#e9ecef'
            }}
            className="p-6 rounded-2xl border flex flex-col items-center gap-4 group relative overflow-hidden shadow-sm"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${selectedIdx === idx ? 'bg-[#1a237e] text-white' : 'bg-[#f8f9fa] text-[#1a237e] border border-[#dee2e6]'} ${calledIds.has(student.id) && selectedIdx !== idx ? 'opacity-40' : ''}`}>
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
        className="w-full bg-gradient-to-r from-[#1a237e] to-[#3949ab] hover:opacity-90 text-white py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-lg uppercase tracking-widest shadow-lg transition-all disabled:opacity-50"
      >
        <RotateCcw className={`w-6 h-6 ${isSpinning ? 'animate-spin' : ''}`} />
        {isSpinning ? 'Selecting...' : 'Select Student'}
      </button>

      {selectedIdx !== null && !isSpinning && students[selectedIdx] && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8 bg-[#f0f2ff] border border-[#1a237e]/20 rounded-2xl"
        >
          <p className="text-[#1a237e] text-[10px] uppercase tracking-widest font-black mb-1">Selected Student</p>
          <h3 className="text-3xl font-black text-[#1a237e] uppercase">{students[selectedIdx].fullName}</h3>
          <p className="text-[#636e72] font-bold text-xs mt-2 uppercase">Ready to answer your question!</p>
        </motion.div>
      )}
    </div>
  );
}
