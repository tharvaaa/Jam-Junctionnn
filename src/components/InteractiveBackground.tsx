/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from "react";

interface SymbolParticle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  symbol: string;
  fontSize: number;
  opacity: number;
  color: string;
  angle: number;
  spin: number;
}

interface GlassOrb {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  color: string;
}

const MUSIC_SYMBOLS = ["♪", "♫", "♬", "♩", "∮", "♯", "♭", "𝄢", "𝄞"];
const MUSIC_COLORS = [
  "rgba(168, 85, 247, 0.35)",  // Purple
  "rgba(236, 72, 153, 0.35)",  // Pink
  "rgba(59, 130, 246, 0.35)",  // Blue
  "rgba(20, 184, 166, 0.35)",  // Teal
  "rgba(244, 63, 94, 0.35)",   // Rose
];

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, radius: 220 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: SymbolParticle[] = [];
    let orbs: GlassOrb[] = [];

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initElements();
    };

    const initElements = () => {
      particles = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 24000) + 12;
      
      // Ambient music symbols
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          symbol: MUSIC_SYMBOLS[Math.floor(Math.random() * MUSIC_SYMBOLS.length)],
          fontSize: Math.floor(Math.random() * 16) + 14,
          opacity: Math.random() * 0.25 + 0.12,
          color: MUSIC_COLORS[Math.floor(Math.random() * MUSIC_COLORS.length)],
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.01,
        });
      }

      // iOS Style Liquid Gradient Orbs
      orbs = [
        {
          x: canvas.width * 0.2,
          y: canvas.height * 0.3,
          radius: Math.min(canvas.width, canvas.height) * 0.35,
          vx: 0.35,
          vy: 0.25,
          color: "rgba(124, 58, 237, 0.08)" // Intense Purple
        },
        {
          x: canvas.width * 0.8,
          y: canvas.height * 0.2,
          radius: Math.min(canvas.width, canvas.height) * 0.4,
          vx: -0.2,
          vy: 0.3,
          color: "rgba(219, 39, 119, 0.07)" // Magenta/Pink
        },
        {
          x: canvas.width * 0.5,
          y: canvas.height * 0.8,
          radius: Math.min(canvas.width, canvas.height) * 0.45,
          vx: 0.15,
          vy: -0.25,
          color: "rgba(13, 148, 136, 0.06)" // Teal
        },
        {
          x: canvas.width * 0.3,
          y: canvas.height * 0.7,
          radius: Math.min(canvas.width, canvas.height) * 0.3,
          vx: -0.25,
          vy: -0.15,
          color: "rgba(37, 99, 235, 0.07)" // Royal Blue
        }
      ];
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initElements();

    interface CursorTrail {
      x: number;
      y: number;
      symbol: string;
      size: number;
      color: string;
      opacity: number;
      vx: number;
      vy: number;
      angle: number;
      spin: number;
    }
    let trails: CursorTrail[] = [];

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw solid iOS Deep Space dark backdrop
      ctx.fillStyle = "#030308";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Draw & Warp Liquid Gradient Orbs (iPhone background layers)
      orbs.forEach(o => {
        o.x += o.vx;
        o.y += o.vy;

        // Bounce of invisible boundaries
        if (o.x - o.radius < -100 || o.x + o.radius > canvas.width + 100) o.vx *= -1;
        if (o.y - o.radius < -100 || o.y + o.radius > canvas.height + 100) o.vy *= -1;

        const gradient = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.radius);
        gradient.addColorStop(0, o.color);
        gradient.addColorStop(0.5, o.color.replace("0.08", "0.04").replace("0.07", "0.035").replace("0.06", "0.03"));
        gradient.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Create high-fidelity cursor interactive music trail
      const mouse = mouseRef.current;
      if (mouse.x > 0 && Math.random() < 0.22) {
        trails.push({
          x: mouse.x + (Math.random() - 0.5) * 12,
          y: mouse.y + (Math.random() - 0.5) * 12,
          symbol: MUSIC_SYMBOLS[Math.floor(Math.random() * MUSIC_SYMBOLS.length)],
          size: Math.floor(Math.random() * 12) + 12,
          color: MUSIC_COLORS[Math.floor(Math.random() * MUSIC_COLORS.length)],
          opacity: 0.75,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2 - 0.6, // float up subtly
          angle: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.04
        });
      }

      // Draw trails
      for (let i = trails.length - 1; i >= 0; i--) {
        const t = trails[i];
        t.x += t.vx;
        t.y += t.vy;
        t.opacity -= 0.015;
        t.angle += t.spin;

        if (t.opacity <= 0) {
          trails.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(t.angle);
        ctx.font = `600 ${t.size}px sans-serif`;
        ctx.fillStyle = t.color.replace("0.35", t.opacity.toFixed(2));
        ctx.fillText(t.symbol, 0, 0);
        ctx.restore();
      }

      // 4. Ambient floating symbols
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;

        // Wrap-around
        if (p.x < -40) p.x = canvas.width + 40;
        if (p.x > canvas.width + 40) p.x = -40;
        if (p.y < -40) p.y = canvas.height + 40;
        if (p.y > canvas.height + 40) p.y = -40;

        // Interactive mouse escape force fields
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
          const power = (mouse.radius - distance) / mouse.radius; // scale 0 -> 1
          const angle = Math.atan2(dy, dx);
          
          // push away softly
          p.x += Math.cos(angle) * power * 3;
          p.y += Math.sin(angle) * power * 3;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.font = `${p.fontSize}px sans-serif`;
        ctx.fillStyle = p.color;
        ctx.fillText(p.symbol, -p.fontSize / 2, p.fontSize / 2);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="apple-liquid-nebula-canvas"
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}
