import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { TiltCard } from './TiltCard';

const TimeBox: React.FC<{ value: number, label: string, isLast?: boolean }> = ({ value, label, isLast }) => {
    const { theme } = useTheme();
    return (
        <div className="flex flex-col items-center justify-center gap-0.5 group flex-1">
            <div className={`
                relative w-full aspect-square max-w-[60px] md:max-w-[70px]
                backdrop-blur-md
                rounded-xl shadow-sm border 
                flex items-center justify-center 
                transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-md
                ${theme.isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-white/60'}
            `}>
                <span className={`text-xl md:text-2xl font-black font-mono z-10 ${isLast ? 'text-pink-600' : (theme.isDark ? 'text-white' : 'text-slate-700')}`}>
                {value.toString().padStart(2, '0')}
                </span>
            </div>
            <span className="text-[9px] md:text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">
                {label}
            </span>
        </div>
    );
};

export const CountdownTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const { theme } = useTheme();

  useEffect(() => {
    // Target Date: June 11, 2026
    const targetDate = new Date('2026-06-11T00:00:00').getTime(); 

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <TiltCard className={`group h-full relative overflow-hidden rounded-[2rem] p-[1px] shadow-md hover:shadow-lg transition-shadow duration-300 ${theme.isDark ? 'bg-slate-800' : 'bg-white/40'}`}>
      {/* Gradient Border Background */}
      <div className={`absolute inset-0 bg-gradient-to-r from-rose-300 via-pink-400 to-orange-300 opacity-50`}></div>
      
      <div className={`rounded-[2rem] overflow-hidden flex flex-col relative z-10 h-full backdrop-blur-3xl ${theme.isDark ? 'bg-slate-900/95' : 'bg-white/90'}`}>
         <div className="bg-gradient-to-r from-rose-500 to-pink-600 py-2 px-4 text-center relative overflow-hidden flex justify-between items-center shadow-sm">
            <h3 className="text-xs md:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
               <Timer size={16} className="animate-pulse" /> Đếm Ngược
            </h3>
            <span className="text-[10px] font-bold text-white/90 bg-white/20 px-2 py-0.5 rounded-full">THPTQG 2026</span>
         </div>
         
         <div className={`flex-1 p-4 md:p-6 flex flex-col justify-center items-center backdrop-blur-md ${theme.isDark ? 'bg-slate-900/50' : 'bg-white/40'}`}>
            <div className="flex justify-between items-center w-full gap-2 md:gap-4 max-w-sm">
               <TimeBox value={timeLeft.days} label="Ngày" />
               <div className="text-2xl font-light text-slate-300 mb-4">:</div>
               <TimeBox value={timeLeft.hours} label="Giờ" />
               <div className="text-2xl font-light text-slate-300 mb-4">:</div>
               <TimeBox value={timeLeft.minutes} label="Phút" />
               <div className="text-2xl font-light text-slate-300 mb-4">:</div>
               <TimeBox value={timeLeft.seconds} label="Giây" isLast />
            </div>
         </div>
      </div>
    </TiltCard>
  );
};