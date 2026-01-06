
import React, { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useTheme } from './ThemeContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const { theme } = useTheme();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login logic
    onLogin(name || "Học sinh");
    onClose();
  };

  const inputClass = `w-full pl-12 pr-4 py-3 border rounded-2xl focus:ring-4 focus:ring-pink-100 outline-none transition-all ${theme.isDark ? 'bg-slate-800/80 border-slate-600 text-white placeholder-slate-400 focus:border-pink-500' : 'bg-white/60 border-slate-200 focus:border-pink-300'}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      ></div>

      {/* Modal Card */}
      <div className={`relative w-full max-w-md backdrop-blur-2xl border rounded-[2.5rem] shadow-2xl overflow-hidden animate-pop-in ${theme.isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white/70 border-white/50'}`}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full transition-all z-10 ${theme.isDark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white/50 hover:bg-white text-slate-500 hover:text-slate-800'}`}
        >
          <X size={20} />
        </button>

        <div className="p-8 md:p-10">
          <h2 className={`text-3xl font-bold text-center mb-8 ${theme.isDark ? 'text-white' : 'text-slate-800'}`}>
            {isRegister ? 'Đăng Ký' : 'Đăng Nhập'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-3">Họ Tên</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    placeholder="Nhập tên của bạn"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-3">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-3">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isRegister && (
              <div className="flex items-center justify-between text-sm px-1">
                <label className={`flex items-center gap-2 cursor-pointer ${theme.isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <input type="checkbox" className="rounded border-slate-300 text-pink-500 focus:ring-pink-200" />
                  Ghi nhớ đăng nhập
                </label>
                <button type="button" className="text-pink-500 font-bold hover:underline">
                  Quên mật khẩu?
                </button>
              </div>
            )}

            <button 
              type="submit"
              className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all bg-gradient-to-r ${theme.primary}`}
            >
              {isRegister ? 'Tạo Tài Khoản' : 'Đăng Nhập'} <ArrowRight size={20} />
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              {isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
              <button 
                onClick={() => setIsRegister(!isRegister)}
                className={`font-bold transition-colors ${theme.isDark ? 'text-white hover:text-pink-500' : 'text-slate-800 hover:text-pink-600'}`}
              >
                {isRegister ? "Đăng nhập ngay" : "Đăng ký miễn phí"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
