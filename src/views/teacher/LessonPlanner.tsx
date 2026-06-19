import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MonitorPlay, Send, Copy, RotateCcw, ArrowLeft } from 'lucide-react';
import { getGeminiResponse, prompts } from '../../lib/geminiService';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import { useSessionState } from '../../lib/hooks';

export default function LessonPlanner({ userClass, onBack }: { userClass: string | null, onBack?: () => void }) {
  const [subject, setSubject] = useSessionState('lesson_subject', '');
  const [mathPart, setMathPart] = useSessionState<'Part I' | 'Part II'>('lesson_math_part', 'Part I');
  const [topic, setTopic] = useSessionState('lesson_topic', '');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useSessionState('lesson_response', '');

  const handleGenerate = async () => {
    if (!topic || !subject) return;
    setLoading(true);
    setResponse('');
    try {
      const isMath = subject.toLowerCase().includes('math') || subject.toLowerCase().includes('ganita');
      const fullTopic = `Subject: ${subject}${isMath ? ` (${mathPart})` : ''}\nTopic: ${topic}${isMath ? `\nNote: Follow class ${userClass} math ${mathPart} curriculum.` : ''}`;
      const res = await getGeminiResponse(`Generate a lesson plan for: ${fullTopic}`, prompts.lessonPlanner, userClass);
      setResponse(res);
    } catch (error: any) {
      console.error("Lesson plan generation failed:", error);
      setResponse(`### ⚠️ Generation Failed\n\n${error.message || "An error occurred during generation. Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        {onBack && (
          <button 
            onClick={onBack}
            className="p-2 -ml-2 text-[#0066CC] hover:bg-black/5 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center border border-[#e9ecef] shadow-sm">
          <MonitorPlay className="w-6 h-6 text-[#0066CC]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-[#0066CC] uppercase tracking-tight">Lesson Planner</h1>
          <p className="text-[#57534e] text-[11px] font-bold uppercase tracking-widest">Design engaging and structured lessons.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-[#e9ecef] shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#57534e] pl-1">Topic or Chapter</label>
          <textarea 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="" 
            rows={3}
            className="w-full bg-[#fdfcfb] border border-[#e9ecef] rounded-lg p-4 text-[#1c1917] focus:border-[#0066CC] outline-none font-bold placeholder:font-normal resize-none"
          />
        </div>

        <button 
          onClick={handleGenerate}
          disabled={loading || !topic || !subject}
          className="w-full bg-[#0066CC] hover:bg-[#0055B3] py-4 rounded-lg flex items-center justify-center gap-2 font-black text-xs uppercase tracking-[0.2em] text-white transition-all disabled:opacity-50 shadow-md"
        >
          {loading ? <RotateCcw className="w-4 h-4 animate-spin text-[#f59e0b]" /> : <> <Send className="w-4 h-4 text-[#f59e0b]" /> Generate Lesson Plan </>}
        </button>
      </div>

      {response && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
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
    </div>
  );
}
