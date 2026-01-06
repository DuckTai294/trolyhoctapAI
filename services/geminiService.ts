
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { QuizQuestion, Subject, StudyRoadmap, StudentProfile, QuizType, ExamResult, MindmapData, GradeRecord, CareerSuggestion } from "../types";

// Initialize the client with the provided API key from environment variable
// API key is loaded from .env.local via Vite's define config
const API_KEY = (typeof process !== 'undefined' && process.env?.API_KEY) ||
  (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
  '';

// Check if API key is available
const isApiKeyAvailable = API_KEY && API_KEY.length > 10;
const ai = isApiKeyAvailable ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// Use Gemini 2.0 Flash for optimal performance
const MODEL_NAME = "gemini-2.0-flash";

// --- SYSTEM INSTRUCTIONS ---

const BASE_INSTRUCTION = `
Bạn là AI Assistant - Trợ lý AI chuyên biệt cho học sinh lớp 12 tại Việt Nam ôn thi THPT Quốc Gia.
Ngôn ngữ: Tiếng Việt.

QUY TẮC HIỂN THỊ TOÁN HỌC (RẤT QUAN TRỌNG):
- Luôn sử dụng định dạng LaTeX cho tất cả các công thức toán học, phương trình hóa học hoặc biểu thức vật lý.
- Công thức cùng dòng (inline): bọc trong dấu $ (ví dụ: $x^2 + 2x + 1 = 0$).
- Công thức riêng dòng (block): bọc trong dấu $$ (ví dụ: $$ \\int_{0}^{1} x dx $$).
- Không sử dụng code block (\\\` hoặc \\\`\\\`) cho công thức toán.
`;

const TEACHER_MODE = `
Phong cách: Giáo viên nhiệt tình, dễ thương, dùng emoji 🌟✨. Giải thích cặn kẽ, dễ hiểu.
Tập trung vào trọng tâm thi cử, mẹo giải nhanh, và bám sát cấu trúc đề thi Bộ Giáo dục.
`;

const GEN_Z_MODE = `
Phong cách: "Bạn thân Gen Z".
- Xưng hô: "Ông/Bà - Tui", "Cậu - Tớ", hoặc "Bro".
- Dùng slang/teencode hợp lý (keke, xỉu up xỉu down, cháy phố, drama, 'sim' kiến thức...).
- Giải thích kiến thức bằng các ví dụ đời thường, meme, tình yêu, game.
- Vui tính, lầy lội nhưng kiến thức phải chuẩn thi đại học.
`;

const SOCRATIC_MODE = `
QUAN TRỌNG: Bạn đang ở chế độ "Gia sư Socratic".
- TUYỆT ĐỐI KHÔNG đưa ra đáp án ngay lập tức.
- Chỉ đưa ra gợi ý (hint), đặt câu hỏi ngược lại để gợi mở tư duy.
- Hướng dẫn từng bước nhỏ.
- Nếu người dùng bế tắc quá mới giải thích thêm một chút.
- Mục tiêu: Chống chép bài, rèn tư duy logic cho kỳ thi đại học.
`;

// Helper to build dynamic context based on student profile
const buildContext = (profile?: StudentProfile) => {
  if (!profile) return "";
  return `
  --- THÔNG TIN HỌC SINH (QUAN TRỌNG) ---
  Tên: ${profile.name || "Bạn học sinh"}
  Mục tiêu: Đỗ ${profile.targetUniversity || "Đại học"} - Ngành ${profile.targetMajor || "..."}
  Điểm số mong muốn: ${profile.targetScore || "Cao"}
  Điểm mạnh: ${profile.strengths || "Chưa rõ"}
  Điểm yếu (Cần khắc phục): ${profile.weaknesses || "Chưa rõ"}
  Phong cách học: ${profile.learningStyle || "Linh hoạt"}
  
  HÃY LUÔN ghi nhớ thông tin này để tư vấn sát sườn. 
  Ví dụ: Nếu học sinh yếu môn Toán, hãy giải thích Toán thật chậm. Nếu mục tiêu điểm cao, hãy đưa bài tập nâng cao (Vận dụng cao).
  -----------------------------------------
  `;
};

// --- HELPER: CLEAN JSON ---
function cleanAndParseJson(text: string | undefined): any {
  if (!text) return null;
  try {
    // Remove markdown code blocks if present
    let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse Error:", e, "Original text:", text);
    return null;
  }
}

// Message for when API is not available
const API_UNAVAILABLE_MSG = "⚠️ Chưa cấu hình API Key. Vui lòng thêm GEMINI_API_KEY vào file .env.local và khởi động lại ứng dụng.";

export const generateTheory = async (subject: Subject, topic: string, profile?: StudentProfile): Promise<string> => {
  if (!ai) return API_UNAVAILABLE_MSG;
  try {
    const context = buildContext(profile);
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Hãy giảng bài chi tiết về chủ đề: "${topic}" cho môn ${subject}. 
      Lưu ý: Đây là kiến thức ôn thi THPT Quốc Gia lớp 12. Hãy làm nổi bật các ý hay ra trong đề thi.`,
      config: {
        systemInstruction: BASE_INSTRUCTION + TEACHER_MODE + context,
        temperature: 0.7,
      },
    });

    return response.text || "Xin lỗi, giáo viên AI đang bận chút xíu, bạn thử lại nha! 🥺";
  } catch (error) {
    console.error(error);
    return "Có lỗi xảy ra khi kết nối với vũ trụ tri thức rồi! 🌌 (Kiểm tra kết nối mạng)";
  }
};

export const generateQuiz = async (subject: Subject, topic: string, profile?: StudentProfile): Promise<QuizQuestion[]> => {
  if (!ai) return [];
  try {
    const context = buildContext(profile);
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Tạo 5 câu hỏi trắc nghiệm ôn thi THPTQG về chủ đề "${topic}" môn ${subject}.`,
      config: {
        systemInstruction: BASE_INSTRUCTION + "Bạn là chuyên gia ra đề thi chuẩn cấu trúc Bộ GD&ĐT." + context,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["multiple-choice"] },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswer", "explanation"]
          }
        }
      }
    });

    const data = cleanAndParseJson(response.text);
    // Add IDs if missing
    return Array.isArray(data) ? data.map((q, i) => ({ ...q, id: q.id || `auto-quiz-${Date.now()}-${i}` })) : [];
  } catch (error) {
    console.error("Generate Quiz Error", error);
    return [];
  }
};

// --- COMPREHENSIVE QUIZ GENERATOR ---
export const generateComprehensiveQuiz = async (
  input: string,
  fileData: string | null,
  questionTypes: QuizType[],
  subject: string,
  profile?: StudentProfile
): Promise<QuizQuestion[]> => {
  if (!ai) return [];
  try {
    const context = buildContext(profile);
    const parts: any[] = [];

    if (fileData) {
      const matches = fileData.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        parts.push({
          inlineData: { mimeType: matches[1], data: matches[2] }
        });
      }
    }

    const prompt = `
      Hãy tạo một bài kiểm tra kiến thức ${fileData ? 'DỰA TRÊN TÀI LIỆU ĐƯỢC CUNG CẤP' : `về chủ đề "${input}" môn ${subject}`}.
      
      Yêu cầu:
      1. Tạo tổng cộng 5-10 câu hỏi.
      2. Bao gồm các dạng câu hỏi sau: ${questionTypes.join(', ')}.
      3. ${fileData ? 'QUAN TRỌNG: Chỉ sử dụng thông tin có trong tài liệu/hình ảnh để đặt câu hỏi. Không bịa đặt thêm.' : 'Bám sát chương trình lớp 12 THPTQG.'}
      4. Độ khó: Phù hợp với mục tiêu ${profile?.targetScore || '8+'} điểm.
    `;
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        systemInstruction: BASE_INSTRUCTION + context + "Bạn là người ra đề thi khó tính nhưng công bằng.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["multiple-choice", "true-false", "short-answer"] },
              question: { type: Type.STRING, description: "Nội dung câu hỏi (có thể chứa LaTeX $...$)" },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Danh sách lựa chọn (chỉ dùng cho multiple-choice). Nếu là true-false hoặc short-answer thì để mảng rỗng."
              },
              correctAnswer: { type: Type.STRING, description: "Đáp án đúng (True/False hoặc text)" },
              explanation: { type: Type.STRING, description: "Giải thích chi tiết (có thể chứa LaTeX $...$)" }
            },
            required: ["type", "question", "correctAnswer", "explanation"]
          }
        }
      }
    });

    const data = cleanAndParseJson(response.text);
    if (Array.isArray(data)) {
      return data.map((q: any, index: number) => ({
        ...q,
        id: q.id || `q-${Date.now()}-${index}`,
        options: q.options || []
      }));
    }
    return [];

  } catch (error) {
    console.error("Error generating comprehensive quiz:", error);
    return [];
  }
};

// --- GAP HUNTER ---
export const generateGapAnalysis = async (history: ExamResult[], profile?: StudentProfile): Promise<{ diagnosis: string, remedialQuestions: QuizQuestion[] }> => {
  if (!ai) return { diagnosis: API_UNAVAILABLE_MSG, remedialQuestions: [] };
  try {
    const context = buildContext(profile);
    const historySummary = history.slice(0, 5).map(exam => {
      const wrongAnswers = exam.questions.filter(q => exam.userAnswers[q.id] !== q.correctAnswer);
      return `Môn: ${exam.subject}, Điểm: ${exam.score}/${exam.total}, Sai: ${wrongAnswers.map(q => q.question.substring(0, 50) + "...").join("; ")}`;
    }).join("\n");

    const prompt = `
        Đóng vai bác sĩ "chẩn đoán kiến thức". Dựa trên lịch sử làm bài:
        1. Phân tích lỗ hổng kiến thức.
        2. Tạo 5 câu hỏi "thuốc đặc trị" tập trung vào điểm yếu.
        Lịch sử: ${historySummary}
        `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: BASE_INSTRUCTION + context,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosis: { type: Type.STRING },
            remedialQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["multiple-choice"] },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["question", "options", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["diagnosis", "remedialQuestions"]
        }
      }
    });

    const data = cleanAndParseJson(response.text);
    if (!data) return { diagnosis: "Không đủ dữ liệu hoặc lỗi AI.", remedialQuestions: [] };

    // Ensure IDs exist
    if (data.remedialQuestions) {
      data.remedialQuestions = data.remedialQuestions.map((q: any, i: number) => ({
        ...q,
        id: q.id || `remedial-${Date.now()}-${i}`
      }));
    }
    return data;

  } catch (error) {
    console.error(error);
    return { diagnosis: "Có lỗi khi phân tích dữ liệu.", remedialQuestions: [] };
  }
};

export const explainText = async (text: string, profile?: StudentProfile): Promise<string> => {
  if (!ai) return API_UNAVAILABLE_MSG;
  try {
    const context = buildContext(profile);
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Giải thích ngắn gọn đoạn văn bản này: "${text}"`,
      config: {
        systemInstruction: BASE_INSTRUCTION + context + "Giải thích cực kỳ ngắn gọn, dễ hiểu.",
      },
    });
    return response.text || "Mình không giải thích được đoạn này rồi :(";
  } catch (error) {
    return "Lỗi kết nối khi giải thích nha!";
  }
};

export const chatWithAI = async (message: string, base64Image?: string, options: { useGenZMode?: boolean, useSocraticMode?: boolean, profile?: StudentProfile } = {}): Promise<string> => {
  if (!ai) return API_UNAVAILABLE_MSG;
  try {
    const parts: any[] = [];
    if (base64Image) {
      const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
      if (matches) parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
    }
    if (message) parts.push({ text: message });

    let instruction = BASE_INSTRUCTION + buildContext(options.profile);
    instruction += options.useGenZMode ? GEN_Z_MODE : TEACHER_MODE;
    if (options.useSocraticMode) instruction += SOCRATIC_MODE;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: parts },
      config: { systemInstruction: instruction }
    });

    return response.text || "AI đang suy nghĩ nhưng chưa trả lời được nè.";
  } catch (error) {
    console.error(error);
    return "Oop! Có lỗi kết nối rồi. Vui lòng thử lại sau.";
  }
};

export const generateFlashcards = async (content: string, profile?: StudentProfile): Promise<{ front: string, back: string }[]> => {
  if (!ai) return [];
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Tạo flashcards từ nội dung này: "${content}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING },
              back: { type: Type.STRING },
            },
            required: ["front", "back"]
          }
        }
      }
    });
    return cleanAndParseJson(response.text) || [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const generateStudyRoadmap = async (target: string, currentLevel: string, profile?: StudentProfile): Promise<StudyRoadmap | null> => {
  if (!ai) return null;
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Mục tiêu: "${target}". Hiện tại: "${currentLevel}". Lập lộ trình học tập.`,
      config: {
        systemInstruction: `Bạn là Chiến Lược Gia Luyện Thi. Phân tích điểm mạnh/yếu để đưa ra lộ trình tối ưu.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            target: { type: Type.STRING },
            currentLevel: { type: Type.STRING },
            advice: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phase: { type: Type.STRING },
                  actions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  focusTopics: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["phase", "actions", "focusTopics"]
              }
            }
          },
          required: ["target", "currentLevel", "advice", "steps"]
        }
      }
    });
    return cleanAndParseJson(response.text);
  } catch (error) {
    console.error(error);
    return null;
  }
}

// --- MINDMAP GENERATOR ---
export const generateMindmap = async (input: string, profile?: StudentProfile): Promise<MindmapData | null> => {
  if (!ai) return null;
  try {
    // const context = buildContext(profile); // Not strictly needed for structure generation
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Phân tích nội dung sau và tạo cấu trúc dữ liệu cho Sơ đồ tư duy (Mindmap) chi tiết, đẹp mắt: "${input}"`,
      config: {
        systemInstruction: `Bạn là chuyên gia thiết kế Mindmap.
                Nhiệm vụ: Chuyển đổi văn bản thành cấu trúc cây JSON trực quan cho layout dạng Radial Tree.
                
                YÊU CẦU QUAN TRỌNG VỀ VISUAL:
                1. 'nodes': 
                   - type: 'root' (duy nhất 1 node gốc), 'branch' (các nhánh chính từ root), 'leaf' (các ý nhỏ từ branch).
                   - shape: 'rect' (root), 'rounded' (branch), 'circle' (leaf).
                   - label: Ngắn gọn (Key phrase, < 5 từ).
                   - id: Unique string.
                2. 'edges':
                   - source: id của node cha.
                   - target: id của node con.
                
                Hãy tạo cấu trúc sâu ít nhất 2 cấp (Root -> Branch -> Leaf) để sơ đồ trông đầy đặn.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["root", "branch", "leaf"] },
                  shape: { type: Type.STRING, enum: ["rect", "circle", "rounded"] },
                  backgroundColor: { type: Type.STRING },
                  textColor: { type: Type.STRING },
                  borderColor: { type: Type.STRING }
                },
                required: ["id", "label", "type"]
              }
            },
            edges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  source: { type: Type.STRING },
                  target: { type: Type.STRING },
                  label: { type: Type.STRING }
                },
                required: ["id", "source", "target"]
              }
            }
          },
          required: ["nodes", "edges"]
        }
      }
    });

    const data = cleanAndParseJson(response.text);
    if (!data) return null;

    // Note: Coordinates (x,y) will be calculated by the Frontend layout algorithm
    // Ensure data integrity
    const nodes = (data.nodes || []).map((node: any) => ({ ...node, x: 0, y: 0 }));
    return { nodes, edges: data.edges || [] };

  } catch (error) {
    console.error("Mindmap generation error:", error);
    return null;
  }
};

// --- GRADE ANALYZER ---
export const analyzeGrades = async (grades: GradeRecord, profile: StudentProfile): Promise<CareerSuggestion | null> => {
  if (!ai) return null;
  try {
    const gradeSummary = Object.entries(grades).map(([subj, detail]) =>
      `${subj}: Avg ${detail.average?.toFixed(1) || 'N/A'}`
    ).join(', ');

    const prompt = `
        Dựa trên bảng điểm sau của học sinh lớp 12: ${gradeSummary}
        Và sở thích/mục tiêu: ${profile.targetMajor || 'Chưa rõ'}, điểm mạnh: ${profile.strengths || 'Chưa rõ'}.
        
        Hãy đóng vai chuyên gia tư vấn hướng nghiệp:
        1. Gợi ý 3 ngành học phù hợp nhất.
        2. Gợi ý 3 trường Đại học phù hợp với số điểm và  đào tạo tốt ngành đó.
        3. Phân tích chi tiết tại sao lại gợi ý như vậy (dựa trên điểm môn nào cao).
        4. Xác định các khối thi phù hợp (A00, A01, D01...).
        `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: `Bạn là Chuyên gia Hướng nghiệp.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            majors: { type: Type.ARRAY, items: { type: Type.STRING } },
            universities: { type: Type.ARRAY, items: { type: Type.STRING } },
            analysis: { type: Type.STRING },
            suitableBlocks: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["majors", "universities", "analysis", "suitableBlocks"]
        }
      }
    });

    return cleanAndParseJson(response.text);
  } catch (error) {
    console.error("Grade analysis error", error);
    return null;
  }
};
