import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Send, Copy, RotateCcw, ArrowLeft } from 'lucide-react';
import { getGeminiResponse, prompts } from '../../lib/geminiService';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import { useSessionState } from '../../lib/hooks';

export default function TestPaperGenerator({ userClass, onBack }: { userClass: string | null, onBack?: () => void }) {
  const [desc, setDesc] = useSessionState('test_desc', '');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useSessionState('test_response', '');

  const handleGenerate = async () => {
    if (!desc) return;
    setLoading(true);
    const res = await getGeminiResponse(`Generate a full test paper based on: ${desc}`, prompts.testPaperGenerator, userClass, "gemini-2.5-flash");
    setResponse(res);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        {onBack && (
          <button 
            onClick={onBack}
            className="p-2 -ml-2 text-[#1a237e] hover:bg-blue-50 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-[#e9ecef] shadow-sm">
          <FileText className="w-6 h-6 text-[#1a237e]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-[#1a237e] uppercase tracking-tight">Test Paper Generator</h1>
          <p className="text-[#57534e] text-[11px] font-bold uppercase tracking-widest">Create comprehensive exam papers instantly.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-[#e9ecef] shadow-sm space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#57534e] pl-1">Paper Requirements</label>
          <textarea 
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="e.g. Mid-term exam, covering Unit 1 and 2, 80 marks total..." 
            rows={4}
            className="w-full bg-[#fdfcfb] border border-[#e9ecef] rounded-lg p-4 text-[#1c1917] focus:border-[#1a237e] outline-none font-bold placeholder:font-normal resize-none"
          />
        </div>

        <button 
          onClick={handleGenerate}
          disabled={loading || !desc}
          className="w-full bg-[#1a237e] hover:bg-[#283593] py-4 rounded-lg flex items-center justify-center gap-2 font-black text-xs uppercase tracking-[0.2em] text-white transition-all disabled:opacity-50 shadow-md"
        >
          {loading ? <RotateCcw className="w-4 h-4 animate-spin text-[#f59e0b]" /> : <> <Send className="w-4 h-4 text-[#f59e0b]" /> Generate Test Paper </>}
        </button>
      </div>

      {response && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-xl border border-[#e9ecef] shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-[#1a237e]" />
          <div className="absolute top-4 right-4 flex gap-2">
            <button 
              onClick={() => navigator.clipboard.writeText(response)}
              className="p-2 bg-[#fdfcfb] rounded-lg border border-[#e9ecef] text-[#57534e] hover:text-[#1a237e] transition-all shadow-sm"
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
