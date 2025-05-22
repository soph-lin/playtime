import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Vector3, EdgesGeometry, LineBasicMaterial, LineSegments, CylinderGeometry } from "three";

export default function FlatRecord() {
  const recordRef = useRef<Mesh>(null);
  const rotationAxis = new Vector3(0.5, 0.2, 0).normalize();
  const rotationSpeed = 0.05;
  const [isPaused, setIsPaused] = useState(false);

  useFrame(() => {
    if (!recordRef.current || isPaused) return;
    recordRef.current.rotateOnAxis(rotationAxis, rotationSpeed);
  });

  const handlePointerDown = () => {
    setIsPaused(true);
  };

  const handlePointerUp = () => {
    setIsPaused(false);
  };

  return (
    <group
      ref={recordRef}
      position={[0, 0, 0]}
      rotation={[-Math.PI / 2.5, 0, Math.PI]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Main Record */}
      <mesh>
        <cylinderGeometry args={[1.5, 1.5, 0.05, 64]} />
        <meshBasicMaterial color="#2C3E50" />
      </mesh>

      {/* Outline - positioned slightly in front */}
      <group position={[0, 0.001, 0]}>
        <primitive
          object={
            new LineSegments(
              new EdgesGeometry(new CylinderGeometry(1.5, 1.5, 0.05, 64)),
              new LineBasicMaterial({
                color: "#1F1F1F",
                linewidth: 8,
                transparent: true,
                opacity: 1,
                depthTest: false,
              })
            )
          }
        />
      </group>

      {/* Record Grooves */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[1.4, 1.4, 0.005, 64]} />
        <meshBasicMaterial color="#34495E" />
      </mesh>

      {/* Record Label */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.01, 32]} />
        <meshBasicMaterial color="#E74C3C" />
      </mesh>

      {/* Center Hole */}
      <mesh position={[0, 0.035, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.015, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  );
}
