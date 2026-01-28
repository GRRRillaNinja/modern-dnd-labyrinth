import React, { useEffect, useRef } from 'react';

interface HomeIconProps {
  size?: number;
  warriorNumber?: number; // 0 for Player 1, 1 for Player 2
}

export const HomeIcon: React.FC<HomeIconProps> = ({ size = 20, warriorNumber = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const iconSize = size * 0.8;
    const iconAlpha = 0.35;

    // Different colors for each player
    const color = warriorNumber === 0 
      ? { r: 250, g: 204, b: 21 }  // Yellow for Player 1
      : { r: 59, g: 130, b: 246 };  // Blue for Player 2

    ctx.save();
    ctx.translate(centerX, centerY);

    // Glow effect
    ctx.shadowBlur = 8;
    ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${iconAlpha * 0.8})`;

    ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${iconAlpha})`;
    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${iconAlpha * 0.6})`;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Draw obelisk shape (tapered pillar with pyramidion top)
    ctx.beginPath();

    // Pyramidion (small pyramid top)
    const pyramidHeight = iconSize * 0.25;
    const pyramidWidth = iconSize * 0.35;
    ctx.moveTo(0, -iconSize / 2);
    ctx.lineTo(-pyramidWidth / 2, -iconSize / 2 + pyramidHeight);
    ctx.lineTo(pyramidWidth / 2, -iconSize / 2 + pyramidHeight);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Shaft (tapered rectangular pillar)
    const topWidth = iconSize * 0.35;
    const bottomWidth = iconSize * 0.45;
    const shaftHeight = iconSize * 1.1;
    
    ctx.beginPath();
    ctx.moveTo(-topWidth / 2, -iconSize / 2 + pyramidHeight);
    ctx.lineTo(-bottomWidth / 2, -iconSize / 2 + pyramidHeight + shaftHeight);
    ctx.lineTo(bottomWidth / 2, -iconSize / 2 + pyramidHeight + shaftHeight);
    ctx.lineTo(topWidth / 2, -iconSize / 2 + pyramidHeight);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Base (small rectangular base)
    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${iconAlpha * 0.9})`;
    const baseWidth = iconSize * 0.55;
    const baseHeight = iconSize * 0.15;
    ctx.beginPath();
    ctx.rect(-baseWidth / 2, -iconSize / 2 + pyramidHeight + shaftHeight, baseWidth, baseHeight);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }, [size, warriorNumber]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="inline-block"
    />
  );
};
