import React from "react";
import { cn } from "@/lib/utils";

interface Particle {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly delay: number;
  readonly size: number;
}

interface ParticleContainerProps {
  particles: readonly Particle[];
  icon: React.ReactNode;
  className?: string;
  iconClassName?: string;
  expression?: string;
  children: React.ReactNode;
}

export function ParticleContainer({
  particles,
  icon,
  className,
  iconClassName,
  expression,
  children,
}: ParticleContainerProps) {
  return (
    <div className={cn("relative", className)} style={{ zIndex: 1000 }}>
      {/* Particles positioned around the top */}
      <div
        className="absolute inset-0 pointer-events-none particle-container overflow-visible"
        data-expression={expression}
        style={{ zIndex: 1001 }}
      >
        {particles.map((particle) => (
          <div
            key={particle.id}
            className={cn("absolute particle", iconClassName)}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              fontSize: `${particle.size}px`,
            }}
          >
            {icon}
          </div>
        ))}
      </div>

      {/* Children (the sprite) */}
      <div style={{ zIndex: 999 }}>{children}</div>
    </div>
  );
}
