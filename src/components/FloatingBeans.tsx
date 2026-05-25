"use client";

import React, { useEffect, useRef } from "react";

interface Bean {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

export default function FloatingBeans() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let beans: Bean[] = [];
    const maxBeans = 20;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Initialize beans
    for (let i = 0; i < maxBeans; i++) {
      beans.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 12 + 6, // 6px to 18px
        speedY: -(Math.random() * 0.5 + 0.2), // float up slowly
        speedX: Math.random() * 0.3 - 0.15,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 0.5 - 0.25,
        opacity: Math.random() * 0.25 + 0.1, // very subtle transparency
      });
    }

    const drawCoffeeBean = (
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      rotation: number,
      opacity: number
    ) => {
      context.save();
      context.translate(x, y);
      context.rotate((rotation * Math.PI) / 180);
      context.beginPath();

      // Outer bean shape (ellipse)
      context.ellipse(0, 0, size, size * 0.6, 0, 0, 2 * Math.PI);
      context.fillStyle = `rgba(43, 29, 22, ${opacity})`;
      context.strokeStyle = `rgba(199, 161, 122, ${opacity * 0.6})`;
      context.lineWidth = 1;
      context.fill();
      context.stroke();

      // The signature split down the middle of a coffee bean (S-curve)
      context.beginPath();
      context.moveTo(-size * 0.8, 0);
      context.bezierCurveTo(
        -size * 0.3,
        -size * 0.15,
        size * 0.3,
        size * 0.15,
        size * 0.8,
        0
      );
      context.strokeStyle = `rgba(12, 10, 9, ${opacity * 0.9})`;
      context.lineWidth = size * 0.08;
      context.stroke();

      context.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      beans.forEach((bean) => {
        // Move bean
        bean.y += bean.speedY;
        bean.x += bean.speedX;
        bean.rotation += bean.rotationSpeed;

        // Reset if offscreen
        if (bean.y < -30) {
          bean.y = canvas.height + 30;
          bean.x = Math.random() * canvas.width;
        }
        if (bean.x < -30) bean.x = canvas.width + 30;
        if (bean.x > canvas.width + 30) bean.x = -30;

        // Draw bean
        drawCoffeeBean(ctx, bean.x, bean.y, bean.size, bean.rotation, bean.opacity);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
