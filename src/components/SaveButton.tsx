import React, { useState } from 'react';
import { Save, Check, Loader2, BrainCircuit } from 'lucide-react';
import { auth, saveToMemory } from '../lib/firebase';
import { Memory } from '../types';

interface SaveButtonProps {
  type: Memory['type'];
  title: string;
  content: string;
  className?: string;
}

export default function SaveButton({ type, title, content, className = "" }: SaveButtonProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    setError(false);
    try {
      await saveToMemory(auth.currentUser.uid, type, title, content);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save to memory:', err);
      setError(true);
      setTimeout(() => setError(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (!auth.currentUser) return null;

  return (
    <button
      onClick={handleSave}
      disabled={saving || saved}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
        saved 
          ? 'bg-green-600 text-white' 
          : error 
            ? 'bg-red-600 text-white'
            : 'bg-[#f0f2ff] text-[#1a237e] border border-[#dce1ff] hover:bg-[#1a237e] hover:text-white'
      } ${className}`}
    >
      {saving ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : saved ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <BrainCircuit className="w-3.5 h-3.5" />
      )}
      {saving ? 'Saving...' : saved ? 'Saved to Memory' : error ? 'Error' : 'Save to Memory'}
    </button>
  );
}
