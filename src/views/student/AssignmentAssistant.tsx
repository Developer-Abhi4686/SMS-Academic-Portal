import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Send, RotateCcw, Copy, Camera, FileText, ArrowLeft, PenTool } from 'lucide-react';
import { getGeminiResponse, prompts } from '../../lib/geminiService';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import { useSessionState } from '../../lib/hooks';

export default function AssignmentAssistant({ userClass, onBack }: { userClass: string | null, onBack?: () => void }) {
  const [content, setContent] = useSessionState('assignment_content', '');
  const [subject, setSubject] = useSessionState('assignment_subject', '');
  const [mathPart, setMathPart] = useSessionState<'Part I' | 'Part II'>('assignment_math_part', 'Part I');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useSessionState('assignment_response', '');
  const [mode, setMode] = useState<'assignment' | 'summary'>('assignment');

  const handleGenerate = async () => {
    if (!content) return;
    setLoading(true);
    const isMath = subject.toLowerCase().includes('math') || subject.toLowerCase().includes('ganita');
    const promptTemplate = mode === 'assignment' ? prompts.assignmentAssistant : prompts.summaryAssistant;
    const finalContent = `${subject ? `Subject: ${subject}${isMath ? ` (${mathPart})` : ''}\n` : ''}${content}${isMath ? `\nNote: Follow class ${userClass} math ${mathPart} curriculum.` : ''}`;
    const res = await getGeminiResponse(finalContent, promptTemplate, userClass);
    setResponse(res);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 -ml-2 text-[#0066CC] hover:bg-black/5 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center border border-[#e9ecef] shadow-sm">
            {mode === 'assignment' ? (
              <PenTool className="w-6 h-6 text-[#0066CC]" />
            ) : (
              <FileText className="w-6 h-6 text-[#0066CC]" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-black text-[#0066CC] uppercase tracking-tight max-sm:text-sm">
              {mode === 'assignment' ? 'Assignment Solver' : 'Summary Solver'}
            </h1>
            <p className="text-[#57534e] text-[11px] font-bold uppercase tracking-widest max-sm:text-[9px]">
              {mode === 'assignment' 
                ? 'Help with homework in simple, grade-appropriate language.'
                : 'Get a concise summary and key concepts from any text.'}
            </p>
          </div>
        </div>

        <div className="flex bg-[#fcfcfc] border border-[#e7e5e4] p-1 rounded-xl shadow-inner">
          <button
            onClick={() => setMode('assignment')}
            className={`px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${mode === 'assignment' ? 'bg-[#0066CC] text-white shadow-md' : 'text-[#57534e] hover:bg-neutral-100'}`}
          >
            Assignment
          </button>
          <button
            onClick={() => setMode('summary')}
            className={`px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${mode === 'summary' ? 'bg-[#0066CC] text-white shadow-md' : 'text-[#57534e] hover:bg-neutral-100'}`}
          >
            Summary
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-[#e9ecef] shadow-sm space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#57534e] pl-1">Subject</label>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Science" 
                className="flex-1 bg-[#fdfcfb] border border-[#e9ecef] rounded-lg p-3 text-[#1c1917] focus:border-[#0066CC] outline-none font-bold transition-all placeholder:font-normal"
              />
              {(subject.toLowerCase().includes('math') || subject.toLowerCase().includes('ganita')) && (
                <select
                  value={mathPart}
                  onChange={(e) => setMathPart(e.target.value as any)}
                  className="bg-[#0066CC] text-white rounded-lg px-3 text-[10px] font-black uppercase tracking-widest outline-none border-none"
                >
                  <option value="Part I">Part I</option>
                  <option value="Part II">Part II</option>
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#57534e] pl-1">
            {mode === 'assignment' ? 'Homework Details' : 'Text to Summarize'}
          </label>
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={mode === 'assignment' ? "Paste your assignment questions here..." : "Paste the chapter text or notes here..."} 
            rows={6}
            className="w-full bg-[#fdfcfb] border border-[#e9ecef] rounded-lg p-4 text-[#1c1917] focus:border-[#0066CC] outline-none font-bold placeholder:font-normal resize-none"
          />
        </div>

        <div className="flex gap-4">
          <button 
            type="button"
            className="flex-1 bg-[#fdfcfb] border border-[#e7e5e4] hover:bg-black/5 rounded-lg py-3 flex items-center justify-center gap-2 text-[#57534e] font-black text-[10px] uppercase tracking-widest transition-all"
          >
            <Camera className="w-4 h-4" /> Add Photo
          </button>
          <button 
            type="button"
            className="flex-1 bg-[#fdfcfb] border border-[#e7e5e4] hover:bg-black/5 rounded-lg py-3 flex items-center justify-center gap-2 text-[#57534e] font-black text-[10px] uppercase tracking-widest transition-all"
          >
            <FileText className="w-4 h-4" /> Add Document
          </button>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={loading || !content}
          className="w-full bg-[#0066CC] hover:bg-[#0055B3] py-4 rounded-lg flex items-center justify-center gap-2 font-black text-xs uppercase tracking-[0.2em] text-white transition-all disabled:opacity-50 shadow-md"
        >
          {loading ? <RotateCcw className="w-4 h-4 animate-spin text-[#f59e0b]" /> : <> <Send className="w-4 h-4 text-[#f59e0b]" /> {mode === 'assignment' ? 'Help with Assignment' : 'Generate Summary'} </>}
        </button>
      </div>

      {response && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-xl border border-[#e9ecef] shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-[#0066CC]" />
          <div className="absolute top-4 right-4 flex gap-2">
            <button 
              onClick={() => navigator.clipboard.writeText(response)}
              className="p-2 bg-[#fdfcfb] rounded-lg border border-[#e9ecef] text-[#57534e] hover:text-[#0066CC] transition-all shadow-sm"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <MarkdownRenderer content={response} />
        </motion.div>
      )}

      <div className="p-4 bg-black/5 border border-black/10 rounded-xl text-[#0066CC] text-[10px] font-bold uppercase tracking-wider text-center">
        Note: This tool is for learning assistance. Please ensure you understand the solved logic!
      </div>
    </div>
  );
}
