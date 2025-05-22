"use client";

import { useEffect, useRef } from "react";

export default function ScrollingBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Create stars
    const stars: { x: number; y: number; size: number; speed: number; opacity: number }[] = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 8 + 4,
        speed: Math.random() * 1 + 0.5,
        opacity: Math.random() * 0.4 + 0.2, // Opacity between 0.2 and 0.6
      });
    }

    // Function to draw a rounded star
    const drawRoundedStar = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      const spikes = 5;
      const outerRadius = size;
      const innerRadius = size * 0.5;
      const roundness = 0.6;

      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI / spikes) * i;
        const x1 = x + Math.cos(angle) * radius;
        const y1 = y + Math.sin(angle) * radius;

        if (i === 0) {
          ctx.moveTo(x1, y1);
        } else {
          const prevAngle = (Math.PI / spikes) * (i - 1);

          if (i % 2 === 0) {
            // Only round the outer points (even indices)
            const cpX = x + Math.cos((angle + prevAngle) / 2) * (radius * roundness);
            const cpY = y + Math.sin((angle + prevAngle) / 2) * (radius * roundness);
            ctx.quadraticCurveTo(cpX, cpY, x1, y1);
          } else {
            // Straight lines for inner points
            ctx.lineTo(x1, y1);
          }
        }
      }
      ctx.closePath();
    };

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        star.x -= star.speed;
        star.y += star.speed;

        if (star.x < 0) {
          star.x = canvas.width;
          star.y = Math.random() * canvas.height;
        }
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }

        ctx.fillStyle = `rgba(26, 115, 232, ${star.opacity})`; // Cerulean with varying opacity
        drawRoundedStar(ctx, star.x, star.y, star.size);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
}
