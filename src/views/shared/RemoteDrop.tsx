import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  CheckCircle2, 
  ShieldCheck, 
  Smartphone, 
  ArrowLeft,
  File,
  X,
  AlertCircle
} from 'lucide-react';
import { supabaseStorage } from '../../lib/supabaseStorage';

export default function RemoteDrop() {
  const { vaultId } = useParams<{ vaultId: string }>();
  const navigate = useNavigate();
  const [vaultName, setVaultName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchVault() {
      if (!vaultId) return;
      try {
        const vault = await supabaseStorage.getVaultById(vaultId);
        if (vault) {
          setVaultName(vault.name);
        } else {
          setError('Secure vault not found.');
        }
      } catch (err) {
        setError('Connection error. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchVault();
  }, [vaultId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!vaultId || !e.target.files) return;
    
    setUploading(true);
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      // Check if file is too large for Firestore (1MB limit for document)
      if (file.size > 700 * 1024) {
        alert(`File "${file.name}" is too large for secure wireless transfer. Please keep files under 700KB.`);
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
        await supabaseStorage.addVaultFile(vaultId, fileData);
        setUploadedFiles(prev => [...prev, file.name]);
      } catch (error) {
        console.error("Failed to upload file to database:", error);
      }
    }
    
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-red-500">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight text-primary">{error}</h1>
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col p-6 font-sans">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col pt-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-accent/10 rounded-[2.5rem] border border-accent/20 flex items-center justify-center mx-auto mb-6 text-accent relative">
            <Smartphone className="w-10 h-10" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full border-4 border-background flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-primary uppercase mb-1">Wireless Drop</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted opacity-60">
            Securely push assets to <span className="text-accent">{vaultName}</span>
          </p>
        </div>

        {/* Drop Area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 min-h-[300px] border-4 border-dashed rounded-[3rem] flex flex-col items-center justify-center p-12 transition-all cursor-pointer ${uploading ? 'bg-accent/10 border-accent/30' : 'bg-surface border-white/5 hover:border-accent/30'}`}
        >
          {uploading ? (
            <>
              <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-6"></div>
              <p className="text-xs font-black uppercase tracking-widest text-accent">Encrypting & Syncing...</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-accent mb-6 opacity-20" />
              <p className="text-lg font-black text-primary uppercase tracking-tight mb-2">Tap to select</p>
              <p className="text-[10px] font-black text-muted opacity-40 text-center uppercase tracking-widest">
                Files are sent directly to the teacher's session via secure pulse.
              </p>
            </>
          )}
        </div>

        <input 
          type="file" 
          multiple 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileUpload}
        />

        {/* Recently Path Status */}
        <AnimatePresence>
          {uploadedFiles.length > 0 && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mt-8 p-6 bg-surface border border-white/5 rounded-[2.5rem] shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <p className="text-xs font-black uppercase tracking-tight text-primary">Transmission Success</p>
              </div>
              <div className="space-y-2">
                {uploadedFiles.slice(-3).map((name, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-[10px] font-bold text-muted truncate w-40">{name}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Delivered</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="py-12 text-center">
          <div className="flex items-center justify-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" />
            Session Encrypted
          </div>
        </div>
      </div>
    </div>
  );
}
