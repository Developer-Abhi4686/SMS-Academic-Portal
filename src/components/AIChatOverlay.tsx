import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, 
  X, 
  Send, 
  MessageSquare,
  Sparkles,
  User,
  RotateCcw,
  Zap,
  Globe
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
    // Set initial message based on role
    const welcomeText = role === 'teacher' 
      ? "Greetings. I am Zehn, the institutional AI assistant for the SMS Academic Portal. I am here to assist you with administrative tasks, lesson planning, and professional pedagogical support. How can I help you excel today at St. Michael's?"
      : "Hey! I'm Zehn, your AI companion in the SMS Academic Portal. 🚀 Whether you need help with your percentage calculations, assignments, or just want to chat about school life at St. Michael's, I've got your back!";
    
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

  // Auto-scroll to bottom
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
      {/* Floating Button */}
      <div className="fixed bottom-24 sm:bottom-6 right-6 z-[60]">
        <motion.button
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`group relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 border overflow-hidden ${
            isOpen 
              ? 'bg-white border-[#e9ecef] shadow-xl' 
              : 'bg-[#1a237e] border-white/20 shadow-[0_10px_30px_rgba(26,35,126,0.3)]'
          }`}
        >
          {/* Animated Background for idle state */}
          {!isOpen && (
            <motion.div 
              animate={{ 
                background: [
                  'linear-gradient(45deg, #1a237e, #3949ab)',
                  'linear-gradient(45deg, #3949ab, #1a237e)',
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
              className="absolute inset-0 opacity-100"
            />
          )}
          
          <div className="relative z-10">
            {isOpen ? (
              <X className="w-6 h-6 text-[#1a237e]" />
            ) : (
              <Zap className="w-6 h-6 text-[#00b8d4] fill-[#00b8d4] group-hover:scale-110 transition-transform" />
            )}
          </div>
        </motion.button>
      </div>

      {/* Chat Dialog */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-40 sm:bottom-24 right-6 w-[380px] max-w-[calc(100vw-3rem)] h-[550px] max-h-[calc(100vh-12rem)] bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] z-[60] flex flex-col overflow-hidden border border-white/50"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-[#1a237e] via-[#311b92] to-[#1a237e] p-8 text-white relative">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00b8d4]/10 rounded-full blur-3xl" />
              <div className="flex items-center gap-5 relative z-10">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl overflow-hidden group">
                    <Zap className="w-8 h-8 text-[#00b8d4] fill-[#00b8d4] animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#1a237e] rounded-full" />
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tight">ZEHN <span className="text-[#00b8d4] font-light">OS</span></h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                    {role === 'teacher' ? 'Institutional AI Assistant' : 'Next-Gen Academic Proxy'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-[#f8f9fa]/50 custom-scrollbar"
            >
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex flex-col gap-1.5 max-w-[85%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl text-[13px] font-medium leading-[1.6] transition-all shadow-sm ${
                      msg.sender === 'ai' 
                        ? 'bg-white border border-[#e9ecef] text-[#2d3436] rounded-tl-none' 
                        : 'bg-[#1a237e] text-white rounded-tr-none'
                    }`}>
                      <MarkdownRenderer content={msg.text} />
                    </div>
                    <span className="text-[9px] font-bold text-[#b2bec3] uppercase tracking-widest px-1">
                      {msg.sender === 'ai' ? 'Zehn' : 'You'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#e9ecef] px-5 py-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1.5 items-center">
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-[#00b8d4] rounded-full" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#3949ab] rounded-full" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#1a237e] rounded-full" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-[#e9ecef]">
              <div className="flex items-center gap-3 bg-[#f1f3f5] p-2 rounded-2xl border border-[#e9ecef] focus-within:border-[#1a237e] transition-colors group">
                <input 
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={role === 'teacher' ? "Consult with Zehn..." : "Sync with Zehn..."}
                  className="flex-1 bg-transparent px-3 py-2 text-[13px] font-bold focus:outline-none placeholder:text-[#b2bec3]"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() || loading}
                  className="p-3 bg-[#1a237e] text-white rounded-xl shadow-lg hover:shadow-[#1a237e]/40 transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-center mt-4">
                <div className="flex items-center gap-2 grayscale h-3 opacity-30">
                  <Globe className="w-3 h-3" />
                  <span className="text-[8px] font-black uppercase tracking-[0.3em]">Encrypted Core Connection</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
