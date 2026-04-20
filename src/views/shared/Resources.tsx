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
  Search
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
      name: "NCERT books", 
      url: "https://ncert.nic.in/ebooks.php?ln=hi", 
      desc: "Official digital textbooks from NCERT.", 
      icon: "📚",
      color: "from-blue-500 to-indigo-500"
    },
    { 
      name: "CBSE Resources", 
      url: "https://cbseacademic.nic.in/", 
      desc: "Academic guidelines and syllabus.", 
      icon: "🏫",
      color: "from-green-500 to-teal-500"
    }
  ];

  if (role === 'teacher') {
    mainResources.push({
      name: "Free Reference Hub",
      url: "https://www.selfstudys.com/", // A popular free reference site in India
      desc: "Reference books and notes digitsolly for free.",
      icon: "📔",
      color: "from-purple-500 to-pink-500"
    });
  }

  const handleComingSoon = () => {
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 -ml-2 text-[#1a237e] hover:bg-[#f0f2ff] rounded-xl transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-black text-[#1a237e] uppercase tracking-tight">Digital Library</h1>
            <p className="text-[#636e72] text-[11px] font-bold uppercase tracking-widest">Official NCERT and Academic Reference Material.</p>
          </div>
        </div>
        {!showNewNcert && (
          <div className="hidden md:flex p-3 bg-white border border-[#e9ecef] rounded-xl items-center gap-3 shadow-sm">
            <Search className="w-4 h-4 text-[#1a237e]" />
            <input placeholder="Search resources..." className="bg-transparent border-none outline-none text-xs font-bold text-[#1a237e] w-48" />
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!showNewNcert ? (
          <motion.div 
            key="main"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {mainResources.map((res) => (
              <a 
                key={res.name}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white p-8 rounded-2xl border border-[#e9ecef] hover:border-[#3949ab] transition-all flex items-start gap-6 relative overflow-hidden shadow-sm hover:shadow-md"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${res.color} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500`} />
                <div className="text-5xl group-hover:scale-110 transition-transform duration-300">{res.icon}</div>
                <div>
                  <h2 className="text-xl font-bold text-[#2d3436] mb-2 flex items-center gap-2 group-hover:text-[#1a237e] transition-colors">
                    {res.name}
                    <ExternalLink className="w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity" />
                  </h2>
                  <p className="text-[#636e72] text-xs font-medium leading-relaxed">{res.desc}</p>
                </div>
              </a>
            ))}

            {userClass === 'IX' && (
              <button
                onClick={() => setShowNewNcert(true)}
                className="group bg-white p-8 rounded-2xl border border-[#e9ecef] hover:border-orange-500 transition-all flex items-start gap-6 shadow-sm text-left"
              >
                <div className="text-5xl">🆕</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-[#2d3436] mb-2 flex items-center justify-between group-hover:text-orange-600">
                    New NCERT
                    <ChevronRight className="w-5 h-5 opacity-30 group-hover:opacity-100 transition-opacity" />
                  </h2>
                  <p className="text-[#636e72] text-xs font-medium">Access the latest 2026-27 curriculum books.</p>
                </div>
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="ncert"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <button 
              onClick={() => setShowNewNcert(false)}
              className="flex items-center gap-2 text-[#636e72] hover:text-[#1a237e] font-bold text-xs uppercase tracking-widest transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Resources
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Kaveri', link: 'https://drive.google.com/file/d/152LkpEUcg_PHHYlDgu07ww0NWiIhE1Yg/view?usp=drive_link' },
                { name: 'Ganga', link: 'https://drive.google.com/file/d/1X-j30T7Q6skkkfqKLLW8_0ks3ZsNNrqn/view?usp=drive_link' },
                { name: 'Science', link: 'https://drive.google.com/file/d/1IzwmSHXGzTK7cV2svrACPwkg6E8-ap-j/view?usp=drive_link' },
                { name: 'Math', link: null },
                { name: 'Social Science', link: null },
              ].map((book) => (
                <button
                  key={book.name}
                  onClick={book.link ? () => window.open(book.link, '_blank') : handleComingSoon}
                  className="bg-white p-10 rounded-2xl border border-[#e9ecef] shadow-sm flex flex-col items-center gap-4 hover:border-[#1a237e] group transition-all"
                >
                  <Book className="w-12 h-12 text-[#1a237e] group-hover:scale-110 transition-transform" />
                  <span className="text-xl font-black text-[#2d3436]">{book.name}</span>
                  {book.link ? (
                    <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 shadow-sm">Available</span>
                  ) : (
                    <span className="text-[10px] text-[#636e72] font-black uppercase tracking-widest bg-[#f8f9fa] px-4 py-1.5 rounded-full border border-[#dee2e6]">Coming Soon</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPopup && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-[#1a237e] text-white p-4 rounded-2xl border border-[#1a237e]/20 font-black uppercase text-[10px] tracking-widest z-50 shadow-2xl"
          >
            Coming Soon!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
