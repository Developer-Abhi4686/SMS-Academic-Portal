import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, Send, Brain, User, RotateCcw, Copy, ArrowLeft, Sparkles, Zap } from 'lucide-react';
import { getGeminiResponse, prompts } from '../../lib/geminiService';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import { useSessionState } from '../../lib/hooks';

export default function DoubtSolver({ userClass, onBack }: { userClass: string | null, onBack?: () => void }) {
  const [activeTab, setActiveTab] = useSessionState<'engine' | 'assistant'>('doubtsolver_tab', 'engine');
  
  // Engine State
  const [subject, setSubject] = useSessionState('doubtsolver_subject', '');
  const [chapter, setChapter] = useSessionState('doubtsolver_chapter', '');
  const [chapterName, setChapterName] = useSessionState('doubtsolver_chaptername', '');
  
  // Assistant State
  const [doubtText, setDoubtText] = useSessionState('doubtsolver_text', '');
  
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useSessionState('doubtsolver_response', '');

  const handleEngineSubmit = async () => {
    if (!subject || !chapterName) return;
    setLoading(true);
    const prompt = `Subject: ${subject}\nChapter: ${chapter}\nChapter Name: ${chapterName}\nPlease provide the most probable conceptual doubt a student might have in this chapter and solve it in the simplest possible language.`;
    const res = await getGeminiResponse(prompt, prompts.doubtSolver, userClass, "gemini-2.5-flash-lite");
    setResponse(res);
    setLoading(false);
  };

  const handleAssistantSubmit = async () => {
    if (!doubtText) return;
    setLoading(true);
    const res = await getGeminiResponse(doubtText, prompts.doubtSolver, userClass, "gemini-3.1-flash-lite-preview");
    setResponse(res);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-4 bg-white border border-[#e7e5e4] text-[#1a237e] rounded-[1.5rem] shadow-sm hover:shadow-md transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3 h-3 text-[#1a237e] opacity-40" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1a237e]">Smart Assistant</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Doubt <span className="font-editorial text-[#1a237e]">Solver</span></h1>
            <p className="text-[#57534e] text-xs font-medium">Simplified explanations for complex curriculum.</p>
          </div>
        </div>
        <div className="w-16 h-16 rounded-[2rem] bg-[#1a237e] flex items-center justify-center text-white shadow-xl shadow-[#1a237e]/20">
          <Lightbulb className="w-8 h-8" />
        </div>
      </section>

      {/* Modern Tabs */}
      <div className="flex p-1 bg-[#f8f9fa] rounded-[2rem] border border-[#e7e5e4] shadow-inner">
        <button
          onClick={() => { setActiveTab('engine'); setResponse(''); }}
          className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.8rem] transition-all text-[11px] font-black uppercase tracking-widest ${
            activeTab === 'engine' ? 'bg-white text-[#1a237e] shadow-xl' : 'text-[#57534e] hover:bg-white/50'
          }`}
        >
          <Brain className="w-4 h-4" /> Doubt Engine
        </button>
        <button
          onClick={() => { setActiveTab('assistant'); setResponse(''); }}
          className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.8rem] transition-all text-[11px] font-black uppercase tracking-widest ${
            activeTab === 'assistant' ? 'bg-white text-[#1a237e] shadow-xl' : 'text-[#1c1917] hover:bg-white/50'
          }`}
        >
          <User className="w-4 h-4" /> Personal Assistant
        </button>
      </div>

      {/* Input Module */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white p-10 rounded-[3.5rem] border border-[#e7e5e4] shadow-sm space-y-8"
        >
          {activeTab === 'engine' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#57534e] ml-2">Subject</label>
                <input 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Physics" 
                  className="w-full bg-[#f8f9fa] border-none rounded-2xl p-5 text-sm font-bold text-[#1c1917] focus:ring-2 ring-[#1a237e]/20 outline-none"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#57534e] ml-2">Chapter Sequence</label>
                <input 
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  placeholder="e.g. Chapter 05" 
                  className="w-full bg-[#f8f9fa] border-none rounded-2xl p-5 text-sm font-bold text-[#1c1917] focus:ring-2 ring-[#1a237e]/20 outline-none"
                />
              </div>
              <div className="space-y-3 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#57534e] ml-2">Topic / Chapter Title</label>
                <input 
                  value={chapterName}
                  onChange={(e) => setChapterName(e.target.value)}
                  placeholder="e.g. Laws of Motion and Dynamics" 
                  className="w-full bg-[#f8f9fa] border-none rounded-2xl p-5 text-sm font-bold text-[#1c1917] focus:ring-2 ring-[#1a237e]/20 outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#57534e] ml-2">Inquiry / Doubt</label>
              <textarea 
                value={doubtText}
                onChange={(e) => setDoubtText(e.target.value)}
                placeholder="Explain the concept of quantum entanglement as if I am in Class 10..." 
                rows={4}
                className="w-full bg-[#f8f9fa] border-none rounded-3xl p-6 text-sm font-bold text-[#1c1917] focus:ring-2 ring-[#1a237e]/20 outline-none resize-none"
              />
            </div>
          )}
          
          <button 
            onClick={activeTab === 'engine' ? handleEngineSubmit : handleAssistantSubmit}
            disabled={loading || (activeTab === 'engine' ? (!subject || !chapterName) : !doubtText)}
            className="w-full bg-[#1a237e] text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-[#1a237e]/20 hover:bg-[#283593] transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <RotateCcw className="w-4 h-4 animate-spin" /> Analyzing Logic...
              </span>
            ) : (
              'Process Query'
            )}
          </button>
        </motion.div>
      </AnimatePresence>

      {/* Response Display */}
      <AnimatePresence>
        {response && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#f8f9fa] p-10 rounded-[4rem] border border-[#e7e5e4] shadow-inner relative overflow-hidden"
          >
            <div className="absolute top-8 right-8">
              <button 
                onClick={() => navigator.clipboard.writeText(response)}
                className="p-4 bg-white rounded-2xl border border-[#e7e5e4] text-[#57534e] hover:text-[#1a237e] shadow-sm transition-all"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            
            <div className="max-w-[800px]">
               <MarkdownRenderer content={response} />
            </div>

            <div className="mt-12 flex items-center justify-between opacity-30 pt-8 border-t border-[#e7e5e4]">
               <div className="flex items-center gap-2">
                 <Zap className="w-3 h-3" />
                 <span className="text-[8px] font-black uppercase tracking-widest">AI Assisted Solution</span>
               </div>
               <span className="text-[8px] font-black uppercase tracking-widest">SMS Student Hub</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
