import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, Send, Brain, User, RotateCcw, Copy, ArrowLeft, Sparkles, Zap, HelpCircle } from 'lucide-react';
import { getGeminiResponse, prompts } from '../../lib/geminiService';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import { useSessionState } from '../../lib/hooks';

export default function DoubtSolver({ userClass, onBack }: { userClass: string | null, onBack?: () => void }) {
  const [activeTab, setActiveTab] = useSessionState<'engine' | 'assistant'>('doubtsolver_tab', 'engine');
  
  // Engine State
  const [subject, setSubject] = useSessionState('doubtsolver_subject', '');
  const [mathPart, setMathPart] = useSessionState<'Part I' | 'Part II'>('doubtsolver_math_part', 'Part I');
  const [chapter, setChapter] = useSessionState('doubtsolver_chapter', '');
  const [chapterName, setChapterName] = useSessionState('doubtsolver_chaptername', '');
  
  // Assistant State
  const [doubtText, setDoubtText] = useSessionState('doubtsolver_text', '');
  
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useSessionState('doubtsolver_response', '');

  const handleEngineSubmit = async () => {
    if (!subject || !chapterName) return;
    setLoading(true);
    const isMath = subject.toLowerCase().includes('math') || subject.toLowerCase().includes('ganita');
    const prompt = `Subject: ${subject}${isMath ? ` (${mathPart})` : ''}\nChapter: ${chapter}\nChapter Name: ${chapterName}\nPlease provide the most probable conceptual doubt a student might have in this chapter and solve it in the simplest possible language.${isMath ? `\nNote: Use the syllabus defined for Class ${userClass} Math ${mathPart}.` : ''}`;
    const res = await getGeminiResponse(prompt, prompts.doubtSolver, userClass);
    setResponse(res);
    setLoading(false);
  };

  const handleAssistantSubmit = async () => {
    if (!doubtText) return;
    setLoading(true);
    const res = await getGeminiResponse(doubtText, prompts.doubtSolver, userClass);
    setResponse(res);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-12">
      {/* Header Section */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-3 sm:p-4 bg-white border border-[#e7e5e4] text-[#0066CC] rounded-[1.2rem] sm:rounded-[1.5rem] shadow-sm hover:shadow-md transition-all"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-3 h-3 text-[#0066CC] opacity-40" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#0066CC]">Smart Assistant</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter">Doubt <span className="font-editorial text-[#0066CC]">Solver</span></h1>
            <p className="text-[#57534e] text-xs font-medium">Simplified explanations for complex curriculum.</p>
          </div>
        </div>
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[2rem] bg-[#0066CC] flex items-center justify-center text-white shadow-xl shadow-[#0066CC]/20 self-start sm:self-auto">
          <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>
      </section>

      {/* Modern Tabs */}
      <div className="flex p-1 bg-[#f8f9fa] rounded-2xl sm:rounded-[2rem] border border-[#e7e5e4] shadow-inner">
        <button
          onClick={() => { setActiveTab('engine'); setResponse(''); }}
          className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-3 py-2.5 sm:py-4 rounded-xl sm:rounded-[1.8rem] transition-all text-[9px] sm:text-[11px] font-black uppercase tracking-wider sm:tracking-widest ${
            activeTab === 'engine' ? 'bg-white text-[#0066CC] shadow-xl' : 'text-[#57534e] hover:bg-white/50'
          }`}
        >
          <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Doubt Engine
        </button>
        <button
          onClick={() => { setActiveTab('assistant'); setResponse(''); }}
          className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-3 py-2.5 sm:py-4 rounded-xl sm:rounded-[1.8rem] transition-all text-[9px] sm:text-[11px] font-black uppercase tracking-wider sm:tracking-widest ${
            activeTab === 'assistant' ? 'bg-white text-[#0066CC] shadow-xl' : 'text-[#1c1917] hover:bg-white/50'
          }`}
        >
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Personal Assistant
        </button>
      </div>

      {/* Input Module */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white p-5 sm:p-10 rounded-[2rem] sm:rounded-[3.5rem] border border-[#e7e5e4] shadow-sm space-y-6 sm:space-y-8"
        >
          {activeTab === 'engine' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#57534e] ml-2">Subject</label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input 
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Science" 
                      className="flex-1 bg-[#f8f9fa] border-none rounded-xl sm:rounded-2xl p-4 sm:p-5 text-sm font-bold text-[#1c1917] focus:ring-2 ring-[#0066CC]/20 outline-none"
                    />
                    {(subject.toLowerCase().includes('math') || subject.toLowerCase().includes('ganita')) && (
                      <select
                        value={mathPart}
                        onChange={(e) => setMathPart(e.target.value as any)}
                        className="bg-[#0066CC] text-white rounded-xl sm:rounded-2xl px-3 sm:px-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest outline-none border-none shadow-lg shadow-[#0066CC]/20"
                      >
                        <option value="Part I">Part I</option>
                        <option value="Part II">Part II</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#57534e] ml-2">Chapter Sequence</label>
                <input 
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  placeholder="" 
                  className="w-full bg-[#f8f9fa] border-none rounded-xl sm:rounded-2xl p-4 sm:p-5 text-sm font-bold text-[#1c1917] focus:ring-2 ring-[#0066CC]/20 outline-none"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#57534e] ml-2">Topic / Chapter Title</label>
                <input 
                  value={chapterName}
                  onChange={(e) => setChapterName(e.target.value)}
                  placeholder="" 
                  className="w-full bg-[#f8f9fa] border-none rounded-xl sm:rounded-2xl p-4 sm:p-5 text-sm font-bold text-[#1c1917] focus:ring-2 ring-[#0066CC]/20 outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#57534e] ml-2">Inquiry / Doubt</label>
              <textarea 
                value={doubtText}
                onChange={(e) => setDoubtText(e.target.value)}
                placeholder="" 
                rows={4}
                className="w-full bg-[#f8f9fa] border-none rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-sm font-bold text-[#1c1917] focus:ring-2 ring-[#0066CC]/20 outline-none resize-none"
              />
            </div>
          )}
          
          <button 
            onClick={activeTab === 'engine' ? handleEngineSubmit : handleAssistantSubmit}
            disabled={loading || (activeTab === 'engine' ? (!subject || !chapterName) : !doubtText)}
            className="w-full bg-[#0066CC] text-white py-4 sm:py-6 rounded-xl sm:rounded-[2rem] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[9px] sm:text-[10px] shadow-xl shadow-[#0066CC]/20 hover:bg-[#0055B3] transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2 sm:gap-3 animate-pulse">
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin shrink-0" /> Analyzing...
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
            className="bg-[#f8f9fa] p-5 sm:p-11 rounded-[2rem] sm:rounded-[4rem] border border-[#e7e5e4] shadow-inner relative overflow-hidden"
          >
            <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
              <button 
                onClick={() => navigator.clipboard.writeText(response)}
                className="p-3 bg-white rounded-xl sm:rounded-2xl border border-[#e7e5e4] text-[#57534e] hover:text-[#0066CC] shadow-sm transition-all hover:bg-neutral-50 active:scale-95 cursor-pointer"
                title="Copy Solution"
              >
                <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
            
            <div className="max-w-[800px] mt-10 sm:mt-0">
               <MarkdownRenderer content={response} />
            </div>

            <div className="mt-8 sm:mt-12 flex items-center justify-between opacity-35 pt-6 sm:pt-8 border-t border-[#e7e5e4]">
               <div className="flex items-center gap-1.5 sm:gap-2">
                 <Zap className="w-3 h-3" />
                 <span className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-widest">AI Assisted Solution</span>
               </div>
               <span className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-widest">SM'S Student Hub</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
