import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BrainCircuit, 
  Search, 
  Trash2, 
  ExternalLink, 
  Clock, 
  FileText, 
  ClipboardList, 
  MessageSquare,
  Lightbulb,
  FileSearch,
  BookOpen,
  ArrowLeft,
  Loader2,
  Inbox
} from 'lucide-react';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserProfile, Memory } from '../../types';
import MarkdownRenderer from '../../components/MarkdownRenderer';

interface MemoryBoxProps {
  userProfile: UserProfile | null;
}

export default function MemoryBox({ userProfile }: MemoryBoxProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  useEffect(() => {
    const fetchMemories = async () => {
      if (!userProfile) {
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'memories'),
          where('userId', '==', userProfile.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Memory[];
        setMemories(items);
      } catch (error) {
        console.error('Error fetching memories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemories();
  }, [userProfile]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this memory?')) return;
    try {
      await deleteDoc(doc(db, 'memories', id));
      setMemories(memories.filter(m => m.id !== id));
      if (selectedMemory?.id === id) setSelectedMemory(null);
    } catch (error) {
      console.error('Error deleting memory:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'quiz': return ClipboardList;
      case 'lesson-plan': return BookOpen;
      case 'test-paper': return FileText;
      case 'sample-paper': return FileSearch;
      case 'doubt': return Lightbulb;
      case 'assignment': return MessageSquare;
      default: return BrainCircuit;
    }
  };

  const filteredMemories = memories.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!userProfile) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-[#f0f2ff] rounded-3xl flex items-center justify-center mx-auto border border-[#e9ecef]">
          <BrainCircuit className="w-10 h-10 text-[#1a237e]" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#1a237e] uppercase tracking-tight">Access Locked</h2>
          <p className="text-[#636e72] font-bold text-xs mt-2 uppercase tracking-widest leading-relaxed">
            Please log in to access your personal Memory Box.<br/>Guest data is not persisted across sessions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#f0f2ff] text-[#1a237e] border border-[#e9ecef]">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#1a237e] uppercase tracking-tight">Memory Box</h1>
            <p className="text-[#636e72] font-bold text-[10px] uppercase tracking-widest">Your digitized academic legacy</p>
          </div>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#636e72]" />
          <input
            type="text"
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#e9ecef] rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-[#1a1a1a] focus:border-[#1a237e] outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
        {/* Memory List */}
        <div className="lg:col-span-1 border-r border-[#e9ecef] pr-4 space-y-4 overflow-y-auto custom-scrollbar pr-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-[#1a237e] animate-spin" />
              <p className="text-[10px] font-black text-[#636e72] uppercase tracking-widest">Loading memories...</p>
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
              <Inbox className="w-12 h-12 text-[#636e72]" />
              <p className="text-[10px] font-black text-[#636e72] uppercase tracking-widest">No memories found</p>
            </div>
          ) : (
            filteredMemories.map((memory) => {
              const Icon = getIcon(memory.type);
              return (
                <button
                  key={memory.id}
                  onClick={() => setSelectedMemory(memory)}
                  className={`w-full p-4 rounded-2xl border transition-all text-left flex items-start gap-4 group relative ${
                    selectedMemory?.id === memory.id 
                      ? 'bg-[#1a237e] border-[#1a237e] text-white shadow-lg' 
                      : 'bg-white border-[#e9ecef] text-[#2d3436] hover:border-[#1a237e]/50'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${selectedMemory?.id === memory.id ? 'bg-white/10 text-white' : 'bg-[#f8f9fa] text-[#1a237e]'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-xs font-black uppercase truncate mb-1 ${selectedMemory?.id === memory.id ? 'text-white' : 'text-[#1a237e]'}`}>
                      {memory.title}
                    </h4>
                    <div className="flex items-center gap-2 opacity-60 text-[9px] font-bold">
                      <Clock className="w-3 h-3" />
                      {new Date(memory.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#e9ecef] shadow-sm overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {selectedMemory ? (
              <motion.div
                key={selectedMemory.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-full"
              >
                <div className="p-6 border-b border-[#f1f3f5] flex items-center justify-between bg-[#f8f9fa]">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm text-[#1a237e] border border-[#e9ecef]">
                      {React.createElement(getIcon(selectedMemory.type), { className: 'w-5 h-5' })}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#1a237e] uppercase tracking-tight">{selectedMemory.title}</h3>
                      <p className="text-[9px] font-bold text-[#636e72] uppercase tracking-widest">{selectedMemory.type.replace('-', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(selectedMemory.id!)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Memory"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <MarkdownRenderer content={selectedMemory.content} />
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-[#f8f9fa] rounded-2xl flex items-center justify-center border border-[#e9ecef]">
                  <ExternalLink className="w-8 h-8 text-[#dee2e6]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#636e72] uppercase tracking-widest">Select a Memory</h3>
                  <p className="text-[10px] font-bold text-[#adb5bd] uppercase mt-1">Review your previously generated work here.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
