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
  const [showPptViewer, setShowPptViewer] = useState(false);
  const [showChapters, setShowChapters] = useState<string | null>(null);
  const [mathSection, setMathSection] = useState<'I' | 'II' | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  const scienceChapters = [
    { title: "Chapter 1: Exploration: Entering the World of Secondary Science", url: "https://ncert.nic.in/textbook/pdf/iesc101.pdf" },
    { title: "Chapter 2: Cell: The Building Block of Life", url: "https://ncert.nic.in/textbook/pdf/iesc102.pdf" },
    { title: "Chapter 3: Tissues in Action", url: "https://ncert.nic.in/textbook/pdf/iesc103.pdf" },
    { title: "Chapter 4: Describing Motion Around Us", url: "https://ncert.nic.in/textbook/pdf/iesc104.pdf" },
    { title: "Chapter 5: Exploring Mixtures and their Separation", url: "https://ncert.nic.in/textbook/pdf/iesc105.pdf" },
    { title: "Chapter 6: How Forces Affect Motion", url: "https://ncert.nic.in/textbook/pdf/iesc106.pdf" },
    { title: "Chapter 7: Work, Energy, and Simple Machines", url: "https://ncert.nic.in/textbook/pdf/iesc107.pdf" },
    { title: "Chapter 8: Journey Inside the Atom", url: "https://ncert.nic.in/textbook/pdf/iesc108.pdf" },
    { title: "Chapter 9: Atomic Foundations of Matter", url: "https://ncert.nic.in/textbook/pdf/iesc109.pdf" },
    { title: "Chapter 10: Sound Waves: Characteristics and Applications", url: "https://ncert.nic.in/textbook/pdf/iesc110.pdf" },
    { title: "Chapter 11: Reproduction: How Life Continues", url: "https://ncert.nic.in/textbook/pdf/iesc111.pdf" },
    { title: "Chapter 12: Patterns in Life: Diversity and Classification", url: "https://ncert.nic.in/textbook/pdf/iesc112.pdf" },
    { title: "Chapter 13: Earth as a System: Energy, Matter, and Life", url: "https://ncert.nic.in/textbook/pdf/iesc113.pdf" },
  ];

  const hindiChapters = [
    { title: "1. दो बैलों की कथा", author: "प्रेमचंद्र", url: "https://ncert.nic.in/textbook/pdf/ihga101.pdf" },
    { title: "2. क्या लिखूँ?", author: "पदुमलाल पुन्नालाल बख्शी", url: "https://ncert.nic.in/textbook/pdf/ihga102.pdf" },
    { title: "3. संवादहीन", author: "शेखर जोशी", url: "https://ncert.nic.in/textbook/pdf/ihga103.pdf" },
    { title: "4. ऐसी भी बातें होती हैं (लता मंगेशकर से साक्षात्कार)", author: "यतींद्र मिश्र", url: "https://ncert.nic.in/textbook/pdf/ihga104.pdf" },
    { title: "5. आखिरी चट्टान तक", author: "मोहन राकेश", url: "https://ncert.nic.in/textbook/pdf/ihga105.pdf" },
    { title: "6. रीढ़ की हड्डी", author: "जगदीशचंद्र माथुर", url: "https://ncert.nic.in/textbook/pdf/ihga106.pdf" },
    { title: "7. मैं और मेरा देश", author: "कन्हैयालाल मिश्र ‘प्रभाकर’", url: "https://ncert.nic.in/textbook/pdf/ihga107.pdf" },
  ];

  const hindiKavyaChapters = [
    { title: "8. पद", author: "रैदास", url: "https://ncert.nic.in/textbook/pdf/ihga109.pdf" },
    { title: "9. राम-लक्ष्मण-परशुराम संवाद", author: "तुलसीदास", url: "https://ncert.nic.in/textbook/pdf/ihga110.pdf" },
    { title: "10. भारति, जय, विजयकरे!", author: "सूर्यकांत त्रिपाठी ‘निराला’", url: "https://ncert.nic.in/textbook/pdf/ihga111.pdf" },
    { title: "11. झाँसी की रानी", author: "सुभद्रा कुमारी चौहान", url: "https://ncert.nic.in/textbook/pdf/ihga112.pdf" },
    { title: "12. घर की याद", author: "भवानीप्रसाद मिश्र", url: "https://ncert.nic.in/textbook/pdf/ihga113.pdf" },
  ];

  const kaveriEnglishPairs = [
    { story: "How I Taught My Grandmother to Read", poem: "Bharat Our Land", url: "https://ncert.nic.in/textbook/pdf/iebe101.pdf" },
    { story: "The Pot Maker", poem: "Gifts of Grace: Honouring Our Vocations", url: "https://ncert.nic.in/textbook/pdf/iebe102.pdf" },
    { story: "Winds of Change", poem: "Canvas of Soil", url: "https://ncert.nic.in/textbook/pdf/iebe103.pdf" },
    { story: "Vitamin-M", poem: "I Cannot Remember My Mother", url: "https://ncert.nic.in/textbook/pdf/iebe104.pdf" },
    { story: "The World of Limitless Possibilities", poem: "Nine Gold Medals", url: "https://ncert.nic.in/textbook/pdf/iebe105.pdf" },
    { story: "Twin Melodies", poem: "A Friend Found in Music", url: "https://ncert.nic.in/textbook/pdf/iebe106.pdf" },
    { story: "Carrier of Words", poem: "Words", url: "https://ncert.nic.in/textbook/pdf/iebe107.pdf" },
    { story: "Follow That Dream", poem: "Believe in Yourself", url: "https://ncert.nic.in/textbook/pdf/iebe108.pdf" },
  ];
  
  const mathPartIChapters = [
    { title: "Chapter 1: Orienting Yourself: The Use of Coordinates", url: "https://ncert.nic.in/textbook/pdf/iemh101.pdf" },
    { title: "Chapter 2: Introduction to Linear Polynomials", url: "https://ncert.nic.in/textbook/pdf/iemh102.pdf" },
    { title: "Chapter 3: The World of Numbers", url: "https://ncert.nic.in/textbook/pdf/iemh103.pdf" },
    { title: "Chapter 4: Exploring Algebraic Identities", url: "https://ncert.nic.in/textbook/pdf/iemh104.pdf" },
    { title: "Chapter 5: I’m Up and Down, and Round and Round", url: "https://ncert.nic.in/textbook/pdf/iemh105.pdf" },
    { title: "Chapter 6: Measuring Space: Perimeter and Area", url: "https://ncert.nic.in/textbook/pdf/iemh106.pdf" },
    { title: "Chapter 7: The Mathematics of Maybe: Introduction to Probability", url: "https://ncert.nic.in/textbook/pdf/iemh107.pdf" },
    { title: "Chapter 8: Predicting What Comes Next: Exploring Sequences and Progressions", url: "https://ncert.nic.in/textbook/pdf/iemh108.pdf" },
  ];

  const resources = [];
  
  if (userClass === 'IX') {
    resources.push({
      name: "NCERT Book",
      desc: `Exploration (Science), Ganita Manjari (Math), Hindi, English, and Social Science for Class 9.`,
      icon: <Library className="w-8 h-8" />,
      isCustom: true,
      onClick: () => setShowNewNcert(true)
    });
  }

  if (role === 'teacher') {
    resources.push({
      name: "PPT",
      desc: "Instant access to digital presentation slides for classroom teaching.",
      icon: <Globe className="w-8 h-8" />,
      accent: "#1c1917",
      onClick: () => setShowPptViewer(true)
    });
  }

  resources.push({ 
    name: "CBSE Academic", 
    url: "https://cbseacademic.nic.in/", 
    desc: "Curriculum guidelines and official board documentation.", 
    icon: <Library className="w-8 h-8" />,
    accent: "#f59e0b"
  });

  resources.push({ 
    name: "NCERT Portal", 
    url: "https://ncert.nic.in/ebooks.php?ln=hi", 
    desc: "Instant access to digital textbooks across all subjects.", 
    icon: <Book className="w-8 h-8" />,
    accent: "#1a237e"
  });

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
        {!showNewNcert && !showPptViewer ? (
          <motion.div 
            key="main"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {resources.map((res) => (
              res.onClick ? (
                <motion.button
                  key={res.name}
                  whileHover={{ scale: 0.98 }}
                  onClick={res.onClick}
                  className="group bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-[#e7e5e4] hover:border-[#1a237e] transition-all flex flex-col justify-between h-[280px] sm:h-[320px] relative overflow-hidden shadow-sm hover:shadow-2xl"
                >
                  <div className="flex justify-between items-start relative z-10">
                    <div className="w-16 h-16 bg-[#f8f9fa] rounded-3xl flex items-center justify-center text-[#1a237e] group-hover:bg-[#1a237e] group-hover:text-white transition-all duration-500">
                      {res.icon}
                    </div>
                  </div>
                  <div className="relative z-10 text-left">
                    <h2 className="text-2xl font-black uppercase tracking-tighter mb-3 group-hover:text-[#1a237e] transition-colors">{res.name}</h2>
                    <p className="text-[#57534e] text-[11px] leading-relaxed font-bold opacity-60 group-hover:opacity-100 transition-opacity">
                      {res.desc}
                    </p>
                  </div>
                  <div className="absolute top-[-20%] right-[-10%] w-48 h-48 rounded-full blur-[80px] bg-stone-100 group-hover:bg-[#1a237e]/10 transition-colors" />
                </motion.button>
              ) : (
                <a 
                  key={res.name}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  className="group bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-[#e7e5e4] hover:border-[#0066CC] transition-all flex flex-col justify-between h-[280px] sm:h-[320px] relative overflow-hidden shadow-sm hover:shadow-2xl"
                >
                  <div className="flex justify-between items-start relative z-10">
                    <div className="w-16 h-16 bg-[#f8f9fa] rounded-3xl flex items-center justify-center text-[#0066CC] group-hover:bg-[#0066CC] group-hover:text-white transition-all duration-500">
                      {res.icon}
                    </div>
                    <ExternalLink className="w-5 h-5 opacity-20 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                  </div>
                  <div className="relative z-10 text-left">
                    <h2 className="text-2xl font-black uppercase tracking-tighter mb-3 group-hover:text-[#0066CC] transition-colors">{res.name}</h2>
                    <p className="text-[#57534e] text-[11px] leading-relaxed font-bold opacity-60 group-hover:opacity-100 transition-opacity">{res.desc}</p>
                  </div>
                  <div className="absolute top-[-20%] right-[-10%] w-48 h-48 rounded-full blur-[80px] bg-stone-100 group-hover:bg-[#0066CC]/10 transition-colors" />
                </a>
              )
            ))}
          </motion.div>
        ) : showPptViewer ? (
          <motion.div 
            key="ppt-viewer"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            <button 
              onClick={() => setShowPptViewer(false)}
              className="flex items-center gap-3 text-[#0066CC] font-black text-xs uppercase tracking-[0.2em] hover:gap-5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Archives
            </button>

            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter italic text-[#0066CC]">Classroom PPTs</h2>
                <p className="text-[10px] font-bold text-[#57534e] uppercase tracking-widest mt-1 opacity-60">Digital presentation slides by subject</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {['Mathematics', 'Science', 'English', 'Hindi', 'Social Science'].map((subject) => (
                  <div 
                    key={subject}
                    className="bg-white p-8 rounded-[2rem] border border-[#e7e5e4] shadow-sm flex flex-col gap-4"
                  >
                    <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center text-[#0066CC]">
                      <Globe className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter text-[#1c1917]">{subject}</h3>
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-2">
                        No PPT available right now. Check frequently for updates.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
              onClick={() => {
                setShowChapters(null);
                setMathSection(null);
                setShowNewNcert(false);
              }}
              className="flex items-center gap-3 text-[#0066CC] font-black text-xs uppercase tracking-[0.2em] hover:gap-5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Archives
            </button>

            {showChapters === 'Science' ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic text-[#0066CC]">Science: Exploration</h2>
                    <p className="text-[10px] font-bold text-[#57534e] uppercase tracking-widest mt-1 opacity-60">Complete 13 Chapter Digital Archive</p>
                  </div>
                  <button 
                    onClick={() => setShowChapters(null)}
                    className="px-6 py-2 bg-[#0066CC] text-white rounded-full text-[10px] font-black uppercase tracking-widest"
                  >
                    Close Viewer
                  </button>
                </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {scienceChapters.map((chapter) => (
                      <a
                        key={chapter.url}
                        href={chapter.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        referrerPolicy="no-referrer"
                        className="bg-white p-6 rounded-2xl border border-[#e7e5e4] hover:border-[#0066CC] hover:shadow-md transition-all flex items-center justify-between group"
                      >
                        <span className="text-xs font-black uppercase tracking-tight text-[#1c1917] transition-colors group-hover:text-[#0066CC]">{chapter.title}</span>
                        <ExternalLink className="w-4 h-4 text-[#0066CC] opacity-20 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                  <div className="mt-8 p-6 bg-[#f8f9fa] rounded-2xl border border-[#e7e5e4] text-center">
                    <p className="text-[10px] font-bold text-[#57534e] uppercase tracking-widest opacity-60">
                      Note: If PDFs don't open, right-click and select "Open link in new tab".
                    </p>
                  </div>
                </div>
              ) : showChapters === 'Math' ? (
              <div className="space-y-12">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic text-[#0066CC]">Math</h2>
                    <p className="text-[10px] font-bold text-[#57534e] uppercase tracking-widest mt-1 opacity-60">2026-27 Ganita Manjari Curriculum</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowChapters(null);
                      setMathSection(null);
                    }}
                    className="px-6 py-2 bg-[#0066CC] text-white rounded-full text-[10px] font-black uppercase tracking-widest"
                  >
                    Switch Subject
                  </button>
                </div>

                {!mathSection ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <button
                      onClick={() => setMathSection('I')}
                      className="bg-white p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] border-2 border-[#e7e5e4] hover:border-[#0066CC] transition-all group flex flex-col items-center text-center gap-4 sm:gap-6"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#f8f9fa] rounded-full flex items-center justify-center text-[#0066CC] group-hover:bg-[#0066CC] group-hover:text-white transition-all shadow-inner">
                        <BookMarked className="w-8 h-8 sm:w-10 sm:h-10" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter">Part I</h3>
                        <span className="text-[8px] font-black uppercase tracking-widest text-[#0066CC] mt-2 block italic opacity-60">8 Chapters Available</span>
                      </div>
                    </button>
                    <button
                      onClick={handleComingSoon}
                      className="bg-white p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] border-2 border-[#e7e5e4] hover:border-[#57534e] transition-all group flex flex-col items-center text-center gap-4 sm:gap-6 opacity-60"
                    >
                      <div className="w-20 h-20 bg-[#f8f9fa] rounded-full flex items-center justify-center text-[#57534e] shadow-inner">
                        <Lock className="w-10 h-10" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter">Part II</h3>
                        <span className="text-[8px] font-black uppercase tracking-widest text-[#57534e] mt-2 block italic">Coming Soon</span>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setMathSection(null)}
                        className="text-[10px] font-black uppercase tracking-widest text-[#0066CC] hover:underline"
                      >
                        Back to Selection
                      </button>
                      <span className="text-white bg-[#0066CC] px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest italic">Part I Content</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mathPartIChapters.map((chapter) => (
                        <a
                          key={chapter.title}
                          href={chapter.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                          className="bg-white p-6 rounded-2xl border border-[#e7e5e4] hover:border-[#0066CC] hover:shadow-md transition-all flex items-center justify-between group"
                        >
                          <span className="text-xs font-black uppercase tracking-tight text-[#1c1917] transition-colors group-hover:text-[#0066CC]">{chapter.title}</span>
                          <ExternalLink className="w-4 h-4 text-[#0066CC] opacity-20 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : showChapters === 'Kaveri' ? (
              <div className="space-y-12">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic text-[#0066CC]">English</h2>
                    <p className="text-[10px] font-bold text-[#57534e] uppercase tracking-widest mt-1 opacity-60">2026-27 Rationalized Curriculum (Pairs)</p>
                  </div>
                  <button 
                    onClick={() => setShowChapters(null)}
                    className="px-6 py-2 bg-[#0066CC] text-white rounded-full text-[10px] font-black uppercase tracking-widest"
                  >
                    Switch Subject
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {kaveriEnglishPairs.map((pair, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Story Box - Clickable */}
                      <a
                        href={pair.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        referrerPolicy="no-referrer"
                        className="bg-white p-8 rounded-[2rem] border border-[#e7e5e4] hover:border-[#0066CC] hover:shadow-xl transition-all flex flex-col justify-center group relative overflow-hidden"
                      >
                        <div className="relative z-10 flex items-center justify-between">
                          <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-[#0066CC] opacity-40 mb-1 block">Chapter {idx + 1}: Story</span>
                            <h3 className="text-xl font-black text-[#1c1917] tracking-tight group-hover:text-[#0066CC] transition-colors">{pair.story}</h3>
                          </div>
                          <ExternalLink className="w-5 h-5 text-[#0066CC] opacity-20 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#0066CC]/5 rounded-bl-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                      </a>

                      {/* Poem Box - Faded & Unclickable */}
                      <div className="bg-[#f8f9fa] p-8 rounded-[2rem] border border-[#e7e5e4] flex flex-col justify-center relative overflow-hidden cursor-not-allowed opacity-40 grayscale">
                        <div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-[#57534e] opacity-40 mb-1 block">Parallel Reading: Poem</span>
                          <h3 className="text-xl font-black text-[#1c1917] tracking-tight">{pair.poem}</h3>
                        </div>
                        <Lock className="absolute top-4 right-4 w-4 h-4 text-[#57534e] opacity-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : showChapters === 'Hindi' ? (
              <div className="space-y-12">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic text-[#0066CC]">Hindi</h2>
                    <p className="text-[10px] font-bold text-[#57534e] uppercase tracking-widest mt-1 opacity-60">2026-27 Rationalized Curriculum</p>
                  </div>
                  <button 
                    onClick={() => setShowChapters(null)}
                    className="px-6 py-2 bg-[#0066CC] text-white rounded-full text-[10px] font-black uppercase tracking-widest"
                  >
                    Switch Subject
                  </button>
                </div>

                <div className="space-y-12">
                  <div className="space-y-6">
                    <div className="inline-block px-8 py-3 bg-black/5 border-2 border-[#0066CC]/10 rounded-[2rem]">
                      <h3 className="text-2xl font-black text-[#0066CC] tracking-tight">गद्य खंड</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {hindiChapters.map((chapter) => (
                        <a
                          key={chapter.title}
                          href={chapter.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                          className="bg-white p-8 rounded-[2rem] border border-[#e7e5e4] hover:border-[#0066CC] hover:shadow-xl transition-all flex flex-col gap-2 group"
                        >
                          <span className="text-lg font-black text-[#1c1917] tracking-tight group-hover:text-[#0066CC] transition-colors">{chapter.title}</span>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-[#57534e] uppercase tracking-widest opacity-40">लेखक:</span>
                              <span className="text-xs font-black text-[#0066CC] italic">{chapter.author}</span>
                            </div>
                            <ExternalLink className="w-4 h-4 text-[#0066CC] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="inline-block px-8 py-3 bg-black/5 border-2 border-[#0066CC]/10 rounded-[2rem]">
                      <h3 className="text-2xl font-black text-[#0066CC] tracking-tight">काव्य खंड</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {hindiKavyaChapters.map((chapter) => (
                        <a
                          key={chapter.title}
                          href={chapter.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          referrerPolicy="no-referrer"
                          className="bg-white p-8 rounded-[2rem] border border-[#e7e5e4] hover:border-[#0066CC] hover:shadow-xl transition-all flex flex-col gap-2 group"
                        >
                          <span className="text-lg font-black text-[#1c1917] tracking-tight group-hover:text-[#0066CC] transition-colors">{chapter.title}</span>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-[#57534e] uppercase tracking-widest opacity-40">लेखक:</span>
                              <span className="text-xs font-black text-[#0066CC] italic">{chapter.author}</span>
                            </div>
                            <ExternalLink className="w-4 h-4 text-[#0066CC] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[
                  { name: 'English', isChapters: true, chapterId: 'Kaveri' },
                  { name: 'Hindi', isChapters: true, chapterId: 'Hindi' },
                  { name: 'Science', isChapters: true },
                  { name: 'Math', isChapters: true, chapterId: 'Math' },
                  { name: 'Social Science', link: null },
                ].map((book) => (
                  <button
                    key={book.name}
                    onClick={book.isChapters ? () => setShowChapters(book.chapterId || book.name) : (book.link ? () => window.open(book.link, '_blank') : handleComingSoon)}
                    className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-[#e7e5e4] shadow-sm flex flex-col items-center text-center gap-4 sm:gap-6 hover:border-[#0066CC] hover:shadow-xl transition-all group"
                  >
                    <div className="w-20 h-20 bg-[#f8f9fa] rounded-full flex items-center justify-center text-[#0066CC] shadow-inner group-hover:bg-[#0066CC] group-hover:text-white transition-all duration-500">
                      <Book className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tighter text-[#1c1917]">{book.name}</h3>
                      {book.link || book.isChapters ? (
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-600 mt-2 block italic">Vault Access Open</span>
                      ) : (
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#57534e] opacity-40 mt-2 block">Pending Upload</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
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
               <div className="w-8 h-8 bg-[#0066CC] rounded-full flex items-center justify-center">
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
          Credit: Abhi Sharma(9-D) &bull; SM'S Portal
        </p>
      </div>
    </div>
  );
}
