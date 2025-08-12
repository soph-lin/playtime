"use client";

interface EllipsisProps {
  className?: string;
  color?: string;
}

export default function Ellipsis({ className = "", color = "currentColor" }: EllipsisProps) {
  return (
    <span className={`inline-block ${className}`}>
      {Array.from({ length: 3 }, (_, i) => (
        <span
          key={i}
          className="inline-block"
          style={{
            animation: `bounce-subtle 1.2s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
            color: color,
          }}
        >
          .
        </span>
      ))}
      <style jsx>{`
        @keyframes bounce-subtle {
          0%,
          20%,
          50%,
          80%,
          100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-4px);
          }
          60% {
            transform: translateY(-2px);
          }
        }
      `}</style>
    </span>
  );
}
