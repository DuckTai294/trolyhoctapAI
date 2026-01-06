
import React, { useState, useRef } from 'react';
import { Flashcard, StudentProfile, QuizQuestion, QuizType, Subject } from '../types';
import { generateComprehensiveQuiz } from '../services/geminiService';
import { TiltCard } from './TiltCard';
import { MathText } from './MathText';
import { Brain, TrendingUp, AlertCircle, CheckCircle, Clock, FileText, UploadCloud, Play, Check, XCircle, RotateCcw, Loader2, ListChecks, Type, ToggleLeft } from 'lucide-react';
import { useTheme } from './ThemeContext';

interface ReviewCenterProps {
  flashcards: Flashcard[];
  profile: StudentProfile;
  onNavigateToFlashcards: () => void;
  onNavigateToStrategy: () => void;
}

export const ReviewCenter: React.FC<ReviewCenterProps> = ({ flashcards, profile, onNavigateToFlashcards, onNavigateToStrategy }) => {
  const { theme } = useTheme();
  
  // State for Review Modes
  const [activeTab, setActiveTab] = useState<'topic' | 'document'>('topic');
  const [reviewState, setReviewState] = useState<'menu' | 'quiz' | 'result'>('menu');
  
  // Quiz Configuration
  const [selectedSubject, setSelectedSubject] = useState<string>(Subject.MATH);
  const [topicInput, setTopicInput] = useState('');
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [questionTypes, setQuestionTypes] = useState<{ [key in QuizType]: boolean }>({
    'multiple-choice': true,
    'true-false': false,
    'short-answer': false
  });

  // Quiz Execution State
  const [isLoading, setIsLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [score, setScore] = useState(0);

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
          alert("File lớn quá! Vui lòng chọn file dưới 2MB nhé.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileData(reader.result as string);
        setFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleQuestionType = (type: QuizType) => {
    setQuestionTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleStartQuiz = async () => {
    if (activeTab === 'topic' && !topicInput) return alert("Vui lòng nhập chủ đề!");
    if (activeTab === 'document' && !fileData) return alert("Vui lòng tải lên tài liệu!");
    
    const selectedTypes = (Object.keys(questionTypes) as QuizType[]).filter(t => questionTypes[t]);
    if (selectedTypes.length === 0) return alert("Vui lòng chọn ít nhất một dạng câu hỏi!");

    setIsLoading(true);
    const input = activeTab === 'topic' ? topicInput : "Tài liệu tải lên";
    
    const questions = await generateComprehensiveQuiz(
        input, 
        activeTab === 'document' ? fileData : null, 
        selectedTypes,
        selectedSubject,
        profile
    );

    if (questions.length > 0) {
        setQuizQuestions(questions);
        setUserAnswers({});
        setReviewState('quiz');
    } else {
        alert("Không thể tạo câu hỏi. Vui lòng thử lại với nội dung rõ ràng hơn!");
    }
    setIsLoading(false);
  };

  const handleSubmitQuiz = () => {
    let correctCount = 0;
    quizQuestions.forEach(q => {
        const userAnswer = userAnswers[q.id]?.trim().toLowerCase();
        const correctAnswer = q.correctAnswer.trim().toLowerCase();
        
        // Basic fuzzy matching for short answers
        if (q.type === 'short-answer') {
            if (correctAnswer.includes(userAnswer) || userAnswer.includes(correctAnswer)) correctCount++;
        } else {
            if (userAnswer === correctAnswer) correctCount++;
        }
    });
    setScore(correctCount);
    setReviewState('result');
  };

  // --- RENDER SECTIONS ---
  const containerClass = `backdrop-blur-xl border rounded-[2.5rem] p-2 shadow-sm flex max-w-md mx-auto mb-8 ${theme.isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white/60 border-white/40'}`;
  const cardClass = `backdrop-blur-2xl border rounded-[2.5rem] p-8 shadow-lg max-w-3xl mx-auto ${theme.isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white/70 border-white/50'}`;
  const inputClass = `w-full p-4 rounded-2xl border outline-none transition-all focus:ring-4 focus:ring-pink-100 ${theme.isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`;

  // 1. MENU SCREEN
  if (reviewState === 'menu') {
      return (
        <div className="space-y-8 animate-fade-in pb-20 max-w-5xl mx-auto">
            <div className="text-center space-y-2">
                <h2 className={`text-3xl font-bold ${theme.text}`}>🧠 Trung Tâm Kiểm Tra Kiến Thức</h2>
                <p className="text-slate-500">Thực hành đa dạng các loại câu hỏi để không bỡ ngỡ khi thi thật.</p>
            </div>

            <div className={containerClass}>
                <button 
                    onClick={() => setActiveTab('topic')}
                    className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${activeTab === 'topic' ? 'bg-white shadow-md text-pink-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Ôn Theo Chủ Đề
                </button>
                <button 
                    onClick={() => setActiveTab('document')}
                    className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${activeTab === 'document' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Ôn Từ Tài Liệu
                </button>
            </div>

            <TiltCard className={cardClass}>
                <div className="space-y-6">
                    {/* Subject Select */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Môn Học</label>
                        <div className="flex flex-wrap gap-2">
                            {[Subject.MATH, Subject.LITERATURE, Subject.ENGLISH, Subject.INFORMATICS, 'Khác'].map(sub => (
                                <button
                                    key={sub}
                                    onClick={() => setSelectedSubject(sub)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${selectedSubject === sub ? 'bg-indigo-100 text-indigo-600 border-indigo-300' : theme.isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white/50 text-slate-500 border-slate-200'}`}
                                >
                                    {sub}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input Area */}
                    {activeTab === 'topic' ? (
                        <div>
                             <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Chủ đề ôn tập</label>
                             <input 
                                value={topicInput}
                                onChange={(e) => setTopicInput(e.target.value)}
                                placeholder="VD: Hàm số mũ, Thì hiện tại hoàn thành..."
                                className={inputClass}
                             />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tải lên đề cương / Tài liệu (Ảnh/PDF)</label>
                            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all hover:border-blue-400 group ${theme.isDark ? 'border-slate-700 bg-slate-800/40 hover:bg-slate-800' : 'border-slate-300 bg-white/40 hover:bg-white/70'}`}>
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-10 h-10 mb-2 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                    <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click để tải lên</span> hoặc kéo thả</p>
                                    <p className="text-xs text-slate-400">{fileName || "PDF, PNG, JPG (Max 2MB)"}</p>
                                </div>
                                <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                            </label>
                        </div>
                    )}

                    {/* Question Types */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cấu trúc đề thi</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button 
                                onClick={() => toggleQuestionType('multiple-choice')}
                                className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${questionTypes['multiple-choice'] ? 'bg-green-50 border-green-200 text-green-700' : theme.isDark ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-white/50 border-slate-200 text-slate-500'}`}
                            >
                                <div className={`w-5 h-5 rounded flex items-center justify-center ${questionTypes['multiple-choice'] ? 'bg-green-500 text-white' : 'bg-slate-200'}`}>
                                    {questionTypes['multiple-choice'] && <Check size={14}/>}
                                </div>
                                <span className="text-sm font-semibold flex items-center gap-1"><ListChecks size={16}/> Trắc nghiệm</span>
                            </button>

                            <button 
                                onClick={() => toggleQuestionType('true-false')}
                                className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${questionTypes['true-false'] ? 'bg-orange-50 border-orange-200 text-orange-700' : theme.isDark ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-white/50 border-slate-200 text-slate-500'}`}
                            >
                                <div className={`w-5 h-5 rounded flex items-center justify-center ${questionTypes['true-false'] ? 'bg-orange-500 text-white' : 'bg-slate-200'}`}>
                                    {questionTypes['true-false'] && <Check size={14}/>}
                                </div>
                                <span className="text-sm font-semibold flex items-center gap-1"><ToggleLeft size={16}/> Đúng / Sai</span>
                            </button>

                            <button 
                                onClick={() => toggleQuestionType('short-answer')}
                                className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${questionTypes['short-answer'] ? 'bg-purple-50 border-purple-200 text-purple-700' : theme.isDark ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-white/50 border-slate-200 text-slate-500'}`}
                            >
                                <div className={`w-5 h-5 rounded flex items-center justify-center ${questionTypes['short-answer'] ? 'bg-purple-500 text-white' : 'bg-slate-200'}`}>
                                    {questionTypes['short-answer'] && <Check size={14}/>}
                                </div>
                                <span className="text-sm font-semibold flex items-center gap-1"><Type size={16}/> Điền từ</span>
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={handleStartQuiz}
                        disabled={isLoading}
                        className={`btn-hover w-full py-4 rounded-xl font-bold text-white shadow-lg text-lg flex items-center justify-center gap-2 bg-gradient-to-r ${activeTab === 'topic' ? 'from-pink-500 to-rose-500' : 'from-blue-500 to-cyan-500'}`}
                    >
                        {isLoading ? <><Loader2 className="animate-spin"/> AI Đang Tạo Đề...</> : <><Play size={20}/> Bắt Đầu Làm Bài</>}
                    </button>
                </div>
            </TiltCard>
        </div>
      );
  }

  // 2. QUIZ SCREEN & 3. RESULT SCREEN
  return (
    <div className="max-w-4xl mx-auto pb-20 animate-slide-in-bottom">
        <div className="flex items-center justify-between mb-6">
            <button onClick={() => setReviewState('menu')} className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-2">
                <RotateCcw size={18}/> Thoát / Làm lại
            </button>
            {reviewState === 'result' && (
                <div className={`text-2xl font-bold ${theme.text}`}>
                    Kết quả: <span className="text-pink-600">{score}/{quizQuestions.length}</span>
                </div>
            )}
        </div>

        <div className="space-y-6">
            {quizQuestions.map((q, idx) => (
                <div key={q.id} className={`backdrop-blur-xl border rounded-[2rem] p-6 shadow-sm card-hover ${theme.isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white/70 border-white/50'}`}>
                    <div className="flex items-start gap-4 mb-4">
                        <span className="bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-lg text-sm whitespace-nowrap">
                            Câu {idx + 1}
                        </span>
                        <div className="flex-1">
                            <div className={`font-bold text-lg ${theme.text}`}>
                                <MathText content={q.question} />
                            </div>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1 block">
                                {q.type === 'multiple-choice' ? 'Trắc nghiệm' : q.type === 'true-false' ? 'Đúng / Sai' : 'Điền câu trả lời ngắn'}
                            </span>
                        </div>
                    </div>

                    {/* Question Content */}
                    <div className="pl-0 md:pl-16">
                        {q.type === 'multiple-choice' && q.options && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {q.options.map((opt, i) => {
                                    const isSelected = userAnswers[q.id] === opt;
                                    const isCorrect = q.correctAnswer === opt;
                                    let cls = "p-3 rounded-xl border text-left transition-all flex items-center gap-2 ";
                                    
                                    if (reviewState === 'result') {
                                        if (isCorrect) cls += "bg-green-100 border-green-500 text-green-800 font-bold";
                                        else if (isSelected && !isCorrect) cls += "bg-red-100 border-red-500 text-red-800";
                                        else cls += theme.isDark ? "bg-slate-800/50 border-slate-700 opacity-60" : "bg-white/50 border-slate-200 opacity-60";
                                    } else {
                                        cls += isSelected ? "bg-pink-100 border-pink-500 text-pink-800 shadow-sm font-bold" : theme.isDark ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300" : "bg-white border-slate-200 hover:bg-slate-50";
                                    }
                                    return (
                                        <button 
                                            key={i} 
                                            onClick={() => reviewState === 'quiz' && setUserAnswers(prev => ({...prev, [q.id]: opt}))}
                                            className={cls}
                                        >
                                            <span className="inline-block w-6 font-bold opacity-50">{String.fromCharCode(65 + i)}.</span> 
                                            <MathText content={opt} isInline />
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {q.type === 'true-false' && (
                            <div className="flex gap-4">
                                {['True', 'False'].map(val => {
                                     const isSelected = userAnswers[q.id] === val;
                                     const isCorrect = String(q.correctAnswer).toLowerCase() === val.toLowerCase();
                                     let cls = "flex-1 py-4 rounded-xl border font-bold transition-all ";
                                     
                                     if (reviewState === 'result') {
                                        if (isCorrect) cls += "bg-green-100 border-green-500 text-green-800";
                                        else if (isSelected && !isCorrect) cls += "bg-red-100 border-red-500 text-red-800";
                                        else cls += theme.isDark ? "bg-slate-800/50 border-slate-700 opacity-60" : "bg-white/50 border-slate-200 opacity-60";
                                     } else {
                                        cls += isSelected 
                                            ? val === 'True' ? "bg-green-100 border-green-500 text-green-700 shadow-sm" : "bg-red-100 border-red-500 text-red-700 shadow-sm"
                                            : theme.isDark ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600";
                                     }
                                     return (
                                         <button 
                                            key={val}
                                            onClick={() => reviewState === 'quiz' && setUserAnswers(prev => ({...prev, [q.id]: val}))}
                                            className={cls}
                                         >
                                            {val === 'True' ? 'Đúng (True)' : 'Sai (False)'}
                                         </button>
                                     );
                                })}
                            </div>
                        )}

                        {q.type === 'short-answer' && (
                            <div>
                                <input 
                                    value={userAnswers[q.id] || ''}
                                    onChange={(e) => reviewState === 'quiz' && setUserAnswers(prev => ({...prev, [q.id]: e.target.value}))}
                                    disabled={reviewState === 'result'}
                                    placeholder="Nhập câu trả lời của bạn..."
                                    className={inputClass}
                                />
                                {reviewState === 'result' && (
                                    <div className="mt-2 text-sm text-slate-500 flex gap-2">
                                        Đáp án gợi ý: <span className="font-bold text-green-600"><MathText content={q.correctAnswer} isInline /></span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Explanation (Result Only) */}
                    {reviewState === 'result' && (
                        <div className="mt-4 ml-0 md:ml-16 p-4 bg-blue-50 text-blue-800 rounded-xl text-sm border border-blue-100 flex gap-2 animate-fade-in">
                            <Clock size={16} className="shrink-0 mt-0.5"/>
                            <div>
                                <span className="font-bold block mb-1">Giải thích chi tiết:</span>
                                <MathText content={q.explanation} />
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>

        {reviewState === 'quiz' && (
            <div className="mt-8 text-center">
                <button 
                    onClick={handleSubmitQuiz}
                    className="btn-hover bg-gradient-to-r from-pink-500 to-purple-600 text-white px-12 py-4 rounded-full font-bold shadow-xl text-lg hover:scale-105 transition-transform"
                >
                    Nộp Bài
                </button>
            </div>
        )}
    </div>
  );
};
