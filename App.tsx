
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Subject, AppState, ViewMode, SavedLesson, ChatMessage, ChatSession, SearchMode, StudentProfile } from './types';
import { SubjectModule } from './components/SubjectModule';
import { FlashcardTool, PlannerTool, StrategyTool } from './components/Tools';
import { ChatBot } from './components/ChatBot';
import { ReviewCenter } from './components/ReviewCenter';
import { AuthModal } from './components/AuthModal';
import { ExamPrep } from './components/ExamPrep';
import { MindMapTool } from './components/MindMapTool';
import { GradeTracker } from './components/GradeTracker';
import { explainText } from './services/geminiService';
import { 
  Book, Brain, Sparkles, Home, 
  FolderOpen, Trash, Layout, BarChart3, PieChart,
  Search, ExternalLink, MoreHorizontal, Loader2, Bot, UserCircle, Edit2,
  Send, LogIn, Repeat, Moon, Sun, ClipboardList, Lightbulb, Quote, Bell, Share2, Calculator, PenTool, Globe, Code, MessageCircle,
  X, Calendar, GraduationCap, Pause, Play, RefreshCw, Clock, Flame, Hourglass, ArrowRight
} from 'lucide-react';
import { useTheme, ThemeSettings, ThemeProvider } from './components/ThemeContext';
import { TiltCard } from './components/TiltCard';
import { MathText } from './components/MathText';
import { CountdownTimer } from './components/CountdownTimer';
import { BackgroundEffects } from './components/BackgroundEffects';

// --- NEW COMPONENT: Premium Mode Toggle ---
const ModeToggle: React.FC = () => {
  const { mode, toggleMode } = useTheme();
  
  return (
    <div className="fixed top-6 right-6 z-50">
      <button 
        onClick={toggleMode}
        className={`
          relative w-20 h-10 rounded-full p-1 shadow-inner transition-colors duration-500 ease-in-out border
          ${mode === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-200 border-slate-300'}
        `}
      >
        {/* Track Icons */}
        <div className="absolute inset-0 flex justify-between items-center px-2 pointer-events-none">
          <Sun size={16} className={`${mode === 'dark' ? 'text-slate-600' : 'text-yellow-500'} transition-colors duration-300`} />
          <Moon size={16} className={`${mode === 'dark' ? 'text-indigo-400' : 'text-slate-400'} transition-colors duration-300`} />
        </div>

        {/* Sliding Circle */}
        <div 
          className={`
            w-8 h-8 rounded-full shadow-md transform transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) flex items-center justify-center
            ${mode === 'dark' ? 'translate-x-10 bg-slate-900 border border-slate-600' : 'translate-x-0 bg-white border border-slate-100'}
          `}
        >
           {/* Inner dot for detail */}
           <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${mode === 'dark' ? 'bg-indigo-500' : 'bg-yellow-400'}`}></div>
        </div>
      </button>
    </div>
  );
};

const MascotRobot: React.FC = () => {
  const [pose, setPose] = useState<'idle' | 'typing' | 'clicking'>('idle');
  const timeoutRef = useRef<number | null>(null);
  const [position, setPosition] = useState({ x: 20, y: 80 }); 
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [showQuickChat, setShowQuickChat] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const [quickAnswer, setQuickAnswer] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const handleKeyDown = () => {
      setPose('typing');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setPose('idle'), 1500);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleRobotMouseDown = (e: React.MouseEvent) => {
    isDragging.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    
    // Add temporary event listeners for drag operation
    const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - dragStart.current.x;
        const dy = moveEvent.clientY - dragStart.current.y;
        
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            isDragging.current = true;
            setPosition(prev => ({
                x: prev.x + dx,
                y: prev.y - dy // Fixed: Inverted Y axis for 'bottom' positioning (drag up increases bottom)
            }));
            dragStart.current = { x: moveEvent.clientX, y: moveEvent.clientY };
        }
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        if (!isDragging.current) {
            setShowQuickChat(prev => !prev);
            setPose('clicking');
            setTimeout(() => setPose('idle'), 500);
        }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleQuickAsk = async () => {
      if (!quickInput.trim()) return;
      setIsThinking(true);
      const answer = await explainText(quickInput); 
      setQuickAnswer(answer);
      setIsThinking(false);
      setQuickInput('');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = false;
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart.current.x;
    const dy = touch.clientY - dragStart.current.y;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        isDragging.current = true;
        setPosition(prev => ({
            x: prev.x + dx,
            y: prev.y - dy // Fixed: Inverted Y axis for 'bottom' positioning
        }));
        dragStart.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) {
        setShowQuickChat(prev => !prev);
        setPose('clicking');
        setTimeout(() => setPose('idle'), 500);
    }
  };

  return (
    <div 
        className="fixed z-[80] transition-transform duration-75 select-none scale-[0.7] origin-bottom-left"
        style={{ 
            left: typeof position.x === 'number' ? `${position.x}px` : position.x, 
            bottom: typeof position.y === 'number' ? `${position.y}px` : position.y,
        }}
    >
      <div className="relative group">
        
        {showQuickChat && (
            <div className={`absolute -top-[320px] left-0 md:left-20 w-72 backdrop-blur-xl border rounded-[2rem] shadow-2xl p-4 animate-pop-in origin-bottom-left flex flex-col gap-3 z-[90] ${theme.isDark ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-pink-200'}`}>
                <div className={`flex justify-between items-center border-b pb-2 ${theme.isDark ? 'border-slate-700' : 'border-pink-100'}`}>
                    <h4 className={`font-bold flex items-center gap-2 text-sm ${theme.text}`}><Sparkles size={14} className="text-pink-500"/> Chat Nhanh</h4>
                    <button onClick={() => setShowQuickChat(false)} className="text-slate-400 hover:text-slate-600 hover:rotate-90 transition-transform"><X size={16}/></button>
                </div>
                
                <div className={`flex-1 rounded-xl p-3 min-h-[100px] max-h-[150px] overflow-y-auto text-sm custom-scrollbar ${theme.isDark ? 'bg-slate-800/50 text-slate-300' : 'bg-white/50 text-slate-700'}`}>
                    {isThinking ? (
                        <div className="flex items-center gap-2 text-slate-400 italic"><Loader2 size={14} className="animate-spin"/> Đang suy nghĩ...</div>
                    ) : (
                        quickAnswer ? <MathText content={quickAnswer} /> : <span className="text-slate-400 italic">Hỏi mình gì đi nào? 👇</span>
                    )}
                </div>

                <div className="flex gap-2">
                    <input 
                        value={quickInput}
                        onChange={(e) => setQuickInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuickAsk()}
                        className={`flex-1 text-sm p-2 rounded-xl border outline-none focus:ring-1 focus:ring-pink-300 transition-all ${theme.isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                        placeholder="Nhập câu hỏi..."
                        autoFocus
                    />
                    <button onClick={handleQuickAsk} className="p-2 bg-pink-500 text-white rounded-xl shadow-md hover:bg-pink-600 transition-all hover:scale-105">
                        <Send size={16} />
                    </button>
                </div>
            </div>
        )}

        <div 
            onMouseDown={handleRobotMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`
            relative flex items-center justify-center cursor-grab active:cursor-grabbing
            transition-transform duration-300
            ${pose === 'idle' && !isDragging.current ? 'animate-float' : ''}
            ${pose === 'typing' ? 'animate-wiggle' : ''}
            ${pose === 'clicking' ? 'animate-jump' : ''}
            `}
        >
           <div className="absolute -top-[22px] left-1/2 -translate-x-1/2 w-[2px] h-6 bg-slate-300 -z-10 origin-bottom transition-transform group-hover:rotate-12"></div>
           <div className="absolute -top-[26px] left-1/2 -translate-x-1/2 w-3 h-3 bg-orange-500 rounded-full shadow-sm -z-10 animate-bounce"></div>
           <div className="absolute -left-[10px] w-5 h-10 bg-orange-500 rounded-l-full shadow-lg border-r border-orange-600 z-0"></div>
           <div className="absolute -right-[10px] w-5 h-10 bg-orange-500 rounded-r-full shadow-lg border-l border-orange-600 z-0"></div>
           <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-[1.2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-b-4 border-slate-100 flex items-center justify-center relative z-10 hover:scale-105 transition-transform">
              <div className="w-12 h-10 md:w-16 md:h-12 bg-slate-800 rounded-xl flex items-center justify-center gap-2 relative overflow-hidden shadow-inner">
                 <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-white/10 rotate-45 blur-[2px]"></div>
                 <div className={`w-1.5 h-4 md:w-2 md:h-5 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee] transition-all duration-150 ${pose === 'typing' ? 'scale-y-50' : 'animate-blink'}`}></div>
                 <div className={`w-1.5 h-4 md:w-2 md:h-5 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee] transition-all duration-150 ${pose === 'typing' ? 'scale-y-50' : 'animate-blink'}`}></div>
              </div>
           </div>
           {theme.isDark && <div className="absolute inset-0 bg-amber-500/20 rounded-[1.2rem] blur-xl -z-10"></div>}
           <div className="absolute -bottom-3 w-10 h-4 bg-slate-200 rounded-full -z-10"></div>
           <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white/80 px-2 py-1 rounded-full pointer-events-none">
               Kéo để di chuyển • Click để chat
           </div>
        </div>
      </div>
    </div>
  );
};

const TopSearchBar: React.FC<{ 
    onSearch: (query: string, mode: SearchMode) => void 
}> = ({ onSearch }) => {
    const [query, setQuery] = useState('');
    const [mode, setMode] = useState<SearchMode>('app');
    const { theme } = useTheme();

    const handleSearch = () => {
        if (!query.trim()) return;
        if (mode === 'google') {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
        } else {
            onSearch(query, 'app');
        }
    };

    return (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 hidden md:block animate-slide-in-bottom">
            <div className={`backdrop-blur-xl border shadow-lg rounded-full flex p-1.5 transition-all duration-300 focus-within:ring-4 focus-within:ring-pink-100 hover:scale-[1.01] ${theme.isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white/70 border-white/40'}`}>
                <div className={`flex rounded-full p-1 mr-2 ${theme.isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <button 
                        onClick={() => setMode('app')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${mode === 'app' ? 'bg-white shadow-sm text-pink-600 scale-105' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        App
                    </button>
                    <button 
                         onClick={() => setMode('google')}
                         className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${mode === 'google' ? 'bg-white shadow-sm text-blue-600 scale-105' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Google
                    </button>
                </div>
                <input 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder={mode === 'app' ? "Tìm bài học, ghi chú..." : "Tìm kiếm trên Google..."}
                    className={`flex-1 bg-transparent outline-none text-sm ${theme.isDark ? 'text-white placeholder-slate-500' : 'text-slate-700 placeholder-slate-400'}`}
                />
                <button 
                    onClick={handleSearch}
                    className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center hover:bg-pink-600 transition-all hover:scale-110 shadow-md"
                >
                    {mode === 'google' ? <ExternalLink size={14} /> : <Search size={14} />}
                </button>
            </div>
        </div>
    );
};

const ExamQuoteWidget: React.FC = () => {
  const { theme } = useTheme();
  return (
    <TiltCard className={`rounded-[2rem] p-6 shadow-lg border relative overflow-hidden h-full flex flex-col justify-center items-center text-center ${theme.isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white/50 border-white/40'}`}>
        <Quote size={32} className="text-white/20 absolute top-4 left-4" />
        <Quote size={32} className="text-white/20 absolute bottom-4 right-4 rotate-180" />
        <div className="relative z-10">
            <p className={`text-xl md:text-2xl font-bold italic mb-3 ${theme.text}`}>"Trí thức là sức mạnh"</p>
            <div className="w-12 h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent mx-auto mb-2"></div>
            <p className="text-slate-500 font-semibold text-sm">— F.Bacon</p>
        </div>
    </TiltCard>
  );
};

// --- NEW COMPONENT: Subject Progress Grid ---
const SubjectProgressGrid: React.FC<{ lessons: SavedLesson[], onNavigate: (sub: Subject) => void }> = ({ lessons, onNavigate }) => {
    const { theme } = useTheme();

    const getProgress = (sub: Subject) => {
        // Mock calculation: count saved lessons + randomness for demo
        const count = lessons.filter(l => l.subject === sub).length;
        // Clamp between 10% and 95% for visuals
        return Math.min(Math.max((count * 15) + 10, 10), 95);
    }

    const cards = [
        { subject: Subject.MATH, icon: <Calculator size={24} />, color: 'bg-red-500', barColor: 'bg-red-500', text: 'Toán học' },
        { subject: Subject.LITERATURE, icon: <PenTool size={24} />, color: 'bg-pink-400', barColor: 'bg-pink-500', text: 'Ngữ văn' },
        { subject: Subject.ENGLISH, icon: <Book size={24} />, color: 'bg-pink-300', barColor: 'bg-red-500', text: 'Tiếng Anh' },
        { subject: Subject.INFORMATICS, icon: <Code size={24} />, color: 'bg-pink-200', barColor: 'bg-red-500', text: 'Tin học' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((c, idx) => {
                const progress = getProgress(c.subject);
                return (
                    <TiltCard key={idx} className={`rounded-[2rem] p-6 shadow-sm border card-hover cursor-pointer group ${theme.isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white border-slate-100'}`}>
                        <div onClick={() => onNavigate(c.subject)} className="relative z-10">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4 ${c.color} group-hover:scale-110 transition-transform duration-300`}>
                                {c.icon}
                            </div>
                            <h3 className={`text-xl font-bold mb-1 ${theme.text}`}>{c.text}</h3>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-xs text-slate-400 font-bold uppercase">Tiến độ</span>
                                <span className={`text-lg font-black ${theme.isDark ? 'text-slate-200' : 'text-slate-800'}`}>{progress}%</span>
                            </div>
                            <div className={`h-2 w-full rounded-full overflow-hidden ${theme.isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                <div className={`h-full rounded-full ${c.barColor} transition-all duration-1000 ease-out`} style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    </TiltCard>
                )
            })}
        </div>
    );
};

// --- NEW COMPONENT: Study Stats Row ---
const StudyStatsRow: React.FC<{ streak: number, minutes: number }> = ({ streak, minutes }) => {
    const { theme } = useTheme();
    const hours = Math.floor(minutes / 60);
    
    return (
        <div className="grid grid-cols-2 gap-4 mb-6">
            <TiltCard className={`p-4 rounded-[2rem] border flex items-center gap-4 ${theme.isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white/60 border-white/40 shadow-sm'}`}>
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm">
                    <Flame size={24} className={streak > 0 ? "animate-pulse" : ""} />
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Chuỗi ngày</p>
                    <h4 className={`text-2xl font-black ${theme.text}`}>{streak} ngày</h4>
                </div>
            </TiltCard>

            <TiltCard className={`p-4 rounded-[2rem] border flex items-center gap-4 ${theme.isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white/60 border-white/40 shadow-sm'}`}>
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                    <Hourglass size={24} />
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Tổng giờ học</p>
                    <h4 className={`text-2xl font-black ${theme.text}`}>{hours > 0 ? `${hours}h ` : ''}{minutes % 60}p</h4>
                </div>
            </TiltCard>
        </div>
    );
};

const ExamScheduleWidget: React.FC = () => {
  const { theme } = useTheme();
  const schedule = [
    { subject: "Ngữ văn", time: "11/6/2026 • Sáng", icon: <PenTool size={16} className="text-orange-500"/> },
    { subject: "Toán", time: "11/6/2026 • Chiều", icon: <Calculator size={16} className="text-blue-500"/> },
    { subject: "Bài Tự chọn", time: "12/6/2026 • Sáng", icon: <Layout size={16} className="text-teal-500"/> },
    { subject: "Ngoại ngữ", time: "12/6/2026 • Chiều", icon: <Globe size={16} className="text-purple-500"/> },
  ];

  return (
    <TiltCard className={`rounded-[2rem] p-6 shadow-lg border h-full ${theme.isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white/50 border-white/40'}`}>
        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme.text}`}>
            <Calendar size={20} className="text-pink-500"/> Lịch thi (Dự kiến)
        </h3>
        <div className="space-y-3">
            {schedule.map((item, idx) => (
                <div key={idx} className={`p-3 rounded-xl border transition-all hover:scale-[1.02] flex items-center gap-3 ${theme.isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/60 border-white/50'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${theme.isDark ? 'bg-slate-800' : 'bg-white'}`}>
                        {item.icon}
                    </div>
                    <div>
                        <h4 className={`font-bold text-sm ${theme.text}`}>{item.subject}</h4>
                        <p className="text-[10px] text-slate-500 font-medium">{item.time}</p>
                    </div>
                </div>
            ))}
        </div>
    </TiltCard>
  );
};

const ExamNewsWidget: React.FC = () => {
  const { theme } = useTheme();
  const news = [
    { title: "Kỳ thi tốt nghiệp THPT 2025: Những điều cần biết", date: "12/06/2025" },
    { title: "Bộ GD&ĐT công bố đề tham khảo mới nhất", date: "10/06/2025" },
  ];

  return (
    <TiltCard className={`rounded-[2rem] p-6 shadow-lg border h-full ${theme.isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white/50 border-white/40'}`}>
        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme.text}`}>
            <Book size={20} className="text-indigo-500"/> Tin tức mới
        </h3>
        <div className="space-y-3">
            {news.map((item, idx) => (
                <div key={idx} className={`p-3 rounded-xl border transition-all hover:shadow-md cursor-pointer group ${theme.isDark ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' : 'bg-white/60 border-slate-200 hover:border-teal-300'}`}>
                    <h4 className={`font-bold text-sm mb-1 group-hover:text-teal-600 transition-colors line-clamp-1 ${theme.isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {item.title}
                    </h4>
                    <div className="flex justify-between items-center text-[10px] font-medium">
                        <span className="text-slate-400">{item.date}</span>
                        <span className="text-teal-600 group-hover:underline">Xem ngay</span>
                    </div>
                </div>
            ))}
        </div>
    </TiltCard>
  );
};

const StudentProfileCard: React.FC<{ profile: StudentProfile, onUpdate: (p: StudentProfile) => void }> = ({ profile, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempProfile, setTempProfile] = useState<StudentProfile>(profile);
    const { theme } = useTheme();

    const handleSave = () => {
        onUpdate(tempProfile);
        setIsEditing(false);
    };

    const inputClass = `input-interactive p-3 rounded-xl border text-sm transition-all focus:ring-4 focus:ring-pink-100 ${theme.isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white/70 border-slate-200 text-slate-800'}`;

    if (isEditing) {
        return (
            <TiltCard className={`backdrop-blur-xl border rounded-[2rem] p-6 shadow-lg mb-6 relative overflow-hidden animate-pop-in ${theme.isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white/60 border-white/40'}`}>
                <div className="flex items-center justify-between mb-4">
                     <h3 className={`font-bold flex items-center gap-2 ${theme.text}`}><UserCircle className="text-indigo-500"/> Hồ Sơ Học Sinh</h3>
                     <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 hover:rotate-90 transition-transform"><X size={20}/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input className={inputClass} placeholder="Họ và tên" value={tempProfile.name} onChange={e => setTempProfile({...tempProfile, name: e.target.value})} />
                    <input className={inputClass} placeholder="Trường ĐH mục tiêu" value={tempProfile.targetUniversity} onChange={e => setTempProfile({...tempProfile, targetUniversity: e.target.value})} />
                     <input className={inputClass} placeholder="Ngành học" value={tempProfile.targetMajor} onChange={e => setTempProfile({...tempProfile, targetMajor: e.target.value})} />
                    <input className={inputClass} placeholder="Điểm số mong muốn" value={tempProfile.targetScore} onChange={e => setTempProfile({...tempProfile, targetScore: e.target.value})} />
                    <textarea className={`${inputClass} col-span-1 md:col-span-2`} placeholder="Điểm yếu cần cải thiện" value={tempProfile.weaknesses} onChange={e => setTempProfile({...tempProfile, weaknesses: e.target.value})} />
                     <textarea className={`${inputClass} col-span-1 md:col-span-2`} placeholder="Sở trường" value={tempProfile.strengths} onChange={e => setTempProfile({...tempProfile, strengths: e.target.value})} />
                </div>
                <button onClick={handleSave} className="btn-hover w-full mt-4 bg-indigo-500 text-white py-2 rounded-xl font-bold shadow-md hover:bg-indigo-600">
                    Lưu Hồ Sơ
                </button>
            </TiltCard>
        );
    }

    return (
        <TiltCard className={`card-hover backdrop-blur-xl border rounded-[2rem] p-6 shadow-md mb-6 relative overflow-hidden group ${theme.isDark ? 'bg-slate-900/60 border-slate-700 from-slate-900 to-indigo-950' : 'bg-gradient-to-br from-white/60 to-indigo-50/50 border-white/50'}`}>
            <div className="absolute top-0 right-0 p-4 opacity-50 text-slate-300">
                <GraduationCap size={80} className="rotate-12 group-hover:rotate-0 transition-transform duration-700"/>
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center border-2 border-indigo-200 shadow-inner group-hover:scale-110 transition-transform">
                         <UserCircle size={40} />
                    </div>
                    <div>
                         <h3 className={`text-xl font-bold ${theme.text}`}>{profile.name || "Học sinh lớp 12"}</h3>
                         <div className="flex flex-wrap gap-2 mt-1">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${theme.isDark ? 'bg-slate-800 text-slate-300 border-slate-600' : 'bg-white/60 text-slate-600 border-slate-100'}`}>
                                🎯 {profile.targetUniversity || "Chưa đặt mục tiêu"}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${theme.isDark ? 'bg-slate-800 text-slate-300 border-slate-600' : 'bg-white/60 text-slate-600 border-slate-100'}`}>
                                ⭐ {profile.targetScore ? `Mục tiêu: ${profile.targetScore}` : ""}
                            </span>
                         </div>
                    </div>
                </div>
                <button onClick={() => setIsEditing(true)} className="btn-hover flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white text-indigo-600 rounded-xl text-sm font-bold shadow-sm border border-indigo-100">
                    <Edit2 size={16}/> Cập nhật hồ sơ
                </button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-200/50 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cần cải thiện (AI sẽ tập trung giúp bạn)</p>
                     <p className={`text-sm italic ${theme.isDark ? 'text-slate-300' : 'text-slate-700'}`}>{profile.weaknesses || "Chưa nhập thông tin..."}</p>
                </div>
                <div>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sở trường</p>
                     <p className={`text-sm italic ${theme.isDark ? 'text-slate-300' : 'text-slate-700'}`}>{profile.strengths || "Chưa nhập thông tin..."}</p>
                </div>
            </div>
        </TiltCard>
    );
}

const ActivityChart: React.FC = () => {
  const data = [40, 70, 30, 85, 50, 90, 65]; 
  const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const { theme } = useTheme();

  return (
    <TiltCard className={`card-hover backdrop-blur-2xl border rounded-[2rem] p-6 shadow-lg flex flex-col h-full relative overflow-hidden ${theme.isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white/50 border-white/40'}`}>
      {!theme.isDark && <div className="absolute top-[-50%] left-[-20%] w-[200px] h-[200px] bg-blue-200/30 rounded-full blur-3xl animate-blob"></div>}
      
      <div className="flex items-center gap-2 mb-6 relative z-10">
        <div className="p-2 bg-blue-100/80 text-blue-600 rounded-xl shadow-sm">
           <BarChart3 size={20} />
        </div>
        <h3 className={`font-bold ${theme.text}`}>Hoạt động tuần này</h3>
      </div>
      
      <div className="flex-1 flex items-end justify-between gap-2 sm:gap-4 px-2 relative z-10">
        {data.map((value, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2 group w-full">
            <div className={`w-full relative h-32 md:h-40 rounded-full flex items-end overflow-hidden shadow-inner border transition-all ${theme.isDark ? 'bg-slate-800 border-slate-600' : 'bg-white/40 border-white/20 hover:bg-white/60'}`}>
               <div 
                 className="w-full bg-gradient-to-t from-blue-400 to-cyan-400 rounded-full hover:from-blue-500 hover:to-cyan-500 transition-all duration-500 ease-spring"
                 style={{ height: `${value}%` }}
               ></div>
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-all duration-300 bg-slate-800 text-white text-xs px-2 py-1 rounded-lg mb-1 pointer-events-none whitespace-nowrap z-20">
                 {value}%
               </div>
            </div>
            <span className="text-xs font-bold text-slate-400 group-hover:text-blue-500 transition-colors">{days[idx]}</span>
          </div>
        ))}
      </div>
    </TiltCard>
  );
};

const SubjectDistributionChart: React.FC<{ lessons: SavedLesson[] }> = ({ lessons }) => {
  const counts = {
    [Subject.MATH]: 0,
    [Subject.LITERATURE]: 0,
    [Subject.ENGLISH]: 0,
    [Subject.INFORMATICS]: 0,
  };
  
  lessons.forEach(l => {
    if (counts[l.subject] !== undefined) counts[l.subject]++;
  });
  
  const total = Math.max(lessons.length, 1);
  const mathPct = (counts[Subject.MATH] / total) * 100;
  const litPct = (counts[Subject.LITERATURE] / total) * 100;
  const engPct = (counts[Subject.ENGLISH] / total) * 100;
  const { theme } = useTheme();

  return (
    <TiltCard className={`card-hover backdrop-blur-2xl border rounded-[2rem] p-6 shadow-lg flex flex-col h-full relative overflow-hidden ${theme.isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white/50 border-white/40'}`}>
      {!theme.isDark && <div className="absolute bottom-[-20%] right-[-20%] w-[150px] h-[150px] bg-purple-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>}

      <div className="flex items-center gap-2 mb-4 relative z-10">
         <div className="p-2 bg-purple-100/80 text-purple-600 rounded-xl shadow-sm">
           <PieChart size={20} />
         </div>
         <h3 className={`font-bold ${theme.text}`}>Phân bổ môn học</h3>
      </div>

      <div className="flex-1 flex items-center justify-center relative z-10">
         <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-[16px] md:border-[20px] border-white/50 shadow-[inset_0_4px_10px_rgba(0,0,0,0.05),0_10px_20px_rgba(0,0,0,0.05)] flex items-center justify-center backdrop-blur-sm transition-all hover:scale-105 duration-500">
            <div 
              className="absolute inset-[-16px] md:inset-[-20px] rounded-full opacity-80"
              style={{
                background: `conic-gradient(
                  #818cf8 0% ${mathPct}%, 
                  #f472b6 ${mathPct}% ${mathPct + litPct}%, 
                  #34d399 ${mathPct + litPct}% ${mathPct + litPct + engPct}%, 
                  #a78bfa ${mathPct + litPct + engPct}% 100%
                )`,
                mask: 'radial-gradient(transparent 58%, black 59%)',
                WebkitMask: 'radial-gradient(transparent 58%, black 59%)'
              }}
            ></div>
            <div className="text-center z-10">
               <span className={`block text-2xl font-black ${theme.text}`}>{lessons.length}</span>
               <span className="text-[10px] uppercase text-slate-400 font-bold">Bài học</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 relative z-10">
         <div className="flex items-center gap-2 text-xs font-semibold text-slate-600"><span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]"></span> Toán</div>
         <div className="flex items-center gap-2 text-xs font-semibold text-slate-600"><span className="w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.6)]"></span> Văn</div>
         <div className="flex items-center gap-2 text-xs font-semibold text-slate-600"><span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span> Anh</div>
         <div className="flex items-center gap-2 text-xs font-semibold text-slate-600"><span className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]"></span> Tin</div>
      </div>
    </TiltCard>
  );
};

const FloatingPomodoro: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    let interval: number | null = null;
    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActive(!isActive);
  };

  const resetTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActive(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: 'work' | 'break') => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`fixed bottom-32 right-6 z-50 flex flex-col items-end transition-all duration-500 ease-spring`}>
      {isExpanded && (
        <div className={`mb-4 backdrop-blur-xl border rounded-[2rem] p-6 shadow-xl animate-pop-in w-72 origin-bottom-right ${theme.isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white/70 border-white/40'}`}>
           <div className="flex justify-between items-center mb-4">
              <h4 className={`font-bold flex items-center gap-2 ${theme.text}`}>
                 {mode === 'work' ? '🔥 Tập trung' : '☕ Nghỉ ngơi'}
              </h4>
              <button onClick={() => setIsExpanded(false)} className="text-slate-400 hover:text-slate-700 hover:rotate-90 transition-transform">
                <X size={18} />
              </button>
           </div>
           
           <div className={`flex rounded-full p-1 mb-4 ${theme.isDark ? 'bg-slate-800' : 'bg-slate-100/80'}`}>
              <button 
                onClick={() => switchMode('work')} 
                className={`flex-1 py-1 rounded-full text-sm font-bold transition-all duration-300 ${mode === 'work' ? 'bg-white shadow-sm text-pink-600 scale-105' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Học
              </button>
              <button 
                onClick={() => switchMode('break')} 
                className={`flex-1 py-1 rounded-full text-sm font-bold transition-all duration-300 ${mode === 'break' ? 'bg-white shadow-sm text-teal-600 scale-105' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Nghỉ
              </button>
           </div>

           <div className={`text-5xl font-black text-center mb-4 font-mono tracking-tight ${theme.text}`}>
              {formatTime(timeLeft)}
           </div>

           <div className="flex justify-center gap-4">
              <button onClick={toggleTimer} className="btn-hover w-12 h-12 bg-pink-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-pink-600">
                {isActive ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
              </button>
              <button onClick={resetTimer} className="btn-hover w-12 h-12 bg-white text-slate-600 rounded-full flex items-center justify-center shadow-md border border-slate-100 hover:bg-slate-50">
                <RefreshCw size={20} className="transition-transform active:rotate-180"/>
              </button>
           </div>
        </div>
      )}

      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          relative group flex items-center justify-center 
          backdrop-blur-lg border 
          shadow-lg
          transition-all duration-500 ease-spring
          ${isExpanded 
            ? 'w-14 h-14 rounded-full bg-pink-500 text-white border-pink-400 rotate-90' 
            : `w-16 h-16 rounded-full hover:scale-110 ${theme.isDark ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-white/70 border-white/50 text-slate-700 hover:bg-white/90'}`}
        `}
      >
        {!isExpanded && (
           <div className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm animate-pop-in">
             {isActive ? 'ON' : 'OFF'}
           </div>
        )}
        <Clock size={isExpanded ? 24 : 30} className={isActive && !isExpanded ? 'animate-pulse' : ''} />
        
        {!isExpanded && isActive && (
          <span className="absolute bottom-[-20px] bg-slate-800/80 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-md font-mono animate-fade-in">
            {formatTime(timeLeft)}
          </span>
        )}
      </button>
    </div>
  );
};

const QuickAskAI: React.FC = () => {
  const [selection, setSelection] = useState<{text: string, x: number, y: number, bottom: number} | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, isBelow: false });
  const { theme } = useTheme();

  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      if (sel && sel.toString().trim().length > 0) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        if (selection?.text !== sel.toString()) {
            setExplanation(null); 
            setSelection({
              text: sel.toString(),
              x: rect.left + rect.width / 2,
              y: rect.top,
              bottom: rect.bottom
            });
        }
      } else {
        if (!explanation && !loading) {
            setSelection(null);
        }
      }
    };
    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, [explanation, loading, selection?.text]);

  useLayoutEffect(() => {
      if (!selection || !popoverRef.current) return;

      const popoverRect = popoverRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const padding = 20;

      let left = selection.x;
      const halfWidth = popoverRect.width / 2;

      if (left - halfWidth < padding) {
          left = halfWidth + padding;
      } else if (left + halfWidth > viewportWidth - padding) {
          left = viewportWidth - halfWidth - padding;
      }

      let top = selection.y - 12; 
      let isBelow = false;
      
      if (top - popoverRect.height < padding) {
          top = selection.bottom + 12; 
          isBelow = true;
      }

      setPosition({ top, left, isBelow });

  }, [selection, explanation, loading]);


  const handleAskAI = async () => {
    if (!selection) return;
    setLoading(true);
    const result = await explainText(selection.text);
    setExplanation(result);
    setLoading(false);
  };

  const handleSearchGoogle = () => {
    if (!selection) return;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(selection.text)}`, '_blank');
  };

  const close = () => {
    setSelection(null);
    setExplanation(null);
    window.getSelection()?.removeAllRanges();
  };

  if (!selection) return null;

  return (
    <div 
      ref={popoverRef}
      style={{ top: position.top, left: position.left }}
      className={`fixed z-[100] transform -translate-x-1/2 mb-2 pointer-events-auto transition-all duration-300 ease-spring ${position.isBelow ? '' : '-translate-y-full'}`}
    >
      {!explanation && !loading ? (
        <div className="flex bg-slate-800/90 backdrop-blur-md text-white rounded-full shadow-xl p-1 animate-pop-in border border-white/20">
           <button 
              onClick={handleAskAI}
              className="px-4 py-2 rounded-full hover:bg-white/20 transition-all duration-200 flex items-center gap-2 text-sm font-bold border-r border-white/10 hover:scale-105"
              title="Giải thích bằng AI"
           >
              <Sparkles size={14} className="text-pink-300" /> Hỏi AI
           </button>
           <button 
              onClick={handleSearchGoogle}
              className="px-4 py-2 rounded-full hover:bg-white/20 transition-all duration-200 flex items-center gap-2 text-sm font-bold hover:scale-105"
              title="Tìm trên Google"
           >
              <Search size={14} className="text-blue-300" /> Google
           </button>
        </div>
      ) : (
        <div className={`backdrop-blur-xl border p-4 rounded-2xl shadow-xl w-72 md:w-96 text-sm animate-pop-in origin-center ${theme.isDark ? 'bg-slate-900/95 border-slate-700 text-slate-200' : 'bg-white/95 border-slate-200 text-slate-800'}`}>
           <div className={`flex justify-between items-center mb-2 border-b pb-2 ${theme.isDark ? 'border-slate-700' : 'border-slate-100'}`}>
             <span className="font-bold text-pink-600 flex items-center gap-1"><Brain size={14}/> Giải thích nhanh</span>
             <button onClick={close} className="text-slate-400 hover:text-slate-600 hover:rotate-90 transition-transform"><X size={16}/></button>
           </div>
           {loading ? (
             <div className="py-4 text-center text-slate-500 italic flex flex-col items-center gap-2">
               <Loader2 className="animate-spin text-pink-500" size={24} />
               AI đang đọc... ✨
             </div>
           ) : (
             <div className="prose prose-sm max-h-60 overflow-y-auto custom-scrollbar">
                <MathText content={explanation || ''} />
             </div>
           )}
        </div>
      )}
    </div>
  );
};

const SidebarItem: React.FC<{ 
    icon: React.ReactNode, 
    label: string, 
    active: boolean, 
    onClick: () => void,
  }> = ({ icon, label, active, onClick }) => {
  const { theme } = useTheme();
  return (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-4 px-4 py-2.5 rounded-2xl transition-all duration-300 group
      ${active 
        ? `shadow-md border font-bold scale-[1.02] ${theme.isDark ? `bg-gradient-to-r ${theme.primary} border-transparent text-white` : 'bg-white/80 border-slate-100 text-pink-600'}` 
        : `text-slate-500 hover:translate-x-1 ${theme.isDark ? 'hover:bg-slate-800/40 hover:text-slate-300' : 'hover:bg-white/40 hover:text-slate-700'}`
      }
    `}
  >
    <div className={`p-1.5 rounded-xl transition-all duration-300 ${active ? (theme.isDark ? 'text-white bg-white/20' : 'bg-pink-50 text-pink-600 scale-110') : 'bg-transparent text-slate-400 group-hover:bg-white/60 group-hover:text-slate-600 group-hover:scale-110'}`}>
        {icon}
    </div>
    <span className="text-sm tracking-wide">{label}</span>
  </button>
  );
};

const Dock: React.FC<{ 
  onNavigate: (view: ViewMode, subject: Subject | null) => void,
  activeView: ViewMode,
  activeSubject: Subject | null
}> = ({ onNavigate, activeView, activeSubject }) => {
  const { theme } = useTheme();
  return (
    <div className="fixed bottom-4 left-1/2 md:left-[calc(50%+8rem)] transform -translate-x-1/2 z-[60] flex items-center gap-2 px-3 py-2 rounded-[2.5rem] transition-all duration-500 pointer-events-none hover:scale-[1.01] ease-spring max-w-[95vw] overflow-x-auto custom-scrollbar-hide">
        <div className={`absolute inset-0 backdrop-blur-2xl rounded-[2.5rem] border shadow-2xl -z-10 transition-opacity duration-300 pointer-events-auto ${theme.isDark ? 'bg-slate-900/60 border-slate-700 shadow-slate-900/50' : 'bg-white/60 border-white/40 shadow-slate-200/50'}`}></div>

        <div className="flex items-center gap-2 pointer-events-auto min-w-max">
            <DockItem 
            icon={<Layout size={20} />} 
            label="Tổng quan" 
            active={activeView === 'dashboard'} 
            onClick={() => onNavigate('dashboard', null)}
            bgColor="bg-slate-100/50"
            activeBgColor="bg-slate-800"
            activeIconColor="text-white"
            iconColor="text-slate-500"
            />

            <DockItem 
            icon={<MessageCircle size={20} />} 
            label="Hỏi AI" 
            active={activeView === 'chatbot'} 
            onClick={() => onNavigate('chatbot', null)}
            bgColor="bg-pink-100/50"
            activeBgColor={`bg-gradient-to-tr ${theme.primary}`}
            activeIconColor="text-white"
            iconColor="text-pink-400"
            />

            <DockItem 
            icon={<ClipboardList size={20} />} 
            label="Luyện thi" 
            active={activeView === 'exam_prep'} 
            onClick={() => onNavigate('exam_prep', null)}
            bgColor="bg-orange-100/50"
            activeBgColor="bg-gradient-to-tr from-orange-400 to-amber-500"
            activeIconColor="text-white"
            iconColor="text-orange-500"
            />

            <DockItem 
            icon={<Calculator size={20} />} 
            label="Tính điểm" 
            active={activeView === 'grade_tracker'} 
            onClick={() => onNavigate('grade_tracker', null)}
            bgColor="bg-red-100/50"
            activeBgColor="bg-gradient-to-tr from-red-400 to-pink-500"
            activeIconColor="text-white"
            iconColor="text-red-500"
            />

            <DockItem 
            icon={<Share2 size={20} />} 
            label="Mindmap" 
            active={activeView === 'mindmap'} 
            onClick={() => onNavigate('mindmap', null)}
            bgColor="bg-cyan-100/50"
            activeBgColor="bg-gradient-to-tr from-cyan-400 to-blue-500"
            activeIconColor="text-white"
            iconColor="text-cyan-500"
            />

            <div className="w-[1px] h-8 bg-slate-300/30 mx-1"></div>

            <DockItem 
            icon={<Calculator size={20} />} 
            label="Môn Toán" 
            active={activeSubject === Subject.MATH} 
            onClick={() => onNavigate('subject', Subject.MATH)}
            bgColor="bg-blue-100/50"
            activeBgColor="bg-gradient-to-tr from-blue-400 to-indigo-500"
            activeIconColor="text-white"
            iconColor="text-blue-500"
            />
            <DockItem 
            icon={<PenTool size={20} />} 
            label="Môn Văn" 
            active={activeSubject === Subject.LITERATURE} 
            onClick={() => onNavigate('subject', Subject.LITERATURE)}
            bgColor="bg-red-100/50"
            activeBgColor="bg-gradient-to-tr from-red-300 to-pink-400"
            activeIconColor="text-white"
            iconColor="text-red-400"
            />
            <DockItem 
            icon={<Globe size={20} />} 
            label="Tiếng Anh" 
            active={activeSubject === Subject.ENGLISH} 
            onClick={() => onNavigate('subject', Subject.ENGLISH)}
            bgColor="bg-emerald-100/50"
            activeBgColor="bg-gradient-to-tr from-emerald-300 to-teal-400"
            activeIconColor="text-white"
            iconColor="text-emerald-500"
            />
            <DockItem 
            icon={<Code size={20} />} 
            label="Tin Học" 
            active={activeSubject === Subject.INFORMATICS} 
            onClick={() => onNavigate('subject', Subject.INFORMATICS)}
            bgColor="bg-purple-100/50"
            activeBgColor="bg-gradient-to-tr from-purple-300 to-violet-400"
            activeIconColor="text-white"
            iconColor="text-purple-500"
            />
        </div>
    </div>
  );
};

const DockItem: React.FC<{ 
  icon: React.ReactNode, 
  label: string, 
  active: boolean, 
  onClick: () => void,
  bgColor: string,
  activeBgColor: string,
  iconColor: string,
  activeIconColor: string
}> = ({ icon, label, active, onClick, bgColor, activeBgColor, iconColor, activeIconColor }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative group flex flex-col items-center">
      <div className={`
        absolute -top-10 px-2 py-1 rounded-lg bg-slate-800/90 backdrop-blur text-white text-[10px] font-bold shadow-lg transition-all duration-300 ease-spring pointer-events-none whitespace-nowrap z-[70]
        ${hovered ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-90'}
      `}>
        {label}
      </div>

      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`
          w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ease-spring shrink-0
          ${active ? `${activeBgColor} scale-110 shadow-lg shadow-pink-200/40` : `${bgColor} hover:bg-white hover:scale-110`}
        `}
      >
        <div className={`transition-colors duration-300 ${active ? activeIconColor : iconColor}`}>
          {icon}
        </div>
      </button>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { theme, backgroundImage, backgroundOverlay, backgroundBlur } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [state, setState] = useState<AppState>({
    currentView: 'dashboard',
    activeSubject: null,
    savedLessons: [],
    flashcards: [],
    tasks: [],
    reminders: [], // New state
    chatSessions: [],
    activeChatSessionId: null,
    studentProfile: { 
        name: '',
        targetUniversity: '',
        targetMajor: '',
        targetScore: '',
        strengths: '',
        weaknesses: '',
        learningStyle: ''
    },
    gradeRecord: {},
    studyStats: {
        streakDays: 0,
        lastLoginDate: '',
        totalStudyMinutes: 0
    }
  });

  // --- Notification Checker ---
  useEffect(() => {
    // Request permission on load
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }

    const interval = setInterval(() => {
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        state.reminders.forEach(r => {
            if (r.active && r.days.includes(currentDay) && r.time === currentTime && now.getSeconds() < 2) {
                // Trigger notification
                if (Notification.permission === 'granted') {
                    new Notification("⏰ Đến giờ học rồi!", { 
                        body: `Đã đến giờ cho: ${r.title}`,
                        icon: '/favicon.ico'
                    });
                } else {
                    // Fallback using document title or just in-app is usually better than alert loop
                    console.log(`⏰ Nhắc nhở: Đến giờ học ${r.title} rồi!`);
                }
            }
        });
    }, 1000); // Check every second to catch the minute change accurately

    return () => clearInterval(interval);
  }, [state.reminders]);

  // --- Study Timer & Streak Logic ---
  useEffect(() => {
    // 1. Streak Logic
    const today = new Date().toDateString();
    let newStreak = state.studyStats.streakDays;
    
    if (state.studyStats.lastLoginDate !== today) {
        const lastDate = state.studyStats.lastLoginDate ? new Date(state.studyStats.lastLoginDate) : null;
        if (lastDate) {
            const diffTime = Math.abs(new Date(today).getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays === 1) {
                newStreak += 1;
            } else if (diffDays > 1) {
                newStreak = 1; // Reset streak
            }
        } else {
            newStreak = 1;
        }

        setState(prev => ({
            ...prev,
            studyStats: {
                ...prev.studyStats,
                streakDays: newStreak,
                lastLoginDate: today
            }
        }));
    }

    // 2. Study Minutes Timer
    const timerInterval = setInterval(() => {
        setState(prev => ({
            ...prev,
            studyStats: {
                ...prev.studyStats,
                totalStudyMinutes: prev.studyStats.totalStudyMinutes + 1
            }
        }));
    }, 60000); // Update every minute

    return () => clearInterval(timerInterval);
  }, []); // Run on mount (streak) and set up interval

  useEffect(() => {
    const saved = localStorage.getItem('glassyGeniusData_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
            // Data sanitation to prevent white screen from removed views
            if (['game', 'timetable', 'mycourses'].includes(parsed.currentView)) {
                parsed.currentView = 'dashboard';
            }

            // Ensure nested objects exist to prevent undefined access
            const safeProfile = parsed.studentProfile || { name: '', targetUniversity: '', targetMajor: '', targetScore: '', strengths: '', weaknesses: '', learningStyle: '' };
            const safeGrades = parsed.gradeRecord || {};
            const safeReminders = parsed.reminders || [];
            const safeStats = { streakDays: 0, lastLoginDate: '', totalStudyMinutes: 0, ...parsed.studyStats };
            
            setState(prev => ({ 
                ...prev, 
                ...parsed,
                studentProfile: safeProfile,
                gradeRecord: safeGrades,
                reminders: safeReminders,
                studyStats: safeStats
            }));
        }
      } catch (e) { 
          console.error("Failed to load data, resetting...", e); 
          localStorage.removeItem('glassyGeniusData_v2');
      }
    }
  }, []);

  useEffect(() => {
    try {
        const dataToSave = { ...state };
        localStorage.setItem('glassyGeniusData_v2', JSON.stringify(dataToSave));
    } catch(e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
             console.error("Critical: Storage quota exceeded. Consider cleaning up old chats.");
             // Optional: Auto-prune old chat sessions here if needed
        }
    }
  }, [state]);

  const createNewSession = () => {
      const newSession: ChatSession = {
          id: Date.now().toString(),
          title: `Đoạn chat ${state.chatSessions.length + 1}`,
          messages: [],
          date: new Date().toLocaleDateString()
      };
      setState(prev => ({
          ...prev,
          chatSessions: [...prev.chatSessions, newSession],
          activeChatSessionId: newSession.id
      }));
  };

  const navigateTo = (view: ViewMode, subject: Subject | null = null) => {
    if (view === 'chatbot' && state.chatSessions.length === 0) {
        createNewSession();
    }
    setState(prev => ({ ...prev, currentView: view, activeSubject: subject }));
    setMobileMenuOpen(false);
  };

  const deleteLesson = (id: string) => {
    if(confirm("Bạn có chắc muốn xóa bài học này không?")) {
        setState(prev => ({ ...prev, savedLessons: prev.savedLessons.filter(l => l.id !== id) }));
    }
  };

  const handleAppSearch = (query: string) => {
    alert(`Đang tìm kiếm trong app: ${query} (Tính năng demo)`);
  };


  const updateSession = (id: string, messages: ChatMessage[]) => {
      setState(prev => ({
          ...prev,
          chatSessions: prev.chatSessions.map(s => s.id === id ? { ...s, messages } : s)
      }));
  };

  const deleteSession = (id: string) => {
      setState(prev => ({
          ...prev,
          chatSessions: prev.chatSessions.filter(s => s.id !== id),
          activeChatSessionId: prev.activeChatSessionId === id ? null : prev.activeChatSessionId
      }));
  };

  const handleLogin = (username: string) => {
      setState(prev => ({
          ...prev,
          studentProfile: { ...prev.studentProfile, name: username }
      }));
  };

  const renderBackground = () => {
    // 1. Custom Background (Highest Priority)
    if (backgroundImage) {
        return (
            <div className="fixed inset-0 pointer-events-none z-0">
                <img 
                    src={backgroundImage} 
                    alt="Background" 
                    className="w-full h-full object-cover" 
                    style={{ filter: `blur(${backgroundBlur}px)` }}
                />
                {/* Overlay for contrast */}
                <div 
                    className="absolute inset-0 transition-colors duration-300"
                    style={{ backgroundColor: theme.isDark ? 'black' : 'white', opacity: backgroundOverlay }}
                ></div>
            </div>
        );
    }

    // New Simple Blue Theme
    if (theme.id === 'simple-blue') {
       return (
         <div className={`fixed inset-0 pointer-events-none z-0 ${theme.isDark ? 'bg-slate-950' : 'bg-blue-50'}`}>
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `radial-gradient(${theme.isDark ? '#ffffff' : '#000000'} 1px, transparent 1px)`,
                backgroundSize: '24px 24px'
            }}></div>
         </div>
       );
    }

    // 2. Specific Theme Backgrounds
    if (theme.id === 'lofi' && theme.isDark) {
        return (
            <div className="fixed inset-0 pointer-events-none z-0 bg-slate-950">
                 {/* Starry Sky */}
                <div className="absolute inset-0" style={{ 
                    backgroundImage: 'radial-gradient(white 1px, transparent 1px), radial-gradient(white 1px, transparent 1px)',
                    backgroundSize: '50px 50px, 100px 100px',
                    backgroundPosition: '0 0, 25px 25px',
                    opacity: 0.3
                }}></div>
                {/* Yellow Lamp Glow */}
                <div className="absolute top-10 right-20 w-[400px] h-[400px] rounded-full bg-amber-500/10 blur-[100px] animate-pulse"></div>
            </div>
        );
    }
    // New Cyber Theme Background
    if (theme.id === 'cyber' && theme.isDark) {
        return (
            <div className="fixed inset-0 pointer-events-none z-0 bg-black">
                {/* Grid */}
                <div className="absolute inset-0" style={{ 
                    backgroundImage: 'linear-gradient(rgba(0, 255, 153, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 153, 0.05) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    opacity: 0.5
                }}></div>
                <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-emerald-900/20 to-transparent"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[100px] animate-pulse"></div>
            </div>
        );
    }

    // 3. Default Gradient Blobs
    return (
        <div className="fixed inset-0 pointer-events-none z-0">
            <div className={`absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[120px] animate-blob bg-gradient-to-tr ${theme.secondary}`}></div>
            <div className={`absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-4000 bg-gradient-to-bl ${theme.primary}`}></div>
        </div>
    );
  };

  const getSmartSuggestion = () => {
      if (!state.studentProfile.weaknesses) return "Hôm nay hãy thử làm một bài thi thử để xem trình độ nhé!";
      return `Dựa trên điểm yếu "${state.studentProfile.weaknesses}", AI khuyên bạn nên vào mục "Luyện thi" > "Săn Lỗ Hổng" để khắc phục ngay.`;
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans transition-colors duration-500 ${theme.isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-700'}`}>
      
      {renderBackground()}
      <BackgroundEffects />

      <QuickAskAI />
      <FloatingPomodoro />
      <TopSearchBar onSearch={(q, m) => handleAppSearch(q)} />
      <MascotRobot />
      
      {/* Controls: Mode Toggle & Theme Settings */}
      <ModeToggle />
      <ThemeSettings />

      {/* Login Button */}
      <div className="fixed top-6 right-44 z-50"> {/* Adjusted position to avoid overlap */}
        <button 
          onClick={() => setShowAuthModal(true)}
          className={`h-10 px-4 rounded-full shadow-lg flex items-center justify-center gap-2 text-white font-bold transition-all hover:scale-105 ${theme.isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-800'}`}
        >
          <LogIn size={16} /> <span className="hidden md:inline text-sm">Đăng nhập</span>
        </button>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onLogin={handleLogin}
      />

      <div className={`fixed inset-0 bg-black/20 z-50 transition-opacity md:hidden ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setMobileMenuOpen(false)}></div>
      <aside className={`
          fixed inset-y-0 left-0 w-72 backdrop-blur-2xl border-r shadow-2xl z-50 transform transition-transform duration-300 md:translate-x-0 md:static md:flex md:w-64 md:shadow-sm md:z-20 flex flex-col p-6
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          ${theme.isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white/90 border-white/40 md:bg-white/40'}
      `}>
        <div className="flex items-center gap-3 mb-8 px-2 cursor-pointer group" onClick={() => navigateTo('dashboard')}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${theme.primary} flex items-center justify-center text-white shadow-md shadow-pink-200 group-hover:scale-110 transition-transform`}>
                <Sparkles size={20} />
            </div>
            <h1 className={`font-bold text-xl tracking-tight ${theme.isDark ? 'text-white' : 'text-slate-800'}`}>AI <span className={`text-transparent bg-clip-text bg-gradient-to-r ${theme.primary}`}>Assistant</span></h1>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
            <p className="px-4 text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">MENU</p>
            <SidebarItem icon={<Home size={20} />} label="Tổng quan" active={state.currentView === 'dashboard'} onClick={() => navigateTo('dashboard')} />
            <SidebarItem icon={<Layout size={20} />} label="Kế hoạch" active={state.currentView === 'planner'} onClick={() => navigateTo('planner')} />
            <SidebarItem icon={<ClipboardList size={20} />} label="Luyện thi" active={state.currentView === 'exam_prep'} onClick={() => navigateTo('exam_prep')} />
            <SidebarItem icon={<Repeat size={20} />} label="Ôn tập" active={state.currentView === 'review'} onClick={() => navigateTo('review')} />
            <SidebarItem icon={<Share2 size={20} />} label="Sơ đồ tư duy" active={state.currentView === 'mindmap'} onClick={() => navigateTo('mindmap')} />
            <SidebarItem icon={<Brain size={20} />} label="Thẻ ghi nhớ" active={state.currentView === 'flashcards'} onClick={() => navigateTo('flashcards')} />
            <SidebarItem icon={<MessageCircle size={20} />} label="Trợ lý AI" active={state.currentView === 'chatbot'} onClick={() => navigateTo('chatbot')} />
        </div>
      </aside>

      <main className="flex-1 relative z-10 overflow-hidden flex flex-col h-full perspective-1000 pt-16 md:pt-4">
         <button onClick={() => setMobileMenuOpen(true)} className={`md:hidden absolute top-6 left-4 p-2 backdrop-blur rounded-lg z-50 transition-colors ${theme.isDark ? 'bg-slate-800/50 text-white hover:bg-slate-800' : 'bg-white/50 text-slate-700 hover:bg-white/80'}`}>
            <MoreHorizontal size={24} />
         </button>

         <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar scroll-smooth pb-32">
            <div className="max-w-6xl mx-auto pl-0 md:pl-20">
                
                <div style={{ display: state.currentView === 'chatbot' ? 'block' : 'none' }} className="animate-pop-in h-full">
                    <ChatBot 
                      sessions={state.chatSessions}
                      activeSessionId={state.activeChatSessionId}
                      profile={state.studentProfile}
                      onSessionChange={(id) => setState(prev => ({ ...prev, activeChatSessionId: id }))}
                      onNewSession={createNewSession}
                      onDeleteSession={deleteSession}
                      onUpdateSession={updateSession}
                    />
                </div>

                {state.currentView !== 'chatbot' && (
                    <div key={`${state.currentView}-${state.activeSubject || ''}`} className="animate-pop-in h-full">
                      
                      {state.currentView === 'exam_prep' && (
                          <div className="mt-8 md:mt-12">
                             <ExamPrep profile={state.studentProfile} />
                          </div>
                      )}

                      {/* NEW VIEW: MindMap */}
                      {state.currentView === 'mindmap' && (
                          <div className="mt-8 md:mt-12 h-[75vh]">
                              <MindMapTool />
                          </div>
                      )}

                      {/* NEW VIEW: Grade Tracker */}
                      {state.currentView === 'grade_tracker' && (
                          <div className="mt-8 md:mt-12">
                              <GradeTracker 
                                grades={state.gradeRecord} 
                                profile={state.studentProfile}
                                onUpdateGrades={(g) => setState(prev => ({ ...prev, gradeRecord: g }))}
                              />
                          </div>
                      )}

                      {state.currentView === 'dashboard' && (
                          <div className="space-y-8 mt-4 md:mt-12">
                              
                              <div className={`p-4 rounded-2xl flex items-center gap-4 shadow-sm border animate-slide-in-right ${theme.isDark ? 'bg-blue-900/30 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
                                  <div className="p-2 bg-blue-500 text-white rounded-full shrink-0 animate-pulse">
                                      <Lightbulb size={24} />
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-sm uppercase opacity-70">Gợi ý hôm nay</h4>
                                      <p className="font-medium">{getSmartSuggestion()}</p>
                                  </div>
                              </div>
                              
                              <StudyStatsRow 
                                streak={state.studyStats.streakDays} 
                                minutes={state.studyStats.totalStudyMinutes}
                              />

                              <SubjectProgressGrid lessons={state.savedLessons} onNavigate={(sub) => navigateTo('subject', sub)} />

                              <StudentProfileCard 
                                profile={state.studentProfile} 
                                onUpdate={(p) => setState(prev => ({ ...prev, studentProfile: p }))} 
                              />
                              
                              {/* TIMER & QUOTE (Side-by-Side) */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="h-full">
                                    <CountdownTimer />
                                </div>
                                <div className="h-full">
                                    <ExamQuoteWidget />
                                </div>
                              </div>

                              {/* Charts Section */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  <div className="col-span-1 lg:col-span-1">
                                      <SubjectDistributionChart lessons={state.savedLessons} />
                                  </div>
                                  <div className="col-span-1 lg:col-span-2">
                                      <ActivityChart />
                                  </div>
                              </div>

                              {/* Info Section */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="h-full">
                                    <ExamScheduleWidget />
                                </div>
                                <div className="h-full">
                                    <ExamNewsWidget />
                                </div>
                              </div>

                              <div className="mt-8">
                                  <div className="flex justify-between items-center mb-4">
                                      <h3 className={`text-xl font-bold ${theme.text} flex items-center gap-2`}>
                                          <FolderOpen className="text-pink-500" size={20}/> Lịch sử bài học gần đây
                                      </h3>
                                  </div>
                                  {state.savedLessons.length > 0 ? (
                                      <div className={`backdrop-blur-xl border rounded-3xl p-2 shadow-sm ${theme.isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-white/50 border-white/40'}`}>
                                          {state.savedLessons.slice(0, 5).map(lesson => (
                                              <div key={lesson.id} className={`flex items-center justify-between p-4 rounded-2xl transition-all group border-b last:border-0 hover:pl-6 ${theme.isDark ? 'hover:bg-slate-800 border-slate-800' : 'hover:bg-white/60 border-slate-100'}`}>
                                                  <div className="flex items-center gap-4">
                                                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100 group-hover:scale-110 transition-transform">
                                                          <Book size={18} />
                                                      </div>
                                                      <div>
                                                          <h4 className={`font-bold ${theme.isDark ? 'text-slate-200' : 'text-slate-700'}`}>{lesson.topic}</h4>
                                                          <span className="text-xs text-slate-500 bg-white/70 px-2 py-0.5 rounded-full border border-slate-200">{lesson.subject} • {lesson.date}</span>
                                                      </div>
                                                  </div>
                                                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                      <button onClick={() => alert(lesson.content)} className="p-2 text-slate-400 hover:text-blue-500 transition-all hover:scale-110">Xem</button>
                                                      <button onClick={() => deleteLesson(lesson.id)} className="p-2 text-slate-400 hover:text-red-500 transition-all hover:scale-110"><Trash size={16}/></button>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  ) : (
                                      <div className={`p-8 rounded-2xl border border-dashed text-center text-slate-400 ${theme.isDark ? 'border-slate-700' : 'border-slate-300'}`}>
                                          Bạn chưa lưu bài học nào. Hãy vào từng môn học để bắt đầu nhé!
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}

                      {state.currentView === 'subject' && state.activeSubject && (
                          <div className="mt-8 md:mt-12">
                            <SubjectModule 
                                subject={state.activeSubject} 
                                profile={state.studentProfile}
                                onBack={() => navigateTo('dashboard')}
                                onSaveLesson={(lesson) => setState(prev => ({ ...prev, savedLessons: [lesson, ...prev.savedLessons] }))}
                                savedLessons={state.savedLessons}
                                onDeleteLesson={deleteLesson}
                            />
                          </div>
                      )}

                      {state.currentView === 'review' && (
                          <div className="mt-8 md:mt-12">
                             <ReviewCenter 
                                flashcards={state.flashcards} 
                                profile={state.studentProfile}
                                onNavigateToFlashcards={() => navigateTo('flashcards')}
                                onNavigateToStrategy={() => navigateTo('strategy')}
                             />
                          </div>
                      )}
                      
                      {state.currentView === 'strategy' && (
                          <div className="mt-8 md:mt-12">
                             <StrategyTool profile={state.studentProfile} />
                          </div>
                      )}

                      {state.currentView === 'flashcards' && (
                          <div className="mt-8 md:mt-12">
                            <FlashcardTool 
                                cards={state.flashcards} 
                                setCards={(val) => setState(prev => ({...prev, flashcards: typeof val === 'function' ? val(prev.flashcards) : val}))} 
                                profile={state.studentProfile}
                            />
                          </div>
                      )}
                      
                      {state.currentView === 'planner' && (
                          <div className="mt-8 md:mt-12">
                            <PlannerTool 
                                tasks={state.tasks} 
                                setTasks={(val) => setState(prev => ({...prev, tasks: typeof val === 'function' ? val(prev.tasks) : val}))} 
                                reminders={state.reminders}
                                setReminders={(val) => setState(prev => ({...prev, reminders: typeof val === 'function' ? val(prev.reminders) : val}))}
                            />
                          </div>
                      )}
                    </div>
                )}
            </div>
         </div>
      </main>

      <Dock 
        onNavigate={navigateTo} 
        activeView={state.currentView} 
        activeSubject={state.activeSubject}
      />

    </div>
  );
};

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}

export default App;
