import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Send, Copy, RotateCcw, ArrowLeft } from 'lucide-react';
import { getGeminiResponse, prompts } from '../../lib/geminiService';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import SaveButton from '../../components/SaveButton';
import { useSessionState } from '../../lib/hooks';

export default function QuizGenerator({ userClass, onBack }: { userClass: string | null, onBack?: () => void }) {
  const [subject, setSubject] = useSessionState('quiz_subject', '');
  const [chapter, setChapter] = useSessionState('quiz_chapter', '');
  const [difficulty, setDifficulty] = useSessionState('quiz_difficulty', 'moderate');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useSessionState('quiz_response', '');

  const handleGenerate = async () => {
    if (!subject || !chapter) return;
    setLoading(true);
    const prompt = `Subject: ${subject}\nChapter: ${chapter}\nTARGET DIFFICULTY: ${difficulty.toUpperCase()}\n\nTASK: Generate exactly 10 questions that are strictly categorized as ${difficulty.toUpperCase()} level. Do not include any other difficulty levels.`;
    const res = await getGeminiResponse(prompt, prompts.quizGenerator, userClass, "gemini-2.5-flash-lite");
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
          <Sparkles className="w-6 h-6 text-[#1a237e]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-[#1a237e] uppercase tracking-tight">Quiz Generator</h1>
          <p className="text-[#636e72] text-[11px] font-bold uppercase tracking-widest">Create professional assessments in seconds.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-[#e9ecef] shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#636e72] pl-1">Subject</label>
            <input 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Science, Mathematics" 
              className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-lg p-3 text-[#1a1a1a] focus:border-[#1a237e] outline-none font-bold transition-all placeholder:font-normal"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#636e72] pl-1">Chapter Name/Number</label>
            <input 
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              placeholder="e.g. Force and Motion" 
              className="w-full bg-[#f8f9fa] border border-[#e9ecef] rounded-lg p-3 text-[#1a1a1a] focus:border-[#1a237e] outline-none font-bold transition-all placeholder:font-normal"
            />
          </div>
        </div>
        
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#636e72] pl-1">Difficulty Level</label>
          <div className="flex gap-2">
            {['Basic', 'Moderate', 'Highly Difficult'].map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level.toLowerCase())}
                className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                  difficulty === level.toLowerCase() 
                    ? 'bg-[#1a237e] text-white shadow-md' 
                    : 'bg-[#f8f9fa] border border-[#e9ecef] text-[#636e72] hover:bg-[#f1f3f5]'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={loading || !subject || !chapter}
          className="w-full bg-gradient-to-r from-[#1a237e] to-[#3949ab] hover:opacity-90 py-4 rounded-lg flex items-center justify-center gap-2 font-black text-xs uppercase tracking-[0.2em] text-white transition-all disabled:opacity-50 shadow-md"
        >
          {loading ? (
            <RotateCcw className="w-4 h-4 animate-spin text-[#00b8d4]" />
          ) : (
            <>
              <Send className="w-4 h-4 text-[#00b8d4]" />
              PROCESS REQUEST
            </>
          )}
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
            <SaveButton 
              type="quiz" 
              title={`${subject} Quiz: ${chapter}`} 
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
