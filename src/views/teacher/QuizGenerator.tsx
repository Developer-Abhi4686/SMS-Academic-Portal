import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, Copy, RotateCcw, ArrowLeft, CheckCircle2, XCircle, Info, BrainCircuit } from 'lucide-react';
import { getGeminiResponse, prompts } from '../../lib/geminiService';
import { useSessionState } from '../../lib/hooks';

interface MCQQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizData {
  title: string;
  questions: MCQQuestion[];
}

export default function QuizGenerator({ userClass, onBack }: { userClass: string | null, onBack?: () => void }) {
  const [subject, setSubject] = useSessionState('quiz_subject', '');
  const [chapter, setChapter] = useSessionState('quiz_chapter', '');
  const [mathPart, setMathPart] = useSessionState<'Part I' | 'Part II'>('quiz_math_part', 'Part I');
  const [difficulty, setDifficulty] = useSessionState('quiz_difficulty', 'moderate');
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(() => {
    const saved = sessionStorage.getItem('quiz_json_data');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>(() => {
    const saved = sessionStorage.getItem('quiz_selected_options');
    return saved ? JSON.parse(saved) : {};
  });
  const [showExplanations, setShowExplanations] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (quizData) sessionStorage.setItem('quiz_json_data', JSON.stringify(quizData));
    sessionStorage.setItem('quiz_selected_options', JSON.stringify(selectedOptions));
  }, [quizData, selectedOptions]);

  const handleGenerate = async () => {
    if (!subject || !chapter) return;
    setLoading(true);
    setLoadingStatus('Initializing Neural Net...');
    setError(null);
    setQuizData(null);
    setSelectedOptions({});
    setShowExplanations({});
    
    try {
      const isMath = subject.toLowerCase().includes('math') || subject.toLowerCase().includes('ganita');
      setLoadingStatus(`Mapping Syllabus for Class ${userClass}...`);
      
      const prompt = `Subject: ${subject}${isMath ? ` (${mathPart})` : ''}\nChapter: ${chapter}\nTARGET DIFFICULTY: ${difficulty.toUpperCase()}${isMath ? `\nNote: Use the syllabus defined for Class ${userClass} Math ${mathPart}.` : ''}`;
      
      setLoadingStatus('Gemini is conceptualizing questions...');
      const res = await getGeminiResponse(prompt, prompts.mcqGenerator, userClass);
      
      setLoadingStatus('Finalizing logic structures...');
      const jsonStr = res.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      setQuizData(parsed);
    } catch (err: any) {
      console.error("Quiz generation failed:", err);
      setError(err.message || "Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  const handleOptionSelect = (questionId: number, optionIndex: number) => {
    if (selectedOptions[questionId] !== undefined) return;
    setSelectedOptions(prev => ({ ...prev, [questionId]: optionIndex }));
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
            <BrainCircuit className="w-3.5 h-3.5 text-accent" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Quiz Engine</p>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Interactive Assessment</h1>
        </div>
      </header>

      <div className="glass-panel p-10 rounded-[3.5rem] shadow-2xl space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-3">Subject Matrix</label>
            <div className="flex gap-3">
              <input 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Science" 
                className="flex-1 bg-white/50 border border-white/40 rounded-3xl p-5 text-primary focus:border-accent outline-none font-bold backdrop-blur-sm shadow-inner transition-all placeholder:font-medium placeholder:opacity-30"
              />
              {(subject.toLowerCase().includes('math') || subject.toLowerCase().includes('ganita')) && (
                <select
                  value={mathPart}
                  onChange={(e) => setMathPart(e.target.value as any)}
                  className="bg-primary text-white rounded-3xl px-6 text-[10px] font-bold uppercase tracking-widest outline-none border-none shadow-xl shadow-primary/20"
                >
                  <option value="Part I">Part I</option>
                  <option value="Part II">Part II</option>
                </select>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-3">Target Chapter</label>
            <input 
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              placeholder="Chapter Title or No." 
              className="w-full bg-white/50 border border-white/40 rounded-3xl p-5 text-primary focus:border-accent outline-none font-bold backdrop-blur-sm shadow-inner transition-all placeholder:font-medium placeholder:opacity-30"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-3">Intensity Modulation</label>
          <div className="flex gap-4">
            {['Basic', 'Moderate', 'Highly Difficult'].map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level.toLowerCase())}
                className={`flex-1 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all duration-500 ${
                  difficulty === level.toLowerCase() 
                    ? 'bg-primary text-white shadow-2xl shadow-primary/20 scale-[1.05]' 
                    : 'bg-white/40 border border-white/60 text-muted hover:bg-white hover:text-primary active:scale-95'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <button 
            onClick={handleGenerate}
            disabled={loading || !subject || !chapter}
            className="w-full bg-primary hover:bg-primary-dark py-6 rounded-3xl flex items-center justify-center gap-4 font-bold text-[11px] uppercase tracking-[0.4em] text-white transition-all disabled:opacity-50 shadow-[0_20px_50px_-12px_rgba(var(--primary-rgb),0.3)] active:scale-[0.98]"
          >
            {loading ? (
              <RotateCcw className="w-5 h-5 animate-spin text-accent" />
            ) : (
              <>
                <Send className="w-5 h-5 text-accent" />
                Initialize Generation
              </>
            )}
          </button>
          
          <AnimatePresence>
            {loading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="flex gap-1.5">
                   {[0, 1, 2].map((i) => (
                     <motion.div 
                      key={i}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                      className="w-1.5 h-1.5 rounded-full bg-accent"
                    />
                   ))}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-accent animate-pulse">{loadingStatus}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4"
          >
            <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-1">Configuration Error</p>
              <p className="text-sm font-medium text-red-800/80 leading-relaxed">{error}</p>
            </div>
          </motion.div>
        )}
      </div>

      {quizData && (
        <div className="space-y-8 pb-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-primary uppercase">{quizData.title}</h2>
            <div className="flex items-center gap-3 px-6 py-2.5 bg-slate-50 rounded-full border border-border-subtle">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Performance Metric</span>
              <span className="text-sm font-bold text-primary">
                {Object.entries(selectedOptions).reduce((acc, [qid, opt]) => {
                  const q = quizData.questions.find(q => q.id === parseInt(qid));
                  return q?.correctAnswer === opt ? acc + 1 : acc;
                }, 0)} / {quizData.questions.length}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            {quizData.questions.map((q, idx) => {
              const isSelected = selectedOptions[q.id] !== undefined;
              const selectedOption = selectedOptions[q.id];
              const isCorrect = selectedOption === q.correctAnswer;

              return (
                <motion.div 
                  key={q.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-surface p-10 rounded-[2.5rem] border border-border-subtle shadow-sm relative overflow-hidden group"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isSelected ? (isCorrect ? 'bg-emerald-500' : 'bg-red-500') : 'bg-slate-200'}`} />
                  
                  <div className="space-y-8">
                    <h4 className="text-xl font-bold text-primary leading-snug flex gap-4">
                      <span className="text-accent opacity-30 font-mono tracking-tighter">0{idx + 1}</span>
                      {q.question}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {q.options.map((option, optIdx) => {
                        let btnClass = "bg-white border-border-subtle text-muted hover:border-primary/40 hover:bg-slate-50";
                        
                        if (isSelected) {
                          if (optIdx === q.correctAnswer) {
                            btnClass = "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold";
                          } else if (optIdx === selectedOption) {
                            btnClass = "bg-red-50 border-red-500 text-red-800 font-bold";
                          } else {
                            btnClass = "bg-slate-50 border-border-subtle text-muted opacity-40";
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleOptionSelect(q.id, optIdx)}
                            disabled={isSelected}
                            className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${btnClass}`}
                          >
                            <span className="text-sm">{option}</span>
                            {isSelected && optIdx === q.correctAnswer && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                            {isSelected && optIdx === selectedOption && optIdx !== q.correctAnswer && <XCircle className="w-5 h-5 text-red-500" />}
                          </button>
                        );
                      })}
                    </div>

                    <AnimatePresence>
                      {isSelected && (
                        <div className="pt-2">
                          {!showExplanations[q.id] ? (
                            <button
                              onClick={() => setShowExplanations(prev => ({ ...prev, [q.id]: true }))}
                              className="flex items-center gap-3 px-6 py-3 bg-slate-50 text-primary rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all border border-border-subtle"
                            >
                              <BrainCircuit className="w-4 h-4 text-accent" />
                              Reveal Logic
                            </button>
                          ) : (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-6 bg-slate-50 rounded-2xl border border-border-subtle"
                            >
                              <div className="flex gap-4">
                                <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                                <div className="space-y-2">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Rationalization</p>
                                  <p className="text-sm font-medium text-muted leading-relaxed">
                                    {q.explanation}
                                  </p>
                                  <button
                                    onClick={() => setShowExplanations(prev => ({ ...prev, [q.id]: false }))}
                                    className="pt-2 text-[9px] font-bold uppercase tracking-widest text-primary hover:underline underline-offset-4 decoration-accent"
                                  >
                                    Retract Info
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="flex justify-center pt-4">
            <button 
              onClick={() => {
                setQuizData(null);
                setSelectedOptions({});
                setShowExplanations({});
                setSubject('');
                setChapter('');
                sessionStorage.removeItem('quiz_json_data');
                sessionStorage.removeItem('quiz_selected_options');
              }}
              className="flex items-center gap-3 px-10 py-5 bg-white border border-border-subtle rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-muted hover:text-red-600 hover:border-red-200 transition-all shadow-sm hover:shadow-xl hover:shadow-red-500/5 group"
            >
              <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              Terminate & Reset Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

