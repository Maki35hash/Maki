import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  volume: number; // 0 - 255 roughly
  isActive: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ volume, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let tick = 0;

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (!isActive) return;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Dynamic radius based on volume
      // Normalize volume (assuming typical range 0-100 from hook)
      const normalizedVol = Math.min(volume / 50, 1.5); 
      const baseRadius = 60;
      const radius = baseRadius + (normalizedVol * 40);

      tick += 0.05;

      // Draw "Elio's Halo"
      // Multiple concentric circles with varying opacity and pulse
      
      // Outer Glow
      const gradient = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.5, centerX, centerY, radius * 1.5);
      gradient.addColorStop(0, 'rgba(251, 191, 36, 0.1)'); // Amber
      gradient.addColorStop(0.5, 'rgba(251, 191, 36, 0.2)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Core Ring 1
      ctx.strokeStyle = `rgba(251, 191, 36, ${0.5 + normalizedVol * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Add some waviness to the circle
      for (let i = 0; i <= Math.PI * 2; i += 0.1) {
        const r = radius + Math.sin(i * 10 + tick) * (5 * normalizedVol);
        const x = centerX + Math.cos(i) * r;
        const y = centerY + Math.sin(i) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      // Core Ring 2 (Inner)
      ctx.strokeStyle = `rgba(245, 158, 11, ${0.8})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      const r2 = (baseRadius * 0.8) + (normalizedVol * 10);
      ctx.arc(centerX, centerY, r2, 0, Math.PI * 2);
      ctx.stroke();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [volume, isActive]);

  return (
    <canvas 
      ref={canvasRef} 
      width={400} 
      height={400} 
      className="w-full max-w-[300px] h-auto mx-auto"
    />
  );
};

export default Visualizer;