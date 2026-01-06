
import React, { useState, useEffect } from 'react';
import { GradeRecord, GradeDetail, StudentProfile, CareerSuggestion } from '../types';
import { useTheme } from './ThemeContext';
import { analyzeGrades } from '../services/geminiService';
import { TiltCard } from './TiltCard';
import { MathText } from './MathText';
import { Calculator, Save, TrendingUp, GraduationCap, Building2, BookOpen, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface GradeTrackerProps {
  grades: GradeRecord;
  profile: StudentProfile;
  onUpdateGrades: (grades: GradeRecord) => void;
}

const SUBJECTS = [
  "Toán", "Ngữ Văn", "Tiếng Anh", "Vật Lý", "Hóa Học", "Sinh Học", "Lịch Sử", "Địa Lý", "GDCD", "Tin Học"
];

export const GradeTracker: React.FC<GradeTrackerProps> = ({ grades, profile, onUpdateGrades }) => {
  const { theme } = useTheme();
  const [localGrades, setLocalGrades] = useState<GradeRecord>(grades);
  const [analysis, setAnalysis] = useState<CareerSuggestion | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize missing subjects
  useEffect(() => {
    const newGrades = { ...localGrades };
    let changed = false;
    SUBJECTS.forEach(sub => {
        if (!newGrades[sub]) {
            newGrades[sub] = { regular: [], midterm: null, final: null, average: null };
            changed = true;
        }
    });
    if (changed) setLocalGrades(newGrades);
  }, []);

  const calculateAverage = (detail: GradeDetail): number | null => {
      let sum = 0;
      let count = 0;
      
      // Regular (Hệ số 1)
      detail.regular.forEach(s => { sum += s; count += 1; });
      
      // Midterm (Hệ số 2)
      if (detail.midterm !== null) { sum += detail.midterm * 2; count += 2; }
      
      // Final (Hệ số 3)
      if (detail.final !== null) { sum += detail.final * 3; count += 3; }

      return count === 0 ? null : parseFloat((sum / count).toFixed(1));
  };

  const handleChange = (subject: string, field: keyof GradeDetail, value: string, index?: number) => {
      const numValue = value === '' ? null : parseFloat(value);
      if (numValue !== null && (numValue < 0 || numValue > 10)) return; // Validate 0-10

      setLocalGrades(prev => {
          const detail = { ...prev[subject] };
          
          if (field === 'regular' && typeof index === 'number') {
              if (value === '') {
                  detail.regular = detail.regular.filter((_, i) => i !== index);
              } else {
                  // Ensure array is filled up to index
                  const newReg = [...detail.regular];
                  newReg[index] = numValue as number;
                  detail.regular = newReg;
              }
          } else if (field === 'midterm' || field === 'final') {
              (detail as any)[field] = numValue;
          }

          detail.average = calculateAverage(detail);
          
          const updated = { ...prev, [subject]: detail };
          onUpdateGrades(updated); // Sync to parent immediately
          return updated;
      });
  };

  const handleAnalyze = async () => {
      setLoading(true);
      const result = await analyzeGrades(localGrades, profile);
      setAnalysis(result);
      setLoading(false);
  };

  const getScoreColor = (score: number | null) => {
      if (score === null) return 'text-slate-400';
      if (score >= 8.0) return 'text-green-500 font-bold';
      if (score >= 6.5) return 'text-blue-500 font-bold';
      if (score >= 5.0) return 'text-yellow-600';
      return 'text-red-500';
  };

  // Improved Input Styling for Dark Mode visibility
  const inputClass = `w-10 h-10 text-center rounded-lg border focus:ring-2 focus:ring-pink-300 outline-none transition-all ${theme.isDark ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-600' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-300'}`;
  const inputLargeClass = `w-12 h-10 text-center rounded-lg border font-bold focus:ring-2 focus:ring-blue-300 outline-none transition-all ${theme.isDark ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-600' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-300'}`;

  return (
    <div className="animate-fade-in pb-20">
      <div className="text-center mb-8">
          <h2 className={`text-3xl font-bold ${theme.text} flex items-center justify-center gap-2`}>
              <Calculator size={32} className="text-pink-500"/> Sổ Điểm & Hướng Nghiệp AI
          </h2>
          <p className="text-slate-500 mt-2">Nhập điểm để AI tính trung bình và gợi ý ngành học phù hợp nhất với bạn.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Grade Input Table */}
          <div className="lg:col-span-2">
              <TiltCard className={`rounded-[2rem] border overflow-hidden shadow-lg ${theme.isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white/60 border-white/40'}`}>
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                          <thead className={`text-xs uppercase font-bold ${theme.isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                              <tr>
                                  <th className="px-4 py-3">Môn học</th>
                                  <th className="px-4 py-3 w-48">Điểm Thường Xuyên (hs1)</th>
                                  <th className="px-4 py-3 w-24 text-center">Giữa Kỳ (hs2)</th>
                                  <th className="px-4 py-3 w-24 text-center">Cuối Kỳ (hs3)</th>
                                  <th className="px-4 py-3 w-20 text-center">TBM</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/20">
                              {SUBJECTS.map((subject) => {
                                  const detail = localGrades[subject] || { regular: [], midterm: null, final: null, average: null };
                                  return (
                                      <tr key={subject} className={`hover:bg-black/5 transition-colors`}>
                                          <td className={`px-4 py-3 font-bold ${theme.text}`}>{subject}</td>
                                          <td className="px-4 py-3">
                                              <div className="flex gap-2 flex-wrap">
                                                  {[0, 1, 2, 3].map(i => (
                                                      <input 
                                                          key={i}
                                                          type="number"
                                                          placeholder="-"
                                                          className={inputClass}
                                                          value={detail.regular[i] ?? ''}
                                                          onChange={(e) => handleChange(subject, 'regular', e.target.value, i)}
                                                      />
                                                  ))}
                                              </div>
                                          </td>
                                          <td className="px-4 py-3 text-center">
                                              <input 
                                                  type="number"
                                                  placeholder="-"
                                                  className={inputLargeClass}
                                                  value={detail.midterm ?? ''}
                                                  onChange={(e) => handleChange(subject, 'midterm', e.target.value)}
                                              />
                                          </td>
                                          <td className="px-4 py-3 text-center">
                                              <input 
                                                  type="number"
                                                  placeholder="-"
                                                  className={inputLargeClass}
                                                  value={detail.final ?? ''}
                                                  onChange={(e) => handleChange(subject, 'final', e.target.value)}
                                              />
                                          </td>
                                          <td className={`px-4 py-3 text-center font-black text-lg ${getScoreColor(detail.average)}`}>
                                              {detail.average ?? '-'}
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>
              </TiltCard>
          </div>

          {/* Analysis Section */}
          <div className="lg:col-span-1 space-y-6">
              <TiltCard className={`p-6 rounded-[2rem] border flex flex-col items-center justify-center text-center ${theme.isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white/60 border-white/40 shadow-md'}`}>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-violet-500 flex items-center justify-center text-white mb-4 shadow-lg animate-pulse">
                      <Sparkles size={32} />
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${theme.text}`}>Phân Tích Hướng Nghiệp</h3>
                  <p className="text-sm text-slate-500 mb-6">AI sẽ dựa trên điểm số thực tế để tìm ra ngành nghề phù hợp nhất.</p>
                  
                  <button 
                      onClick={handleAnalyze}
                      disabled={loading}
                      className={`btn-hover w-full py-3 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 bg-gradient-to-r ${theme.primary}`}
                  >
                      {loading ? <><Loader2 className="animate-spin"/> Đang phân tích...</> : <><TrendingUp size={20}/> Phân tích ngay</>}
                  </button>
              </TiltCard>

              {analysis && (
                  <div className="animate-slide-in-bottom space-y-4">
                      {/* Majors */}
                      <div className={`p-5 rounded-[2rem] border ${theme.isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
                          <h4 className="font-bold text-pink-500 flex items-center gap-2 mb-3"><GraduationCap size={18}/> Ngành Học Đề Xuất</h4>
                          <ul className="space-y-2">
                              {analysis.majors.map((m, i) => (
                                  <li key={i} className="flex items-center gap-2 text-sm font-medium">
                                      <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold">{i+1}</span>
                                      {m}
                                  </li>
                              ))}
                          </ul>
                      </div>

                      {/* Universities */}
                      <div className={`p-5 rounded-[2rem] border ${theme.isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
                          <h4 className="font-bold text-blue-500 flex items-center gap-2 mb-3"><Building2 size={18}/> Trường Phù Hợp</h4>
                          <ul className="space-y-2">
                              {analysis.universities.map((u, i) => (
                                  <li key={i} className="flex items-center gap-2 text-sm font-medium">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                      {u}
                                  </li>
                              ))}
                          </ul>
                      </div>

                      {/* Blocks */}
                      <div className={`p-5 rounded-[2rem] border ${theme.isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
                          <h4 className="font-bold text-orange-500 flex items-center gap-2 mb-3"><BookOpen size={18}/> Khối Thi Thế Mạnh</h4>
                          <div className="flex flex-wrap gap-2">
                              {analysis.suitableBlocks.map((b, i) => (
                                  <span key={i} className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200">
                                      {b}
                                  </span>
                              ))}
                          </div>
                      </div>

                      {/* Text Analysis */}
                      <div className={`p-5 rounded-[2rem] border ${theme.isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
                          <h4 className="font-bold text-slate-500 flex items-center gap-2 mb-2"><AlertCircle size={18}/> Đánh giá chi tiết</h4>
                          <div className="text-sm text-slate-600 leading-relaxed italic">
                              <MathText content={analysis.analysis} />
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
