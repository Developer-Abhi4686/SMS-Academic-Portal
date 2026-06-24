import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { School, ChevronRight, Clock, Check, ChevronDown } from 'lucide-react';

import { auth } from '../lib/firebase';
import { createClient } from '../../utils/supabase/client';

const supabase = createClient();

interface ClassSelectionProps {
  onClassSelect: (userClass: string, section: string) => void;
}

const CLASSES = ['VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

interface CustomSelectProps {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  onChange: (val: string) => void;
  prefixText?: string;
}

function CustomSelect({ label, value, options, placeholder, disabled, onChange, prefixText = "" }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-3" ref={containerRef}>
      <label className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] ml-1">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full bg-white/50 border border-white/40 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 text-left font-bold transition-all shadow-sm flex items-center justify-between text-base sm:text-lg select-none outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent ${
            disabled 
              ? 'opacity-35 cursor-not-allowed' 
              : 'cursor-pointer hover:bg-white hover:border-accent/45 active:scale-[0.99]'
          }`}
        >
          <span className={value ? 'text-primary' : 'text-slate-400 font-medium'}>
            {value ? `${prefixText}${value}` : placeholder}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <ChevronDown className="w-6 h-6 text-accent" />
          </motion.div>
        </button>

        <AnimatePresence>
          {isOpen && !disabled && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute z-50 left-0 right-0 bottom-full mb-3 bg-white/95 backdrop-blur-lg border border-slate-200/60 rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="max-h-60 overflow-y-auto dropdown-scroll py-2 pl-3 pr-2.5">
                <div className="space-y-1">
                  {options.map((option, index) => {
                    const isSelected = value === option;
                    return (
                      <motion.button
                        key={option}
                        type="button"
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => {
                          onChange(option);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-6 py-4 rounded-[1.5rem] font-bold text-base transition-all flex items-center justify-between group ${
                          isSelected 
                            ? 'bg-brand text-white shadow-md shadow-brand/10' 
                            : 'text-primary hover:bg-brand/5 hover:text-brand'
                        }`}
                      >
                        <span>{prefixText}{option}</span>
                        {isSelected ? (
                          <Check className="w-5 h-5 text-accent" />
                        ) : (
                          <Check className="w-5 h-5 text-brand/0 group-hover:text-brand/40 transition-colors" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StationClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-end">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">
        {time.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
      </span>
      <div className="flex items-center gap-1.5 mt-1 opacity-80">
        <Clock className="w-3.5 h-3.5 text-brand" />
        <span className="text-[11px] font-bold tabular-nums text-primary">
          {time.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

export default function ClassSelection({ onClassSelect }: ClassSelectionProps) {
  const [selected, setSelected] = useState('');
  const [section, setSection] = useState('');
  const [loading, setLoading] = useState(false);

  const getSectionsForClass = (cls: string) => {
    return ['A', 'B', 'C', 'D', 'E'];
  };

  const sections = getSectionsForClass(selected);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected && section) {
      setLoading(true);
      try {
        const uid = auth.currentUser?.uid || 'temp_user';
        await supabase.from('users').upsert({
          id: uid,
          userClass: selected,
          section: section,
          updatedAt: new Date().toISOString()
        }).select();
      } catch (error) {
        // Silently catch
      } finally {
        setLoading(false);
        onClassSelect(selected, section);
      }
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 md:p-12 overflow-hidden selection:bg-brand selection:text-white pt-20">
      {/* Background Orbs - Linear gradient soft blurry blobs directly behind the glass panel */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-gradient-to-tr from-brand to-accent opacity-20 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Absolute Header for Clock */}
      <div className="absolute top-4 right-4 md:top-12 md:right-12 z-[110]">
        <StationClock />
      </div>

      <div className="w-full max-w-xl md:max-w-2xl relative z-10 flex flex-col items-center justify-center gap-6 md:gap-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tighter text-primary">
            SM'S <span className="text-brand">Portal.</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-6 sm:p-10 md:p-14 rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] relative w-full"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <School className="w-24 h-24 sm:w-32 sm:h-32 rotate-12" />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-6 sm:mb-10 text-primary text-center">Select class and section</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-10">
            <div className="space-y-6 sm:space-y-8">
              <CustomSelect
                label="Class"
                value={selected}
                options={CLASSES}
                placeholder="Select Class..."
                prefixText="Class "
                onChange={(val) => {
                  setSelected(val);
                  setSection('');
                }}
              />

              <CustomSelect
                label="Section"
                value={section}
                options={sections}
                placeholder="Select Section..."
                prefixText="Section "
                disabled={!selected}
                onChange={(val) => setSection(val)}
              />
            </div>

            <button
              type="submit"
              disabled={!selected || !section || loading}
              className="w-full bg-brand text-white font-bold py-4 sm:py-6 md:py-7 rounded-xl sm:rounded-[2.5rem] transition-all text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-brand/20 hover:bg-brand-dark active:scale-[0.98] flex items-center justify-center gap-4 group disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-accent border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform text-accent" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          className="text-center w-full space-y-2 mt-6"
        >
          <div className="w-20 h-px bg-primary/20 mx-auto mb-4" />
          <p className="text-[12px] font-bold tracking-[0.4em] text-primary uppercase">
            St Michael's Portal, Bhind
          </p>
          <p className="text-[10px] font-black tracking-widest text-muted uppercase text-xs">
            Engineered by - Abhi Shama(9-d)
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
