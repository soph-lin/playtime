"use client";

import { useEffect, useState } from "react";
import StripedBackground from "@/components/background/StripedBackground";
import { LOADING_SPLASH_MESSAGES } from "@/constants/loading";
import Ellipsis from "@/components/effects/Ellipsis";
import FlatRecord from "@/components/3d/FlatRecord";
import { Canvas } from "@react-three/fiber";

const SPLASH_MESSAGE_INTERVAL = 2000; // 2 seconds

interface LoadingScreenProps {
  isLoading: boolean;
  children: React.ReactNode;
}

export default function LoadingScreen({ isLoading, children }: LoadingScreenProps) {
  const [splashMessage, setSplashMessage] = useState<string>("");
  const [isFading, setIsFading] = useState<boolean>(false);

  useEffect(() => {
    if (isLoading) {
      // Start with a random message
      const randomIndex = Math.floor(Math.random() * LOADING_SPLASH_MESSAGES.length);
      setSplashMessage(LOADING_SPLASH_MESSAGES[randomIndex]);

      // Set up interval to cycle through messages
      const interval = setInterval(() => {
        // Start fade out
        setIsFading(true);

        // After fade out, change message and fade in
        setTimeout(() => {
          const nextIndex =
            (randomIndex + Math.floor(Date.now() / SPLASH_MESSAGE_INTERVAL) + 1) % LOADING_SPLASH_MESSAGES.length;
          setSplashMessage(LOADING_SPLASH_MESSAGES[nextIndex]);
          setIsFading(false);
        }, 300); // Fade out duration
      }, SPLASH_MESSAGE_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [isLoading]);

  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <>
      <StripedBackground />
      <div className="fixed inset-0 flex items-center justify-center z-10">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-48 h-48 mx-auto">
              <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <group scale={1.6}>
                  <FlatRecord rotationSpeed={0.03} />
                </group>
              </Canvas>
            </div>
          </div>
          <h2
            className={`text-2xl font-bold text-cerulean-600 mb-2 transition-opacity duration-300 ${
              isFading ? "opacity-0" : "opacity-100"
            }`}
          >
            {splashMessage}
            <Ellipsis color="#1a73e8" />
          </h2>
        </div>
      </div>
    </>
  );
}
