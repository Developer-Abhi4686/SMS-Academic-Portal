import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookMarked, 
  ExternalLink, 
  ChevronRight, 
  FileText, 
  Book, 
  Lock,
  ArrowLeft,
  Search,
  Library,
  ArrowRight,
  Globe,
  Plus
} from 'lucide-react';

interface ResourcesProps {
  role: 'teacher' | 'student';
  onBack?: () => void;
  userClass?: string | null;
}

export default function Resources({ role, onBack, userClass }: ResourcesProps) {
  const [showNewNcert, setShowNewNcert] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const mainResources = [
    { 
      name: "NCERT Portal", 
      url: "https://ncert.nic.in/ebooks.php?ln=hi", 
      desc: "Instant access to digital textbooks across all subjects.", 
      icon: <Book className="w-8 h-8" />,
      accent: "#1a237e"
    },
    { 
      name: "CBSE Academic", 
      url: "https://cbseacademic.nic.in/", 
      desc: "Curriculum guidelines and official board documentation.", 
      icon: <Library className="w-8 h-8" />,
      accent: "#f59e0b"
    }
  ];

  if (role === 'teacher') {
    mainResources.push({
      name: "Reference Hub",
      url: "https://www.selfstudys.com/",
      desc: "Extensive repository of digital reference books and notes.",
      icon: <Globe className="w-8 h-8" />,
      accent: "#1c1917"
    });
  }

  const handleComingSoon = () => {
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-24">
      {/* Editorial Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-4 bg-white border border-[#e7e5e4] text-[#1a237e] rounded-2xl shadow-sm hover:shadow-md transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1a237e]">Institutional Archive</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Digital <span className="font-editorial text-[#1a237e]">Library</span></h1>
            <p className="text-[#57534e] text-sm font-medium">Access verified NCERT & Academic references.</p>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-4 bg-[#f8f9fa] p-2 rounded-2xl border border-[#e7e5e4]">
           <button className="px-6 py-2.5 bg-white text-[#1a237e] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">All Resources</button>
           <button className="px-6 py-2.5 text-[#57534e] hover:text-[#1a237e] rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">Bookmarks</button>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {!showNewNcert ? (
          <motion.div 
            key="main"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {mainResources.map((res) => (
              <a 
                key={res.name}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white p-10 rounded-[3rem] border border-[#e7e5e4] hover:border-[#1a237e] transition-all flex flex-col justify-between h-[320px] relative overflow-hidden shadow-sm hover:shadow-2xl"
              >
                <div className="flex justify-between items-start relative z-10">
                  <div className="w-16 h-16 bg-[#f8f9fa] rounded-3xl flex items-center justify-center text-[#1a237e] group-hover:bg-[#1a237e] group-hover:text-white transition-all duration-500">
                    {res.icon}
                  </div>
                  <ExternalLink className="w-5 h-5 opacity-20 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </div>
                <div className="relative z-10">
                  <h2 className="text-2xl font-black uppercase tracking-tighter mb-3 group-hover:text-[#1a237e] transition-colors">{res.name}</h2>
                  <p className="text-[#57534e] text-[11px] leading-relaxed font-bold opacity-60 group-hover:opacity-100 transition-opacity">{res.desc}</p>
                </div>
                <div className="absolute top-[-20%] right-[-10%] w-48 h-48 rounded-full blur-[80px] bg-stone-100 group-hover:bg-[#1a237e]/10 transition-colors" />
              </a>
            ))}

            {userClass === 'IX' && (
              <motion.button
                whileHover={{ scale: 0.98 }}
                onClick={() => setShowNewNcert(true)}
                className="group bg-[#1c1917] p-10 rounded-[3rem] flex flex-col justify-between h-[320px] relative overflow-hidden shadow-xl"
              >
                <div className="flex justify-between items-start relative z-10">
                   <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-white backdrop-blur-md">
                     <Plus className="w-8 h-8" />
                   </div>
                   <div className="px-4 py-1.5 bg-[#1a237e] text-white text-[9px] font-black uppercase tracking-widest rounded-full">New Batch</div>
                </div>
                <div className="relative z-10">
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-3">2026—27 NCERT</h2>
                  <p className="text-white/50 text-[11px] leading-relaxed font-bold">Access the complete updated curriculum drive.</p>
                </div>
                <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-[#1a237e]/20 rounded-full blur-[60px]" />
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="ncert"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            <button 
              onClick={() => setShowNewNcert(false)}
              className="flex items-center gap-3 text-[#1a237e] font-black text-xs uppercase tracking-[0.2em] hover:gap-5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Archives
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[
                { name: 'Kaveri', link: 'https://drive.google.com/file/d/152LkpEUcg_PHHYlDgu07ww0NWiIhE1Yg/view?usp=drive_link' },
                { name: 'Ganga', link: 'https://drive.google.com/file/d/1X-j30T7Q6skkkfqKLLW8_0ks3ZsNNrqn/view?usp=drivesdk' },
                { name: 'Science', link: 'https://drive.google.com/file/d/1IzwmSHXGzTK7cV2svrACPwkg6E8-ap-j/view?usp=drivesdk' },
                { name: 'Math', link: null },
                { name: 'Social Science', link: null },
              ].map((book) => (
                <button
                  key={book.name}
                  onClick={book.link ? () => window.open(book.link, '_blank') : handleComingSoon}
                  className="bg-white p-10 rounded-[3rem] border border-[#e7e5e4] shadow-sm flex flex-col items-center text-center gap-6 hover:border-[#1a237e] hover:shadow-xl transition-all group"
                >
                  <div className="w-20 h-20 bg-[#f8f9fa] rounded-full flex items-center justify-center text-[#1a237e] shadow-inner group-hover:bg-[#1a237e] group-hover:text-white transition-all duration-500">
                    <Book className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tighter text-[#1c1917]">{book.name}</h3>
                    {book.link ? (
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-600 mt-2 block italic">Vault Access Open</span>
                    ) : (
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#57534e] opacity-40 mt-2 block">Pending Upload</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPopup && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200]"
          >
            <div className="bg-[#1c1917] text-white px-8 py-4 rounded-[2rem] border border-white/10 shadow-2xl flex items-center gap-4">
               <div className="w-8 h-8 bg-[#1a237e] rounded-full flex items-center justify-center">
                 <Lock className="w-4 h-4" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Resource Not Yet Finalized</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Credit Footer */}
      <div className="pt-12 border-t border-[#e7e5e4] text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#57534e]">
          Credit: Abhi Sharma(9-D) &bull; SMS Student Hub
        </p>
      </div>
    </div>
  );
}
