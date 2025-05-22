import { Text } from "@react-three/drei";

export default function Title() {
  const text = "Name that Tune!";

  return (
    <group>
      {text.split("").map((char, i) => (
        <group key={i} position={[(i - text.length / 2) * 1.2, 3, 0]}>
          <Text fontSize={2} letterSpacing={0.2} textAlign="center" anchorX="center" anchorY="middle">
            {char === " " ? "\u00A0" : char}
            <meshStandardMaterial metalness={0.8} roughness={0.2} />
          </Text>
        </group>
      ))}
    </group>
  );
}
