"use client";

import React, { useEffect, useRef, useState } from "react";
import SteamAnimation from "./SteamAnimation";

interface SplashParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

export default function CoffeePourAnimation({
  active,
  color = "#4e3629", // Espresso brown
}: {
  active: boolean;
  color?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showSteam, setShowSteam] = useState(false);

  useEffect(() => {
    if (!active) {
      setShowSteam(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let fillPercent = 0;
    const particles: SplashParticle[] = [];
    const cupWidth = 90;
    const cupHeight = 80;
    const cupX = canvas.width / 2 - cupWidth / 2;
    const cupY = canvas.height - cupHeight - 20;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Cup Outline
      ctx.save();
      ctx.strokeStyle = "rgba(199, 161, 122, 0.4)";
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.beginPath();
      // Cup handle
      ctx.arc(cupX + cupWidth, cupY + cupHeight / 2, 18, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();

      // Cup body (rounded bottom rectangle)
      ctx.beginPath();
      ctx.moveTo(cupX, cupY);
      ctx.lineTo(cupX + 5, cupY + cupHeight - 15);
      ctx.quadraticCurveTo(cupX + 8, cupY + cupHeight, cupX + 20, cupY + cupHeight);
      ctx.lineTo(cupX + cupWidth - 20, cupY + cupHeight);
      ctx.quadraticCurveTo(cupX + cupWidth - 8, cupY + cupHeight, cupX + cupWidth - 5, cupY + cupHeight - 15);
      ctx.lineTo(cupX + cupWidth, cupY);
      ctx.stroke();
      ctx.restore();

      // 2. Animate Pour & Fill
      if (fillPercent < 100) {
        fillPercent += 1.8; // filling rate

        // Draw Stream of Coffee pouring from top
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        // A slightly wavy pouring stream
        const streamWobble = Math.sin(Date.now() * 0.05) * 2;
        ctx.rect(canvas.width / 2 - 3 + streamWobble, 10, 6, cupY + cupHeight - (fillPercent / 100) * cupHeight - 10);
        ctx.fill();
        ctx.restore();

        // Generate splash particles
        if (Math.random() < 0.8) {
          particles.push({
            x: canvas.width / 2 + (Math.random() * 12 - 6),
            y: cupY + cupHeight - (fillPercent / 100) * cupHeight,
            vx: (Math.random() * 4 - 2),
            vy: -(Math.random() * 3 + 2),
            size: Math.random() * 3 + 1.5,
            opacity: 1,
          });
        }
      } else {
        // Complete fill
        setShowSteam(true);
      }

      // 3. Draw Liquid inside Cup
      const currentLiquidHeight = (fillPercent / 100) * cupHeight;
      if (currentLiquidHeight > 0) {
        ctx.save();
        // Mask so liquid stays inside the cup shape
        ctx.beginPath();
        ctx.moveTo(cupX + 2, cupY + cupHeight - currentLiquidHeight);
        ctx.lineTo(cupX + 5, cupY + cupHeight - 15);
        ctx.quadraticCurveTo(cupX + 8, cupY + cupHeight, cupX + 20, cupY + cupHeight);
        ctx.lineTo(cupX + cupWidth - 20, cupY + cupHeight);
        ctx.quadraticCurveTo(cupX + cupWidth - 8, cupY + cupHeight, cupX + cupWidth - 5, cupY + cupHeight - 15);
        ctx.lineTo(cupX + cupWidth - 2, cupY + cupHeight - currentLiquidHeight);
        ctx.closePath();
        ctx.clip();

        // Draw the liquid body
        ctx.fillStyle = color;
        ctx.beginPath();
        // Draw wavy liquid surface
        const waveFrequency = 0.15;
        const waveAmplitude = fillPercent < 100 ? 3 : 1; // wilder waves when pouring, calm waves when full
        const time = Date.now() * 0.01;
        ctx.moveTo(cupX, cupY + cupHeight - currentLiquidHeight);

        for (let x = cupX; x <= cupX + cupWidth; x++) {
          const y = cupY + cupHeight - currentLiquidHeight + Math.sin(x * waveFrequency + time) * waveAmplitude;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(cupX + cupWidth, cupY + cupHeight);
        ctx.lineTo(cupX, cupY + cupHeight);
        ctx.closePath();
        ctx.fill();

        // Crema foam top layer (slightly lighter gold/cream)
        ctx.fillStyle = "rgba(199, 161, 122, 0.4)";
        ctx.beginPath();
        ctx.moveTo(cupX, cupY + cupHeight - currentLiquidHeight);
        for (let x = cupX; x <= cupX + cupWidth; x++) {
          const y = cupY + cupHeight - currentLiquidHeight + Math.sin(x * waveFrequency + time) * waveAmplitude;
          ctx.lineTo(x, y);
        }
        for (let x = cupX + cupWidth; x >= cupX; x--) {
          const y = cupY + cupHeight - currentLiquidHeight + Math.sin(x * waveFrequency + time) * waveAmplitude + 3;
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // 4. Update and Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.opacity -= 0.02;

        if (p.opacity <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.fillStyle = `rgba(199, 161, 122, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [active, color]);

  return (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={180}
        height={180}
        className="w-full h-full block"
      />
      {showSteam && (
        <SteamAnimation className="absolute -top-4 left-1/2 -translate-x-1/2 scale-125" />
      )}
    </div>
  );
}
