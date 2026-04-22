import React, { useState } from 'react';
import { motion } from 'motion/react';
import { School, ChevronRight } from 'lucide-react';

import { auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface ClassSelectionProps {
  onClassSelect: (selectedClass: string, selectedSection: string) => void;
}

const CLASSES = [
  'Nursery', 'LKG', 'UKG', 
  'I', 'II', 'III', 'IV', 'V', 
  'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'
];

export default function ClassSelection({ onClassSelect }: ClassSelectionProps) {
  const [selected, setSelected] = useState('');
  const [section, setSection] = useState('');
  const [loading, setLoading] = useState(false);

  const getSectionsForClass = (cls: string) => {
    if (['Nursery', 'LKG', 'UKG'].includes(cls)) return ['A', 'B'];
    if (['VIII', 'IX', 'X'].includes(cls)) return ['A', 'B', 'C', 'D', 'E'];
    if (['XI', 'XII'].includes(cls)) return ['A'];
    if (cls === '') return [];
    return ['A', 'B', 'C', 'D', 'E'];
  };

  const sections = getSectionsForClass(selected);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected && section) {
      setLoading(true);
      try {
        if (auth.currentUser) {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            userClass: selected,
            section: section
          });
        }
        onClassSelect(selected, section);
      } catch (error) {
        console.error('Error updating class:', error);
        onClassSelect(selected, section); 
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#fdfcfb] px-4 font-['Space_Grotesk',sans-serif] transition-colors duration-300">
      <div className="max-w-xl w-full text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#1a237e] rounded-xl flex items-center justify-center shadow-md">
              <School className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-[#1a237e] uppercase tracking-tight mb-2">
            Welcome to SMS Portal
          </h1>
          <h2 className="text-[#57534e] font-semibold text-xs uppercase tracking-widest px-4">
            St Michael's School, Bhind &bull; Hub
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-10 rounded-[3rem] border border-[#e7e5e4] shadow-lg transition-colors duration-300"
        >
          <h3 className="text-lg font-black uppercase tracking-tighter mb-8 text-[#1a237e]">Select Your Profile</h3>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="text-left space-y-2">
                <label className="text-[10px] font-black text-[#57534e] uppercase tracking-[0.2em] pl-1">
                  Target Grade
                </label>
                <div className="relative">
                  <select
                    value={selected}
                    onChange={(e) => {
                      setSelected(e.target.value);
                      setSection(''); // Reset section when class changes
                    }}
                    className="w-full bg-[#f8f9fa] border-2 border-transparent rounded-2xl p-5 text-[#1c1917] focus:border-[#1a237e] outline-none font-bold appearance-none transition-all cursor-pointer"
                  >
                    <option value="" disabled>Grade...</option>
                    {CLASSES.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#1a237e]">
                    <ChevronRight className="w-5 h-5 rotate-90" />
                  </div>
                </div>
              </div>

              <div className="text-left space-y-2">
                <label className="text-[10px] font-black text-[#57534e] uppercase tracking-[0.2em] pl-1">
                  Target Section
                </label>
                <div className="relative">
                  <select
                    value={section}
                    disabled={!selected}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full bg-[#f8f9fa] border-2 border-transparent rounded-2xl p-5 text-[#1c1917] focus:border-[#1a237e] outline-none font-bold appearance-none transition-all cursor-pointer disabled:opacity-50"
                  >
                    <option value="" disabled>Section...</option>
                    {sections.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#1a237e]">
                    <ChevronRight className="w-5 h-5 rotate-90" />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!selected || !section || loading}
              className="w-full bg-gradient-to-r from-[#1a237e] to-[#283593] hover:opacity-95 text-white font-black py-5 rounded-[2rem] transition-all text-[10px] uppercase tracking-[0.3em] shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        <footer className="mt-12 text-[#57534e] text-[9px] md:text-xs font-bold uppercase tracking-[0.2em] px-4 leading-relaxed opacity-50">
          <p>SMS Portal &bull; Credit: Abhi Sharma(9-D)</p>
        </footer>
      </div>
    </div>
  );
}
