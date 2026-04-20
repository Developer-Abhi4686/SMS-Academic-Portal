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
  ChevronRight
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
      // Basic math evaluation (using eval for simplicity here, in production use a math library)
      // We'll replace scientific strings with Math functions
      let safeEq = display
        .replace(/√/g, 'Math.sqrt')
        .replace(/cosec\(/g, '1/Math.sin(')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/\^/g, '**');

      // Simple sanitization: only allow math chars
      if (/[^0-9+\-*/().√MathPIE^ ,]/.test(safeEq)) {
          throw new Error("Invalid Input");
      }
      
      const res = eval(safeEq);
      setEquation(display + ' =');
      setDisplay(String(Number(res.toFixed(8))));
    } catch (e) {
      setDisplay('Error');
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
    let validCount = 0;

    marks.forEach(m => {
      const o = parseFloat(m.obtained);
      const mx = parseFloat(m.max);
      if (!isNaN(o) && !isNaN(mx) && mx > 0) {
        totalObtained += o;
        totalMax += mx;
        validCount++;
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
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 text-[#1a237e] hover:bg-[#f0f2ff] rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[#1a237e] uppercase tracking-tight">Academic Tools</h1>
            <p className="text-[#636e72] font-bold text-xs uppercase tracking-widest">Select Calculator Mode</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.button
            whileHover={{ y: -5 }}
            onClick={() => setMode('percentage')}
            className="bg-white p-8 rounded-3xl border-2 border-[#dee2e6] flex flex-col items-center text-center gap-6 shadow-xl hover:border-[#1a237e] transition-all group"
          >
            <div className="w-16 h-16 bg-[#f0f2ff] rounded-2xl flex items-center justify-center text-[#1a237e] group-hover:scale-110 transition-transform">
              <Percent className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1a237e] uppercase tracking-tight mb-2">Percentage Calculator</h2>
              <p className="text-[#636e72] text-xs font-medium leading-relaxed">Calculate final academic percentages across multiple subjects easily.</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ y: -5 }}
            onClick={() => setMode('standard')}
            className="bg-white p-8 rounded-3xl border-2 border-[#dee2e6] flex flex-col items-center text-center gap-6 shadow-xl hover:border-[#3949ab] transition-all group"
          >
            <div className="w-16 h-16 bg-[#f0f2ff] rounded-2xl flex items-center justify-center text-[#1a237e] group-hover:scale-110 transition-transform">
              <CalcIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1a237e] uppercase tracking-tight mb-2">Standard Calculator</h2>
              <p className="text-[#636e72] text-xs font-medium leading-relaxed">Advanced scientific calculator with support for complex math operations.</p>
            </div>
          </motion.button>
        </div>
      </div>
    );
  }

  if (mode === 'percentage') {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setMode('selection'); resetPercentage(); }}
              className="p-2 -ml-2 text-[#1a237e] hover:bg-[#f0f2ff] rounded-xl transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-[#1a237e] uppercase tracking-tight">Percentage Calc</h1>
              <p className="text-[#636e72] font-bold text-xs uppercase tracking-widest">Analyze Academic Results</p>
            </div>
          </div>
          <button 
            onClick={resetPercentage}
            className="p-2 text-[#636e72] hover:text-red-500 rounded-lg"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </header>

        <div className="bg-white p-6 rounded-3xl border border-[#dee2e6] shadow-lg space-y-6">
          <div className="space-y-4">
            {marks.map((m, idx) => (
              <div key={m.id} className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-1 text-[10px] font-black text-[#636e72]">{idx + 1}</div>
                <div className="col-span-6 relative">
                   <input
                    type="number"
                    placeholder="Obtained Marks"
                    value={m.obtained}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => updateMark(m.id, 'obtained', e.target.value)}
                    className="w-full bg-[#f8f9fa] border border-[#dee2e6] rounded-xl px-4 py-2.5 text-sm font-bold text-[#1a237e] outline-none focus:border-[#1a237e] transition-all"
                  />
                </div>
                <div className="col-span-1 text-center font-bold text-[#636e72]">/</div>
                <div className="col-span-4">
                  <input
                    type="number"
                    placeholder="Max"
                    value={m.max}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => updateMark(m.id, 'max', e.target.value)}
                    className="w-full bg-[#f8f9fa] border border-[#dee2e6] rounded-xl px-4 py-2.5 text-sm font-bold text-[#1a237e] outline-none focus:border-[#1a237e] transition-all"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#dee2e6] flex flex-col gap-6">
            <button 
              onClick={calculatePercentage}
              className="w-full bg-[#1a237e] text-white py-4 rounded-xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-[#1a237e]/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-white" />
              Calculate Result
            </button>

            {resultPercentage !== null && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#f0f2ff] p-6 rounded-2xl flex flex-col items-center text-center gap-2 border border-[#1a237e]/10"
              >
                <p className="text-[#636e72] text-[10px] uppercase font-black tracking-widest leading-none">Final Percentage</p>
                <h4 className="text-4xl font-black text-[#1a237e]">{resultPercentage.toFixed(2)}%</h4>
                <div className="mt-2 flex gap-1">
                   {[...Array(5)].map((_, i) => (
                     <div key={i} className={`h-1.5 w-8 rounded-full ${i < Math.floor(resultPercentage / 20) ? 'bg-[#00b8d4]' : 'bg-[#1a237e]/10'}`}></div>
                   ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Standard Scientific Calculator
  const scientificButtons = [
    { label: '(', val: '(' },
    { label: ')', val: ')' },
    { label: '√', val: '√(' },
    { label: 'cosec', val: 'cosec(' },
    { label: 'sin', val: 'sin(' },
    { label: 'cos', val: 'cos(' },
    { label: 'tan', val: 'tan(' },
    { label: 'log', val: 'log(' },
    { label: '^', val: '^' },
    { label: 'π', val: 'π' },
  ];

  const mainButtons = [
    { label: '7', val: '7', type: 'num' }, { label: '8', val: '8', type: 'num' }, { label: '9', val: '9', type: 'num' }, { label: '÷', val: '/', type: 'op' },
    { label: '4', val: '4', type: 'num' }, { label: '5', val: '5', type: 'num' }, { label: '6', val: '6', type: 'num' }, { label: '×', val: '*', type: 'op' },
    { label: '1', val: '1', type: 'num' }, { label: '2', val: '2', type: 'num' }, { label: '3', val: '3', type: 'num' }, { label: '−', val: '-', type: 'op' },
    { label: '0', val: '0', type: 'num' }, { label: '.', val: '.', type: 'num' }, { label: '=', val: '=', type: 'eq' }, { label: '+', val: '+', type: 'op' },
  ];

  return (
    <div className="max-w-md mx-auto space-y-6">
      <header className="flex items-center gap-4">
        <button 
          onClick={() => { setMode('selection'); clearStandard(); }}
          className="p-2 -ml-2 text-[#1a237e] hover:bg-[#f0f2ff] rounded-xl transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-[#1a237e] uppercase tracking-tight">Scientīfic Calc</h1>
          <p className="text-[#636e72] font-bold text-xs uppercase tracking-widest">Advanced Math Mode</p>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] p-6 shadow-2xl border border-[#dee2e6] space-y-6 overflow-hidden">
        {/* Display */}
        <div className="bg-[#f8f9fa] p-8 rounded-3xl border border-[#dee2e6] text-right flex flex-col justify-end min-h-[140px] shadow-inner">
          <p className="text-[#636e72] text-xs font-bold mb-1 h-4">{equation}</p>
          <div className="text-4xl font-black text-[#1a237e] overflow-hidden whitespace-nowrap overflow-ellipsis">
            {display}
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="space-y-4">
          {/* Scientific Row */}
          <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar no-scrollbar">
            {scientificButtons.map(btn => (
              <button
                key={btn.label}
                onClick={() => handleCalcPress(btn.val)}
                className="shrink-0 bg-[#f0f2ff] px-4 py-2 rounded-xl text-[10px] font-black uppercase text-[#1a237e] border border-[#1a237e]/5 hover:bg-[#1a237e] hover:text-white transition-all"
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-3">
             <button onClick={clearStandard} className="col-span-2 bg-[#fee2e2] text-red-600 p-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm">Clear</button>
             <button onClick={deleteLast} className="bg-[#f8f9fa] p-5 rounded-2xl flex items-center justify-center text-[#636e72] border border-[#dee2e6] hover:bg-[#1a1a1a] hover:text-white transition-all shadow-sm"><Delete className="w-5 h-5" /></button>
             <button onClick={() => handleCalcPress('(')} className="bg-[#f8f9fa] p-5 rounded-2xl font-black text-[#1a237e] border border-[#dee2e6] hover:bg-[#1a1a1a] hover:text-white transition-all shadow-sm">(</button>

             {mainButtons.map((btn) => (
                <button
                  key={btn.label}
                  onClick={() => btn.type === 'eq' ? calculateStandard() : handleCalcPress(btn.val)}
                  className={`p-5 rounded-2xl font-black text-lg transition-all shadow-sm ${
                    btn.type === 'num' ? 'bg-white text-[#1a1a1a] border border-[#dee2e6] hover:border-[#1a237e]' :
                    btn.type === 'op' ? 'bg-[#f0f2ff] text-[#1a237e] border border-[#1a237e]/10 hover:bg-[#1a237e] hover:text-white' :
                    'bg-[#00b8d4] text-white shadow-lg shadow-[#00b8d4]/30 hover:opacity-90'
                  }`}
                >
                  {btn.label}
                </button>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
