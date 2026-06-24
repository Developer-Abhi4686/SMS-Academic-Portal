import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Search, ArrowLeft, Clock, Eye, 
  CheckCircle2, XCircle, FileDown, FolderOpen, 
  Filter, Check, ArrowRight, MessageSquare, RefreshCw,
  AlertCircle, ChevronDown, HelpCircle
} from 'lucide-react';
import { createClient } from '../../../utils/supabase/client';

const supabase = createClient();

interface Student {
  id: string;
  name: string;
}

interface Submission {
  id: string;
  created_at: string;
  student_id: string;
  class: string;
  section: string;
  assignment_name: string;
  file_url: string;
  status: string;
  teacher_comment: string | null;
}

interface SubmissionsProps {
  onBack?: () => void;
  userClass: string | null;
  userSection: string | null;
}

export default function Submissions({ onBack, userClass, userSection }: SubmissionsProps) {
  const [selectedClass, setSelectedClass] = useState(userClass || 'X');
  const [selectedSection, setSelectedSection] = useState(userSection || 'A');
  const [studentsMap, setStudentsMap] = useState<Record<string, string>>({});
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Review drawer/inspection states
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState<string>('');
  const [updatingSubId, setUpdatingSubId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch student catalog to resolve names
  const fetchStudentsCatalog = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, name');
      
      if (!error && data) {
        const dict: Record<string, string> = {};
        data.forEach(s => {
          dict[String(s.id)] = s.name;
        });
        setStudentsMap(dict);
      }
    } catch (e) {
      console.warn("Failed to lookup student names mapping:", e);
    }
  };

  // Fetch submissions for chosen class + section
  const fetchClassSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('class', selectedClass)
        .eq('section', selectedSection)
        .order('id', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (err) {
      console.error("Failed to read class submissions:", err);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load students name directory
  useEffect(() => {
    fetchStudentsCatalog();
  }, []);

  // Reload files when class/section filters shift
  useEffect(() => {
    fetchClassSubmissions();
    setSelectedSubId(null);
  }, [selectedClass, selectedSection]);

  // Load comment when selected submission shifts
  useEffect(() => {
    if (selectedSubId) {
      const activeObj = submissions.find(s => s.id === selectedSubId);
      setCommentInput(activeObj?.teacher_comment || '');
    } else {
      setCommentInput('');
    }
  }, [selectedSubId, submissions]);

  // Handle Approve Action
  const handleApprove = async (id: string) => {
    setUpdatingSubId(id);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ status: 'Approved' })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setSubmissions(prev => 
        prev.map(s => s.id === id ? { ...s, status: 'Approved' } : s)
      );
    } catch (err: any) {
      alert("Approval status update failed: " + err.message);
    } finally {
      setUpdatingSubId(null);
    }
  };

  // Handle Deny Action
  const handleDeny = async (id: string) => {
    setUpdatingSubId(id);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ status: 'Denied' })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setSubmissions(prev => 
        prev.map(s => s.id === id ? { ...s, status: 'Denied' } : s)
      );
    } catch (err: any) {
      alert("Denial status update failed: " + err.message);
    } finally {
      setUpdatingSubId(null);
    }
  };

  // Save/Update Teacher Comment field
  const handleSaveComment = async (id: string) => {
    setUpdatingSubId(id);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ teacher_comment: commentInput.trim() || null })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setSubmissions(prev => 
        prev.map(s => s.id === id ? { ...s, teacher_comment: commentInput.trim() || null } : s)
      );
      
      alert("Feedback comments saved successfully!");
    } catch (err: any) {
      alert("Feedback write failed: " + err.message);
    } finally {
      setUpdatingSubId(null);
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const studentName = (studentsMap[sub.student_id] || 'Unknown Pupil').toLowerCase();
    const assignmentName = (sub.assignment_name || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return studentName.includes(query) || assignmentName.includes(query);
  });

  const selectedSub = submissions.find(s => s.id === selectedSubId);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 selection:bg-rose-100">
      
      {/* ACTION HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 -ml-2 text-neutral-500 hover:text-slate-950 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">
              Teacher Assessment Ledger
            </h1>
            <p className="text-slate-400 font-mono font-bold text-[9px] uppercase tracking-wider mt-1.5">
              Grade Class Portals · Review and Appraise Real-Time Submissions
            </p>
          </div>
        </div>
      </div>

      {/* FILTER SHEET & CONTROL GRID */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        
        <div className="flex flex-wrap items-center gap-3">
          {/* CLASS SELECTOR */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent font-bold text-xs text-slate-700 outline-none cursor-pointer"
            >
              {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].map(c => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>

          {/* SECTION SELECTOR */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="bg-transparent font-bold text-xs text-slate-700 outline-none cursor-pointer"
            >
              {['A', 'B', 'C', 'D', 'E'].map(s => (
                <option key={s} value={s}>Section {s}</option>
              ))}
            </select>
          </div>

          {/* SYNC TRIGGER FOR LIVE SUBMISSIONS */}
          <button
            onClick={fetchClassSubmissions}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-950 transition-colors"
            title="Reload registry database list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* SEARCH FILTER */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search student or task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-transparent focus:border-slate-300 rounded-xl pl-9 pr-4 py-1.5 font-bold text-xs text-slate-700 outline-none transition-all"
          />
        </div>
      </div>

      {/* TWO PARTITIONS BOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: MATCHING SUBMISSIONS LIST TABLE */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
              Delivery Catalog ({filteredSubmissions.length})
            </h3>
            <span className="text-[9px] text-slate-400 font-mono">
              Filtered for Grade {selectedClass}-{selectedSection}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 dropdown-scroll custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-2 text-slate-400">
                <RefreshCw className="w-7 h-7 animate-spin text-rose-400" />
                <p className="font-mono text-[8.5px] uppercase tracking-wider">Syncing submissions index...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-20 text-slate-400 border border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">No submissions discovered</p>
                <p className="text-[8.5px] text-slate-400 max-w-xs mx-auto mt-1 uppercase leading-relaxed font-medium">
                  Students have not dispatched any assignments under Class {selectedClass}-{selectedSection} yet.
                </p>
              </div>
            ) : (
              filteredSubmissions.map((sub) => {
                const isSelected = selectedSubId === sub.id;
                const studentName = studentsMap[sub.student_id] || 'Unknown Pupil';
                const isPending = sub.status?.toLowerCase() === 'pending';
                const isApproved = sub.status?.toLowerCase() === 'approved';
                const isDenied = sub.status?.toLowerCase() === 'denied' || sub.status?.toLowerCase() === 'rejected';

                return (
                  <motion.div
                    key={sub.id}
                    whileHover={{ scale: 1.005, x: 1 }}
                    onClick={() => setSelectedSubId(sub.id)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 cursor-pointer select-none transition-all ${
                      isSelected 
                        ? 'border-rose-300 bg-rose-50/15 ring-1 ring-rose-300/10 shadow-xs' 
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wide">
                          ID #{sub.id}
                        </span>
                        {sub.teacher_comment && (
                          <span title="Feedback comment added">
                            <MessageSquare className="w-3 h-3 text-amber-500" />
                          </span>
                        )}
                      </div>
                      <h4 className="font-black text-slate-800 text-[11.5px] uppercase tracking-tight truncate">
                        {studentName}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase leading-tight line-clamp-1">
                        {sub.assignment_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* State Pills */}
                      {isPending && (
                        <span className="flex items-center gap-1 bg-slate-50 text-slate-600 font-mono font-bold text-[8px] uppercase px-2 py-0.5 rounded border border-slate-100">
                          <Clock className="w-2.5 h-2.5" />
                          Pending
                        </span>
                      )}
                      {isApproved && (
                        <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 font-mono font-bold text-[8px] uppercase px-2 py-0.5 rounded border border-emerald-100">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Approved
                        </span>
                      )}
                      {isDenied && (
                        <span className="flex items-center gap-1 bg-rose-50 text-rose-700 font-mono font-bold text-[8px] uppercase px-2 py-0.5 rounded border border-rose-100">
                          <XCircle className="w-2.5 h-2.5" />
                          Denied
                        </span>
                      )}

                      <ArrowRight className={`w-4 h-4 text-slate-300 transition-transform ${isSelected ? 'translate-x-1 text-rose-500' : ''}`} />
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED REVIEW DRAWER / EDIT BLOCK */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 space-y-5 sticky top-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono border-b border-slate-100 pb-2.5">
            Active Review Panel
          </h3>

          <AnimatePresence mode="wait">
            {!selectedSub ? (
              <motion.div 
                key="blank"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 text-slate-400 space-y-2"
              >
                <Eye className="w-10 h-10 text-slate-300 mx-auto" />
                <div>
                  <h4 className="text-xs font-bold text-slate-600">No Document Selected</h4>
                  <p className="text-[9px] text-slate-400 uppercase max-w-xs mx-auto mt-0.5 normal-case">
                    Click any student submittal row on the left catalog sheet to review physical files, set status, and provide comments.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="active-review"
                initial={{ opacity: 0, scale: 0.98, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -5 }}
                className="space-y-4"
              >
                <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-100 space-y-2.5">
                  <div className="space-y-0.5">
                    <span className="text-[8.5px] font-mono font-black text-rose-500 uppercase">
                      Class {selectedSub.class}-{selectedSub.section} Submission
                    </span>
                    <h2 className="text-md font-black text-slate-900 uppercase tracking-tight">
                      {studentsMap[selectedSub.student_id] || 'Unknown Pupil'}
                    </h2>
                  </div>

                  <div className="text-xs text-slate-700 font-bold uppercase tracking-tight py-1 bg-white border border-slate-100 px-3 rounded-lg leading-snug">
                    Task: <span className="text-slate-950 font-black">{selectedSub.assignment_name}</span>
                  </div>

                  {/* Attachment Asset Download */}
                  {selectedSub.file_url ? (
                    <div className="flex items-center justify-between p-2 bg-rose-500/5 text-[9.5px] rounded-lg border border-rose-100">
                      <div className="flex items-center gap-2 text-rose-950 font-bold truncate">
                        <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">Physical Assignment File</span>
                      </div>
                      <a 
                        href={selectedSub.file_url}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-rose-500 hover:text-white border border-rose-200 text-rose-600 rounded font-black uppercase text-[8.5px] transition-colors shadow-2xs"
                      >
                        <FileDown className="w-3 h-3" />
                        View File
                      </a>
                    </div>
                  ) : (
                    <div className="text-[10px] text-amber-600 font-bold">
                      ⚠️ No physical file URL attached to this ledger ID.
                    </div>
                  )}
                </div>

                {/* APPROVE & DENY STATUS BUTTONS */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wide">
                    Set Grading Status
                  </span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleApprove(selectedSub.id)}
                      disabled={updatingSubId !== null}
                      className={`py-2 rounded-lg font-black uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                        selectedSub.status?.toLowerCase() === 'approved'
                          ? 'bg-emerald-500 text-white border-transparent shadow-xs'
                          : 'bg-white hover:bg-emerald-50 text-emerald-600 border-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve Work
                    </button>

                    <button
                      onClick={() => handleDeny(selectedSub.id)}
                      disabled={updatingSubId !== null}
                      className={`py-2 rounded-lg font-black uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                        selectedSub.status?.toLowerCase() === 'denied' || selectedSub.status?.toLowerCase() === 'rejected'
                          ? 'bg-rose-500 text-white border-transparent shadow-xs'
                          : 'bg-white hover:bg-rose-50 text-rose-600 border-slate-200'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Deny Work
                    </button>
                  </div>
                </div>

                {/* FEEDBACK COMMENTS EDIT PANEL */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase text-slate-400 block tracking-wide">
                    Appraisal Notes & Comments
                  </label>
                  <textarea
                    rows={4}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Enter grading evaluation or instructions for correction..."
                    className="w-full bg-slate-50 border border-slate-200/80 focus:border-rose-400 rounded-xl px-3.5 py-2 font-semibold text-xs text-slate-700 outline-none transition-all resize-none"
                  />
                </div>

                {/* SAVE APPRAISAL COMMENT BUTTON */}
                <button
                  onClick={() => handleSaveComment(selectedSub.id)}
                  disabled={updatingSubId !== null}
                  className="w-full bg-[#1A1A1A] hover:bg-[#2C2C2C] text-white disabled:opacity-40 font-black uppercase tracking-widest text-[9.5px] py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  {updatingSubId === selectedSub.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Save Appraisal Note
                </button>
                
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
