
import React, { useEffect, useRef } from 'react';
import { useTheme } from './ThemeContext';

export const BackgroundEffects: React.FC = () => {
  const { effect } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || effect === 'none') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: any[] = [];
    let animationId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Init particles
    const createParticle = () => {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 3 + 1;
      const speedY = Math.random() * 1 + 0.5;
      const speedX = (Math.random() - 0.5) * 0.5;
      
      if (effect === 'snow') {
        return { 
            x, y, size, 
            speedY: speedY * 1.5, 
            speedX, 
            color: 'rgba(255, 255, 255, 0.8)', 
            oscillation: Math.random() * 0.02 
        };
      }
      if (effect === 'rain') {
        return { 
            x, y, 
            size: Math.random() * 15 + 10, 
            speedY: speedY * 15 + 10, 
            speedX: 0, 
            color: 'rgba(174, 194, 224, 0.4)', 
            width: 1 
        };
      }
      if (effect === 'leaves') {
        return { 
            x, y, 
            size: Math.random() * 5 + 5, 
            speedY: speedY * 1.5, 
            speedX: speedX * 2, 
            color: `rgba(${200 + Math.random()*55}, ${100 + Math.random()*100}, 20, 0.7)`, 
            rotation: Math.random() * 360, 
            speedR: (Math.random() - 0.5) * 2 
        };
      }
      if (effect === 'fireflies') {
        return { 
            x, y, 
            size: Math.random() * 2 + 1, 
            speedY: (Math.random() - 0.5) * 0.8, 
            speedX: (Math.random() - 0.5) * 0.8, 
            color: '255, 255, 100', // Base RGB
            opacity: Math.random(), 
            opSpeed: 0.01 + Math.random() * 0.02
        };
      }
      return null;
    };

    const particleCount = effect === 'rain' ? 300 : effect === 'fireflies' ? 40 : 80;
    for(let i = 0; i < particleCount; i++) {
        const p = createParticle();
        if(p) particles.push(p);
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p) => {
        if (effect === 'snow') {
            p.y += p.speedY;
            p.x += p.speedX + Math.sin(p.y * p.oscillation);
            if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
            if (p.x > canvas.width) p.x = 0;
            if (p.x < 0) p.x = canvas.width;
            
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        } 
        else if (effect === 'rain') {
            p.y += p.speedY;
            if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
            
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x, p.y + p.size);
            ctx.stroke();
        }
        else if (effect === 'leaves') {
            p.y += p.speedY;
            p.x += p.speedX;
            p.rotation += p.speedR;
            
            if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
            if (p.x > canvas.width) p.x = 0;
            if (p.x < 0) p.x = canvas.width;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            // Draw leaf shape
            ctx.moveTo(0, -p.size/2);
            ctx.quadraticCurveTo(p.size/2, 0, 0, p.size/2);
            ctx.quadraticCurveTo(-p.size/2, 0, 0, -p.size/2);
            ctx.fill();
            ctx.restore();
        }
        else if (effect === 'fireflies') {
            p.x += p.speedX;
            p.y += p.speedY;
            p.opacity += p.opSpeed;
            if(p.opacity >= 1 || p.opacity <= 0.1) p.opSpeed = -p.opSpeed;

            if (p.x > canvas.width + 10) p.x = -10;
            if (p.x < -10) p.x = canvas.width + 10;
            if (p.y > canvas.height + 10) p.y = -10;
            if (p.y < -10) p.y = canvas.height + 10;

            // Draw Glow
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
            gradient.addColorStop(0, `rgba(${p.color}, ${p.opacity})`);
            gradient.addColorStop(1, `rgba(${p.color}, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
            ctx.fill();

            // Draw Core
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [effect]);

  if (effect === 'none') return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ zIndex: 0 }} />;
};
