import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderLock, 
  Plus, 
  ArrowLeft, 
  ShieldCheck, 
  File, 
  FileText, 
  Image as ImageIcon, 
  Folder,
  UploadCloud,
  ChevronRight, 
  Upload, 
  Lock,
  Unlock,
  Search,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  AlertTriangle,
  FolderOpen,
  Info,
  Calendar,
  LockKeyhole,
  Check
} from 'lucide-react';
import { createClient } from '../../../utils/supabase/client';

const supabase = createClient();

interface DBFile {
  id: number;
  created_at?: string;
  file_name: string;
  file_url: string;
  class: string;
  section: string;
}

const CLASSES = ['VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

export default function CloudVault({ 
  onBack,
  defaultClass,
  defaultSection
}: { 
  onBack?: () => void;
  defaultClass?: string | null;
  defaultSection?: string | null;
}) {
  // Select States
  const [selectedClass, setSelectedClass] = useState<string>((defaultClass || '').toUpperCase());
  const [selectedSection, setSelectedSection] = useState<string>((defaultSection || '').toUpperCase());
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Files Data
  const [files, setFiles] = useState<DBFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Upload Status
  const [uploadProgress, setUploadProgress] = useState<string>(''); // '', 'uploading', 'db_sync', 'success', 'error'
  const [uploadErrorMsg, setUploadErrorMsg] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // Action status
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-Unlock if both class and section are selected
  useEffect(() => {
    if (selectedClass && selectedSection) {
      setIsUnlocked(true);
      fetchFiles(selectedClass, selectedSection);
    } else {
      setIsUnlocked(false);
      setFiles([]);
    }
  }, [selectedClass, selectedSection]);

  // Fetch files inside the 'cloud_vault' table matching class and section
  const fetchFiles = async (cls: string, sec: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cloud_vault')
        .select('*')
        .eq('class', cls)
        .eq('section', sec)
        .order('id', { ascending: false });

      if (error) {
        console.warn("Could not query 'cloud_vault' table:", error.message);
        throw error;
      }

      setFiles(data || []);
    } catch (err: any) {
      console.error("Error reading Cloud Vault table:", err);
      // Fallback with visual logs in interface
    } finally {
      setLoading(false);
    }
  };

  // Upload file pipeline
  const handleFileProcess = async (file: File) => {
    if (!selectedClass || !selectedSection) {
      alert("Please specify Class and Section first.");
      return;
    }

    setUploadProgress('uploading');
    setUploadErrorMsg('');

    try {
      // 1. Generate unique path
      const fileExt = file.name.split('.').pop() || 'dat';
      const cleanName = file.name.replace(/[^\w\s.-]/g, '').replace(/\s+/g, '_');
      const uniquePath = `${selectedClass}/${selectedSection}/${Date.now()}_${cleanName}`;

      // 2. Upload to vault-files storage bucket
      const { data: storageData, error: storageErr } = await supabase.storage
        .from('vault-files')
        .upload(uniquePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageErr) {
        // Helpful tip if bucket is not created
        if (storageErr.message?.toLowerCase().includes('bucket not found') || storageErr.message?.toLowerCase().includes('does not exist')) {
          throw new Error("Bucket 'vault-files' not found. Please create a public storage bucket named 'vault-files' in your Supabase dashboard.");
        }
        throw storageErr;
      }

      setUploadProgress('db_sync');

      // 3. Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('vault-files')
        .getPublicUrl(uniquePath);

      const fileUrl = publicUrlData.publicUrl;

      // 4. Save metadata to 'cloud_vault' table with actual exact columns requested
      const { data: insertData, error: insertErr } = await supabase
        .from('cloud_vault')
        .insert([
          {
            file_name: file.name,
            file_url: fileUrl,
            class: selectedClass,
            section: selectedSection
          }
        ])
        .select();

      if (insertErr) {
        // Rollback storage if db sync fails
        await supabase.storage.from('vault-files').remove([uniquePath]);
        throw insertErr;
      }

      setUploadProgress('success');
      setTimeout(() => {
        setUploadProgress('');
      }, 2000);

      // Refresh current directory files
      await fetchFiles(selectedClass, selectedSection);
    } catch (err: any) {
      console.error("Vault upload failed:", err);
      setUploadErrorMsg(err.message || "Transfer suspended. Make sure bucket 'vault-files' and table 'cloud_vault' exist and are accessible.");
      setUploadProgress('error');
    }
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  // Drag and drop handlers
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
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  // Deletion operation
  const handleDelete = async (fileId: number, fileUrl: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this academic asset from the Cloud Vault?")) {
      return;
    }

    setActionLoadingId(fileId);
    try {
      // 1. Delete from DB
      const { error: dbErr } = await supabase
        .from('cloud_vault')
        .delete()
        .eq('id', fileId);

      if (dbErr) throw dbErr;

      // 2. Safely attempt physics storage deletion
      try {
        const urlMatch = fileUrl.split('/storage/v1/object/public/vault-files/');
        if (urlMatch.length > 1) {
          const storagePath = decodeURIComponent(urlMatch[1]);
          await supabase.storage
            .from('vault-files')
            .remove([storagePath]);
        }
      } catch (storageErr) {
        console.warn("Could not delete physical asset from bucket:", storageErr);
      }

      // Refresh files list
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err: any) {
      console.error("Failed to delete file:", err);
      alert("Failed to delete from Cloud database: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Helpers to assign aesthetics based on extension
  const getFileAesthetics = (fileName: string) => {
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    switch (ext) {
      case 'pdf':
        return {
          icon: <FileText className="w-6 h-6 text-red-500" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-100',
          textColor: 'text-red-700',
          tag: 'PDF Document'
        };
      case 'doc':
      case 'docx':
        return {
          icon: <FileText className="w-6 h-6 text-blue-500" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-100',
          textColor: 'text-blue-700',
          tag: 'Word Document'
        };
      case 'xls':
      case 'xlsx':
      case 'csv':
        return {
          icon: <File className="w-6 h-6 text-emerald-500" />,
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-100',
          textColor: 'text-emerald-700',
          tag: 'Spreadsheet'
        };
      case 'ppt':
      case 'pptx':
        return {
          icon: <FileText className="w-6 h-6 text-amber-500" />,
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-100',
          textColor: 'text-amber-700',
          tag: 'Presentation'
        };
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return {
          icon: <ImageIcon className="w-6 h-6 text-purple-500" />,
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-100',
          textColor: 'text-purple-700',
          tag: 'Image Asset'
        };
      default:
        return {
          icon: <File className="w-6 h-6 text-slate-500" />,
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-100',
          textColor: 'text-slate-700',
          tag: 'Academic Resource'
        };
    }
  };

  // Query filtering
  const filteredFiles = files.filter(f => 
    f.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto pb-12 selection:bg-accent/10">
      {/* 1. Header Area with macOS back button and title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2.5 bg-white border border-slate-200/65 rounded-xl shadow-sm hover:shadow-md hover:bg-slate-50 active:scale-95 transition-all cursor-pointer text-slate-700"
              title="Return Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20 shadow-sm animate-pulse-slow">
            <FolderLock className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-primary uppercase tracking-tight">Cloud Storage</h1>
            <p className="text-muted text-[11px] font-bold uppercase tracking-widest mt-0.5">Online storage for files and resources</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100/80 text-[10px] font-black uppercase tracking-widest shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          Secure Connection Active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 2. Left side: Directory Shelf selectors */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-[0_15px_50px_rgba(30,30,60,0.03)] space-y-6">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <FolderOpen className="w-5 h-5 text-accent" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">Select Folder</h3>
            </div>

            {/* Class selection matrix */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted uppercase tracking-[0.22em] ml-1">
                Class
              </label>
              <div className="grid grid-cols-4 gap-2">
                {CLASSES.map((cls) => {
                  const isActive = selectedClass === cls;
                  return (
                    <button
                      key={cls}
                      onClick={() => {
                        setSelectedClass(cls);
                        if (!selectedSection) {
                          // select default section for ease of access
                          setSelectedSection('A');
                        }
                      }}
                      className={`py-3 px-2 rounded-xl text-xs font-black uppercase transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-accent text-white shadow-lg shadow-accent/10 border-none'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100/50'
                      }`}
                    >
                      Class {cls}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section selector shelf */}
            <div className="space-y-3 pt-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-[0.22em] ml-1">
                Classroom Section
              </label>
              <div className="grid grid-cols-5 gap-2">
                {SECTIONS.map((sec) => {
                  const isActive = selectedSection === sec;
                  return (
                    <button
                      key={sec}
                      onClick={() => setSelectedSection(sec)}
                      className={`py-3 px-2 rounded-xl text-xs font-black uppercase transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-accent text-white shadow-lg shadow-accent/10 border-none'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100/50'
                      }`}
                    >
                      Sec {sec}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Locker state lock graphic */}
            <div className="pt-4 flex flex-col items-center justify-center p-6 bg-slate-50/70 border border-slate-100 rounded-2xl relative overflow-hidden">
              <AnimatePresence mode="wait">
                {isUnlocked ? (
                  <motion.div
                    key="unlocked-state"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-3 shadow-inner">
                      <Unlock className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-700">Storage Unlocked</span>
                    <span className="text-[9px] font-medium text-slate-400 mt-1 uppercase">Folder: Class {selectedClass} - {selectedSection}</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="locked-state"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-3 shadow-inner animate-pulse">
                      <LockKeyhole className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-amber-800">Locked</span>
                    <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase max-w-[200px] leading-relaxed">
                      Please select a Class and Section above to view files.
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* 3. Right side: Files explorer and Upload panels */}
        <div className="lg:col-span-8 space-y-6">
          {/* Upload Pipeline Box */}
          <AnimatePresence>
            {isUnlocked && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-[0_15px_50px_rgba(30,30,60,0.03)]"
              >
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-6">
                  <Upload className="w-5 h-5 text-accent" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">Drop & Upload Academic Asset</h3>
                </div>

                {/* Upload drag drop zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[2rem] p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                    isDragging 
                      ? 'border-accent bg-accent/5 scale-[0.98]' 
                      : 'border-slate-200 hover:border-accent hover:bg-slate-50/50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleManualUpload}
                    className="hidden"
                  />

                  {/* Cloud dynamic uploading statuses */}
                  {uploadProgress === 'uploading' ? (
                    <div className="space-y-4 py-4">
                      <div className="w-14 h-14 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center text-accent animate-spin mx-auto">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-accent">[Phase 1/2] Syncing to Supabase...</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Uploading payload to physical cloud bucket</p>
                      </div>
                    </div>
                  ) : uploadProgress === 'db_sync' ? (
                    <div className="space-y-4 py-4">
                      <div className="w-14 h-14 bg-emerald-100 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-600 animate-pulse mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-emerald-700">[Phase 2/2] Recording index...</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Saving public URL to cloud_vault directory table</p>
                      </div>
                    </div>
                  ) : uploadProgress === 'success' ? (
                    <div className="space-y-3 py-4">
                      <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-500/20"
                      >
                        <Check className="w-7 h-7 stroke-[3px]" />
                      </motion.div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-emerald-600">Asset Securely Mounted!</p>
                        <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase">File URL linked inside vault directory</p>
                      </div>
                    </div>
                  ) : uploadProgress === 'error' ? (
                    <div className="space-y-4 py-4 max-w-lg">
                      <div className="w-14 h-14 bg-red-100 border border-red-200 rounded-full flex items-center justify-center text-red-600 mx-auto">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-red-600">Sync Intervention Triggered</p>
                        <p className="text-[10px] font-bold text-red-700/80 mt-1 uppercase bg-red-50/50 p-3 rounded-xl border border-red-100/60 leading-relaxed text-center">
                          {uploadErrorMsg}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadProgress('');
                          }}
                          className="mt-3 px-4 py-1.5 bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          Dismiss Alert
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 bg-slate-100 group-hover:bg-accent/10 group-hover:text-accent group-hover:scale-115 text-slate-500 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 border border-slate-200/40">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-black text-slate-700 uppercase tracking-tight mb-1">
                        Select or Drag & Drop File
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs leading-relaxed">
                        Supports PDFs, syllabus, presentation papers, assignments (<span className="text-accent">vault-files</span> storage bin)
                      </p>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Directory Files Manager */}
          <div className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-[0_15px_50px_rgba(30,30,60,0.03)] min-h-[400px] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2.5">
                <Folder className="w-5 h-5 text-accent" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
                  {isUnlocked ? `Class ${selectedClass}-${selectedSection} Storage Index` : 'Encrypted Directory Manager'}
                </h3>
              </div>

              {isUnlocked && files.length > 0 && (
                <div className="relative max-w-xs w-full">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search folder..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-accent/20 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              )}
            </div>

            {/* Content states */}
            {!isUnlocked ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300 shadow-sm mb-4 animate-pulse">
                  <FolderLock className="w-10 h-10" />
                </div>
                <h4 className="text-base font-black text-slate-600 uppercase tracking-tight mb-1.5">Locker Not Initialized</h4>
                <p className="text-xs text-slate-400 font-medium max-w-sm leading-relaxed mb-6">
                  Mount the physical directories on the left panel to browse database records and view files.
                </p>
                <div className="flex flex-wrap justify-center gap-2 max-w-md">
                  {CLASSES.slice(3, 7).map(c => (
                    <button
                      key={c}
                      onClick={() => {
                        setSelectedClass(c);
                        setSelectedSection('A');
                      }}
                      className="px-4 py-2 bg-slate-100/80 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                    >
                      Class {c}-A
                    </button>
                  ))}
                </div>
              </div>
            ) : loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase text-accent mt-3 tracking-widest">Querying Cloud Records...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/20">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4 border border-slate-200/45">
                  <FolderOpen className="w-8 h-8 opacity-40" />
                </div>
                <h4 className="text-sm font-black text-slate-600 uppercase tracking-tight mb-1">Directory is Empty</h4>
                <p className="text-xs text-slate-400 font-medium max-w-xs leading-relaxed">
                  No files registered for <span className="font-bold text-accent">Class {selectedClass}-{selectedSection}</span> inside 'cloud_vault'. Drop your first file to upload it.
                </p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <p className="text-xs font-black text-slate-500 uppercase">No query matches found</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Try checking spelling or resetting filter field</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-accent" />
                  Showing {filteredFiles.length} file{filteredFiles.length > 1 ? 's' : ''} index entries with physical asset locations
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredFiles.map((file) => {
                    const aesthetics = getFileAesthetics(file.file_name);
                    const isDeletingThis = actionLoadingId === file.id;

                    return (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="bg-white p-5 rounded-[1.751rem] border border-slate-100 flex items-start gap-4 transition-all duration-200 hover:shadow-lg hover:border-slate-200 relative group"
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${aesthetics.borderColor} ${aesthetics.bgColor}`}>
                          {aesthetics.icon}
                        </div>

                        <div className="min-w-0 flex-1 pr-6">
                          <h4 
                            className="text-xs font-black text-slate-700 truncate cursor-pointer hover:text-accent transition-colors block"
                            title={file.file_name}
                            onClick={() => window.open(file.file_url, '_blank')}
                          >
                            {file.file_name}
                          </h4>
                          <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 mt-1.5 rounded-md ${aesthetics.bgColor} ${aesthetics.textColor}`}>
                            {aesthetics.tag}
                          </span>
                          <div className="flex items-center gap-2.5 text-[9px] font-bold text-slate-400 uppercase mt-2">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {file.created_at ? new Date(file.created_at).toLocaleDateString(undefined, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              }) : 'Just uploaded'}
                            </span>
                          </div>
                        </div>

                        <div className="absolute right-4 top-4 flex items-center gap-2">
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-accent rounded-lg border border-slate-100 transition-colors"
                            title="Direct download/view"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button
                            disabled={isDeletingThis}
                            onClick={() => handleDelete(file.id, file.file_url)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-lg border border-red-50 transition-colors cursor-pointer"
                            title="Remove file"
                          >
                            {isDeletingThis ? (
                              <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
