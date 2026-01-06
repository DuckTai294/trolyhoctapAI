
import React, { createContext, useContext, useState, useEffect } from 'react';
import { CloudRain, Snowflake, Wind, Sparkles, Ban, Image as ImageIcon, Upload, Trash2, Sliders } from 'lucide-react';

export interface Theme {
  id: string;
  name: string;
  primary: string; // Gradient for buttons/accents
  secondary: string; // Gradient for background blobs (in light mode)
  text: string; // Main text color class
  accent: string; // Single color accent
  isDark: boolean; // Computed automatically based on mode
}

export type EffectType = 'none' | 'snow' | 'rain' | 'leaves' | 'fireflies';
export type ThemeMode = 'light' | 'dark';

// Base definitions for palettes (colors only)
const themePalettes = [
  {
    id: 'simple-blue',
    name: 'Xanh Vui Nhộn 🎈',
    primary: 'from-blue-500 to-blue-500',
    secondary: 'from-blue-50 to-blue-50',
    accent: 'bg-blue-500',
  },
  {
    id: 'candy',
    name: 'Kẹo Ngọt 🍬',
    primary: 'from-pink-400 to-purple-500',
    secondary: 'from-blue-200 to-cyan-200',
    accent: 'bg-pink-500',
  },
  {
    id: 'cyber',
    name: 'Cyberpunk 🟢',
    primary: 'from-cyan-400 via-teal-500 to-emerald-500', 
    secondary: 'from-slate-800 to-slate-900',
    accent: 'bg-cyan-500',
  },
  {
    id: 'ocean',
    name: 'Đại Dương 🌊',
    primary: 'from-cyan-400 to-blue-600',
    secondary: 'from-emerald-200 to-teal-200',
    accent: 'bg-blue-500',
  },
  {
    id: 'forest',
    name: 'Rừng Xanh 🌲',
    primary: 'from-emerald-400 to-green-600',
    secondary: 'from-yellow-200 to-lime-200',
    accent: 'bg-emerald-500',
  },
  {
    id: 'sunset',
    name: 'Hoàng Hôn 🌅',
    primary: 'from-orange-400 to-red-500',
    secondary: 'from-rose-200 to-pink-200',
    accent: 'bg-orange-500',
  },
  {
    id: 'violet',
    name: 'Tím Mộng Mơ 💜',
    primary: 'from-violet-500 to-fuchsia-500',
    secondary: 'from-purple-200 to-pink-200',
    accent: 'bg-violet-500',
  },
  {
    id: 'minimalist',
    name: 'Tối Giản 🏳️',
    primary: 'from-slate-600 to-slate-800',
    secondary: 'from-gray-100 to-slate-200',
    accent: 'bg-slate-700',
  }
];

interface ThemeContextType {
  theme: Theme;
  setThemeId: (id: string) => void;
  availableThemes: typeof themePalettes;
  effect: EffectType;
  setEffect: (e: EffectType) => void;
  mode: ThemeMode;
  toggleMode: () => void;
  // Background Customization
  backgroundImage: string | null;
  setBackgroundImage: (img: string | null) => void;
  backgroundOverlay: number; // 0 to 1 (opacity of overlay)
  setBackgroundOverlay: (val: number) => void;
  backgroundBlur: number; // 0 to 20 (px blur)
  setBackgroundBlur: (val: number) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: { ...themePalettes[0], text: 'text-slate-800', isDark: false },
  setThemeId: () => {},
  availableThemes: themePalettes,
  effect: 'none',
  setEffect: () => {},
  mode: 'light',
  toggleMode: () => {},
  backgroundImage: null,
  setBackgroundImage: () => {},
  backgroundOverlay: 0.3,
  setBackgroundOverlay: () => {},
  backgroundBlur: 0,
  setBackgroundBlur: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState('simple-blue');
  const [mode, setMode] = useState<ThemeMode>('light');
  const [effect, setEffect] = useState<EffectType>('none');
  
  // Custom Background State
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundOverlay, setBackgroundOverlay] = useState(0.2);
  const [backgroundBlur, setBackgroundBlur] = useState(0);

  useEffect(() => {
    const savedTheme = localStorage.getItem('glassy_theme');
    if (savedTheme) setThemeId(savedTheme);
    
    const savedMode = localStorage.getItem('glassy_mode');
    if (savedMode) setMode(savedMode as ThemeMode);
    
    const savedEffect = localStorage.getItem('glassy_effect');
    if (savedEffect) setEffect(savedEffect as EffectType);

    // Load custom background settings
    const savedBg = localStorage.getItem('glassy_bg_image');
    if (savedBg) setBackgroundImage(savedBg);

    const savedOverlay = localStorage.getItem('glassy_bg_overlay');
    if (savedOverlay) setBackgroundOverlay(parseFloat(savedOverlay));

    const savedBlur = localStorage.getItem('glassy_bg_blur');
    if (savedBlur) setBackgroundBlur(parseFloat(savedBlur));

  }, []);

  const handleSetTheme = (id: string) => {
    setThemeId(id);
    localStorage.setItem('glassy_theme', id);
  };

  const handleToggleMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('glassy_mode', newMode);
  };

  const handleSetEffect = (e: EffectType) => {
    setEffect(e);
    localStorage.setItem('glassy_effect', e);
  };

  const handleSetBackgroundImage = (img: string | null) => {
      try {
          if (img) {
              localStorage.setItem('glassy_bg_image', img);
          } else {
              localStorage.removeItem('glassy_bg_image');
          }
          setBackgroundImage(img);
      } catch (e) {
          alert("Ảnh quá lớn để lưu trữ! Vui lòng chọn ảnh nhỏ hơn (dưới 2MB).");
      }
  };

  const handleSetBackgroundOverlay = (val: number) => {
      setBackgroundOverlay(val);
      localStorage.setItem('glassy_bg_overlay', val.toString());
  };

  const handleSetBackgroundBlur = (val: number) => {
      setBackgroundBlur(val);
      localStorage.setItem('glassy_bg_blur', val.toString());
  };

  // Compute the final theme object based on ID and Mode
  const basePalette = themePalettes.find(t => t.id === themeId) || themePalettes[0];
  
  const currentTheme: Theme = {
    ...basePalette,
    isDark: mode === 'dark',
    text: mode === 'dark' ? 'text-slate-100' : 'text-slate-800',
    secondary: mode === 'dark' ? 'from-slate-900 to-slate-950' : basePalette.secondary
  };

  return (
    <ThemeContext.Provider value={{ 
      theme: currentTheme, 
      setThemeId: handleSetTheme, 
      availableThemes: themePalettes, 
      effect, 
      setEffect: handleSetEffect,
      mode,
      toggleMode: handleToggleMode,
      backgroundImage,
      setBackgroundImage: handleSetBackgroundImage,
      backgroundOverlay,
      setBackgroundOverlay: handleSetBackgroundOverlay,
      backgroundBlur,
      setBackgroundBlur: handleSetBackgroundBlur
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const ThemeSettings: React.FC = () => {
  const { 
      theme, setThemeId, availableThemes, 
      effect, setEffect, 
      backgroundImage, setBackgroundImage,
      backgroundOverlay, setBackgroundOverlay,
      backgroundBlur, setBackgroundBlur
  } = useTheme();
  
  const [isOpen, setIsOpen] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 2 * 1024 * 1024) {
              alert("Ảnh nền nên nhỏ hơn 2MB để app chạy mượt nha!");
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
              setBackgroundImage(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className="fixed top-6 right-28 z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-white transition-all hover:scale-110 bg-gradient-to-br ${theme.primary} border-2 border-white/20`}
        title="Giao diện & Hình nền"
      >
        <span className="text-lg">🎨</span>
      </button>

      {isOpen && (
        <div className={`absolute top-12 right-0 backdrop-blur-xl border p-5 rounded-3xl shadow-2xl w-80 animate-pop-in z-[60] max-h-[80vh] overflow-y-auto custom-scrollbar ${theme.isDark ? 'bg-slate-900/95 border-slate-600' : 'bg-white/95 border-white/50'}`}>
          
          {/* Custom Background Section */}
          <div className="mb-6 border-b border-slate-200/20 pb-4">
              <h4 className={`font-bold mb-3 text-sm flex items-center gap-2 ${theme.text}`}>
                  <ImageIcon size={16} className="text-pink-500"/> Hình nền của bạn
              </h4>
              
              {!backgroundImage ? (
                  <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-pink-400 group ${theme.isDark ? 'border-slate-600 bg-slate-800/50' : 'border-slate-300 bg-slate-50'}`}>
                      <div className="flex flex-col items-center justify-center pt-2 pb-3">
                          <Upload className="w-6 h-6 mb-1 text-slate-400 group-hover:text-pink-500" />
                          <p className="text-xs text-slate-500 font-semibold">Tải ảnh lên (Max 2MB)</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
              ) : (
                  <div className="space-y-3">
                      <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-200/20 group">
                          <img src={backgroundImage} alt="Background" className="w-full h-full object-cover" />
                          <button 
                              onClick={() => setBackgroundImage(null)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                              title="Xóa hình nền"
                          >
                              <Trash2 size={12} />
                          </button>
                      </div>

                      <div className="space-y-2">
                          <div className="flex justify-between text-xs font-medium text-slate-500">
                              <span>Lớp phủ tối/sáng</span>
                              <span>{Math.round(backgroundOverlay * 100)}%</span>
                          </div>
                          <input 
                              type="range" 
                              min="0" max="0.9" step="0.1" 
                              value={backgroundOverlay}
                              onChange={(e) => setBackgroundOverlay(parseFloat(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                          />
                      </div>

                      <div className="space-y-2">
                          <div className="flex justify-between text-xs font-medium text-slate-500">
                              <span>Độ mờ (Blur)</span>
                              <span>{backgroundBlur}px</span>
                          </div>
                          <input 
                              type="range" 
                              min="0" max="20" step="1" 
                              value={backgroundBlur}
                              onChange={(e) => setBackgroundBlur(parseFloat(e.target.value))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                      </div>
                  </div>
              )}
          </div>

          <h4 className={`font-bold mb-3 text-sm ${theme.text}`}>Màu sắc chủ đạo</h4>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {availableThemes.map(t => (
              <button
                key={t.id}
                onClick={() => setThemeId(t.id)}
                className={`
                  p-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center gap-1 relative overflow-hidden
                  ${theme.id === t.id 
                    ? (theme.isDark ? 'border-pink-500/50 bg-white/10 text-white ring-1 ring-pink-500' : 'border-pink-500/50 bg-pink-50 text-pink-900 ring-1 ring-pink-500') 
                    : (theme.isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-white')}
                `}
              >
                <div className={`w-full h-2 rounded-full bg-gradient-to-r ${t.primary}`}></div>
                {t.name}
              </button>
            ))}
          </div>

          <h4 className={`font-bold mb-3 text-sm ${theme.text}`}>Hiệu ứng Chill</h4>
          <div className="flex gap-2 justify-between overflow-x-auto pb-2 custom-scrollbar">
             <button onClick={() => setEffect('none')} className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${effect === 'none' ? 'bg-slate-500 text-white border-slate-500' : 'bg-slate-200/50 text-slate-500 border-transparent hover:bg-slate-200'}`} title="Tắt">
                <Ban size={16}/>
             </button>
             <button onClick={() => setEffect('snow')} className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${effect === 'snow' ? 'bg-blue-200 text-blue-700 border-blue-300' : 'bg-slate-200/50 text-slate-500 border-transparent hover:bg-blue-50'}`} title="Tuyết rơi">
                <Snowflake size={16}/>
             </button>
             <button onClick={() => setEffect('rain')} className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${effect === 'rain' ? 'bg-indigo-200 text-indigo-700 border-indigo-300' : 'bg-slate-200/50 text-slate-500 border-transparent hover:bg-indigo-50'}`} title="Mưa rơi">
                <CloudRain size={16}/>
             </button>
             <button onClick={() => setEffect('leaves')} className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${effect === 'leaves' ? 'bg-orange-200 text-orange-700 border-orange-300' : 'bg-slate-200/50 text-slate-500 border-transparent hover:bg-orange-50'}`} title="Lá rơi">
                <Wind size={16}/>
             </button>
             <button onClick={() => setEffect('fireflies')} className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${effect === 'fireflies' ? 'bg-yellow-200 text-yellow-700 border-yellow-300' : 'bg-slate-200/50 text-slate-500 border-transparent hover:bg-yellow-50'}`} title="Đom đóm">
                <Sparkles size={16}/>
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
