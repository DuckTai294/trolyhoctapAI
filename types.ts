
export enum Subject {
  MATH = 'Toán',
  LITERATURE = 'Văn',
  ENGLISH = 'Anh',
  INFORMATICS = 'Tin'
}

export type QuizType = 'multiple-choice' | 'true-false' | 'short-answer';

export interface QuizQuestion {
  id: string;
  type: QuizType;
  question: string;
  options?: string[]; // Only for multiple-choice
  correctAnswer: string; // "True"/"False" for boolean, specific text for short answer
  explanation: string;
}

export interface SavedLesson {
  id: string;
  subject: Subject;
  topic: string;
  content: string;
  date: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject?: Subject | 'General'; // Added subject categorization
  nextReview?: number; // Timestamp for SRS
  level?: number; // SRS Level (0, 1, 2, 3...)
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

// --- NEW: Reminder Feature ---
export interface Reminder {
  id: string;
  title: string; // Subject or Topic
  time: string; // HH:mm format
  days: number[]; // 0 (Sun) - 6 (Sat)
  active: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 string for preview
  isLoading?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  date: string;
}

// Strategy / Roadmap Types
export interface RoadmapStep {
  phase: string; // e.g., "Giai đoạn 1: Lấp lỗ hổng (Tháng 3)"
  actions: string[];
  focusTopics: string[];
}

export interface StudyRoadmap {
  target: string;
  currentLevel: string;
  advice: string;
  steps: RoadmapStep[];
}

// --- NEW: Student Profile for Personalized AI ---
export interface StudentProfile {
  name: string;
  targetUniversity: string; // Mục tiêu Đại học (Quan trọng với lớp 12)
  targetMajor: string;      // Ngành học
  targetScore: string;      // Điểm số mong muốn (VD: 27+)
  strengths: string;        // Môn giỏi
  weaknesses: string;       // Môn yếu / Lỗ hổng kiến thức
  learningStyle: string;    // Cách học (Hình ảnh, Logic, Nghe...)
}

// --- NEW: Grade Tracking ---
export interface GradeDetail {
  regular: number[]; // Hệ số 1 (Miệng, 15p)
  midterm: number | null; // Hệ số 2
  final: number | null; // Hệ số 3
  average: number | null;
}

export interface GradeRecord {
  [subjectName: string]: GradeDetail;
}

export interface CareerSuggestion {
  majors: string[];
  universities: string[];
  analysis: string; // AI analysis text
  suitableBlocks: string[]; // Khối thi (A00, A01...)
}

// --- NEW: Exam Result for tracking progress ---
export interface ExamResult {
  id: string;
  date: string;
  subject: string;
  score: number;
  total: number;
  duration?: number;
  questions: QuizQuestion[];
  userAnswers: { [key: string]: string };
}

// --- Mindmap Types ---
export interface MindmapNode {
  id: string;
  label: string;
  type: 'root' | 'branch' | 'leaf';
  x?: number;
  y?: number;
  shape?: 'rect' | 'circle' | 'rounded';
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
}

export interface MindmapEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface MindmapData {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
}

export type ViewMode = 'dashboard' | 'subject' | 'flashcards' | 'planner' | 'pomodoro' | 'chatbot' | 'strategy' | 'review' | 'exam_prep' | 'mindmap' | 'grade_tracker';

export type SearchMode = 'app' | 'google';

export interface StudyStats {
  streakDays: number;
  lastLoginDate: string;
  totalStudyMinutes: number;
}

export interface AppState {
  currentView: ViewMode;
  activeSubject: Subject | null;
  savedLessons: SavedLesson[];
  flashcards: Flashcard[];
  tasks: Task[];
  reminders: Reminder[];
  chatSessions: ChatSession[];
  activeChatSessionId: string | null;
  studentProfile: StudentProfile; 
  gradeRecord: GradeRecord;
  studyStats: StudyStats; // New stats
}

// --- MyCourses Types ---
export interface CustomFile {
  id: string;
  name: string;
  type: 'pdf' | 'image';
  data: string; // base64 string
}

export interface CustomChapter {
  id: string;
  title: string;
  description: string;
  files: CustomFile[];
}

export interface CustomCourse {
  id: string;
  title: string;
  icon: string;
  chapters: CustomChapter[];
}
