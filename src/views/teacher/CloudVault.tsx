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
  ChevronRight, 
  Upload, 
  Lock,
  Search,
  MoreVertical,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  Smartphone,
  Copy,
  Check,
  ArrowUpRight
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { auth } from '../../lib/firebase';
import { supabaseStorage } from '../../lib/supabaseStorage';
import { UserProfile } from '../../types';

interface VaultFile {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  url?: string;
}

interface Vault {
  id: string;
  ownerId: string;
  name: string;
  roleType: 'class' | 'subject';
  subject: string;
  passwordHash: string;
  createdAt: string;
}

export default function CloudVault({ onBack, userProfile }: { onBack?: () => void; userProfile?: UserProfile | null }) {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [activeVaultFiles, setActiveVaultFiles] = useState<VaultFile[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreating, setIsCreating] = useState(false);
  const [activeVaultId, setActiveVaultId] = useState<string | null>(null);
  const [authNeededId, setAuthNeededId] = useState<string | null>(null);
  
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    roleType: 'subject' as 'class' | 'subject',
    subject: '',
    password: ''
  });

  const [isAuthFirstTime, setIsAuthFirstTime] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewingFile, setViewingFile] = useState<VaultFile | null>(null);
  const [isReceiving, setIsReceiving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Global Paste and Drop Listeners
  useEffect(() => {
    if (!activeVaultId) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        uploadSimulatedFiles(files);
      }
    };

    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleGlobalDragLeave = (e: DragEvent) => {
      e.preventDefault();
      // Only set to false if we are leaving the window
      if (e.relatedTarget === null) {
        setIsDragging(false);
      }
    };

    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer?.files) {
        uploadSimulatedFiles(Array.from(e.dataTransfer.files));
      }
    };

    window.addEventListener('paste', handlePaste);
    window.addEventListener('dragover', handleGlobalDragOver);
    window.addEventListener('dragleave', handleGlobalDragLeave);
    window.addEventListener('drop', handleGlobalDrop);

    return () => {
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('dragover', handleGlobalDragOver);
      window.removeEventListener('dragleave', handleGlobalDragLeave);
      window.removeEventListener('drop', handleGlobalDrop);
    };
  }, [activeVaultId]);

  const uploadSimulatedFiles = async (files: File[]) => {
    if (!activeVaultId) return;
    
    for (const file of files) {
      if (file.size > 700 * 1024) {
        alert(`File "${file.name}" is too large for secure sync. Please keep files under 700KB.`);
        continue;
      }

      const reader = new FileReader();
      const filePromise = new Promise<string>((resolve) => {
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.readAsDataURL(file);
      });

      const base64Data = await filePromise;

      const fileData = {
        name: file.name || `Pasted Asset ${new Date().toLocaleTimeString()}`,
        type: file.type || 'application/octet-stream',
        size: (file.size / 1024).toFixed(1) + ' KB',
        uploadDate: new Date().toISOString(),
        url: base64Data
      };

      try {
        await supabaseStorage.addVaultFile(activeVaultId, fileData);
        await fetchFiles();
      } catch (error) {
        console.error("Failed to upload simulated file:", error);
      }
    }
  };

  // Handle Browser Navigation (Enable Back button to close modals)
  useEffect(() => {
    const hasOpenModal = isReceiving || !!viewingFile || isCreating || !!authNeededId;
    
    const handlePopState = (e: PopStateEvent) => {
      // If we find our modal state, satisfy it by closing the modal
      if (isReceiving) setIsReceiving(false);
      if (viewingFile) setViewingFile(null);
      if (isCreating) setIsCreating(false);
      if (authNeededId) setAuthNeededId(null);
    };

    if (hasOpenModal) {
      window.history.pushState({ modal: true }, "");
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isReceiving, viewingFile, isCreating, authNeededId]);

  const fetchVaults = async () => {
    if (!userProfile) {
      setVaults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await supabaseStorage.getVaults(userProfile.uid, userProfile.email || '');
      const sorted = (data || []).map((v: any) => ({
        id: String(v.id),
        ownerId: v.ownerId,
        name: v.name,
        roleType: v.roleType,
        subject: v.subject,
        passwordHash: v.passwordHash,
        createdAt: v.createdAt
      }));
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setVaults(sorted);
    } catch (error) {
      console.error("Vault Sync Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    if (!activeVaultId) {
      setActiveVaultFiles([]);
      return;
    }
    try {
      const data = await supabaseStorage.getVaultFiles(activeVaultId);
      const sorted = (data || []).map((f: any) => ({
        id: String(f.id),
        name: f.name,
        type: f.type,
        size: f.size,
        uploadDate: f.uploadDate,
        url: f.url
      }));
      sorted.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
      setActiveVaultFiles(sorted);
    } catch (error) {
      console.error("Files Sync Error:", error);
    }
  };

  // Sync Vaults
  useEffect(() => {
    fetchVaults();
  }, [userProfile]);

  // Sync Files for Active Vault
  useEffect(() => {
    fetchFiles();
  }, [activeVaultId]);

  const activeVault = vaults.find(v => v.id === activeVaultId);

  const handleCreateVault = async () => {
    if (!userProfile) return;

    // Check if a vault with the same details already exists for this teacher
    const existingVault = vaults.find(v => 
      v.name.toLowerCase() === formData.name.toLowerCase() && 
      v.roleType === formData.roleType && 
      v.subject.toLowerCase() === formData.subject.toLowerCase()
    );

    if (existingVault) {
      // Matching folder found - redirect to password check for that folder
      setIsCreating(false);
      setFormStep(1);
      setFormData({ name: '', roleType: 'subject', subject: '', password: '' });
      
      handleOpenVault(existingVault.id);
      return;
    }

    const newVault = {
      ownerId: userProfile.uid,
      name: formData.name,
      roleType: formData.roleType,
      subject: formData.subject,
      passwordHash: formData.password,
      createdAt: new Date().toISOString()
    };
    
    try {
      const createdVault = await supabaseStorage.addVault(newVault);
      setIsCreating(false);
      setFormStep(1);
      setFormData({ name: '', roleType: 'subject', subject: '', password: '' });
      await fetchVaults();
      
      // Auto-open and mark as first time (so no password check)
      setActiveVaultId(createdVault.id);
      setIsAuthFirstTime(true);
    } catch (error) {
      console.error("Failed to create vault:", error);
    }
  };

  const handleOpenVault = (id: string) => {
    setAuthNeededId(id);
    setPasswordInput('');
    setAuthError(false);
  };

  const verifyPassword = () => {
    const vault = vaults.find(v => v.id === authNeededId);
    if (vault && vault.passwordHash === passwordInput) {
      setActiveVaultId(vault.id);
      setAuthNeededId(null);
      setIsAuthFirstTime(false);
    } else {
      setAuthError(true);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeVaultId || !e.target.files) return;
    
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      if (file.size > 700 * 1024) {
        alert(`File "${file.name}" is too large for secure sync. Please keep files under 700KB.`);
        continue;
      }

      const reader = new FileReader();
      const filePromise = new Promise<string>((resolve) => {
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.readAsDataURL(file);
      });

      const base64Data = await filePromise;

      const fileData = {
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: (file.size / 1024).toFixed(1) + ' KB',
        uploadDate: new Date().toISOString(),
        url: base64Data
      };

      try {
        await supabaseStorage.addVaultFile(activeVaultId, fileData);
      } catch (error) {
        console.error("Failed to upload file:", error);
      }
    }
    await fetchFiles();
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!activeVaultId) return;
    try {
      await supabaseStorage.deleteVaultFile(fileId);
      await fetchFiles();
    } catch (error) {
      console.error("Failed to delete file:", error);
    }
  };

  const renderFileIcon = (type: string) => {
    if (type.includes('image')) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (type.includes('text')) return <FileText className="w-5 h-5 text-blue-500" />;
    return <File className="w-5 h-5 text-gray-400" />;
  };

  if (activeVaultId && activeVault) {
    return (
      <div className="max-w-5xl mx-auto h-full flex flex-col">
        {/* Vault Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setActiveVaultId(null);
                setIsAuthFirstTime(false);
              }}
              className="p-2 -ml-2 text-accent hover:bg-accent/10 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20 shadow-sm">
              <FolderLock className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-black text-primary uppercase tracking-tight">{activeVault.name}</h1>
              <p className="text-muted text-[10px] font-bold uppercase tracking-widest">
                {activeVault.roleType === 'class' ? 'Class Teacher' : 'Subject Teacher'} &bull; {activeVault.subject}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" />
            End-to-End Encrypted
          </div>
          
          <button 
            onClick={() => setIsReceiving(true)}
            className="flex items-center gap-3 px-6 py-3 bg-surface border-2 border-emerald-500 text-emerald-500 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/10 hover:-translate-y-1 transition-all"
          >
            <Smartphone className="w-4 h-4" />
            Receive from Mobile
          </button>
        </div>

        {/* File Content Area */}
        <div className={`flex-1 min-h-[400px] flex flex-col transition-all relative ${isDragging ? 'scale-[0.98]' : ''}`}>
          {/* Drag Overlay */}
          <AnimatePresence>
            {isDragging && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-accent/20 backdrop-blur-sm border-4 border-dashed border-accent rounded-[3rem] flex flex-col items-center justify-center"
              >
                <div className="w-20 h-20 bg-surface rounded-[2rem] flex items-center justify-center shadow-2xl mb-4">
                  <Upload className="w-10 h-10 text-accent animate-bounce" />
                </div>
                <p className="text-xl font-black text-primary uppercase tracking-tighter">Release to Receive</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 opacity-60">Asset will be encrypted instantly</p>
              </motion.div>
            )}
          </AnimatePresence>

          {activeVaultFiles.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-[3rem] bg-surface/30">
              <div className="w-24 h-24 bg-surface rounded-3xl flex items-center justify-center shadow-sm border border-white/5 mb-6">
                <Upload className="w-10 h-10 text-accent opacity-40" />
              </div>
              <p className="text-lg font-black text-primary uppercase tracking-tight mb-2">Vault is Empty</p>
              <p className="text-sm text-muted font-medium opacity-60 mb-8 max-w-xs text-center">
                Securely upload your first document. Supports Wi-Fi, Bluetooth & AirDrop.
              </p>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 px-10 py-5 bg-accent text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-accent/20 hover:-translate-y-1 transition-all"
              >
                <Plus className="w-5 h-5" />
                Select / Receive Files
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeVaultFiles.map((file, idx) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setViewingFile(file)}
                    className="bg-surface p-5 rounded-3xl border border-white/5 flex items-center gap-4 group hover:border-accent transition-all cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                      {renderFileIcon(file.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-primary truncate">{file.name}</p>
                      <p className="text-[9px] font-black uppercase text-muted mt-0.5">
                        {file.size} &bull; {new Date(file.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file.id);
                      }}
                      className="p-2 text-muted opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all font-bold"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-center pt-12">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 px-10 py-5 bg-surface border border-white/10 text-accent rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-sm hover:shadow-md hover:bg-slate-800 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Add Assets
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 mt-6">
            <div className="flex-1 h-[1px] bg-border-subtle" />
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted opacity-40">
              <CheckCircle2 className="w-3 h-3" />
              Direct Paste & Drop Supported
            </div>
            <div className="flex-1 h-[1px] bg-border-subtle" />
          </div>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple
          onChange={handleFileUpload}
        />

        {/* QR Receive Modal */}
        <AnimatePresence>
          {isReceiving && (
            <div 
              className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md cursor-pointer"
              onClick={() => setIsReceiving(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-surface w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl p-8 flex flex-col items-center cursor-default border border-border-subtle"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-full flex justify-end mb-4">
                  <button onClick={() => setIsReceiving(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-primary">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center text-emerald-500 mb-6">
                  <Smartphone className="w-10 h-10" />
                </div>
                
                <h3 className="text-2xl font-black uppercase tracking-tighter text-primary mb-2">Wireless Drop</h3>
                <p className="text-center text-xs text-muted font-medium opacity-60 mb-8 max-w-xs">
                  Scan this code on another device to securely push files directly to this vault session.
                </p>

                <div className="p-6 bg-white border-8 border-background rounded-[3rem] shadow-inner mb-8">
                  <QRCodeSVG 
                    value={`${window.location.origin}/#/drop/${activeVaultId}`}
                    size={200}
                    level="H"
                  />
                </div>
 
                <div className="w-full space-y-4">
                  <button 
                    onClick={() => {
                      const link = `${window.location.origin}/#/drop/${activeVaultId}`;
                      navigator.clipboard.writeText(link);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="w-full py-4 bg-background border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-accent hover:bg-white transition-all shadow-sm"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedLink ? 'Link Copied' : 'Copy Direct Link'}
                  </button>
                  
                  <p className="text-[10px] font-black uppercase text-accent text-center tracking-widest opacity-40">
                    Works over Wi-Fi, Bluetooth & Mobile Data
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* File Preview Modal */}
        <AnimatePresence>
          {viewingFile && (
            <div 
              className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm cursor-pointer"
              onClick={() => setViewingFile(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-surface w-full max-w-4xl max-h-[90vh] rounded-[3rem] overflow-hidden shadow-2xl flex flex-col cursor-default border border-border-subtle"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-surface shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center">
                      {renderFileIcon(viewingFile.type)}
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-tight text-primary">{viewingFile.name}</h3>
                      <p className="text-[9px] font-bold text-muted opacity-60 uppercase">{viewingFile.type} &bull; {viewingFile.size}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setViewingFile(null)}
                    className="p-3 hover:bg-white/5 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-auto bg-background p-8 flex flex-col items-center justify-center min-h-[400px]">
                  {viewingFile.url ? (
                    <>
                      <div className="flex-1 flex items-center justify-center w-full">
                        {viewingFile.type.includes('image') ? (
                          <img 
                            src={viewingFile.url} 
                            alt={viewingFile.name} 
                            className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-xl border border-white/5"
                          />
                        ) : viewingFile.type.includes('video') ? (
                          <video 
                            src={viewingFile.url} 
                            controls 
                            className="max-w-full max-h-[80vh] rounded-2xl shadow-xl border border-white/5"
                          />
                        ) : viewingFile.type.includes('audio') ? (
                          <div className="w-full max-w-md bg-surface p-8 rounded-[2rem] shadow-xl border border-white/10 flex flex-col items-center">
                            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center text-accent mb-6">
                              <File className="w-10 h-10" />
                            </div>
                            <audio src={viewingFile.url} controls className="w-full" />
                            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-accent opacity-40">Audio Track Loaded</p>
                          </div>
                        ) : viewingFile.type.includes('pdf') || viewingFile.type.includes('text') ? (
                          <iframe 
                            src={viewingFile.url} 
                            className="w-full h-full min-h-[500px] border-0 rounded-2xl shadow-lg bg-white"
                            title="file-preview"
                          />
                        ) : (
                          <div className="text-center p-12 bg-surface rounded-[3rem] shadow-xl border border-white/10 max-w-md w-full">
                            <div className="w-24 h-24 bg-accent/10 rounded-[2.5rem] flex items-center justify-center shadow-inner mx-auto mb-6">
                              <File className="w-12 h-12 text-accent opacity-40" />
                            </div>
                            <h4 className="text-xl font-black text-primary uppercase tracking-tighter mb-3">Asset Viewer</h4>
                            <p className="text-sm text-muted font-medium opacity-60 mb-2 mx-auto px-4">
                              Direct preview is unavailable for <span className="font-bold text-accent">{viewingFile.type.split('/')[1] || 'this'}</span> files.
                            </p>
                          </div>
                        )}
                      </div>
 
                      <div className="mt-8">
                        <button 
                          onClick={() => {
                            const newTab = window.open();
                            if (newTab) {
                              newTab.document.title = viewingFile.name;
                              if (viewingFile.type.includes('image')) {
                                newTab.document.write(`
                                  <body style="margin:0;display:flex;align-items:center;justify-content:center;background:#0f172a;">
                                    <img src="${viewingFile.url}" style="max-width:100%;max-height:100vh;object-fit:contain;">
                                  </body>
                                `);
                              } else if (viewingFile.type.includes('pdf')) {
                                newTab.document.write(`
                                  <body style="margin:0;height:100vh;overflow:hidden;">
                                    <embed src="${viewingFile.url}" width="100%" height="100%" type="application/pdf">
                                  </body>
                                `);
                              } else if (viewingFile.type.includes('video')) {
                                newTab.document.write(`
                                  <body style="margin:0;display:flex;align-items:center;justify-content:center;background:#000;">
                                    <video src="${viewingFile.url}" controls autoplay style="max-width:100%;max-height:100vh;"></video>
                                  </body>
                                `);
                              } else {
                                newTab.document.write(`
                                  <body style="margin:0;height:100vh;overflow:hidden;">
                                    <iframe src="${viewingFile.url}" width="100%" height="100%" style="border:none;"></iframe>
                                  </body>
                                `);
                              }
                              newTab.document.close();
                            }
                          }}
                          className="flex items-center gap-3 px-12 py-5 bg-accent text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-accent/20 hover:-translate-y-1 transition-all"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                          View in New Tab
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-12">
                      <div className="w-24 h-24 bg-surface rounded-[2rem] flex items-center justify-center shadow-xl border border-white/5 mx-auto mb-6">
                        <Lock className="w-10 h-10 text-accent" />
                      </div>
                      <p className="text-lg font-black text-primary uppercase tracking-tighter mb-2">Asset Session Expired</p>
                      <p className="text-sm text-muted font-medium opacity-60 max-w-sm mx-auto">
                        For security, temporary local preview links expire when you leave the portal. Please re-upload for this session.
                      </p>
                    </div>
                  )}
                </div>
 
                <div className="p-6 border-t border-white/10 bg-surface shrink-0 flex justify-center gap-4">
                  {viewingFile.url && (
                    <a 
                      href={viewingFile.url} 
                      download={viewingFile.name}
                      className="px-8 py-4 bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-accent/20 hover:-translate-y-0.5 transition-all"
                    >
                      Download Document
                    </a>
                  )}
                  <button 
                    onClick={() => setViewingFile(null)}
                    className="px-8 py-4 bg-background border border-white/10 text-primary rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-primary transition-all"
                  >
                    Close Preview
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 -ml-2 text-accent hover:bg-accent/10 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20 shadow-sm">
              <FolderLock className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-black text-primary uppercase tracking-tight">Academic Cloud</h1>
              <p className="text-muted text-[11px] font-bold uppercase tracking-widest">End-to-end encrypted personal storage.</p>
            </div>
          </div>

          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-accent text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-accent/20 hover:-translate-y-1 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Subject Folder
          </button>
        </div>

      {/* Loading State or Stats */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-surface rounded-[2rem] border border-white/5">
            <p className="text-[10px] font-black uppercase text-muted opacity-40 mb-1">Active Vaults</p>
            <p className="text-3xl font-black tracking-tighter text-accent">{vaults.length}</p>
          </div>
          <div className="p-6 bg-surface rounded-[2rem] border border-white/5">
            <p className="text-[10px] font-black uppercase text-muted opacity-40 mb-1">Security Status</p>
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <p className="text-sm font-bold text-emerald-500">Fully Encrypted</p>
            </div>
          </div>
          <div className="p-6 bg-surface rounded-[2rem] border border-white/5 flex items-center justify-center">
             <p className="text-[9px] font-black uppercase tracking-widest text-muted opacity-40 text-center">
               Personal Storage Active
             </p>
          </div>
        </div>
      )}

      {/* Vault List */}
      {!loading && (
        vaults.length === 0 ? (
          <div className="text-center py-24 bg-surface/50 rounded-[3rem] border border-dashed border-white/10">
            <FolderLock className="w-16 h-16 text-accent opacity-5 mx-auto mb-6" />
            <h3 className="text-lg font-black uppercase tracking-tight text-primary mb-2">No Vaults Initialized</h3>
            <p className="text-sm text-muted font-medium opacity-60 max-w-xs mx-auto">
              Your secure storage space is empty. Create your first vault to protect academic assets.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vaults.map((vault, idx) => (
              <motion.div
                key={vault.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => handleOpenVault(vault.id)}
                className="group relative bg-surface border border-white/5 rounded-[2.5rem] p-8 text-left transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer overflow-hidden border-b-4 border-b-accent/10"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <FolderLock className="w-7 h-7" />
                  </div>
                </div>
                
                <h3 className="text-xl font-black uppercase tracking-tighter text-primary mb-1">
                  {vault.name}
                </h3>
                <p className="text-muted text-[10px] font-black uppercase tracking-[0.1em] opacity-60 mb-6">
                  {vault.subject} &bull; {new Date(vault.createdAt).toLocaleDateString()}
                </p>

                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent">
                  <span>Unlock Vault</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>

                {/* Decorative Password Hint Icon */}
                <Lock className="absolute top-4 right-4 w-4 h-4 text-accent opacity-10" />
              </motion.div>
            ))}
          </div>
        )
      )}

      {/* Create Vault Modal */}
      <AnimatePresence>
        {isCreating && (
          <div 
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md cursor-pointer"
            onClick={() => {
              setIsCreating(false);
              setFormStep(1);
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl relative cursor-default border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 pb-0 flex justify-between items-start">
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                  <Plus className="w-6 h-6" />
                </div>
                <button 
                  onClick={() => {
                    setIsCreating(false);
                    setFormStep(1);
                  }}
                  className="p-2 text-muted hover:bg-white/5 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8">
                <h3 className="text-2xl font-black uppercase tracking-tighter text-primary mb-1">
                  Initialize Vault
                </h3>
                <p className="text-muted text-[11px] font-bold uppercase tracking-widest opacity-60 mb-2">
                  Step {formStep} of 2 &bull; Security Configuration
                </p>
                <p className="text-[9px] font-black uppercase text-accent mb-8 bg-accent/10 py-2 px-4 rounded-lg inline-block">
                   End-to-End Encrypted Transfers
                </p>

                {formStep === 1 ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-accent">Teacher's Name</label>
                      <input 
                        type="text" 
                        placeholder="Teacher's Name"
                        className="w-full bg-background border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-accent/20 outline-none transition-all text-primary placeholder:text-muted/30"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-accent">Teacher Role Type</label>
                       <div className="grid grid-cols-2 gap-3">
                          <button 
                             onClick={() => setFormData({...formData, roleType: 'class'})}
                             className={`p-4 border-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all ${formData.roleType === 'class' ? 'border-accent bg-accent/10 text-accent' : 'border-white/5 text-muted'}`}
                          >
                             Class Teacher
                          </button>
                          <button 
                             onClick={() => setFormData({...formData, roleType: 'subject'})}
                             className={`p-4 border-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all ${formData.roleType === 'subject' ? 'border-accent bg-accent/10 text-accent' : 'border-white/5 text-muted'}`}
                          >
                             Subject Teacher
                          </button>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-accent">Academic Subject</label>
                       <input 
                         type="text" 
                         placeholder="Enter the subject you teach"
                         className="w-full bg-background border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-accent/20 outline-none transition-all text-primary placeholder:text-muted/30"
                         value={formData.subject}
                         onChange={(e) => setFormData({...formData, subject: e.target.value})}
                       />
                    </div>

                    <button 
                      disabled={!formData.name || !formData.subject}
                      onClick={() => setFormStep(2)}
                      className="w-full py-5 bg-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-30 transition-all flex items-center justify-center gap-2"
                    >
                      Next Phase
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-3 text-amber-500">
                      <Lock className="w-5 h-5 shrink-0" />
                      <p className="text-[10px] font-bold leading-relaxed">
                        Secure your vault with a robust password.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-accent">Master Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        className="w-full bg-background border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-accent/20 outline-none transition-all text-primary placeholder:text-muted/30"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        autoFocus
                      />
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => setFormStep(1)}
                        className="flex-1 py-4 bg-background text-muted rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/5"
                      >
                        Previous
                      </button>
                      <button 
                        disabled={!formData.password}
                        onClick={handleCreateVault}
                        className="flex-[2] py-5 bg-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-30 transition-all"
                      >
                        Create Secure Vault
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Auth Modal */}
      <AnimatePresence>
        {authNeededId && (
          <div 
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md cursor-pointer"
            onClick={() => setAuthNeededId(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl p-8 cursor-default border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-3xl flex items-center justify-center text-accent mb-6">
                  <Lock className="w-8 h-8" />
                </div>
                
                <h3 className="text-xl font-black uppercase tracking-tighter text-primary mb-2">
                  Vault Locked
                </h3>
                <p className="text-xs text-muted font-medium opacity-60 mb-8">
                  Please enter the master password to access your encrypted assets.
                </p>

                <div className="w-full space-y-4">
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase tracking-widest text-accent ml-2">Vault Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      className={`w-full bg-background border rounded-2xl px-5 py-4 text-sm font-medium outline-none transition-all text-primary placeholder:text-muted/30 ${authError ? 'border-red-500 ring-2 ring-red-500/20' : 'border-white/10 focus:ring-2 focus:ring-accent/20'}`}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
                      autoFocus
                    />
                    {authError && (
                      <p className="text-[9px] font-black uppercase text-red-500 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Invalid Security Password
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setAuthNeededId(null)}
                      className="flex-1 py-4 bg-background text-muted rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/5"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={verifyPassword}
                      className="flex-[1.5] py-4 bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-accent/20"
                    >
                      Unlock Assets
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
