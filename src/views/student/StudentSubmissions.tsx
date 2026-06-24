import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, CheckCircle2, XCircle, Clock, ArrowLeft, 
  Sparkles, FileText, Check, ChevronDown, RefreshCw, 
  BookOpen, HelpCircle, AlertCircle, FileDown
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

interface StudentSubmissionsProps {
  onBack?: () => void;
  userClass: string | null;
  userSection: string | null;
}

export default function StudentSubmissions({ onBack, userClass, userSection }: StudentSubmissionsProps) {
  const [selectedClass, setSelectedClass] = useState(userClass || 'X');
  const [selectedSection, setSelectedSection] = useState(userSection || 'A');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [assignmentName, setAssignmentName] = useState<string>('');
  
  // File and Upload states
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'saving' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  // Submissions list
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch students based on selected class and section
  const fetchStudents = async (klass: string, sect: string) => {
    setLoadingStudents(true);
    setStudents([]);
    setSelectedStudentId('');
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, name')
        .eq('class', klass)
        .eq('section', sect)
        .order('name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error("Error fetching students list:", err);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Fetch previous submissions for the chosen student
  const fetchPreviousSubmissions = async (studentId: string) => {
    if (!studentId) {
      setSubmissions([]);
      return;
    }
    setLoadingSubmissions(true);
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', studentId)
        .order('id', { ascending: false }); // Newest primary ID first

      if (error) throw error;
      setSubmissions(data || []);
    } catch (err) {
      console.error("Error fetching previous submissions:", err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Trigger loading students on changes
  useEffect(() => {
    fetchStudents(selectedClass, selectedSection);
  }, [selectedClass, selectedSection]);

  // Trigger loading submissions when student is chosen
  useEffect(() => {
    fetchPreviousSubmissions(selectedStudentId);
  }, [selectedStudentId]);

  // File drag handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Submission pipeline
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setErrorMsg("Please select your name from the class roster.");
      return;
    }
    if (!assignmentName.trim()) {
      setErrorMsg("Please enter an assignment name.");
      return;
    }
    if (!file) {
      setErrorMsg("Please select a physical assignment document/file to upload.");
      return;
    }

    setUploadProgress('uploading');
    setErrorMsg('');

    try {
      // 1. Generate path
      const fileExt = file.name.split('.').pop() || 'dat';
      const cleanName = file.name.replace(/[^\w\s.-]/g, '').replace(/\s+/g, '_');
      const uniquePath = `submissions/${selectedClass}/${selectedSection}/${Date.now()}_${cleanName}`;

      // 2. Upload to 'vault-files' storage bucket
      const { data: storageData, error: storageErr } = await supabase.storage
        .from('vault-files')
        .upload(uniquePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageErr) {
        if (storageErr.message?.toLowerCase().includes('bucket not found')) {
          throw new Error("Storage bucket 'vault-files' was not found. Please verify standard Supabase Storage configuration.");
        }
        throw storageErr;
      }

      setUploadProgress('saving');

      // 3. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('vault-files')
        .getPublicUrl(uniquePath);

      const uploadedUrl = publicUrlData.publicUrl;

      // 4. Save metadata row inside 'submissions' table
      const { data: insertData, error: insertErr } = await supabase
        .from('submissions')
        .insert([
          {
            student_id: selectedStudentId,
            class: selectedClass,
            section: selectedSection,
            assignment_name: assignmentName.trim(),
            file_url: uploadedUrl,
            status: 'Pending',
            teacher_comment: null
          }
        ])
        .select();

      if (insertErr) {
        // Rollback physical upload if SQL record creation fails
        await supabase.storage.from('vault-files').remove([uniquePath]);
        throw insertErr;
      }

      setUploadProgress('success');
      setAssignmentName('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Reload list
      await fetchPreviousSubmissions(selectedStudentId);

      // Reset success banner after 3 seconds
      setTimeout(() => {
        setUploadProgress('idle');
      }, 3000);

    } catch (err: any) {
      console.error("Submission pipeline failed:", err);
      setErrorMsg(err.message || "Failed to submit assignment. Check your Supabase tables and credentials.");
      setUploadProgress('error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 selection:bg-sky-100">
      
      {/* HEADER SECTION */}
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
          <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">
              Student Submissions Hub
            </h1>
            <p className="text-slate-400 font-mono font-bold text-[9px] uppercase tracking-wider mt-1.5">
              Submit Assignments & View Teacher Real-Time Reviews
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: ASSIGNMENT UPLOAD FORM */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 space-y-5">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
              New Submittal Form
            </h3>
            <p className="text-xs text-slate-500">
              Provide details and upload your document to submit for teacher grading.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* GRID OF CLASS AND SECTION FILTERS */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase text-slate-400 block tracking-wide">Class</label>
                <select 
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 focus:border-violet-400 rounded-xl px-3 py-2 font-bold text-xs text-slate-700 outline-none transition-all cursor-pointer"
                >
                  {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].map(c => (
                    <option key={c} value={c}>Class {c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase text-slate-400 block tracking-wide">Section</label>
                <select 
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 focus:border-violet-400 rounded-xl px-3 py-2 font-bold text-xs text-slate-700 outline-none transition-all cursor-pointer"
                >
                  {['A', 'B', 'C', 'D', 'E'].map(s => (
                    <option key={s} value={s}>Section {s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* NAME SELECTOR */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase text-slate-400 block tracking-wide">
                Select Your Name ({loadingStudents ? 'loading...' : `${students.length} found`})
              </label>
              <div className="relative">
                <select 
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  disabled={students.length === 0}
                  className="w-full bg-slate-50 border border-slate-200/80 focus:border-violet-400 rounded-xl px-3 py-2.5 font-bold text-xs text-slate-700 outline-none transition-all cursor-pointer disabled:opacity-50 appearance-none"
                >
                  <option value="">-- Choose Name from Roster --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              {students.length === 0 && !loadingStudents && (
                <p className="text-[9px] text-amber-600 font-bold tracking-tight">
                  ⚠️ No registered students in class roster {selectedClass}-{selectedSection}. Introduce pupils via Student Selector first!
                </p>
              )}
            </div>

            {/* ASSIGNMENT NAME TEXT FIELD */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase text-slate-400 block tracking-wide">Assignment Name / Subject</label>
              <input 
                type="text"
                required
                value={assignmentName}
                onChange={(e) => setAssignmentName(e.target.value)}
                placeholder="e.g. Physics Homework 3, English Essay"
                className="w-full bg-slate-50 border border-slate-200/80 focus:border-violet-400 rounded-xl px-4 py-2.5 font-bold text-xs text-slate-700 outline-none transition-all"
              />
            </div>

            {/* FILE DRAG AND DROP BOX */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase text-slate-400 block tracking-wide">Assignment File (PDF or Document)</label>
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
                  isDragging 
                    ? 'border-violet-500 bg-violet-50/50' 
                    : file 
                      ? 'border-emerald-400 bg-emerald-50/10' 
                      : 'border-slate-200 hover:border-violet-300 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.pages,.key"
                />
                
                {file ? (
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-100 shadow-sm">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-bold text-xs text-neutral-800 line-clamp-1 max-w-[240px] mx-auto uppercase tracking-tight">
                        {file.name}
                      </p>
                      <p className="text-[9px] text-slate-400 font-mono font-bold">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB · ready
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center shadow-inner">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-700">Drag file here or click to browse</p>
                      <p className="text-[8.5px] text-slate-400 font-mono font-bold uppercase tracking-widest">Supports PDF, Documents, images up to 10MB</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PIPELINE ERROR DISPLAY */}
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-100 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-[10px] font-semibold leading-relaxed">{errorMsg}</p>
              </div>
            )}

            {/* STATUS DIALOG/FEEDBACK FOR LARGE PIPELINES */}
            {uploadProgress !== 'idle' && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 font-mono text-[9px] uppercase tracking-wider space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>Submittal Pipeline:</span>
                  <span className={uploadProgress === 'success' ? 'text-emerald-600 font-black' : 'text-indigo-600 font-black'}>
                    {uploadProgress}
                  </span>
                </div>
                <div className="text-[8.5px] text-slate-400 font-medium lowercase">
                  {uploadProgress === 'uploading' && "transferring document binary to supastorage 'vault-files'..."}
                  {uploadProgress === 'saving' && "anchoring url reference into submissions catalog..."}
                  {uploadProgress === 'success' && "assignment successfully synchronized!"}
                </div>
              </div>
            )}

            {/* TRIGGER ACTION BUTTON */}
            <button
              type="submit"
              disabled={uploadProgress === 'uploading' || uploadProgress === 'saving' || students.length === 0}
              className="w-full bg-gradient-to-tr from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 disabled:opacity-40 text-white font-black uppercase tracking-widest text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
            >
              {(uploadProgress === 'uploading' || uploadProgress === 'saving') ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {uploadProgress === 'uploading' ? 'Uploading document...' : uploadProgress === 'saving' ? 'Verifying record...' : 'Submit Assignment'}
            </button>

          </form>
        </div>

        {/* RIGHT COLUMN: PREVIOUS SUBMISSIONS AND REVIEWS LIST */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                Recent Submissions Log
              </h3>
              <p className="text-xs text-slate-500">
                Track status and view grading notes from your teachers.
              </p>
            </div>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 dropdown-scroll custom-scrollbar">
            {!selectedStudentId ? (
              <div className="text-center py-16 text-slate-400 border border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500"> Roster Identity Not Selected</p>
                <p className="text-[9px] text-slate-400 max-w-xs mx-auto mt-1 uppercase">
                  Select your Class, Section, and Name on the left to review your submission history.
                </p>
              </div>
            ) : loadingSubmissions ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-violet-400" />
                <p className="font-mono text-[8.5px] uppercase tracking-wider">Loading history from ledger...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-16 text-slate-400 border border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">A clean sheet!</p>
                <p className="text-[9px] text-slate-400 max-w-xs mx-auto mt-1 uppercase">
                  You have no recorded assignment submissions here yet. Use the upload panel to deliver your first work.
                </p>
              </div>
            ) : (
              submissions.map((sub) => {
                const isPending = sub.status?.toLowerCase() === 'pending';
                const isApproved = sub.status?.toLowerCase() === 'approved';
                const isDenied = sub.status?.toLowerCase() === 'denied' || sub.status?.toLowerCase() === 'rejected';

                return (
                  <div 
                    key={sub.id} 
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 space-y-3 hover:border-slate-200 transition-all"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="space-y-1">
                        <span className="text-[8px] bg-slate-100 text-slate-500 font-mono font-bold px-2 py-0.5 rounded uppercase">
                          ID #{sub.id} · CLASS {sub.class}-{sub.section}
                        </span>
                        <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">
                          {sub.assignment_name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-medium">
                          <span>Submitted:</span>
                          <span>{sub.created_at ? new Date(sub.created_at).toLocaleString() : 'Just now'}</span>
                        </div>
                      </div>

                      {/* Status indicator badge */}
                      <div>
                        {isPending && (
                          <span className="flex items-center gap-1 bg-slate-100 text-slate-600 font-mono font-bold text-[8.5px] uppercase px-2.5 py-1 rounded-full border border-slate-200/50">
                            <Clock className="w-3 h-3 text-slate-500" />
                            Pending
                          </span>
                        )}
                        {isApproved && (
                          <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 font-mono font-bold text-[8.5px] uppercase px-2.5 py-1 rounded-full border border-emerald-100">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Approved
                          </span>
                        )}
                        {isDenied && (
                          <span className="flex items-center gap-1 bg-rose-50 text-rose-700 font-mono font-bold text-[8.5px] uppercase px-2.5 py-1 rounded-full border border-rose-100">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Denied
                          </span>
                        )}
                      </div>
                    </div>

                    {/* File Attachment Pill */}
                    {sub.file_url && (
                      <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 text-[10px] shadow-sm">
                        <div className="flex items-center gap-2 text-slate-600 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="font-bold truncate max-w-[200px]">Physical Document Asset</span>
                        </div>
                        <a 
                          href={sub.file_url} 
                          target="_blank" 
                          referrerPolicy="no-referrer"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 rounded font-black uppercase text-[8.5px] transition-colors leading-none"
                        >
                          <FileDown className="w-3 h-3" />
                          Open File
                        </a>
                      </div>
                    )}

                    {/* Teacher Review Comments Block */}
                    {sub.teacher_comment ? (
                      <div className="p-3 bg-amber-50/55 rounded-xl border border-amber-100 flex flex-col gap-1">
                        <span className="text-[8.5px] font-black text-amber-800 uppercase tracking-wide">Teacher Review Comments:</span>
                        <p className="text-xs text-amber-900/90 font-medium text-slate-700 leading-relaxed italic">
                          "{sub.teacher_comment}"
                        </p>
                      </div>
                    ) : (
                      !isPending && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/80 text-[10px] text-slate-400 italic font-medium">
                          No assessment comment accompanied this grade review.
                        </div>
                      )
                    )}

                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
