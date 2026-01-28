import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
  angle: number;  // For curved movement
  speed: number;  // Movement speed
  trail: { x: number; y: number; alpha: number }[];  // Trail history
}

interface ParticleCloudProps {
  color: 'blue' | 'purple';
  warriorNumber?: number; // 0 for Player 1, 1 for Player 2
}

export const ParticleCloud: React.FC<ParticleCloudProps> = ({ color, warriorNumber = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();

  // Color configurations based on warrior number
  const colors = {
    blue: {
      particle: warriorNumber === 0 ? 'rgba(250, 204, 21, ' : 'rgba(59, 130, 246, ',   // yellow or blue
      glow: warriorNumber === 0 ? 'rgba(234, 179, 8, ' : 'rgba(37, 99, 235, ',        // yellow or darker blue
      barrier: warriorNumber === 0 ? 'rgba(234, 179, 8, ' : 'rgba(37, 99, 235, ',     // yellow or darker blue for barrier
    },
    purple: {
      particle: warriorNumber === 0 ? 'rgba(250, 204, 21, ' : 'rgba(59, 130, 246, ',   // yellow or blue
      glow: warriorNumber === 0 ? 'rgba(234, 179, 8, ' : 'rgba(37, 99, 235, ',        // yellow or darker blue
      barrier: warriorNumber === 0 ? 'rgba(234, 179, 8, ' : 'rgba(37, 99, 235, ',     // yellow or darker blue for barrier
    },
  };

  const config = colors[color];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const initParticles = () => {
      const particles: Particle[] = [];
      const particleCount = 30;
      
      for (let i = 0; i < particleCount; i++) {
        particles.push(createParticle(canvas.width, canvas.height));
      }
      
      particlesRef.current = particles;
    };

    // Create a new particle
    const createParticle = (width: number, height: number): Particle => {
      // Spawn particles from the edges
      const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
      let x, y;
      
      switch(edge) {
        case 0: // top
          x = Math.random() * width;
          y = 0;
          break;
        case 1: // right
          x = width;
          y = Math.random() * height;
          break;
        case 2: // bottom
          x = Math.random() * width;
          y = height;
          break;
        default: // left
          x = 0;
          y = Math.random() * height;
      }
      
      return {
        x,
        y,
        vx: 0,
        vy: 0,
        life: Math.random() * 200,
        maxLife: 200 + Math.random() * 100,
        size: 0.8 + Math.random() * 1.2,
        opacity: 0.5 + Math.random() * 0.3,
        angle: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.2,
        trail: [],
      };
    };

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const time = Date.now() * 0.001;  // Time in seconds

      // Draw magical barrier square (pulsing, rounded)
      const barrierSize = 70 + Math.sin(time * 2) * 4;  // Width/height of square
      const barrierAlpha = 0.15 + Math.sin(time * 1.5) * 0.05;
      const cornerRadius = 6;  // Match tile border radius
      
      ctx.save();
      ctx.strokeStyle = config.barrier + barrierAlpha + ')';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 15;
      ctx.shadowColor = config.barrier + (barrierAlpha * 0.8) + ')';
      
      // Main barrier square with rounded corners
      const x = centerX - barrierSize / 2;
      const y = centerY - barrierSize / 2;
      
      ctx.beginPath();
      ctx.moveTo(x + cornerRadius, y);
      ctx.lineTo(x + barrierSize - cornerRadius, y);
      ctx.arcTo(x + barrierSize, y, x + barrierSize, y + cornerRadius, cornerRadius);
      ctx.lineTo(x + barrierSize, y + barrierSize - cornerRadius);
      ctx.arcTo(x + barrierSize, y + barrierSize, x + barrierSize - cornerRadius, y + barrierSize, cornerRadius);
      ctx.lineTo(x + cornerRadius, y + barrierSize);
      ctx.arcTo(x, y + barrierSize, x, y + barrierSize - cornerRadius, cornerRadius);
      ctx.lineTo(x, y + cornerRadius);
      ctx.arcTo(x, y, x + cornerRadius, y, cornerRadius);
      ctx.stroke();
      
      // Inner faint square
      const innerSize = barrierSize - 10;
      const innerX = centerX - innerSize / 2;
      const innerY = centerY - innerSize / 2;
      
      ctx.strokeStyle = config.barrier + (barrierAlpha * 0.5) + ')';
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.moveTo(innerX + cornerRadius, innerY);
      ctx.lineTo(innerX + innerSize - cornerRadius, innerY);
      ctx.arcTo(innerX + innerSize, innerY, innerX + innerSize, innerY + cornerRadius, cornerRadius);
      ctx.lineTo(innerX + innerSize, innerY + innerSize - cornerRadius);
      ctx.arcTo(innerX + innerSize, innerY + innerSize, innerX + innerSize - cornerRadius, innerY + innerSize, cornerRadius);
      ctx.lineTo(innerX + cornerRadius, innerY + innerSize);
      ctx.arcTo(innerX, innerY + innerSize, innerX, innerY + innerSize - cornerRadius, cornerRadius);
      ctx.lineTo(innerX, innerY + cornerRadius);
      ctx.arcTo(innerX, innerY, innerX + cornerRadius, innerY, cornerRadius);
      ctx.stroke();
      
      ctx.restore();

      // Draw base glow
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 50);
      gradient.addColorStop(0, config.barrier + '0.1)');
      gradient.addColorStop(0.5, config.barrier + '0.03)');
      gradient.addColorStop(1, config.barrier + '0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current.forEach((particle, index) => {
        // Calculate vector to center
        const dx = centerX - particle.x;
        const dy = centerY - particle.y;
        const distToCenter = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize direction to center
        const dirX = dx / distToCenter;
        const dirY = dy / distToCenter;
        
        // Spiral effect: add angular velocity
        const angleToCenter = Math.atan2(dy, dx);
        const spiralAngle = angleToCenter + Math.PI / 2; // Perpendicular for spiral
        
        // Combine inward pull with spiral motion
        const pullStrength = 0.5; // How strongly particles are pulled inward
        const spiralStrength = 0.3; // How much spiral motion
        
        // Update velocity with spiral vortex effect
        particle.vx = dirX * pullStrength + Math.cos(spiralAngle) * spiralStrength;
        particle.vy = dirY * pullStrength + Math.sin(spiralAngle) * spiralStrength;
        
        // Apply velocity
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life += 1;
        
        // Add current position to trail
        particle.trail.unshift({ x: particle.x, y: particle.y, alpha: 1 });
        // Keep trail length limited
        if (particle.trail.length > 8) {
          particle.trail.pop();
        }
        // Fade trail
        particle.trail.forEach((point, i) => {
          point.alpha *= 0.85;
        });

        // Respawn if particle reaches center or dies
        if (distToCenter < 5 || particle.life >= particle.maxLife) {
          particlesRef.current[index] = createParticle(canvas.width, canvas.height);
          return;
        }

        // Calculate fade in/out
        let lifeFactor = 1;
        if (particle.life < 30) {
          lifeFactor = particle.life / 30;
        } else if (particle.life > particle.maxLife - 30) {
          lifeFactor = (particle.maxLife - particle.life) / 30;
        }

        // Firefly pulse effect (slower, more organic)
        const pulse = 0.6 + Math.sin(particle.life * 0.05 + index * 0.7) * 0.4;
        
        // Fade out as particle gets closer to center for smooth disappearance
        const centerFade = Math.min(1, distToCenter / 20);
        
        const alpha = particle.opacity * lifeFactor * pulse * centerFade;

        // Draw trail (firefly light trail)
        ctx.save();
        particle.trail.forEach((point, i) => {
          const trailAlpha = alpha * point.alpha * 0.3;
          if (trailAlpha < 0.01) return;
          
          ctx.shadowBlur = 8;
          ctx.shadowColor = config.particle + trailAlpha + ')';
          ctx.fillStyle = config.particle + trailAlpha + ')';
          
          const trailSize = particle.size * (1 - i / particle.trail.length) * 0.7;
          ctx.beginPath();
          ctx.arc(point.x, point.y, trailSize, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();

        // Draw main firefly particle (soft glowing orb)
        ctx.save();
        
        // Outer glow
        const glowGradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 4
        );
        glowGradient.addColorStop(0, config.particle + alpha + ')');
        glowGradient.addColorStop(0.3, config.particle + (alpha * 0.6) + ')');
        glowGradient.addColorStop(0.6, config.particle + (alpha * 0.2) + ')');
        glowGradient.addColorStop(1, config.particle + '0)');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Core bright center
        ctx.shadowBlur = 15;
        ctx.shadowColor = config.particle + (alpha * 1.2) + ')';
        ctx.fillStyle = config.particle + (alpha * 1.3) + ')';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    initParticles();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [color, config.glow, config.particle, config.barrier, warriorNumber]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.9 }}
    />
  );
};
