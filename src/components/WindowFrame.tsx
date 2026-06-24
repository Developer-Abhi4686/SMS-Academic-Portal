import React from 'react';
import { motion, useDragControls } from 'motion/react';
import { RunningApp } from '../types';

interface WindowFrameProps {
  app: RunningApp;
  index: number;
  isFocused: boolean;
  item: any;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onFocus: () => void;
  dragConstraintsRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}

export default function WindowFrame({
  app,
  index,
  isFocused,
  item,
  onClose,
  onMinimize,
  onToggleMaximize,
  onFocus,
  dragConstraintsRef,
  children
}: WindowFrameProps) {
  const dragControls = useDragControls();
  const isMaximized = true;

  // We start dragging on pointer down inside the title bar
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag with primary mouse button
    if (e.button !== 0) return;
    // Dragging is disabled since we are always full screen
    onFocus();
  };

  const holderClasses = isMaximized
    ? "absolute inset-0 top-8 flex items-center justify-center select-text p-0"
    : "absolute w-full max-w-4xl h-[75%] flex items-center justify-center select-text p-1";

  const windowClasses = isMaximized
    ? "w-full h-full bg-white/75 backdrop-blur-3xl rounded-none border-none shadow-none flex flex-col overflow-hidden relative"
    : "w-full h-full bg-white/60 backdrop-blur-3xl rounded-[2.5rem] border border-[#9E9EB7]/25 shadow-[0_30px_70px_rgba(107,105,152,0.1)] flex flex-col overflow-hidden relative";

  return (
    <motion.div
      drag={!isMaximized}
      dragControls={dragControls}
      dragListener={false} // Disable dragging from the body of the window
      dragMomentum={false}
      dragElastic={0.1}
      dragConstraints={dragConstraintsRef}
      initial={{ 
        opacity: 0, 
        scale: 0.94, 
        x: !isMaximized ? index * 24 : 0, 
        y: !isMaximized ? index * 18 : 0 
      }}
      animate={{ 
        opacity: app.minimized ? 0 : 1,
        scale: app.minimized ? 0.05 : 1,
        pointerEvents: app.minimized ? 'none' : 'auto',
        zIndex: app.zIndex,
      }}
      exit={{ opacity: 0, scale: 0.1, y: -350 }}
      transition={{ type: "spring", stiffness: 220, damping: 25 }}
      style={{ position: 'absolute' }}
      className={`${holderClasses} ${isFocused ? 'ring-1 ring-cyan-500/30 rounded-[2.5rem]' : ''}`}
      onPointerDown={onFocus}
    >
      <div className={windowClasses}>
        {/* Window title bar (macOS top-panel chrome) */}
        <div 
          onPointerDown={handlePointerDown}
          className="window-title-bar h-14 border-[#9E9EB7]/15 border-b flex items-center justify-between px-6 select-none shrink-0 bg-white/20 cursor-grab active:cursor-grabbing"
        >
          {/* Standard Traffic-Light buttons with authentic MacBook colors */}
          <div className="flex items-center gap-2.5 group/traffic">
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }} 
              className="w-4.5 h-4.5 rounded-full bg-[#FF5F56] border border-[#FF5F56]/20 flex items-center justify-center text-[8px] font-black text-transparent hover:group-hover/traffic:text-red-900/70 transition-colors relative cursor-pointer shadow-sm active:scale-90"
              title="Close"
            >
              ✕
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onMinimize(); }} 
              className="w-4.5 h-4.5 rounded-full bg-[#FFBD2E] border border-[#FFBD2E]/20 flex items-center justify-center text-[9px] font-black text-transparent hover:group-hover/traffic:text-amber-950/70 transition-colors relative cursor-pointer shadow-sm active:scale-90"
              title="Minimize"
            >
              —
            </button>
            <button 
              className="w-4.5 h-4.5 rounded-full bg-[#27C93F] border border-[#27C93F]/20 flex items-center justify-center text-[7px] font-black text-transparent hover:group-hover/traffic:text-green-950/60 transition-colors relative cursor-not-allowed opacity-50 shadow-sm"
              title="Fullscreen Only"
              disabled
            >
              ⤢
            </button>
          </div>

          {/* Window Title & Icon */}
          <div className="flex items-center gap-2.5 pointer-events-none">
            {item && React.createElement(item.icon, { className: 'w-4 h-4 text-[#6B6998]' })}
            <span className="text-[11px] font-black text-[#1A1A1A] uppercase tracking-[0.2em] font-mono">
              {item?.label}
            </span>
          </div>

          {/* Right balanced visual block */}
          <div className="w-16 flex justify-end pointer-events-none">
            <span className={`text-[9px] font-mono font-bold uppercase tracking-widest ${isFocused ? 'text-cyan-500' : 'text-[#9E9EB7]'}`}>
              {isFocused ? 'Active' : 'BG'}
            </span>
          </div>
        </div>

        {/* Main scrollable body panel for custom rendered tools */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-12 py-4 sm:py-10 custom-scrollbar scroll-smooth bg-white/35 text-[#1A1A1A] select-text">
          {children}
        </div>
      </div>
    </motion.div>
  );
}
