import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Vector3 } from "three";

export default function TitleRecord() {
  const recordRef = useRef<Mesh>(null);
  const rotationAxis = new Vector3(0.5, 0.2, 0).normalize();
  const rotationSpeed = 0.05;

  useFrame(() => {
    if (!recordRef.current) return;
    recordRef.current.rotateOnAxis(rotationAxis, rotationSpeed);
  });

  return (
    <mesh ref={recordRef} position={[0, -1, 0]} rotation={[-Math.PI / 2.5, 0, Math.PI]}>
      <cylinderGeometry args={[3, 3, 0.1, 64]} />
      <meshStandardMaterial color="#111111" metalness={0.9} roughness={0.1} />

      {/* Record Grooves */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[2.8, 2.8, 0.01, 64]} />
        <meshStandardMaterial color="#222222" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Record Label */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[1, 1, 0.02, 32]} />
        <meshStandardMaterial color="#FFD700" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Center Hole */}
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.03, 32]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
    </mesh>
  );
}
