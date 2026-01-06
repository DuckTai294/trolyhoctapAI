
import React, { useState, useEffect } from 'react';
import { Subject, QuizQuestion, SavedLesson, StudentProfile } from '../types';
import { generateQuiz, generateTheory } from '../services/geminiService';
import { BookOpen, HelpCircle, Save, ArrowLeft, CheckCircle, XCircle, Loader2, ChevronDown, ChevronRight, PlayCircle, FileText, Check, Trash2, Bookmark, Sparkles, Search } from 'lucide-react';
import { MathText } from './MathText';
import { useTheme } from './ThemeContext';

interface SubjectModuleProps {
  subject: Subject;
  profile: StudentProfile; 
  onBack: () => void;
  onSaveLesson: (lesson: SavedLesson) => void;
  savedLessons?: SavedLesson[]; // Pass saved lessons to display list
  onDeleteLesson?: (id: string) => void; // Optional delete handler
}

type Mode = 'menu' | 'theory' | 'quiz';

// --- ADMIN CONTENT DATA (GIẢ LẬP SERVER) ---
// Cấu trúc dữ liệu chứa nội dung bài giảng tĩnh do Admin đăng tải
const SYLLABUS_DATA: Record<string, { title: string, lessons: { title: string, content: string }[] }[]> = {
  [Subject.MATH]: [
    {
      title: "Chương 1: Ứng dụng đạo hàm để khảo sát hàm số",
      lessons: [
        {
            title: "Tính đơn điệu của hàm số",
            content: `
# 1. Định nghĩa
Cho hàm số $y=f(x)$ xác định trên $K$ ($K$ có thể là một khoảng, một đoạn hoặc một nửa khoảng).

*   Hàm số $y=f(x)$ đồng biến (tăng) trên $K$ nếu $\\forall x_1, x_2 \\in K, x_1 < x_2 \\Rightarrow f(x_1) < f(x_2)$.
*   Hàm số $y=f(x)$ nghịch biến (giảm) trên $K$ nếu $\\forall x_1, x_2 \\in K, x_1 < x_2 \\Rightarrow f(x_1) > f(x_2)$.

# 2. Điều kiện cần và đủ
Cho hàm số $y=f(x)$ có đạo hàm trên khoảng $K$.

*   Nếu $f'(x) > 0, \\forall x \\in K$ thì hàm số đồng biến trên $K$.
*   Nếu $f'(x) < 0, \\forall x \\in K$ thì hàm số nghịch biến trên $K$.
*   Nếu $f'(x) = 0, \\forall x \\in K$ thì hàm số không đổi trên $K$.

**Chú ý:** Giả sử $f(x)$ liên tục trên $K$ và có đạo hàm trên $K$. Nếu $f'(x) \\ge 0$ (hoặc $f'(x) \\le 0$) $\\forall x \\in K$ và đẳng thức chỉ xảy ra tại hữu hạn điểm thì hàm số đồng biến (hoặc nghịch biến) trên $K$.
            `
        },
        {
            title: "Cực trị của hàm số", 
            content: `
# 1. Khái niệm cực đại, cực tiểu
Cho hàm số $y=f(x)$ xác định và liên tục trên khoảng $(a;b)$ và điểm $x_0 \\in (a;b)$.

*   Nếu tồn tại số $h > 0$ sao cho $f(x) < f(x_0)$ với mọi $x \\in (x_0-h; x_0+h) \\setminus \\{x_0\\}$ thì ta nói hàm số $f(x)$ đạt **cực đại** tại $x_0$.
*   Nếu tồn tại số $h > 0$ sao cho $f(x) > f(x_0)$ với mọi $x \\in (x_0-h; x_0+h) \\setminus \\{x_0\\}$ thì ta nói hàm số $f(x)$ đạt **cực tiểu** tại $x_0$.

# 2. Điều kiện đủ để hàm số có cực trị
**Định lý 1 (Dấu hiệu 1):**
Giả sử hàm số $f$ liên tục trên khoảng $(a;b)$ chứa điểm $x_0$ và có đạo hàm trên các khoảng $(a; x_0)$ và $(x_0; b)$. Khi đó:
*   Nếu $f'(x)$ đổi dấu từ dương sang âm khi $x$ qua $x_0$ thì $x_0$ là điểm cực đại.
*   Nếu $f'(x)$ đổi dấu từ âm sang dương khi $x$ qua $x_0$ thì $x_0$ là điểm cực tiểu.

**Định lý 2 (Dấu hiệu 2):**
Giả sử hàm số $f$ có đạo hàm cấp hai trên khoảng $(a;b)$ chứa $x_0$.
*   Nếu $f'(x_0) = 0$ và $f''(x_0) < 0$ thì $x_0$ là điểm cực đại.
*   Nếu $f'(x_0) = 0$ và $f''(x_0) > 0$ thì $x_0$ là điểm cực tiểu.
            `
        },
        { title: "Giá trị lớn nhất và giá trị nhỏ nhất của hàm số", content: "Nội dung bài giảng đang được Admin cập nhật..." },
        { title: "Đường tiệm cận", content: "Nội dung bài giảng đang được Admin cập nhật..." },
        { title: "Khảo sát sự biến thiên và vẽ đồ thị hàm số", content: "Nội dung bài giảng đang được Admin cập nhật..." }
      ]
    },
    {
      title: "Chương 2: Hàm số lũy thừa, Hàm số mũ và Logarit",
      lessons: [
        { title: "Lũy thừa", content: "Nội dung bài giảng đang được Admin cập nhật..." },
        { title: "Hàm số mũ và hàm số logarit", content: "Nội dung bài giảng đang được Admin cập nhật..." },
        { title: "Phương trình mũ và phương trình logarit", content: "Nội dung bài giảng đang được Admin cập nhật..." }
      ]
    },
    {
        title: "Hình học: Khối đa diện",
        lessons: [
            { 
                title: "Khái niệm về khối đa diện", 
                content: `
# 1. Khối lăng trụ và khối chóp
*   **Khối lăng trụ** là phần không gian được giới hạn bởi một hình lăng trụ kể cả hình lăng trụ ấy.
*   **Khối chóp** là phần không gian được giới hạn bởi một hình chóp kể cả hình chóp ấy.

# 2. Khái niệm về hình đa diện và khối đa diện
**Hình đa diện** (gọi tắt là đa diện) là hình được tạo bởi một số hữu hạn các đa giác phẳng thỏa mãn hai tính chất:
1.  Hai đa giác bất kì hoặc không có điểm chung, hoặc có đúng một đỉnh chung, hoặc có đúng một cạnh chung.
2.  Mỗi cạnh của đa giác nào cũng là cạnh chung của đúng hai đa giác.

**Khối đa diện** là phần không gian được giới hạn bởi một hình đa diện, kể cả hình đa diện đó.
                `
            },
            { title: "Thể tích khối đa diện", content: "Công thức tính thể tích: $V = \\frac{1}{3}Bh$ (Khối chóp) và $V = Bh$ (Khối lăng trụ)." }
        ]
    }
  ],
  [Subject.LITERATURE]: [
    {
      title: "Văn học hiện đại Việt Nam (Thơ)",
      lessons: [
        { 
            title: "Tây Tiến (Quang Dũng)", 
            content: `
# I. Tác giả Quang Dũng
*   Là nghệ sĩ đa tài: làm thơ, viết văn, vẽ tranh, soạn nhạc.
*   Phong cách thơ: Hồn nhiên, phóng khoáng, đậm chất lãng mạn và tài hoa.

# II. Tác phẩm Tây Tiến
**1. Hoàn cảnh sáng tác:**
*   Cuối năm 1948, tại Phù Lưu Chanh, khi Quang Dũng đã chuyển sang đơn vị khác và nhớ về đơn vị cũ.
*   Ban đầu có tên là "Nhớ Tây Tiến", sau đổi thành "Tây Tiến".

**2. Nội dung chính:**
*   Vẻ đẹp thiên nhiên Tây Bắc: Vừa hùng vĩ, dữ dội, vừa thơ mộng, trữ tình.
*   Hình tượng người lính Tây Tiến: Hào hoa, lãng mạn nhưng cũng đầy bi tráng, dũng cảm hi sinh vì tổ quốc.

> "Sông Mã xa rồi Tây Tiến ơi!
> Nhớ về rừng núi nhớ chơi vơi..."
            `
        },
        { title: "Việt Bắc (Tố Hữu)", content: "Nội dung bài giảng đang được Admin cập nhật..." },
        { title: "Đất Nước (Nguyễn Khoa Điềm)", content: "Nội dung bài giảng đang được Admin cập nhật..." }
      ]
    },
    {
      title: "Văn học hiện đại Việt Nam (Văn xuôi)",
      lessons: [
        { title: "Người lái đò Sông Đà (Nguyễn Tuân)", content: "Nội dung bài giảng đang được Admin cập nhật..." },
        { title: "Vợ chồng A Phủ (Tô Hoài)", content: "Nội dung bài giảng đang được Admin cập nhật..." }
      ]
    },
  ],
  [Subject.ENGLISH]: [
    {
      title: "Unit 1: Life Stories",
      lessons: [
          { 
              title: "Vocabulary & Grammar", 
              content: `
# 1. Vocabulary: Life Achievements
*   **Achievement** (n): Thành tựu
*   **Dedicate** (v): Cống hiến -> Dedicated to (adj)
*   **Distinguished** (adj): Ưu tú, xuất sắc
*   **Respectable** (adj): Đáng kính

# 2. Grammar: Past Simple vs. Past Continuous
**Past Simple (Quá khứ đơn):**
*   Dùng để diễn tả hành động đã kết thúc trong quá khứ.
*   VD: He **wrote** this book in 1990.

**Past Continuous (Quá khứ tiếp diễn):**
*   Diễn tả hành động đang xảy ra tại một thời điểm cụ thể trong quá khứ.
*   VD: At 8 PM yesterday, I **was watching** TV.

**Kết hợp:**
*   Một hành động đang xảy ra (Past Cont) thì hành động khác xen vào (Past Simple).
*   VD: When I **was walking** down the street, I **saw** him.
              ` 
          }
      ]
    }
  ],
  [Subject.INFORMATICS]: [
    {
      title: "Chương 1: Cơ sở dữ liệu quan hệ",
      lessons: [
        {
            title: "Khái niệm CSDL và Hệ QTCSDL",
            content: `
# 1. Cơ sở dữ liệu (Database)
Là tập hợp các dữ liệu có cấu trúc, liên quan với nhau, được lưu trữ trên các thiết bị nhớ để phục vụ nhu cầu khai thác thông tin của nhiều người dùng.

# 2. Hệ quản trị CSDL (DBMS)
Là phần mềm cung cấp môi trường thuận lợi và hiệu quả để tạo lập, lưu trữ và khai thác thông tin của CSDL.
Ví dụ: Microsoft Access, MySQL, SQL Server...
            `
        }
      ]
    }
  ]
};

export const SubjectModule: React.FC<SubjectModuleProps> = ({ 
    subject, profile, onBack, onSaveLesson, savedLessons = [], onDeleteLesson 
}) => {
  const { theme } = useTheme();
  const [mode, setMode] = useState<Mode>('menu');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("AI đang xử lý...");
  const [content, setContent] = useState('');
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: string }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [viewSavedId, setViewSavedId] = useState<string | null>(null);
  
  // Custom Topic State
  const [customTopic, setCustomTopic] = useState("");
  
  // Accordion State
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Default expand first chapter
    const syllabus = SYLLABUS_DATA[subject];
    if (syllabus && syllabus.length > 0) {
        setExpandedChapters({ [syllabus[0].title]: true });
    }
  }, [subject]);

  const toggleChapter = (title: string) => {
    setExpandedChapters(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const handleSelectLesson = (lessonTitle: string, lessonContent: string) => {
      setTopic(lessonTitle);
      setContent(lessonContent);
      setMode('theory');
      setViewSavedId(null);
      // Auto scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSavedLesson = (lesson: SavedLesson) => {
      setTopic(lesson.topic);
      setContent(lesson.content);
      setMode('theory');
      setViewSavedId(lesson.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerateCustomTheory = async () => {
    if (!customTopic.trim()) return;
    setLoading(true);
    setLoadingText("AI đang soạn bài giảng chi tiết...");
    
    // Set UI to theory mode immediately
    setTopic(customTopic);
    setMode('theory');
    setViewSavedId(null);
    setContent(''); // Clear content while loading

    try {
        const generatedContent = await generateTheory(subject, customTopic, profile);
        setContent(generatedContent);
    } catch (e) {
        alert("Có lỗi xảy ra khi tạo bài giảng. Vui lòng thử lại!");
        setMode('menu');
    } finally {
        setLoading(false);
        setCustomTopic("");
    }
  };

  const handleStartQuiz = async () => {
    if (!topic) return;
    setLoading(true);
    setLoadingText("AI đang soạn câu hỏi trắc nghiệm...");
    setMode('quiz');
    setQuizAnswers({});
    setQuizSubmitted(false);
    
    // AI creates quiz based on the static topic content or title
    const result = await generateQuiz(subject, topic, profile);
    setQuiz(result);
    setLoading(false);
  };

  const handleSave = () => {
    // Check if already saved
    const isAlreadySaved = savedLessons.some(l => l.topic === topic && l.subject === subject);
    if (isAlreadySaved) {
        alert("Bài học này đã có trong thư viện rồi! 😉");
        return;
    }

    onSaveLesson({
      id: Date.now().toString(),
      subject,
      topic,
      content, // Saves the current static content
      date: new Date().toLocaleDateString()
    });
    alert("Đã lưu bài học vào thư viện! 📚");
  };

  const calculateScore = () => {
    let score = 0;
    quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctAnswer) score++;
    });
    return score;
  };

  // Lọc danh sách bài đã lưu của môn hiện tại
  const currentSubjectSavedLessons = savedLessons.filter(l => l.subject === subject);

  if (mode === 'menu') {
    const syllabus = SYLLABUS_DATA[subject] || [];

    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up pt-4 md:pt-10 pb-20">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-800 mb-4 transition-all hover:-translate-x-1 font-bold">
          <ArrowLeft className="mr-2" size={20} /> Quay lại Tổng quan
        </button>
        
        <div className="text-center space-y-2">
          <h2 className={`text-4xl font-black ${theme.text}`}>Môn {subject}</h2>
          <p className="text-slate-500">Chọn bài học từ giáo trình bên dưới để bắt đầu.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column: Syllabus */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* AI Custom Topic Generator */}
                <div className={`p-6 rounded-2xl border relative overflow-hidden group ${theme.isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white/60 border-white/40 shadow-sm'}`}>
                    <div className="absolute top-0 right-0 p-6 opacity-10 text-pink-500 pointer-events-none group-hover:scale-110 transition-transform">
                        <Sparkles size={80} />
                    </div>
                    <h3 className={`font-bold text-lg mb-2 flex items-center gap-2 ${theme.text}`}>
                        <Sparkles size={20} className="text-pink-500"/> Học chủ đề bất kỳ với AI
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">Nhập bất kỳ chủ đề nào bạn muốn (VD: "Phương trình logarit", "Vợ chồng A Phủ"...), AI sẽ soạn bài giảng chi tiết ngay lập tức.</p>
                    
                    <div className="flex gap-2 relative z-10">
                        <input 
                            value={customTopic}
                            onChange={(e) => setCustomTopic(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerateCustomTheory()}
                            placeholder={`Nhập chủ đề ${subject} cần học...`}
                            className={`flex-1 p-3 pl-4 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-pink-200 ${theme.isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'}`}
                        />
                        <button 
                            onClick={handleGenerateCustomTheory}
                            disabled={!customTopic.trim()}
                            className="btn-hover px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Search size={18} /> <span className="hidden sm:inline">Học Ngay</span>
                        </button>
                    </div>
                </div>

                <div className={`p-4 rounded-2xl border flex items-center gap-2 font-bold ${theme.isDark ? 'bg-slate-800/50 border-slate-700 text-orange-400' : 'bg-orange-50 border-orange-100 text-orange-600'}`}>
                    <FileText size={20} /> Chương trình học (Admin Upload)
                </div>
                
                {syllabus.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 italic">Chưa có dữ liệu chương trình cho môn này.</div>
                ) : (
                    <div className="space-y-3">
                        {syllabus.map((chapter, idx) => (
                            <div key={idx} className={`rounded-2xl border overflow-hidden transition-all duration-300 ${theme.isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white/60 border-slate-100 shadow-sm'}`}>
                                <button 
                                    onClick={() => toggleChapter(chapter.title)}
                                    className={`w-full p-4 flex items-center justify-between font-bold text-left transition-colors ${expandedChapters[chapter.title] ? (theme.isDark ? 'bg-slate-800 text-pink-400' : 'bg-pink-50 text-pink-600') : (theme.isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50')}`}
                                >
                                    <span className="flex-1 mr-2">{chapter.title}</span>
                                    {expandedChapters[chapter.title] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </button>
                                
                                {expandedChapters[chapter.title] && (
                                    <div className={`border-t ${theme.isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-100 bg-white/40'}`}>
                                        {chapter.lessons.map((lesson, lIdx) => (
                                            <button
                                                key={lIdx}
                                                onClick={() => handleSelectLesson(lesson.title, lesson.content)}
                                                className={`w-full p-3 pl-6 text-left text-sm flex items-center gap-3 transition-colors border-b last:border-0 ${theme.isDark ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-slate-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-slate-50'}`}
                                            >
                                                <PlayCircle size={14} className="text-blue-500 opacity-70" />
                                                {lesson.title}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Right Column: Saved Lessons */}
            <div className="lg:col-span-1 space-y-4">
                 <div className={`p-4 rounded-2xl border flex items-center gap-2 font-bold ${theme.isDark ? 'bg-slate-800/50 border-slate-700 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                    <Bookmark size={20} /> Thư viện đã lưu
                </div>
                
                {currentSubjectSavedLessons.length === 0 ? (
                    <div className={`p-8 rounded-2xl border border-dashed text-center text-sm ${theme.isDark ? 'border-slate-700 text-slate-500' : 'border-slate-300 text-slate-400'}`}>
                        Bạn chưa lưu bài giảng nào của môn {subject}.
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                        {currentSubjectSavedLessons.map(lesson => (
                            <div key={lesson.id} className={`group p-3 rounded-2xl border transition-all hover:scale-[1.02] cursor-pointer relative ${theme.isDark ? 'bg-slate-900/60 border-slate-700 hover:bg-slate-800' : 'bg-white/60 border-slate-100 hover:shadow-md'}`} onClick={() => handleOpenSavedLesson(lesson)}>
                                <h4 className={`font-bold text-sm mb-1 pr-6 ${theme.text}`}>{lesson.topic}</h4>
                                <span className="text-[10px] text-slate-500 bg-black/5 px-2 py-0.5 rounded-full">{lesson.date}</span>
                                
                                {onDeleteLesson && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDeleteLesson(lesson.id); }}
                                        className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                        title="Xóa bài lưu"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => setMode('menu')} className="flex items-center text-slate-600 hover:text-slate-900 bg-white/50 px-4 py-2 rounded-full backdrop-blur-md transition-all hover:bg-white/80 hover:-translate-x-1 border border-slate-200 shadow-sm">
          <ArrowLeft className="mr-2" size={18} /> Chọn bài khác
        </button>
        
        <div className="flex gap-2">
            {mode === 'theory' && !loading && (
            <>
                <button 
                    onClick={handleStartQuiz} 
                    className="btn-hover flex items-center bg-indigo-500 text-white px-4 py-2 rounded-full font-bold shadow-md hover:bg-indigo-600"
                >
                    <HelpCircle className="mr-2" size={18} /> Luyện tập
                </button>
                
                {/* Hide Save button if viewing an already saved lesson */}
                {!viewSavedId && (
                    <button 
                        onClick={handleSave} 
                        className="btn-hover flex items-center bg-white text-pink-500 px-4 py-2 rounded-full font-bold shadow-sm border border-pink-100 hover:bg-pink-50"
                    >
                        <Save className="mr-2" size={18} /> Lưu bài
                    </button>
                )}
            </>
            )}
        </div>
      </div>

      <div className={`flex-1 backdrop-blur-2xl rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col border relative transition-all duration-500 ${theme.isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white/70 border-white/50'}`}>
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
            <Loader2 className="animate-spin mb-4 text-pink-500" size={48} />
            <p className={`text-xl font-medium animate-pulse ${theme.text}`}>{loadingText}</p>
          </div>
        ) : mode === 'theory' ? (
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar animate-slide-in-bottom">
            <div className={`prose max-w-none ${theme.isDark ? 'prose-invert' : 'prose-pink text-slate-700'}`}>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-6">{topic}</h1>
              {/* Hiển thị nội dung bài giảng */}
              <MathText content={content || "Nội dung đang cập nhật..."} />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar animate-slide-in-bottom">
             <h2 className={`text-2xl font-bold mb-6 text-center ${theme.text}`}>Trắc nghiệm: {topic}</h2>
             {quiz.length === 0 ? (
               <div className="text-center text-slate-500">Không tạo được câu hỏi nào. Thử lại nhé!</div>
             ) : (
               <div className="space-y-8">
                 {quiz.map((q, idx) => (
                   <div key={idx} className={`rounded-2xl p-6 shadow-sm border card-hover ${theme.isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white/60 border-slate-100'}`}>
                     <div className={`font-bold text-lg mb-4 flex gap-2 ${theme.text}`}>
                       <span>Câu {idx + 1}:</span>
                       <MathText content={q.question} />
                     </div>
                     <div className="grid grid-cols-1 gap-3">
                       {q.options?.map((opt, optIdx) => {
                         const isSelected = quizAnswers[idx] === opt;
                         const isCorrect = q.correctAnswer === opt;
                         let btnClass = "text-left p-4 rounded-xl border transition-all duration-200 hover:pl-6 flex items-center justify-between ";
                         
                         if (quizSubmitted) {
                           if (isCorrect) btnClass += "bg-green-100 border-green-500 text-green-800 font-bold shadow-md";
                           else if (isSelected && !isCorrect) btnClass += "bg-red-100 border-red-500 text-red-800";
                           else btnClass += theme.isDark ? "bg-slate-900 border-slate-700 opacity-60" : "bg-white border-slate-200 opacity-60";
                         } else {
                           btnClass += isSelected 
                                ? "bg-pink-100 border-pink-500 text-pink-800 shadow-sm font-bold scale-[1.01]" 
                                : theme.isDark ? "bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300" : "bg-white border-slate-200 hover:border-pink-300 hover:bg-pink-50 text-slate-700";
                         }

                         return (
                           <button
                             key={optIdx}
                             onClick={() => !quizSubmitted && setQuizAnswers(prev => ({ ...prev, [idx]: opt }))}
                             className={btnClass}
                           >
                             <MathText content={opt} isInline />
                             {quizSubmitted && isCorrect && <CheckCircle className="inline ml-2 text-green-600 animate-pop-in" size={16} />}
                             {quizSubmitted && isSelected && !isCorrect && <XCircle className="inline ml-2 text-red-600 animate-pop-in" size={16} />}
                           </button>
                         );
                       })}
                     </div>
                     {quizSubmitted && (
                       <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-xl text-sm border border-blue-100 animate-slide-in-bottom">
                         <strong>Giải thích:</strong> <MathText content={q.explanation} />
                       </div>
                     )}
                   </div>
                 ))}
                 
                 {!quizSubmitted ? (
                   <div className="text-center pt-4">
                     <button
                       onClick={() => setQuizSubmitted(true)}
                       className="btn-hover bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-full font-bold shadow-md"
                     >
                       Nộp Bài
                     </button>
                   </div>
                 ) : (
                   <div className="text-center pt-4 pb-12 animate-pop-in">
                     <p className={`text-2xl font-bold mb-4 ${theme.text}`}>
                       Kết quả: <span className="text-pink-600">{calculateScore()}/{quiz.length}</span>
                     </p>
                   </div>
                 )}
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};
