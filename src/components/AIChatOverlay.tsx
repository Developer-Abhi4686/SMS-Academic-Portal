import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Send, 
  Sparkles,
  Zap,
  Globe,
  Plus
} from 'lucide-react';
import { getGeminiResponse, prompts } from '../lib/geminiService';
import MarkdownRenderer from './MarkdownRenderer';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AIChatOverlayProps {
  role?: 'teacher' | 'student' | null;
}

export default function AIChatOverlay({ role }: AIChatOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const welcomeText = role === 'teacher' 
      ? "Greetings. I am Zehn, your institutional AI analyst. I'm here to streamline your administrative workload and coordinate pedagogical strategies. How may I assist your mission today?"
      : "Hey! I'm Zehn. 🚀 Consider me your secondary cognitive node. Whether it's complex math, assignment structures, or school life—I'm ready to sync. What's on the agenda?";
    
    setMessages([
      {
        id: 'welcome',
        text: welcomeText,
        sender: 'ai',
        timestamp: new Date()
      }
    ]);
  }, [role]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (text: string = inputText) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const chatHistory = messages
        .map(m => `${m.sender === 'user' ? 'User' : 'Zehn'}: ${m.text}`)
        .join('\n');
      
      const fullPrompt = `${chatHistory}\nUser: ${text}\nZehn:`;
      const systemPrompt = role === 'teacher' ? prompts.teacherSchoolCompanion : prompts.schoolCompanion;
      const aiResponse = await getGeminiResponse(fullPrompt, systemPrompt);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Zehn Chat Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger - Refined */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-10 right-10 w-16 h-16 bg-[#943a1a] text-white rounded-full shadow-2xl flex items-center justify-center z-[100] border-4 border-white overflow-hidden group"
      >
        <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.button>

      {/* Side Assist Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-[#1c1917]/20 backdrop-blur-sm z-[110]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-[#fdfcfb] shadow-[-20px_0_60px_rgba(0,0,0,0.1)] z-[120] flex flex-col border-l border-[#e7e5e4]"
            >
              {/* Header: Editorial & Sophisticated */}
              <div className="p-10 pb-6 border-b border-[#e7e5e4]">
                <div className="flex justify-between items-start mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#943a1a] rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black uppercase tracking-tighter text-[#943a1a]">Zehn</h3>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Intelligence Node</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-3 bg-[#f7f5f2] rounded-full text-[#57534e] hover:text-[#943a1a] hover:bg-white transition-all border border-[#e7e5e4]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-[#fdfcfb] bg-[#f7f5f2] flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-[#943a1a] opacity-30" />
                      </div>
                    ))}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#57534e] opacity-60">System Online & Active</span>
                </div>
              </div>

              {/* Chat Canvas */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-8 py-8 space-y-8 bg-[#fdfcfb] custom-scrollbar"
              >
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`max-w-[90%] px-6 py-4 rounded-[2rem] transition-all ${
                      msg.sender === 'ai' 
                        ? 'bg-[#f7f5f2] border border-[#e7e5e4] text-[#1c1917] rounded-tl-none' 
                        : 'bg-[#943a1a] text-white rounded-tr-none shadow-lg'
                    }`}>
                      <MarkdownRenderer content={msg.text} />
                    </div>
                    <span className="mt-3 text-[8px] font-black uppercase tracking-widest text-[#57534e] opacity-40">
                      {msg.sender === 'ai' ? 'Analytical Output' : 'User Request'} &bull; {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2 p-4 bg-[#f7f5f2] rounded-2xl w-fit">
                    <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-[#943a1a]" />
                    <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-[#943a1a]" />
                    <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-[#943a1a]" />
                  </div>
                )}
              </div>

              {/* Input Surface */}
              <div className="p-8 border-t border-[#e7e5e4] bg-white">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <Plus className="w-4 h-4 text-[#943a1a]" />
                  </div>
                  <input 
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={role === 'teacher' ? "Execute command..." : "Engage with Zehn..."}
                    className="w-full pl-14 pr-24 py-5 bg-[#f7f5f2] rounded-[1.5rem] border-2 border-transparent focus:border-[#943a1a] outline-none font-bold text-xs transition-all"
                  />
                  <div className="absolute inset-y-2 right-2 flex items-center">
                    <button 
                      onClick={() => handleSend()}
                      disabled={!inputText.trim() || loading}
                      className="px-6 h-full bg-[#943a1a] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-[#c2410c] transition-all shadow-lg disabled:opacity-50 disabled:shadow-none"
                    >
                      Process <Send className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-center gap-3 grayscale opacity-30">
                  <Globe className="w-3 h-3" />
                  <span className="text-[8px] font-black uppercase tracking-[0.4em]">Integrated Academic Network</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
