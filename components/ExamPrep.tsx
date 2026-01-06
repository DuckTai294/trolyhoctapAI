import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { StudentProfile, Subject, QuizQuestion, ExamResult } from '../types';
import { StrategyTool } from './Tools';
import { generateComprehensiveQuiz, generateGapAnalysis } from '../services/geminiService';
import { useTheme } from './ThemeContext';
import { TiltCard } from './TiltCard';
import { MathText } from './MathText';
import { 
  Map, FileText, Timer, Download, Folder, 
  ChevronRight, PlayCircle, AlertTriangle, Trophy,
  Clock, Shield, UploadCloud, Loader2, CheckCircle, XCircle, RotateCcw, History, ScanSearch, Target, Brain, Activity, X
} from 'lucide-react';

interface ExamPrepProps {
  profile: StudentProfile;
}

type Tab = 'strategies' | 'papers' | 'mock' | 'history' | 'gap_hunter';

export const ExamPrep: React.FC<ExamPrepProps> = ({ profile }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('strategies');

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div>
            <h2 className={`text-3xl font-bold ${theme.text} flex items-center gap-2`}>
                🎓 Luyện Thi THPTQG
            </h2>
            <p className="text-slate-500">Trung tâm luyện đề và chiến lược thi cử.</p>
        </div>

        {/* Navigation Tabs */}
        <div className={`flex p-1 rounded-xl border overflow-x-auto max-w-full custom-scrollbar ${theme.isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/50 border-slate-200'}`}>
            <button 
                onClick={() => setActiveTab('strategies')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'strategies' ? 'bg-white shadow-sm text-pink-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Map size={16}/> Chiến Lược
            </button>
            <button 
                onClick={() => setActiveTab('gap_hunter')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'gap_hunter' ? 'bg-white shadow-sm text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <ScanSearch size={16}/> Săn Lỗ Hổng
            </button>
            <button 
                onClick={() => setActiveTab('papers')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'papers' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <FileText size={16}/> Đề Thi Cũ
            </button>
            <button 
                onClick={() => setActiveTab('mock')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'mock' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Timer size={16}/> Thi Thử
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <History size={16}/> Lịch Sử
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="animate-slide-in-bottom">
        {activeTab === 'strategies' && <StrategyTool profile={profile} />}
        {activeTab === 'gap_hunter' && <GapHunterView profile={profile} />}
        {activeTab === 'papers' && <PastPapersView />}
        {activeTab === 'mock' && <MockTestCenter profile={profile} onExamComplete={() => setActiveTab('history')} />}
        {activeTab === 'history' && <ExamHistoryView />}
      </div>
    </div>
  );
};

// --- Sub-component: Gap Hunter (Săn Lỗ Hổng) ---
const GapHunterView: React.FC<{ profile: StudentProfile }> = ({ profile }) => {
    const { theme } = useTheme();
    const [state, setState] = useState<'idle' | 'scanning' | 'results'>('idle');
    const [history, setHistory] = useState<ExamResult[]>([]);
    const [analysis, setAnalysis] = useState<{ diagnosis: string, remedialQuestions: QuizQuestion[] } | null>(null);
    const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('glassy_exam_history');
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) { console.error(e); }
        }
    }, []);

    const handleScan = async () => {
        if (history.length === 0) {
            alert("Bạn chưa làm bài thi thử nào để AI phân tích. Hãy vào mục 'Thi Thử' làm một bài trước nhé!");
            return;
        }
        setState('scanning');
        const result = await generateGapAnalysis(history, profile);
        setAnalysis(result);
        setState('results');
        setSubmitted(false);
        setUserAnswers({});
    };

    if (state === 'scanning') {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in text-center">
                <div className="relative mb-8">
                    <ScanSearch size={80} className="text-pink-500 animate-pulse" />
                    <div className="absolute inset-0 border-4 border-pink-500/30 rounded-full animate-ping"></div>
                </div>
                <h3 className={`text-2xl font-bold ${theme.text} mb-2`}>AI Đang Quét Lỗ Hổng...</h3>
                <p className="text-slate-500 max-w-md">
                    Hệ thống đang phân tích {history.length} bài thi gần nhất để tìm ra điểm yếu "chí mạng" của bạn.
                </p>
            </div>
        );
    }

    if (state === 'results' && analysis) {
        return (
            <div className="animate-slide-in-right space-y-8">
                {/* Diagnosis Card */}
                <TiltCard className={`p-8 rounded-[2.5rem] border relative overflow-hidden ${theme.isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white/70 border-white/50 shadow-lg'}`}>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-2xl shrink-0">
                            <Activity size={32} />
                        </div>
                        <div>
                            <h3 className={`text-xl font-bold ${theme.text} mb-2`}>Chẩn đoán của Bác sĩ AI 🩺</h3>
                            <div className={`prose ${theme.isDark ? 'prose-invert' : ''}`}>
                                <MathText content={analysis.diagnosis} />
                            </div>
                        </div>
                    </div>
                </TiltCard>

                {/* Remedial Quiz */}
                <div>
                    <h3 className={`text-xl font-bold ${theme.text} mb-4 flex items-center gap-2`}>
                        <Target className="text-green-500"/> Bài Tập "Thuốc Đặc Trị"
                    </h3>
                    <div className="space-y-6">
                        {analysis.remedialQuestions.map((q, idx) => {
                            const isCorrect = submitted && userAnswers[q.id] === q.correctAnswer;
                            return (
                                <div key={q.id} className={`p-6 rounded-2xl border transition-all ${submitted ? (isCorrect ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200') : (theme.isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm')}`}>
                                    <p className={`font-bold mb-4 ${theme.text}`}>
                                        <span className="text-slate-400 mr-2">Câu {idx + 1}:</span>
                                        <MathText content={q.question} />
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {q.options?.map((opt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => !submitted && setUserAnswers(prev => ({...prev, [q.id]: opt}))}
                                                disabled={submitted}
                                                className={`
                                                    p-4 rounded-xl text-left border flex items-center gap-2 transition-all
                                                    ${submitted
                                                        ? (opt === q.correctAnswer ? 'bg-green-100 border-green-500 text-green-800 font-bold' : userAnswers[q.id] === opt ? 'bg-red-100 border-red-500 text-red-800' : 'opacity-50')
                                                        : (userAnswers[q.id] === opt ? 'bg-blue-100 border-blue-500 text-blue-800 font-bold shadow-md' : theme.isDark ? 'bg-slate-900 border-slate-700 hover:bg-slate-800' : 'bg-white hover:bg-slate-50')
                                                    }
                                                `}
                                            >
                                                <span className="opacity-50 font-mono">{String.fromCharCode(65 + i)}.</span>
                                                <MathText content={opt} isInline />
                                            </button>
                                        ))}
                                    </div>
                                    {submitted && (
                                        <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-xl text-sm border border-blue-100 animate-slide-in-bottom">
                                            <strong>Giải thích:</strong> <MathText content={q.explanation} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    
                    {!submitted && (
                        <div className="mt-8 text-center">
                            <button 
                                onClick={() => setSubmitted(true)}
                                className="btn-hover px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-bold shadow-lg"
                            >
                                Kiểm Tra Kết Quả
                            </button>
                        </div>
                    )}
                    
                    {submitted && (
                        <div className="mt-8 text-center">
                            <button 
                                onClick={() => setState('idle')}
                                className="btn-hover px-8 py-3 bg-slate-200 text-slate-700 rounded-full font-bold shadow-sm"
                            >
                                Hoàn Thành & Quay Lại
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // IDLE STATE
    return (
        <TiltCard className={`p-10 rounded-[2.5rem] border text-center ${theme.isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white/60 border-white/40 shadow-lg'}`}>
            <div className="mb-6 inline-flex p-6 bg-red-100 rounded-full text-red-500 shadow-inner">
                <Brain size={48} />
            </div>
            <h2 className={`text-3xl font-bold mb-4 ${theme.text}`}>AI Săn Lỗ Hổng Kiến Thức</h2>
            <p className="text-slate-500 max-w-xl mx-auto mb-8 leading-relaxed">
                Thay vì làm đề tràn lan, hãy để AI phân tích lịch sử {history.length} bài thi của bạn để tìm ra chính xác những mảng kiến thức bạn đang yếu và tạo bài tập khắc phục ngay lập tức.
            </p>
            
            <div className="flex justify-center">
                <button 
                    onClick={handleScan}
                    className="btn-hover px-10 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-xl flex items-center gap-3"
                >
                    <ScanSearch size={24} /> BẮT ĐẦU QUÉT
                </button>
            </div>
            
            <p className="mt-4 text-xs text-slate-400">
                *Cần ít nhất 1 bài thi thử trong lịch sử để AI có dữ liệu phân tích.
            </p>
        </TiltCard>
    );
};

// --- Sub-component: Past Papers ---
const PastPapersView: React.FC = () => {
    const { theme } = useTheme();
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

    // Mock Data for past papers
    const papers = {
        [Subject.MATH]: [
            { year: 2024, name: "Đề thi chính thức 2024 - Mã 101", views: 1500 },
            { year: 2024, name: "Đề thi thử Lần 1 - Chuyên KHTN", views: 890 },
            { year: 2023, name: "Đề thi chính thức 2023 - Mã 102", views: 2100 },
        ],
        [Subject.LITERATURE]: [
            { year: 2024, name: "Đề thi chính thức 2024", views: 1200 },
            { year: 2023, name: "Đề minh họa Bộ GD&ĐT", views: 3000 },
        ],
        [Subject.ENGLISH]: [
            { year: 2024, name: "Đề thi chính thức 2024 - Mã 401", views: 1100 },
        ],
        [Subject.INFORMATICS]: [
            { year: 2024, name: "Đề ôn tập Python cơ bản", views: 500 },
        ]
    };

    if (selectedSubject) {
        return (
            <div className="space-y-6 animate-fade-in-right">
                <button 
                    onClick={() => setSelectedSubject(null)}
                    className="flex items-center text-slate-500 hover:text-slate-800 font-medium transition-transform hover:-translate-x-1"
                >
                    <ChevronRight className="rotate-180 mr-1" size={20}/> Quay lại thư viện
                </button>

                <h3 className={`text-2xl font-bold ${theme.text}`}>Kho đề thi: {selectedSubject}</h3>

                <div className="grid gap-4">
                    {(papers[selectedSubject] || []).map((paper, idx) => (
                        <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border transition-all hover:scale-[1.01] ${theme.isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white/60 border-slate-200 shadow-sm'}`}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-red-100 text-red-500 flex items-center justify-center">
                                    <FileText size={24}/>
                                </div>
                                <div>
                                    <h4 className={`font-bold ${theme.isDark ? 'text-slate-200' : 'text-slate-700'}`}>{paper.name}</h4>
                                    <p className="text-xs text-slate-500">Năm: {paper.year} • {paper.views} lượt tải</p>
                                </div>
                            </div>
                            <button className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-colors">
                                <Download size={20} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[Subject.MATH, Subject.LITERATURE, Subject.ENGLISH, Subject.INFORMATICS].map((sub) => (
                <div 
                    key={sub}
                    onClick={() => setSelectedSubject(sub)}
                    className={`card-hover p-6 rounded-[2rem] border cursor-pointer flex flex-col items-center justify-center text-center gap-4 ${theme.isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white/60 border-slate-200 shadow-sm'}`}
                >
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-inner ${theme.isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                        <Folder className="text-yellow-500" size={40} fill="currentColor" fillOpacity={0.2} />
                    </div>
                    <div>
                        <h4 className={`text-lg font-bold ${theme.isDark ? 'text-slate-200' : 'text-slate-700'}`}>{sub}</h4>
                        <p className="text-sm text-slate-400">{(papers[sub as Subject] || []).length} đề thi</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- Sub-component: Exam History ---
const ExamHistoryView: React.FC = () => {
    const { theme } = useTheme();
    const [history, setHistory] = useState<ExamResult[]>([]);
    const [viewingResult, setViewingResult] = useState<ExamResult | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('glassy_exam_history');
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {
                console.error("Error loading history", e);
            }
        }
    }, []);

    const clearHistory = () => {
        if(confirm("Bạn có chắc muốn xóa toàn bộ lịch sử thi?")) {
            localStorage.removeItem('glassy_exam_history');
            setHistory([]);
        }
    }

    if (viewingResult) {
        return (
            <div className="animate-slide-in-right">
                <button onClick={() => setViewingResult(null)} className="flex items-center text-slate-500 hover:text-slate-800 mb-6 font-bold">
                    <ChevronRight className="rotate-180 mr-1" size={20}/> Quay lại danh sách
                </button>
                
                <div className={`backdrop-blur-xl border rounded-[2.5rem] p-8 shadow-sm ${theme.isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white/60 border-white/40'}`}>
                    <div className="flex items-center justify-between mb-6 border-b border-slate-200/50 pb-6">
                        <div>
                            <h3 className={`text-2xl font-bold ${theme.text}`}>Chi tiết bài thi: {viewingResult.subject}</h3>
                            <p className="text-slate-500">{viewingResult.date}</p>
                        </div>
                        <div className="text-right">
                            <span className="block text-4xl font-black text-pink-500">{viewingResult.score}/{viewingResult.total}</span>
                            <span className="text-sm font-bold text-slate-400">Điểm số</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {viewingResult.questions.map((q, idx) => {
                            const userAnswer = viewingResult.userAnswers[q.id];
                            const isCorrect = userAnswer === q.correctAnswer;
                            return (
                                <div key={q.id} className={`p-4 rounded-2xl border ${isCorrect ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'}`}>
                                    <div className="font-bold mb-2 flex flex-wrap gap-2">
                                        <span className={`mr-2 ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>Câu {idx + 1}:</span> 
                                        <div className={theme.text}><MathText content={q.question} className="inline" /></div>
                                    </div>
                                    <div className="text-sm grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <div className={`${isCorrect ? 'text-green-700' : 'text-red-600'} flex gap-1`}>
                                            <span>Bạn chọn:</span> 
                                            <strong><MathText content={userAnswer || "Không trả lời"} isInline /></strong>
                                        </div>
                                        {!isCorrect && (
                                            <div className="text-green-700 flex gap-1">
                                                <span>Đáp án đúng:</span>
                                                <strong><MathText content={q.correctAnswer} isInline /></strong>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-2 text-xs text-slate-500 bg-white/50 p-2 rounded-lg italic">
                                        <MathText content={q.explanation} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <h3 className={`text-2xl font-bold ${theme.text}`}>Lịch Sử Thi Thử</h3>
                {history.length > 0 && (
                    <button onClick={clearHistory} className="text-red-400 hover:text-red-600 text-sm font-bold flex items-center gap-1">
                        <XCircle size={14}/> Xóa lịch sử
                    </button>
                )}
            </div>

            {history.length === 0 ? (
                <div className={`text-center py-20 text-slate-400 rounded-[2rem] border border-dashed ${theme.isDark ? 'bg-slate-900/40 border-slate-700' : 'bg-white/40 border-slate-200'}`}>
                    <History size={48} className="mx-auto mb-4 opacity-50"/>
                    <p>Bạn chưa làm bài thi thử nào.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {history.map((item) => (
                        <div key={item.id} className={`flex flex-col md:flex-row items-center justify-between p-6 rounded-2xl border card-hover ${theme.isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white/60 border-white/40 shadow-sm'}`}>
                            <div className="flex items-center gap-4 w-full md:w-auto mb-4 md:mb-0">
                                <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold text-white shadow-md ${item.score / item.total >= 0.8 ? 'bg-green-500' : item.score / item.total >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                                    <span className="text-xl leading-none">{item.score}</span>
                                    <span className="text-[10px] opacity-80">/{item.total}</span>
                                </div>
                                <div>
                                    <h4 className={`font-bold text-lg ${theme.text}`}>{item.subject}</h4>
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span className="flex items-center gap-1"><Clock size={12}/> {item.date}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setViewingResult(item)}
                                className={`w-full md:w-auto px-6 py-2 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${theme.isDark ? 'bg-slate-800 text-white hover:bg-pink-600' : 'bg-slate-100 text-slate-600 hover:bg-pink-100 hover:text-pink-600'}`}
                            >
                                Xem chi tiết
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Sub-component: Mock Test Center ---
const MockTestCenter: React.FC<{ profile: StudentProfile, onExamComplete?: () => void }> = ({ profile, onExamComplete }) => {
    const { theme } = useTheme();
    
    // States
    const [status, setStatus] = useState<'setup' | 'generating' | 'testing' | 'result'>('setup');
    const [timeLeft, setTimeLeft] = useState(0); // seconds
    const [selectedSubject, setSelectedSubject] = useState<Subject>(Subject.MATH);
    const [duration, setDuration] = useState(45); // minutes
    
    // File Upload Data
    const [fileData, setFileData] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');

    // Quiz Data
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
    const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
    const [score, setScore] = useState(0);

    useEffect(() => {
        let timer: number;
        if (status === 'testing' && timeLeft > 0) {
            timer = window.setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handleSubmitExam();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [status, timeLeft]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 20 * 1024 * 1024) {
                alert("File lớn quá (Max 20MB cho AI). Vui lòng chọn file nhỏ hơn.");
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

    const handleStartGeneration = async () => {
        setStatus('generating');
        
        const prompt = fileData 
            ? "Tạo đề thi thử sát với tài liệu này" 
            : `Tạo đề thi thử tổng hợp môn ${selectedSubject} chuẩn cấu trúc THPTQG.`;
        
        // Generate Quiz using existing service
        const questions = await generateComprehensiveQuiz(
            prompt,
            fileData,
            ['multiple-choice'], // Exam usually MC
            selectedSubject,
            profile
        );

        if (questions && questions.length > 0) {
            setQuizQuestions(questions);
            setUserAnswers({});
            setTimeLeft(duration * 60);
            setStatus('testing');
        } else {
            alert("Không thể tạo đề thi. Vui lòng thử lại!");
            setStatus('setup');
        }
    };

    const saveResult = (finalScore: number) => {
        const result: ExamResult = {
            id: Date.now().toString(),
            date: new Date().toLocaleString(),
            subject: selectedSubject,
            score: finalScore,
            total: quizQuestions.length,
            duration: duration,
            questions: quizQuestions,
            userAnswers: userAnswers
        };

        const savedHistory = localStorage.getItem('glassy_exam_history');
        const history: ExamResult[] = savedHistory ? JSON.parse(savedHistory) : [];
        const newHistory = [result, ...history];
        localStorage.setItem('glassy_exam_history', JSON.stringify(newHistory));
    };

    const handleSubmitExam = () => {
        let correctCount = 0;
        quizQuestions.forEach(q => {
            if (userAnswers[q.id] === q.correctAnswer) correctCount++;
        });
        setScore(correctCount);
        saveResult(correctCount);
        setStatus('result');
    };

    const resetExam = () => {
        setStatus('setup');
        setFileData(null);
        setFileName('');
        setUserAnswers({});
    };

    // --- VIEW: GENERATING ---
    if (status === 'generating') {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                <Loader2 size={64} className="text-pink-500 animate-spin mb-6" />
                <h3 className={`text-2xl font-bold ${theme.text} mb-2`}>AI Đang Soạn Đề Thi...</h3>
                <p className="text-slate-500 text-center max-w-md">
                    {fileData ? "Hệ thống đang phân tích tài liệu của bạn." : "Hệ thống đang tổng hợp câu hỏi từ ngân hàng đề thi chuẩn."}
                </p>
            </div>
        );
    }

    // --- VIEW: TESTING (FULL SCREEN OVERLAY VIA PORTAL) ---
    if (status === 'testing') {
        return createPortal(
            <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col text-white p-4 overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 px-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-red-500/10 text-red-500 px-4 py-1 rounded-full border border-red-500/50 text-sm font-bold flex items-center gap-2 animate-pulse">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div> LIVE EXAM
                        </div>
                        <span className="text-slate-400 text-sm hidden md:inline">Môn: {selectedSubject}</span>
                    </div>
                    <div className="text-4xl font-black font-mono tracking-widest text-white">
                        {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => { if(confirm('Thoát sẽ không lưu kết quả?')) setStatus('setup'); }}
                            className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl font-bold hover:bg-slate-700 transition-colors"
                        >
                            Thoát
                        </button>
                        <button 
                            onClick={handleSubmitExam}
                            className="px-6 py-2 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                        >
                            Nộp Bài
                        </button>
                    </div>
                </div>

                {/* Question Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar max-w-4xl mx-auto w-full pb-20">
                    <div className="space-y-8">
                        {quizQuestions.map((q, idx) => (
                            <div key={q.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                                <div className="text-lg font-bold text-slate-200 mb-4 flex gap-2">
                                    <span className="text-slate-500 whitespace-nowrap">Câu {idx + 1}:</span>
                                    <MathText content={q.question} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {q.options?.map((opt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setUserAnswers(prev => ({...prev, [q.id]: opt}))}
                                            className={`
                                                p-4 rounded-xl text-left transition-all border flex gap-2
                                                ${userAnswers[q.id] === opt 
                                                    ? 'bg-blue-600 border-blue-500 text-white font-bold shadow-lg transform scale-[1.01]' 
                                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}
                                            `}
                                        >
                                            <span className="opacity-50 font-mono">{String.fromCharCode(65 + i)}.</span> 
                                            <MathText content={opt} isInline />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    // --- VIEW: RESULT ---
    if (status === 'result') {
        return (
            <div className="max-w-4xl mx-auto py-10 animate-slide-in-bottom">
                <div className="text-center mb-10">
                    <Trophy size={64} className="mx-auto text-yellow-500 mb-4 animate-bounce-slow" />
                    <h2 className={`text-3xl font-bold ${theme.text} mb-2`}>Kết Quả Bài Thi</h2>
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-4">
                        {score} / {quizQuestions.length}
                    </div>
                    <div className="flex items-center justify-center gap-4">
                        <button onClick={resetExam} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors border px-4 py-2 rounded-xl hover:bg-white">
                            <RotateCcw size={18}/> Thi bài khác
                        </button>
                        <button onClick={onExamComplete} className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold px-6 py-2 rounded-xl shadow-md hover:scale-105 transition-transform">
                            <History size={18}/> Xem lịch sử
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {quizQuestions.map((q, idx) => {
                        const isCorrect = userAnswers[q.id] === q.correctAnswer;
                        return (
                            <div key={q.id} className={`p-6 rounded-2xl border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex gap-3 mb-2">
                                    {isCorrect ? <CheckCircle className="text-green-600 shrink-0" /> : <XCircle className="text-red-600 shrink-0" />}
                                    <div className="font-bold text-slate-800 flex gap-2">
                                        <span>Câu {idx + 1}:</span>
                                        <MathText content={q.question} />
                                    </div>
                                </div>
                                <div className="pl-9 text-sm">
                                    <div className="text-slate-600 mb-1 flex gap-2">
                                        <span>Bạn chọn:</span> 
                                        <span className="font-bold"><MathText content={userAnswers[q.id] || "Không trả lời"} isInline /></span>
                                    </div>
                                    <div className="text-green-700 font-bold mb-2 flex gap-2">
                                        <span>Đáp án đúng:</span>
                                        <MathText content={q.correctAnswer} isInline />
                                    </div>
                                    <div className="bg-white/50 p-3 rounded-lg text-slate-700 border border-slate-200/50">
                                        <strong>Giải thích:</strong> 
                                        <MathText content={q.explanation} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // --- VIEW: SETUP ---
    return (
        <TiltCard className={`p-8 rounded-[2.5rem] border relative overflow-hidden ${theme.isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white/60 border-white/40 shadow-lg'}`}>
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <Shield size={120} />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                        <Trophy size={24} />
                    </div>
                    <div>
                        <h3 className={`text-2xl font-bold ${theme.text}`}>Phòng Thi Ảo</h3>
                        <p className="text-slate-500">Tải đề thi hoặc để AI tự động ra đề thi thử chuẩn cấu trúc.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Upload Section */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-700 flex items-center gap-2"><UploadCloud size={18}/> 1. Tải đề thi (Tùy chọn)</h4>
                        
                        <label className={`
                            flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-all group
                            ${fileData ? 'border-green-400 bg-green-50' : theme.isDark ? 'border-slate-700 bg-slate-800/50 hover:bg-slate-800' : 'border-slate-300 bg-white/50 hover:bg-white/80'}
                        `}>
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                {fileData ? (
                                    <>
                                        <CheckCircle className="w-10 h-10 mb-2 text-green-500" />
                                        <p className="text-sm font-bold text-green-600 line-clamp-1">{fileName}</p>
                                        <p className="text-xs text-green-500">Đã sẵn sàng!</p>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud className="w-10 h-10 mb-2 text-slate-400 group-hover:text-orange-500 transition-colors" />
                                        <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Upload file</span> hoặc bỏ qua</p>
                                        <p className="text-xs text-slate-400">Nếu không tải, AI sẽ tự ra đề</p>
                                    </>
                                )}
                            </div>
                            <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                        </label>
                    </div>

                    {/* Config Section */}
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-3"><FileText size={18}/> 2. Môn thi</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {[Subject.MATH, Subject.LITERATURE, Subject.ENGLISH, Subject.INFORMATICS].map(sub => (
                                    <button 
                                        key={sub} 
                                        onClick={() => setSelectedSubject(sub)}
                                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${selectedSubject === sub ? 'bg-orange-100 text-orange-700 border-orange-300 ring-2 ring-orange-200' : theme.isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        {sub}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-3"><Clock size={18}/> 3. Thời gian</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {[15, 45, 90].map(min => (
                                    <button 
                                        key={min}
                                        onClick={() => setDuration(min)}
                                        className={`p-3 rounded-xl border text-sm font-bold transition-all ${duration === min ? 'bg-blue-100 text-blue-700 border-blue-300 ring-2 ring-blue-200' : theme.isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        {min} phút
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-center">
                    <button 
                        onClick={handleStartGeneration}
                        className={`
                            px-8 py-4 rounded-full font-bold text-white text-lg shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2
                            bg-gradient-to-r from-orange-500 to-red-600
                        `}
                    >
                        <PlayCircle size={24} /> BẮT ĐẦU LÀM BÀI
                    </button>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-yellow-800 text-sm flex items-start gap-3">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <p>
                        <strong>Lưu ý:</strong> Khi bắt đầu, giao diện sẽ chuyển sang chế độ toàn màn hình. 
                        Đồng hồ đếm ngược sẽ chạy và bạn không thể sử dụng các công cụ khác.
                    </p>
                </div>
            </div>
        </TiltCard>
    );
};