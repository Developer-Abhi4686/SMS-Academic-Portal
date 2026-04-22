import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator as CalcIcon, 
  Percent, 
  ArrowLeft, 
  Delete,
  X,
  Plus,
  Minus,
  Divide,
  Equal,
  RotateCcw,
  Zap,
  ChevronRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';

type CalcMode = 'selection' | 'standard' | 'percentage';

interface SubjectMark {
  id: number;
  obtained: string;
  max: string;
}

export default function Calculator({ onBack }: { onBack?: () => void }) {
  const [mode, setMode] = useState<CalcMode>('selection');

  // Standard Calculator State
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  
  // Percentage Calculator State
  const [marks, setMarks] = useState<SubjectMark[]>(
    Array.from({ length: 8 }, (_, i) => ({ id: i, obtained: '', max: '' }))
  );
  const [resultPercentage, setResultPercentage] = useState<number | null>(null);

  // Standard Calculator Logic
  const handleCalcPress = (val: string) => {
    if (display === '0' && !isNaN(Number(val))) {
      setDisplay(val);
    } else {
      setDisplay(prev => prev + val);
    }
  };

  const calculateStandard = () => {
    try {
      let safeEq = display
        .replace(/√/g, 'Math.sqrt')
        .replace(/cosec\(/g, '1/Math.sin(')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/\^/g, '**');

      if (/[^0-9+\-*/().√MathPIE^ ,]/.test(safeEq)) {
          throw new Error("Invalid Input");
      }
      
      const res = eval(safeEq);
      setEquation(display + ' =');
      setDisplay(String(Number(res.toFixed(8))));
    } catch (e) {
      setDisplay('ERR_SIG');
    }
  };

  const clearStandard = () => {
    setDisplay('0');
    setEquation('');
  };

  const deleteLast = () => {
    if (display.length > 1) {
      setDisplay(prev => prev.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  // Percentage Calculator Logic
  const updateMark = (id: number, field: 'obtained' | 'max', value: string) => {
    setMarks(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const calculatePercentage = () => {
    let totalObtained = 0;
    let totalMax = 0;
    marks.forEach(m => {
      const o = parseFloat(m.obtained);
      const mx = parseFloat(m.max);
      if (!isNaN(o) && !isNaN(mx) && mx > 0) {
        totalObtained += o;
        totalMax += mx;
      }
    });

    if (totalMax > 0) {
      setResultPercentage((totalObtained / totalMax) * 100);
    } else {
      setResultPercentage(null);
    }
  };

  const resetPercentage = () => {
    setMarks(Array.from({ length: 8 }, (_, i) => ({ id: i, obtained: '', max: '' })));
    setResultPercentage(null);
  };

  if (mode === 'selection') {
    return (
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-4 bg-white border border-[#e7e5e4] text-[#943a1a] rounded-2xl shadow-sm hover:shadow-md transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Cpu className="w-3 h-3 text-[#943a1a] opacity-40" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#943a1a]">Precision Hardware</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Academic <span className="font-editorial text-[#943a1a]">Calculators</span></h1>
              <p className="text-[#57534e] text-xs font-medium">Statistical and Scientific computation modules.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.button
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={() => setMode('percentage')}
            className="bg-white p-12 rounded-[3.5rem] border border-[#e7e5e4] flex flex-col items-center text-center gap-8 shadow-sm hover:border-[#943a1a] hover:shadow-2xl transition-all group"
          >
            <div className="w-20 h-20 bg-[#f7f5f2] rounded-[2rem] flex items-center justify-center text-[#943a1a] group-hover:bg-[#943a1a] group-hover:text-white transition-all duration-500 shadow-inner">
              <Percent className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-3">Academic Yield</h2>
              <p className="text-[#57534e] text-[10px] font-black uppercase tracking-widest opacity-60 leading-relaxed">Percentage & Grade Analysis Module</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={() => setMode('standard')}
            className="bg-[#1c1917] p-12 rounded-[3.5rem] border border-[#1c1917] flex flex-col items-center text-center gap-8 shadow-2xl hover:shadow-[#943a1a]/20 transition-all group overflow-hidden relative"
          >
            <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center text-white group-hover:text-[#f59e0b] backdrop-blur-xl transition-all duration-500 border border-white/10 relative z-10">
              <CalcIcon className="w-8 h-8" />
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-3">Scientific Node</h2>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest leading-relaxed">Advanced Arithmetic & Trigonometric Layer</p>
            </div>
            <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-[#943a1a]/10 rounded-full blur-[60px]" />
          </motion.button>
        </div>
      </div>
    );
  }

  if (mode === 'percentage') {
    return (
      <div className="max-w-3xl mx-auto space-y-12">
        <header className="flex items-center justify-between bg-white p-6 md:p-8 rounded-[3rem] border border-[#e7e5e4] shadow-sm">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => { setMode('selection'); resetPercentage(); }}
              className="p-3 bg-[#f7f5f2] rounded-2xl text-[#943a1a] hover:bg-white border border-transparent hover:border-[#e7e5e4] transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">Academic Yield</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#57534e] opacity-40">Grade Calculator</p>
            </div>
          </div>
          <button 
            onClick={resetPercentage}
            className="w-12 h-12 flex items-center justify-center text-[#57534e] hover:text-[#943a1a] transition-colors"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </header>

        <div className="bg-white rounded-[4rem] border border-[#e7e5e4] p-10 md:p-16 shadow-inner relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
              {marks.map((m, idx) => (
                <div key={m.id} className="flex items-center gap-4 group">
                  <span className="text-[9px] font-black text-[#57534e] opacity-20 w-4 tracking-tighter">{idx + 1}</span>
                  <div className="flex-1 grid grid-cols-7 gap-2 bg-[#f7f5f2] rounded-2xl p-2 border border-transparent group-hover:border-[#943a1a]/20 transition-all">
                    <input
                      type="number"
                      placeholder="Score"
                      className="col-span-3 bg-white rounded-xl px-4 py-3 text-sm font-bold outline-none"
                      value={m.obtained}
                      onChange={(e) => updateMark(m.id, 'obtained', e.target.value)}
                    />
                    <div className="col-span-1 flex items-center justify-center opacity-20">/</div>
                    <input
                      type="number"
                      placeholder="Total"
                      className="col-span-3 bg-white rounded-xl px-4 py-3 text-sm font-bold outline-none"
                      value={m.max}
                      onChange={(e) => updateMark(m.id, 'max', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col justify-center items-center gap-10">
              <div className="text-center">
                 <div className="w-32 h-32 rounded-full border-4 border-[#943a1a]/5 flex items-center justify-center mb-6 mx-auto relative group">
                    <Percent className="w-10 h-10 text-[#943a1a] opacity-20 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 border-4 border-[#943a1a] border-t-transparent rounded-full animate-spin-slow opacity-10" />
                 </div>
                 <h2 className="text-6xl font-black uppercase tracking-tighter text-[#1c1917] mb-2">
                    {resultPercentage !== null ? `${resultPercentage.toFixed(1)}%` : '--.—%'}
                 </h2>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#943a1a]">Calculated Efficiency</p>
              </div>

              <button 
                onClick={calculatePercentage}
                className="w-full bg-[#943a1a] text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-[#943a1a]/30 hover:bg-[#c2410c] transition-all"
              >
                Execute Analysis
              </button>
            </div>
          </div>
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#f59e0b]/5 rounded-full blur-[80px]" />
        </div>
      </div>
    );
  }

  // Specialist Hardware Interface (Standard Calc)
  const buttons = [
    { label: '√', val: '√(', type: 'sci' }, { label: 'π', val: 'π', type: 'sci' }, { label: '^', val: '^', type: 'sci' }, { label: 'C', val: 'CLR', type: 'clr' },
    { label: 'sin', val: 'sin(', type: 'sci' }, { label: 'cos', val: 'cos(', type: 'sci' }, { label: 'tan', val: 'tan(', type: 'sci' }, { label: '÷', val: '/', type: 'op' },
    { label: '7', val: '7', type: 'num' }, { label: '8', val: '8', type: 'num' }, { label: '9', val: '9', type: 'num' }, { label: '×', val: '*', type: 'op' },
    { label: '4', val: '4', type: 'num' }, { label: '5', val: '5', type: 'num' }, { label: '6', val: '6', type: 'num' }, { label: '−', val: '-', type: 'op' },
    { label: '1', val: '1', type: 'num' }, { label: '2', val: '2', type: 'num' }, { label: '3', val: '3', type: 'num' }, { label: '+', val: '+', type: 'op' },
    { label: '0', val: '0', type: 'num' }, { label: '.', val: '.', type: 'num' }, { label: 'del', val: 'DEL', type: 'del' }, { label: '=', val: '=', type: 'eq' },
  ];

  return (
    <div className="max-w-md mx-auto h-full flex flex-col justify-center">
       <div className="bg-[#1c1917] p-8 md:p-12 rounded-[4rem] border-8 border-[#2d2a27] shadow-[0_40px_100px_rgba(0,0,0,0.4)] relative">
          
          {/* Status Bar */}
          <div className="flex justify-between items-center mb-8 px-4 opacity-50">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#f59e0b] shadow-[0_0_10px_#f59e0b]" />
              <span className="text-[8px] font-mono uppercase tracking-widest text-[#fdfcfb]">Core_X1</span>
            </div>
            <span className="text-[8px] font-mono text-white opacity-40 uppercase tracking-widest">Scientific Mode v2.5</span>
          </div>

          {/* Liquid Crystal Display */}
          <div className="bg-[#0c0a09] p-8 rounded-[2rem] border border-white/5 mb-10 text-right flex flex-col justify-end min-h-[160px] relative overflow-hidden shadow-inner font-mono">
             <div className="absolute top-4 left-6 opacity-10 text-white text-[10px] uppercase tracking-widest">Analytical Buffer</div>
             <p className="text-white/30 text-xs mb-4 uppercase tracking-tighter truncate">{equation}</p>
             <div className="text-5xl font-light text-[#f59e0b] tracking-tighter overflow-hidden text-ellipsis whitespace-nowrap">
                {display}
             </div>
             <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/20 pointer-events-none" />
             <div className="absolute inset-x-0 bottom-0 h-px bg-white/5" />
          </div>

          {/* Tactical Inputs */}
          <div className="grid grid-cols-4 gap-4">
            {buttons.map((btn) => (
              <motion.button
                key={btn.label}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (btn.type === 'eq') calculateStandard();
                  else if (btn.val === 'CLR') clearStandard();
                  else if (btn.val === 'DEL') deleteLast();
                  else handleCalcPress(btn.val);
                }}
                className={`h-16 rounded-[1.25rem] flex items-center justify-center font-bold text-xs uppercase transition-all ${
                  btn.type === 'num' ? 'bg-[#292524] text-white hover:bg-[#44403c] border border-white/5' :
                  btn.type === 'sci' ? 'bg-[#1c1917] text-[#f59e0b]/60 hover:text-[#f59e0b] border border-white/5' :
                  btn.type === 'op' ? 'bg-[#943a1a] text-white hover:bg-[#c2410c] shadow-lg shadow-[#943a1a]/20' :
                  btn.type === 'clr' ? 'bg-red-950 text-red-400 border border-red-500/10' :
                  btn.type === 'eq' ? 'bg-[#f59e0b] text-[#1c1917] shadow-[0_0_20px_rgba(245,158,11,0.3)]' :
                  'bg-[#292524] text-white'
                }`}
              >
                {btn.label}
              </motion.button>
            ))}
          </div>

          <button 
            onClick={() => setMode('selection')}
            className="mt-10 w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/30 hover:text-white transition-all text-[8px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3"
          >
             <ArrowLeft className="w-3 h-3" /> System Back
          </button>
          
          {/* Aesthetic Hardware Details */}
          <div className="absolute bottom-6 right-12 opacity-5">
             <div className="grid grid-cols-3 gap-1">
                {[...Array(6)].map((_, i) => <div key={i} className="w-1 h-1 bg-white rounded-full"></div>)}
             </div>
          </div>
       </div>
    </div>
  );
}
