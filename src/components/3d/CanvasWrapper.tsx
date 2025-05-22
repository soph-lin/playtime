"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import TitleScene from "./title/TitleScene";

export default function CanvasWrapper() {
  return (
    <div style={{ width: "100%", height: "80vh" }}>
      <Canvas camera={{ position: [0, 2, 10], fov: 50 }}>
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <OrbitControls makeDefault enableZoom={true} maxPolarAngle={Math.PI / 2} />
        <TitleScene />
      </Canvas>
    </div>
  );
}
