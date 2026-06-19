import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  BrainCircuit, 
  FileText, 
  ArrowLeft,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import QuizGenerator from './QuizGenerator';
import TestPaperGenerator from './TestPaperGenerator';
import SamplePaperGenerator from './SamplePaperGenerator';

type GeneratorType = 'quiz' | 'test' | 'sample' | null;

export default function GeneratorHub({ userClass, onBack }: { userClass: string | null, onBack?: () => void }) {
  const [activeType, setActiveType] = useState<GeneratorType>(null);

  const generators = [
    {
      id: 'quiz' as const,
      title: 'Quiz Engine',
      description: 'Generate interactive MCQs with instant feedback and answer keys.',
      icon: BrainCircuit,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      accent: 'blue'
    },
    {
      id: 'test' as const,
      title: 'Test Papers',
      description: 'Create comprehensive terminal examinations following NCERT standards.',
      icon: FileText,
      color: 'bg-amber-50 text-amber-700 border-amber-100',
      accent: 'amber'
    },
    {
      id: 'sample' as const,
      title: 'Sample Papers',
      description: 'Design mock board papers to help students practice for final exams.',
      icon: BookOpen,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      accent: 'emerald'
    }
  ];

  if (activeType === 'quiz') return <QuizGenerator userClass={userClass} onBack={() => setActiveType(null)} />;
  if (activeType === 'test') return <TestPaperGenerator userClass={userClass} onBack={() => setActiveType(null)} />;
  if (activeType === 'sample') return <SamplePaperGenerator userClass={userClass} onBack={() => setActiveType(null)} />;

  return (
    <div className="max-w-6xl mx-auto space-y-12">
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
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Academic Intelligence</p>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Content Generator</h1>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {generators.map((gen, idx) => (
          <motion.button
            key={gen.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => setActiveType(gen.id)}
            className="group relative bg-surface border border-border-subtle rounded-[3rem] p-10 text-left transition-all hover:border-primary hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1"
          >
            <div className={`w-16 h-16 rounded-2xl ${gen.color} border flex items-center justify-center mb-8 transition-all group-hover:scale-110 shadow-sm`}>
              <gen.icon className="w-8 h-8" />
            </div>
            
            <h3 className="text-2xl font-bold tracking-tight text-primary mb-3">
              {gen.title}
            </h3>
            <p className="text-muted text-sm font-medium leading-relaxed mb-10">
              {gen.description}
            </p>

            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-primary">
              <span>Initialize Tool</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
            </div>
          </motion.button>
        ))}
      </div>

      <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8">
        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <Sparkles className="w-8 h-8 text-primary opacity-20" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-primary">AI-Enabled Workflow</h4>
          <p className="text-xs font-medium text-muted max-w-xl leading-relaxed">
            All generators utilize Gemini Intelligence, calibrated to the NCERT 2026-27 standards. 
            Output is optimized for pedagogical accuracy and institutional compliance.
          </p>
        </div>
      </div>
    </div>
  );
}
