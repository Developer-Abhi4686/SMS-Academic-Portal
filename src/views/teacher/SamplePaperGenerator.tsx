import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileSearch, Send, Copy, RotateCcw, ArrowLeft } from 'lucide-react';
import { getGeminiResponse, prompts } from '../../lib/geminiService';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import { useSessionState } from '../../lib/hooks';

export default function SamplePaperGenerator({ userClass, onBack }: { userClass: string | null, onBack?: () => void }) {
  const [subject, setSubject] = useSessionState('sample_subject', '');
  const [mathPart, setMathPart] = useSessionState<'Part I' | 'Part II'>('sample_math_part', 'Part I');
  const [desc, setDesc] = useSessionState('sample_desc', '');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useSessionState('sample_response', '');

  const handleGenerate = async () => {
    if (!desc || !subject) return;
    setLoading(true);
    setResponse('');
    try {
      const isMath = subject.toLowerCase().includes('math') || subject.toLowerCase().includes('ganita');
      const fullDesc = `Subject: ${subject}${isMath ? ` (${mathPart})` : ''}\nRequirements: ${desc}${isMath ? `\nNote: Use the syllabus defined for Class ${userClass} Math ${mathPart}.` : ''}`;
      const res = await getGeminiResponse(`Generate a sample practice paper for: ${fullDesc}`, prompts.samplePaperGenerator, userClass);
      setResponse(res);
    } catch (error: any) {
      console.error("Sample paper generation failed:", error);
      setResponse(`### ⚠️ Generation Failed\n\n${error.message || "An error occurred during generation. Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header className="flex items-center gap-6">
        {onBack && (
          <button 
            onClick={onBack}
            className="p-3 bg-surface border border-border-subtle rounded-2xl hover:border-primary transition-all group"
          >
            <ArrowLeft className="w-5 h-5 text-primary group-hover:-translate-x-1 transition-transform" />
          </button>
        )}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileSearch className="w-3.5 h-3.5 text-accent" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Board Simulation</p>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Practice Papers</h1>
        </div>
      </header>

      <div className="bg-surface border border-border-subtle p-8 rounded-[2.5rem] shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted pl-1">Target Subject</label>
            <div className="flex gap-2">
              <input 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Physics" 
                className="flex-1 bg-slate-50/50 border border-border-subtle rounded-xl p-3.5 text-primary focus:border-primary focus:bg-white outline-none font-bold transition-all placeholder:font-normal"
              />
              {(subject.toLowerCase().includes('math') || subject.toLowerCase().includes('ganita')) && (
                <select
                  value={mathPart}
                  onChange={(e) => setMathPart(e.target.value as any)}
                  className="bg-primary text-white rounded-xl px-4 text-[10px] font-bold uppercase tracking-widest outline-none border-none shadow-sm"
                >
                  <option value="Part I">Part I</option>
                  <option value="Part II">Part II</option>
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted pl-1">Mock Board Requirements</label>
          <textarea 
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Specify blue-print, marks weightage, or specific NCERT units..." 
            rows={5}
            className="w-full bg-slate-50/50 border border-border-subtle rounded-2xl p-5 text-primary focus:border-primary focus:bg-white outline-none font-bold placeholder:font-normal resize-none leading-relaxed"
          />
        </div>

        <button 
          onClick={handleGenerate}
          disabled={loading || !desc || !subject}
          className="w-full bg-primary hover:bg-primary-dark py-5 rounded-2xl flex items-center justify-center gap-3 font-bold text-[11px] uppercase tracking-[0.2em] text-white transition-all disabled:opacity-50 shadow-2xl shadow-primary/10 group"
        >
          {loading ? (
            <RotateCcw className="w-4 h-4 animate-spin text-accent" />
          ) : (
            <>
              <Send className="w-4 h-4 text-accent transition-transform group-hover:translate-x-1" />
              Generate Mock Document
            </>
          )}
        </button>
      </div>

      {response && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface p-12 rounded-[3.5rem] border border-border-subtle shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-2 h-full bg-primary/10 group-hover:bg-primary transition-colors" />
          <div className="absolute top-8 right-8 flex gap-3">
            <button 
              onClick={() => navigator.clipboard.writeText(response)}
              className="p-3 bg-white rounded-xl border border-border-subtle text-muted hover:text-primary hover:border-primary transition-all shadow-sm"
              title="Copy text"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <div className="prose prose-sm max-w-none prose-headings:text-primary prose-headings:font-bold prose-p:text-muted prose-p:font-medium prose-p:leading-relaxed">
            <MarkdownRenderer content={response} />
          </div>
        </motion.div>
      )}
    </div>
  );
}
