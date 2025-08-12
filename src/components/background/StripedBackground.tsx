"use client";

import { useEffect, useRef } from "react";

export default function StripedBackground() {
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

    // Stripe configuration
    const stripeWidth = 60;
    const stripeSpacing = 120; // Total space between stripes
    const speed = 1.5;
    let offset = 0;

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      // Clear canvas with white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw diagonal stripes from top-right to bottom-left
      ctx.fillStyle = "rgba(26, 115, 232, 0.08)"; // Light cerulean with low opacity

      // Calculate the diagonal offset
      const diagonalOffset = offset % stripeSpacing;

      // Draw stripes from top-right to bottom-left
      // Start from the top-right corner and go towards bottom-left
      for (let i = -stripeWidth; i < canvas.width + canvas.height + stripeWidth; i += stripeSpacing) {
        const stripeX = canvas.width - i - diagonalOffset;

        // Create a diagonal stripe path from top-right to bottom-left
        ctx.beginPath();
        ctx.moveTo(stripeX, 0);
        ctx.lineTo(stripeX - stripeWidth, 0);
        ctx.lineTo(stripeX - stripeWidth + canvas.height, canvas.height);
        ctx.lineTo(stripeX + canvas.height, canvas.height);
        ctx.closePath();
        ctx.fill();
      }

      // Update offset for scrolling effect
      offset += speed;

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
