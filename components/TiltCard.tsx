
import React, { useRef, useState } from 'react';

export const TiltCard: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg)');
  const [bgPos, setBgPos] = useState('50% 50%');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;

    // Rotate range: -10deg to 10deg
    const rotateY = x * 10; 
    const rotateX = -y * 10;

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    setBgPos(`${50 + x * 20}% ${50 + y * 20}%`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setBgPos('50% 50%');
  };

  return (
    <div 
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-200 ease-out transform-style-3d ${className || ''}`}
      style={{ transform }}
    >
      <div 
        className="absolute inset-0 rounded-[2rem] opacity-30 pointer-events-none transition-all duration-500"
        style={{ 
          background: `radial-gradient(circle at ${bgPos}, rgba(255,255,255,0.8), transparent 60%)`,
          mixBlendMode: 'overlay'
        }}
      ></div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
