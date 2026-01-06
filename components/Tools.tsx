
import React, { useState, useEffect, useRef } from 'react';
import { Flashcard, Task, StudyRoadmap, StudentProfile, Subject, Reminder } from '../types';
import { Plus, Trash2, Check, Edit3, Save, Sparkles, Loader2, Wand2, X, Target, TrendingUp, Map, Crosshair, RotateCw, Brain, Cloud, CheckCircle2, Bell, Clock, Calendar, Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import { generateFlashcards, generateStudyRoadmap } from '../services/geminiService';
import { useTheme } from './ThemeContext';
import { TiltCard } from './TiltCard';

// --- Flashcards Component ---
export const FlashcardTool: React.FC<{ cards: Flashcard[], setCards: React.Dispatch<React.SetStateAction<Flashcard[]>>, profile?: StudentProfile }> = ({ cards, setCards, profile }) => {
  const { theme } = useTheme();
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'General'>('General');
  const [filterSubject, setFilterSubject] = useState<Subject | 'General' | 'ALL'>('ALL');
  
  const [flippedId, setFlippedId] = useState<string | null>(null);
  
  // AI Generation State
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiContent, setAiContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // Review Mode State
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<Flashcard[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isReviewFlipped, setIsReviewFlipped] = useState(false);
  
  // Swipe State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  // Restore drafts from localStorage
  useEffect(() => {
    const draft = localStorage.getItem('glassy_flashcard_draft');
    if (draft) {
        try {
            const parsed = JSON.parse(draft);
            if(parsed.front) setFront(parsed.front);
            if(parsed.back) setBack(parsed.back);
            if(parsed.aiContent) setAiContent(parsed.aiContent);
            if(parsed.isAiMode !== undefined) setIsAiMode(parsed.isAiMode);
            if(parsed.selectedSubject) setSelectedSubject(parsed.selectedSubject);
        } catch(e) {
            console.error("Error parsing flashcard draft", e);
        }
    }
  }, []);

  useEffect(() => {
    const draftData = { front, back, aiContent, isAiMode, selectedSubject };
    localStorage.setItem('glassy_flashcard_draft', JSON.stringify(draftData));
    
    // Visual feedback for draft saving (debounce to avoid flickering)
    setDraftSaved(true);
    const timer = setTimeout(() => setDraftSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [front, back, aiContent, isAiMode, selectedSubject]);

  const getDueCards = () => {
    const now = Date.now();
    return cards.filter(c => !c.nextReview || c.nextReview <= now);
  };

  const startReviewSession = () => {
      const due = getDueCards();
      if (due.length === 0) {
          alert("Tuyệt vời! Bạn đã hoàn thành bài ôn tập hôm nay rồi. 🎉");
          return;
      }
      setReviewQueue(due);
      setCurrentReviewIndex(0);
      setIsReviewFlipped(false);
      setIsReviewMode(true);
  };

  const handleReviewResult = (difficulty: 'hard' | 'easy') => {
      const currentCard = reviewQueue[currentReviewIndex];
      let newLevel = currentCard.level || 0;
      let nextReview = Date.now();

      if (difficulty === 'easy') {
          newLevel += 1;
          const daysToAdd = Math.pow(2, newLevel - 1); 
          nextReview += daysToAdd * 24 * 60 * 60 * 1000;
      } else {
          newLevel = 0; 
          nextReview = Date.now(); 
      }

      const updatedCards = cards.map(c => 
          c.id === currentCard.id 
            ? { ...c, level: newLevel, nextReview: nextReview }
            : c
      );
      setCards(updatedCards);

      if (currentReviewIndex < reviewQueue.length - 1) {
          setIsReviewFlipped(false);
          setSlideDirection('left');
          setTimeout(() => {
             setCurrentReviewIndex(prev => prev + 1);
             setSlideDirection(null);
          }, 300);
      } else {
          setIsReviewMode(false);
          alert("Đã hoàn thành phiên ôn tập! 🧠✨");
      }
  };

  // Swipe Handlers
  const onTouchStart = (e: React.TouchEvent) => {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
  }

  const onTouchMove = (e: React.TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX);
  }

  const onTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > 50;
      const isRightSwipe = distance < -50;

      if (isLeftSwipe) {
          // Swipe Left -> Hard
          handleReviewResult('hard');
      } else if (isRightSwipe) {
          // Swipe Right -> Easy
          handleReviewResult('easy');
      }
  }

  const addCard = () => {
    if (!front || !back) return;
    setCards([...cards, { 
        id: Date.now().toString(), 
        front, 
        back, 
        subject: selectedSubject,
        level: 0,
        nextReview: Date.now()
    }]);
    setFront('');
    setBack('');
  };

  const handleAiGenerate = async () => {
    if (!aiContent.trim()) return;
    setIsGenerating(true);
    try {
        const newCardsData = await generateFlashcards(aiContent, profile);
        
        const newCards: Flashcard[] = newCardsData.map(c => ({
            id: Date.now().toString() + Math.random(),
            front: c.front,
            back: c.back,
            subject: selectedSubject,
            level: 0,
            nextReview: Date.now()
        }));

        setCards(prev => [...prev, ...newCards]);
        setAiContent(''); 
        setIsAiMode(false);
        alert(`Đã tạo thành công ${newCards.length} thẻ ghi nhớ môn ${selectedSubject}! ✨`);
    } catch (e) {
        alert("Có lỗi khi tạo thẻ, thử lại nha!");
    } finally {
        setIsGenerating(false);
    }
  };

  const deleteCard = (id: string) => {
    setCards(cards.filter(c => c.id !== id));
  };

  const filteredCards = cards.filter(c => filterSubject === 'ALL' || c.subject === filterSubject || (!c.subject && filterSubject === 'General'));
  const dueCount = getDueCards().length;

  // Styles
  const containerClass = "bg-white/60 border-white/40 shadow-sm";
  const textClass = theme.text;
  const inputClass = "bg-white/80 border-slate-200 text-slate-700 placeholder-slate-400 focus:ring-4 focus:ring-pink-100 transition-all duration-300";
  const cardFrontClass = "bg-white/70 border-white/50 text-slate-700";

  // --- REVIEW MODE INTERFACE ---
  if (isReviewMode) {
      const currentCard = reviewQueue[currentReviewIndex];
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in pb-20">
            <div className="flex justify-between w-full max-w-xl mb-4">
                <div className="flex items-center gap-2 text-slate-500 font-bold">
                    <Brain className="text-pink-500"/>
                    Chế độ ôn tập
                </div>
                <div className="text-slate-400 font-mono">
                    {currentReviewIndex + 1} / {reviewQueue.length}
                </div>
            </div>

            <div 
                onClick={() => setIsReviewFlipped(!isReviewFlipped)}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                className={`
                    w-full max-w-xl h-80 cursor-pointer perspective-1000 group relative mb-8 transition-transform duration-300 hover:scale-[1.02]
                    ${slideDirection === 'left' ? '-translate-x-full opacity-0' : slideDirection === 'right' ? 'translate-x-full opacity-0' : ''}
                `}
            >
                <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isReviewFlipped ? 'rotate-y-180' : ''}`}>
                    {/* Front */}
                    <div className={`absolute w-full h-full backface-hidden backdrop-blur-xl rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center shadow-lg border border-white/60 bg-white/80`}>
                        <span className="absolute top-6 left-6 text-xs font-bold text-pink-500 bg-pink-50 px-3 py-1 rounded-full border border-pink-100 uppercase">
                            Câu hỏi
                        </span>
                        {currentCard.subject && (
                             <span className="absolute top-6 right-6 text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                                {currentCard.subject}
                            </span>
                        )}
                        <p className="font-bold text-2xl md:text-3xl text-slate-800 leading-relaxed overflow-y-auto max-h-full custom-scrollbar px-2">{currentCard.front}</p>
                        <p className="absolute bottom-6 text-slate-400 text-sm animate-pulse">Chạm để lật thẻ • Vuốt trái/phải để chọn</p>
                    </div>
                    {/* Back */}
                    <div className={`absolute w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br ${theme.primary} rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center shadow-lg text-white`}>
                        <span className="absolute top-6 left-6 text-xs font-bold text-white/80 bg-white/20 px-3 py-1 rounded-full border border-white/20 uppercase">
                            Đáp án
                        </span>
                        <p className="font-bold text-2xl md:text-3xl leading-relaxed overflow-y-auto max-h-full custom-scrollbar px-2">{currentCard.back}</p>
                    </div>
                </div>
            </div>

            {isReviewFlipped ? (
                <div className="flex gap-4 w-full max-w-xl animate-slide-in-bottom">
                    <button 
                        onClick={() => handleReviewResult('hard')}
                        className="btn-hover flex-1 py-4 bg-red-100 text-red-600 rounded-2xl font-bold shadow-sm border border-red-200 hover:bg-red-200 flex flex-col items-center"
                    >
                        <span className="text-lg">Quên 😓</span>
                        <span className="text-xs opacity-70 font-normal">Học lại ngay (Vuốt Trái)</span>
                    </button>
                    <button 
                        onClick={() => handleReviewResult('easy')}
                        className="btn-hover flex-1 py-4 bg-green-100 text-green-600 rounded-2xl font-bold shadow-sm border border-green-200 hover:bg-green-200 flex flex-col items-center"
                    >
                        <span className="text-lg">Đã nhớ 🤩</span>
                        <span className="text-xs opacity-70 font-normal">Ôn sau (Vuốt Phải)</span>
                    </button>
                </div>
            ) : (
                <div className="h-[84px]"></div>
            )}

            <button onClick={() => setIsReviewMode(false)} className="mt-8 text-slate-400 hover:text-slate-600 text-sm underline transition-colors">
                Thoát chế độ ôn tập
            </button>
        </div>
      );
  }

  // --- MAIN INTERFACE ---
  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-2">
          <h3 className={`text-2xl font-bold ${textClass} flex items-center gap-2`}>
            ✨ Thẻ Ghi Nhớ
          </h3>
          
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
             <button 
                onClick={startReviewSession}
                className="btn-hover flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-white text-indigo-600 shadow-sm border border-indigo-100 hover:shadow-md whitespace-nowrap"
             >
                <RotateCw size={16} className={dueCount > 0 ? "text-pink-500 animate-spin" : ""}/> 
                Ôn tập ({dueCount})
             </button>
             
             {!isAiMode && (
                <button 
                    onClick={() => setIsAiMode(true)}
                    className={`btn-hover flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-md bg-gradient-to-r ${theme.primary} text-white whitespace-nowrap`}
                >
                    <Wand2 size={16}/> Tạo bằng AI
                </button>
             )}
          </div>
      </div>
      
      {/* Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
         <button 
            onClick={() => setFilterSubject('ALL')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-300 whitespace-nowrap ${filterSubject === 'ALL' ? 'bg-slate-700 text-white border-slate-700 scale-105' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:scale-105'}`}
         >
            Tất cả
         </button>
         {[Subject.MATH, Subject.LITERATURE, Subject.ENGLISH, Subject.INFORMATICS, 'General'].map(sub => (
            <button 
                key={sub}
                onClick={() => setFilterSubject(sub as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-300 whitespace-nowrap ${filterSubject === sub ? 'bg-pink-500 text-white border-pink-500 scale-105 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:scale-105'}`}
            >
                {sub === 'General' ? 'Chung' : sub}
            </button>
         ))}
      </div>

      {/* Creation Area */}
      <TiltCard className={`${containerClass} backdrop-blur-xl p-6 rounded-[2rem] border relative overflow-hidden transition-all duration-500`}>
        {isAiMode ? (
            <div className="animate-slide-in-right relative">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-slate-500 text-sm">Dán nội dung, AI sẽ tạo thẻ cho môn: <span className="font-bold text-pink-500">{selectedSubject === 'General' ? 'Chung' : selectedSubject}</span></p>
                    <div className="flex items-center gap-2">
                        {draftSaved && (
                            <span className="text-xs text-green-500 flex items-center gap-1 animate-fade-in">
                                <CheckCircle2 size={14} /> Đã lưu nháp
                            </span>
                        )}
                        <button 
                            onClick={() => setIsAiMode(false)}
                            className="p-2 -mt-2 -mr-2 rounded-full transition-colors text-slate-400 hover:text-slate-600 hover:bg-white/50"
                            title="Đóng chế độ AI"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Subject Selector for AI */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {[Subject.MATH, Subject.LITERATURE, Subject.ENGLISH, Subject.INFORMATICS, 'General'].map(sub => (
                        <button
                            key={sub}
                            onClick={() => setSelectedSubject(sub as any)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all duration-200 hover:scale-105 ${selectedSubject === sub ? 'bg-pink-100 text-pink-600 border-pink-300' : 'bg-white/50 text-slate-500 border-slate-200'}`}
                        >
                            {sub === 'General' ? 'Chung' : sub}
                        </button>
                    ))}
                </div>
                
                <div className="relative">
                    <textarea
                        value={aiContent}
                        onChange={(e) => setAiContent(e.target.value)}
                        placeholder="Ví dụ: Dán công thức toán, từ vựng tiếng Anh..."
                        className={`w-full p-4 pr-12 rounded-xl border outline-none transition-all min-h-[120px] mb-4 resize-none ${inputClass}`}
                    />
                    <Cloud className={`absolute top-4 right-4 text-slate-300 transition-colors ${draftSaved ? 'text-green-400' : ''}`} size={20} />
                </div>

                <button 
                    onClick={handleAiGenerate}
                    disabled={isGenerating || !aiContent.trim()}
                    className={`
                        w-full py-3 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden active:scale-95
                        ${isGenerating ? 'bg-slate-400 cursor-not-allowed' : `bg-gradient-to-r ${theme.primary} hover:scale-[1.01] hover:shadow-lg`}
                    `}
                >
                    {isGenerating && (
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    )}
                    {isGenerating ? <><Loader2 className="animate-spin"/> AI Đang Tạo...</> : <><Sparkles size={18} className="animate-pulse"/> Tạo Thẻ Ngay</>}
                </button>
            </div>
        ) : (
            <div className="flex flex-col gap-4 animate-fade-in">
                 {/* Subject Selector for Manual */}
                 <div className="flex gap-2 overflow-x-auto pb-1">
                    <span className="text-xs font-bold text-slate-400 flex items-center mr-2 uppercase tracking-wide">Môn học:</span>
                    {[Subject.MATH, Subject.LITERATURE, Subject.ENGLISH, Subject.INFORMATICS, 'General'].map(sub => (
                        <button
                            key={sub}
                            onClick={() => setSelectedSubject(sub as any)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all duration-200 hover:scale-105 ${selectedSubject === sub ? 'bg-blue-100 text-blue-600 border-blue-300' : 'bg-white/50 text-slate-500 border-slate-200'}`}
                        >
                            {sub === 'General' ? 'Chung' : sub}
                        </button>
                    ))}
                </div>

                <div className="flex gap-4 flex-col md:flex-row">
                    <input
                        value={front}
                        onChange={(e) => setFront(e.target.value)}
                        placeholder="Mặt trước (Câu hỏi/Từ vựng)"
                        className={`flex-1 p-4 rounded-xl border outline-none ${inputClass}`}
                    />
                    <input
                        value={back}
                        onChange={(e) => setBack(e.target.value)}
                        placeholder="Mặt sau (Đáp án/Nghĩa)"
                        className={`flex-1 p-4 rounded-xl border outline-none ${inputClass}`}
                    />
                    <button 
                        onClick={addCard} 
                        className={`text-white p-4 rounded-xl shadow-md transition-all duration-300 hover:scale-110 active:scale-95 bg-gradient-to-r ${theme.primary}`}
                    >
                        <Plus size={24} />
                    </button>
                </div>
            </div>
        )}
      </TiltCard>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredCards.map(card => (
          <div
            key={card.id}
            onClick={() => setFlippedId(flippedId === card.id ? null : card.id)}
            className="card-hover h-56 cursor-pointer perspective-1000 group relative"
          >
            <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${flippedId === card.id ? 'rotate-y-180' : ''}`}>
              {/* Front */}
              <div className={`absolute w-full h-full backface-hidden backdrop-blur-md rounded-[2rem] p-6 flex flex-col items-center justify-center text-center shadow-sm border group-hover:border-pink-200 transition-all ${cardFrontClass}`}>
                {/* Subject Badge */}
                {card.subject && (
                    <span className="absolute top-4 left-4 text-[10px] font-bold text-slate-400 bg-white/50 px-2 py-0.5 rounded-md border border-slate-200">
                        {card.subject}
                    </span>
                )}
                <div className="absolute top-4 right-4 flex gap-0.5" title={`Level: ${card.level || 0}`}>
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < (card.level || 0) ? 'bg-green-400' : 'bg-slate-200'}`}></div>
                    ))}
                </div>

                <p className="font-bold text-xl overflow-y-auto max-h-full custom-scrollbar w-full">{card.front}</p>
                
                <button
                  onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }}
                  className="absolute bottom-4 right-4 text-slate-300 hover:text-red-500 transition-all hover:scale-110"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              {/* Back */}
              <div className={`absolute w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br ${theme.primary} rounded-[2rem] p-6 flex items-center justify-center text-center shadow-md text-white`}>
                <p className="font-bold text-xl overflow-y-auto max-h-full custom-scrollbar">{card.back}</p>
              </div>
            </div>
          </div>
        ))}
        {filteredCards.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-400 italic">
                {cards.length === 0 ? "Chưa có thẻ nào. Hãy thêm thủ công hoặc dùng AI nhé! 🚀" : "Không tìm thấy thẻ trong môn học này."}
            </div>
        )}
      </div>
    </div>
  );
};

// --- Reminder Component (New) ---
const ReminderSection: React.FC<{ 
    reminders: Reminder[], 
    setReminders: React.Dispatch<React.SetStateAction<Reminder[]>> 
}> = ({ reminders, setReminders }) => {
    const { theme } = useTheme();
    const [title, setTitle] = useState('');
    const [time, setTime] = useState('');
    // Initialize with current day to improve UX (0-6)
    const [selectedDays, setSelectedDays] = useState<number[]>([new Date().getDay()]);
    const [errorMsg, setErrorMsg] = useState('');

    const days = [
        { label: 'CN', val: 0 }, { label: 'T2', val: 1 }, { label: 'T3', val: 2 },
        { label: 'T4', val: 3 }, { label: 'T5', val: 4 }, { label: 'T6', val: 5 }, { label: 'T7', val: 6 }
    ];

    const toggleDay = (val: number) => {
        if (selectedDays.includes(val)) {
            setSelectedDays(selectedDays.filter(d => d !== val));
        } else {
            setSelectedDays([...selectedDays, val].sort());
        }
    };

    const addReminder = () => {
        if (!title.trim() || !time) {
            setErrorMsg("Vui lòng nhập tên và chọn giờ!");
            return;
        }
        if (selectedDays.length === 0) {
            setErrorMsg("Vui lòng chọn ít nhất một ngày trong tuần.");
            return;
        }
        
        setErrorMsg('');
        const newReminder: Reminder = {
            id: Date.now().toString(),
            title,
            time,
            days: selectedDays,
            active: true
        };
        setReminders([...reminders, newReminder]);
        setTitle('');
        setTime('');
        // Reset to today again for convenience
        setSelectedDays([new Date().getDay()]);
        
        // Request notification permission if needed
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    };

    const toggleActive = (id: string) => {
        setReminders(reminders.map(r => r.id === id ? { ...r, active: !r.active } : r));
    };

    const deleteReminder = (id: string) => {
        if(confirm("Xóa lời nhắc này?")) {
            setReminders(reminders.filter(r => r.id !== id));
        }
    };

    return (
        <div className="space-y-6">
            {/* Create Form */}
            <div className={`p-4 rounded-2xl border ${theme.isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/60 border-slate-200'}`}>
                <h4 className="font-bold text-slate-500 text-xs uppercase mb-3 flex items-center gap-1"><Plus size={14}/> Tạo lời nhắc mới</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input 
                        value={title}
                        onChange={(e) => { setTitle(e.target.value); setErrorMsg(''); }}
                        placeholder="Nội dung (VD: Học Toán, Làm đề Anh...)"
                        className={`p-3 rounded-xl border outline-none ${theme.isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                    />
                    <input 
                        type="time"
                        value={time}
                        onChange={(e) => { setTime(e.target.value); setErrorMsg(''); }}
                        className={`p-3 rounded-xl border outline-none ${theme.isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                    />
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    {days.map(d => (
                        <button
                            type="button"
                            key={d.val}
                            onClick={() => toggleDay(d.val)}
                            className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${selectedDays.includes(d.val) ? 'bg-pink-500 text-white shadow-md scale-110' : theme.isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                            {d.label}
                        </button>
                    ))}
                </div>

                {errorMsg && (
                    <div className="mb-4 text-xs text-red-500 flex items-center gap-1 animate-fade-in">
                        <AlertTriangle size={12}/> {errorMsg}
                    </div>
                )}

                <button 
                    type="button"
                    onClick={addReminder}
                    className={`btn-hover w-full py-2 bg-gradient-to-r ${theme.primary} text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-2`}
                >
                    <Bell size={16}/> Đặt Lịch
                </button>
            </div>

            {/* List */}
            <div className="space-y-3">
                {reminders.map(r => (
                    <div key={r.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${r.active ? (theme.isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-pink-100 shadow-sm') : (theme.isDark ? 'bg-slate-900/50 border-slate-800 opacity-60' : 'bg-slate-50 border-slate-200 opacity-60')}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold shadow-sm ${r.active ? 'bg-pink-50 text-pink-600' : 'bg-slate-200 text-slate-500'}`}>
                                <Clock size={18} />
                                <span className="text-xs">{r.time}</span>
                            </div>
                            <div>
                                <h4 className={`font-bold ${theme.isDark ? 'text-slate-200' : 'text-slate-700'} ${!r.active && 'line-through'}`}>{r.title}</h4>
                                <div className="flex gap-1 mt-1">
                                    {days.map(d => (
                                        <span key={d.val} className={`text-[10px] ${r.days.includes(d.val) ? 'font-bold text-pink-500' : 'text-slate-300'}`}>
                                            {d.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => toggleActive(r.id)}
                                className={`p-2 rounded-full transition-colors ${r.active ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                title={r.active ? "Tắt thông báo" : "Bật thông báo"}
                            >
                                {r.active ? <Volume2 size={18}/> : <VolumeX size={18}/>}
                            </button>
                            <button 
                                onClick={() => deleteReminder(r.id)}
                                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    </div>
                ))}
                {reminders.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm italic">Chưa có lời nhắc nào.</div>
                )}
            </div>
        </div>
    );
};

// --- Planner Component (Updated with Reminders) ---
export const PlannerTool: React.FC<{ 
    tasks: Task[], 
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
    reminders: Reminder[],
    setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>
}> = ({ tasks, setTasks, reminders, setReminders }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'todo' | 'reminder'>('todo');
  const [input, setInput] = useState('');

  const addTask = () => {
    if (!input.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), text: input, completed: false }]);
    setInput('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <TiltCard className="max-w-3xl mx-auto bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white/40 p-8 shadow-sm animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-6">
          <h3 className={`text-2xl font-bold ${theme.text} flex items-center gap-2`}>📅 Kế Hoạch & Lời Nhắc</h3>
      </div>

      {/* Tabs */}
      <div className={`flex p-1 rounded-xl border mb-6 ${theme.isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-slate-200'}`}>
          <button 
            onClick={() => setActiveTab('todo')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'todo' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
             <CheckCircle2 size={16}/> Nhiệm vụ
          </button>
          <button 
            onClick={() => setActiveTab('reminder')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'reminder' ? 'bg-white shadow-sm text-pink-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
             <Bell size={16}/> Lời nhắc học tập
          </button>
      </div>

      {activeTab === 'todo' ? (
          <div className="animate-fade-in">
            <div className="flex gap-3 mb-8">
                <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                placeholder="Hôm nay mình sẽ làm gì nhỉ?..."
                className="flex-1 p-4 rounded-2xl bg-white/80 border border-slate-200 outline-none text-slate-700 placeholder-slate-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-50 transition-all duration-300"
                />
                <button onClick={addTask} className={`btn-hover text-white px-8 rounded-2xl font-bold shadow-md bg-gradient-to-r ${theme.primary}`}>
                Thêm
                </button>
            </div>
            <div className="space-y-3">
                {tasks.map(task => (
                <div key={task.id} className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border hover:scale-[1.01] ${task.completed ? 'bg-green-50/50 border-green-100' : 'bg-white/80 border-transparent hover:border-purple-100 shadow-sm hover:shadow-md'}`}>
                    <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${task.completed ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-purple-400'}`}
                    >
                    {task.completed && <Check size={14} className="text-white animate-check-pop" />}
                    </button>
                    <span className={`flex-1 text-lg font-medium transition-colors ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                    {task.text}
                    </span>
                    <button onClick={() => removeTask(task.id)} className="text-slate-300 hover:text-red-400 transition-all hover:scale-110">
                    <Trash2 size={18} />
                    </button>
                </div>
                ))}
            </div>
          </div>
      ) : (
          <div className="animate-slide-in-right">
              <ReminderSection reminders={reminders} setReminders={setReminders} />
          </div>
      )}
    </TiltCard>
  );
};

// --- StrategyTool Component ---
export const StrategyTool: React.FC<{ profile: StudentProfile }> = ({ profile }) => {
    const { theme } = useTheme();
    const [target, setTarget] = useState(profile.targetUniversity || '');
    const [level, setLevel] = useState(profile.weaknesses || '');
    const [roadmap, setRoadmap] = useState<StudyRoadmap | null>(null);
    const [loading, setLoading] = useState(false);

    // Try to load from localstorage
    useEffect(() => {
        const saved = localStorage.getItem('glassy_roadmap');
        if (saved) {
            try {
                setRoadmap(JSON.parse(saved));
            } catch (e) { }
        }
    }, []);

    const handleGenerate = async () => {
        if (!target || !level) return alert("Vui lòng nhập mục tiêu và trình độ hiện tại!");
        setLoading(true);
        const result = await generateStudyRoadmap(target, level, profile);
        if (result) {
            setRoadmap(result);
            localStorage.setItem('glassy_roadmap', JSON.stringify(result));
        } else {
            alert("Lỗi khi tạo lộ trình. Thử lại nhé!");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <TiltCard className={`p-8 rounded-[2.5rem] border ${theme.isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white/60 border-white/40 shadow-lg'}`}>
                <div className="text-center mb-8">
                    <h2 className={`text-3xl font-bold ${theme.text} mb-2`}>🗺️ Lộ Trình Chiến Lược</h2>
                    <p className="text-slate-500">AI sẽ thiết kế kế hoạch ôn thi chi tiết dựa trên mục tiêu của bạn.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Mục tiêu (Trường / Điểm số)</label>
                        <div className={`flex items-center p-4 rounded-2xl border ${theme.isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <Target className="text-red-500 mr-3" />
                            <input 
                                value={target} 
                                onChange={e => setTarget(e.target.value)} 
                                className="bg-transparent outline-none flex-1 font-bold" 
                                placeholder="VD: ĐH Bách Khoa - 28 điểm" 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Trình độ hiện tại / Điểm yếu</label>
                        <div className={`flex items-center p-4 rounded-2xl border ${theme.isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <Crosshair className="text-blue-500 mr-3" />
                            <input 
                                value={level} 
                                onChange={e => setLevel(e.target.value)} 
                                className="bg-transparent outline-none flex-1 font-bold" 
                                placeholder="VD: Mất gốc Hình học, Tiếng Anh 5.0" 
                            />
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleGenerate}
                    disabled={loading}
                    className={`btn-hover w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 bg-gradient-to-r ${theme.primary}`}
                >
                    {loading ? <><Loader2 className="animate-spin"/> AI Đang Lập Kế Hoạch...</> : <><Sparkles size={20}/> Tạo Lộ Trình</>}
                </button>
            </TiltCard>

            {roadmap && (
                <div className="space-y-6 animate-slide-in-bottom">
                    <div className={`p-6 rounded-[2rem] border relative overflow-hidden ${theme.isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-pink-100 shadow-sm'}`}>
                        <h3 className={`text-xl font-bold ${theme.text} mb-4 flex items-center gap-2`}>
                            <TrendingUp className="text-green-500" /> Lời Khuyên Chiến Lược
                        </h3>
                        <p className={`text-lg leading-relaxed ${theme.isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {roadmap.advice}
                        </p>
                    </div>

                    <div className="relative border-l-4 border-slate-200 ml-4 md:ml-8 space-y-8 pl-8 py-4">
                        {roadmap.steps.map((step, idx) => (
                            <div key={idx} className="relative">
                                <div className={`absolute -left-[42px] top-0 w-6 h-6 rounded-full border-4 border-white shadow-sm ${idx === 0 ? 'bg-pink-500' : 'bg-slate-300'}`}></div>
                                <div className={`p-6 rounded-2xl border card-hover ${theme.isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                                    <h4 className="text-lg font-bold text-pink-600 mb-3">{step.phase}</h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h5 className="text-xs font-bold text-slate-400 uppercase mb-2">Hành động trọng tâm</h5>
                                            <ul className="space-y-2">
                                                {step.actions.map((act, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm">
                                                        <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                                                        <span className={theme.isDark ? 'text-slate-300' : 'text-slate-700'}>{act}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h5 className="text-xs font-bold text-slate-400 uppercase mb-2">Chủ đề cần học</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {step.focusTopics.map((topic, i) => (
                                                    <span key={i} className={`px-3 py-1 rounded-lg text-xs font-bold border ${theme.isDark ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                                        {topic}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
