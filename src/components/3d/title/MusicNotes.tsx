import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Vector3 } from "three";
import { Text } from "@react-three/drei";

export default function MusicNotes() {
  const groupRef = useRef<Group>(null);

  const notes = useMemo(() => {
    return Array.from({ length: 12 }).map(() => ({
      position: new Vector3(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 5 + 2, // Centered more around the title
        (Math.random() - 0.5) * 8
      ),
      rotation: Math.random() * Math.PI,
      speed: 0.1 + Math.random() * 0.2,
      symbol: ["♪", "♫", "♬"][Math.floor(Math.random() * 3)],
    }));
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      notes.forEach((note, i) => {
        const child = groupRef.current!.children[i];
        child.position.y += note.speed;
        child.rotation.y += 0.01;

        if (child.position.y > 8) {
          child.position.y = -3;
          child.position.x = (Math.random() - 0.5) * 15;
          child.position.z = (Math.random() - 0.5) * 8;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {notes.map((note, i) => (
        <group key={i} position={note.position} rotation-y={note.rotation}>
          <Text fontSize={0.8} anchorX="center" anchorY="middle">
            {note.symbol}
            <meshStandardMaterial color="#000000" metalness={0.5} roughness={0.5} />
          </Text>
        </group>
      ))}
    </group>
  );
}
