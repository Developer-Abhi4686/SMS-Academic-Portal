import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, Send, Brain, User, RotateCcw, Copy, ArrowLeft } from 'lucide-react';
import { getGeminiResponse, prompts } from '../../lib/geminiService';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import SaveButton from '../../components/SaveButton';
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
    const res = await getGeminiResponse(prompt, prompts.doubtSolver, userClass, "gemini-3.1-pro-preview");
    setResponse(res);
    setLoading(false);
  };

  const handleAssistantSubmit = async () => {
    if (!doubtText) return;
    setLoading(true);
    const res = await getGeminiResponse(doubtText, prompts.doubtSolver, userClass, "gemini-3.1-pro-preview");
    setResponse(res);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        {onBack && (
          <button 
            onClick={onBack}
            className="p-2 -ml-2 text-[#1a237e] hover:bg-[#f0f2ff] rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <div className="w-12 h-12 rounded-xl bg-[#f0f2ff] flex items-center justify-center border border-[#e9ecef] shadow-sm">
          <Lightbulb className="w-6 h-6 text-[#1a237e]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-[#1a237e] uppercase tracking-tight">Doubt Solver</h1>
          <p className="text-[#636e72] text-[11px] font-bold uppercase tracking-widest">Instant clarity in simple language.</p>
        </div>
      </div>

      <div className="flex gap-3 p-1 bg-white border border-[#e9ecef] rounded-xl mb-8 shadow-sm">
        <button
          onClick={() => { setActiveTab('engine'); setResponse(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all text-sm font-black uppercase tracking-widest ${
            activeTab === 'engine' ? 'bg-[#1a237e] text-white shadow-md' : 'text-[#636e72] hover:bg-[#f8f9fa]'
          }`}
        >
          <Brain className="w-4 h-4" /> Doubt Engine
        </button>
        <button
          onClick={() => { setActiveTab('assistant'); setResponse(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all text-sm font-black uppercase tracking-widest ${
            activeTab === 'assistant' ? 'bg-[#1a237e] text-white shadow-md' : 'text-[#636e72] hover:bg-[#f8f9fa]'
          }`}
        >
          <User className="w-4 h-4" /> Doubt Assistant
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'engine' ? (
          <motion.div
            key="engine"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white p-6 rounded-xl border border-[#e9ecef] shadow-sm space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#636e72] pl-1">Subject</label>
                <input 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Physics" 
                  className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-lg p-3 text-[#1a1a1a] focus:border-[#1a237e] outline-none font-bold transition-all placeholder:font-normal"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#636e72] pl-1">Chapter No.</label>
                <input 
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  placeholder="e.g. 5" 
                  className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-lg p-3 text-[#1a1a1a] focus:border-[#1a237e] outline-none font-bold transition-all placeholder:font-normal"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#636e72] pl-1">Chapter Name</label>
                <input 
                  value={chapterName}
                  onChange={(e) => setChapterName(e.target.value)}
                  placeholder="e.g. Laws of Motion" 
                  className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-lg p-3 text-[#1a1a1a] focus:border-[#1a237e] outline-none font-bold transition-all placeholder:font-normal"
                />
              </div>
            </div>
            <button 
              onClick={handleEngineSubmit}
              disabled={loading || !subject || !chapterName}
              className="w-full bg-gradient-to-r from-[#1a237e] to-[#3949ab] hover:opacity-90 text-white font-black py-4 rounded-lg transition-all text-xs uppercase tracking-widest disabled:opacity-50 shadow-md"
            >
              {loading ? <RotateCcw className="w-4 h-4 animate-spin mx-auto text-[#00b8d4]" /> : 'Run Doubt Engine'}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="assistant"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white p-6 rounded-xl border border-[#e9ecef] shadow-sm space-y-4"
          >
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#636e72] pl-1">Ask your doubt</label>
              <textarea 
                value={doubtText}
                onChange={(e) => setDoubtText(e.target.value)}
                placeholder="Type your question here in your own words..." 
                rows={5}
                className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-lg p-4 text-[#1a1a1a] focus:border-[#1a237e] outline-none resize-none font-bold transition-all placeholder:font-normal"
              />
            </div>
            <button 
              onClick={handleAssistantSubmit}
              disabled={loading || !doubtText}
              className="w-full bg-gradient-to-r from-[#1a237e] to-[#3949ab] hover:opacity-90 text-white font-black py-4 rounded-lg transition-all text-xs uppercase tracking-widest disabled:opacity-50 shadow-md"
            >
              {loading ? <RotateCcw className="w-4 h-4 animate-spin mx-auto text-[#00b8d4]" /> : 'Get Simple Explanation'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {response && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-xl border border-[#e9ecef] shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-[#1a237e]" />
          <div className="absolute top-4 right-4 flex gap-2">
            <SaveButton 
              type="doubt" 
              title={activeTab === 'engine' ? `Doubt: ${chapterName}` : `Doubt: ${doubtText.slice(0, 30)}...`} 
              content={response} 
            />
            <button 
              onClick={() => navigator.clipboard.writeText(response)}
              className="p-2 bg-[#f8f9fa] rounded-lg border border-[#e9ecef] text-[#636e72] hover:text-[#1a237e] transition-all shadow-sm"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <MarkdownRenderer content={response} />
        </motion.div>
      )}
    </div>
  );
}
