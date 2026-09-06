import * as THREE from 'three';

interface FaceMeshProps {
  skinColor: string;
  eyeColor?: string;
  lipColor?: string;
  hairColor?: string;
  headRadius?: number;
  gender?: 'male' | 'female';
}

/**
 * Detailed character face with eyes (whites + pupils + brows), nose, lips,
 * and ears. Female characters get longer hair and fuller lips.
 */
export default function FaceMesh({
  skinColor,
  eyeColor = '#3a2a1a',
  lipColor = '#c47878',
  hairColor = '#3a2a1a',
  headRadius = 0.24,
  gender = 'male',
}: FaceMeshProps) {
  const r = headRadius;
  const eyeY = 0.04;
  const eyeZ = r * 0.82;
  const eyeX = r * 0.38;
  const eyeSize = r * 0.14;
  const pupilSize = r * 0.08;
  const isFemale = gender === 'female';

  return (
    <group>
      {/* Head sphere */}
      <mesh castShadow position={[0, 1.65, 0]}>
        <sphereGeometry args={[r, 24, 24]} />
        <meshStandardMaterial color={skinColor} roughness={0.55} />
      </mesh>

      {/* Hair cap */}
      <mesh castShadow position={[0, 1.74, -0.02]}>
        <sphereGeometry args={[r * 1.05, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color={hairColor} roughness={0.85} />
      </mesh>

      {/* Long hair for female characters — flows down the back and sides */}
      {isFemale && (
        <>
          {/* Back hair flowing down to mid-back */}
          <mesh castShadow position={[0, 1.35, -0.18]} rotation={[0.15, 0, 0]}>
            <boxGeometry args={[r * 1.8, r * 2.2, r * 0.3]} />
            <meshStandardMaterial color={hairColor} roughness={0.85} />
          </mesh>
          {/* Side hair framing the face */}
          <mesh castShadow position={[r * 0.85, 1.35, 0.05]}>
            <boxGeometry args={[r * 0.35, r * 1.4, r * 0.5]} />
            <meshStandardMaterial color={hairColor} roughness={0.85} />
          </mesh>
          <mesh castShadow position={[-r * 0.85, 1.35, 0.05]}>
            <boxGeometry args={[r * 0.35, r * 1.4, r * 0.5]} />
            <meshStandardMaterial color={hairColor} roughness={0.85} />
          </mesh>
          {/* Front bangs */}
          <mesh castShadow position={[0, 1.78, r * 0.55]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[r * 1.5, r * 0.35, r * 0.2]} />
            <meshStandardMaterial color={hairColor} roughness={0.85} />
          </mesh>
        </>
      )}

      {/* Ears */}
      <mesh castShadow position={[r * 0.92, 1.63, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[r * 0.1, r * 0.12, 4, 8]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>
      <mesh castShadow position={[-r * 0.92, 1.63, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[r * 0.1, r * 0.12, 4, 8]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>

      {/* Eyebrows */}
      <mesh position={[eyeX, eyeY + r * 0.22, eyeZ - 0.01]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[r * 0.24, r * 0.06, r * 0.05]} />
        <meshStandardMaterial color={hairColor} roughness={0.8} />
      </mesh>
      <mesh position={[-eyeX, eyeY + r * 0.22, eyeZ - 0.01]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[r * 0.24, r * 0.06, r * 0.05]} />
        <meshStandardMaterial color={hairColor} roughness={0.8} />
      </mesh>

      {/* Eye whites */}
      <mesh position={[eyeX, eyeY, eyeZ]}>
        <sphereGeometry args={[eyeSize, 12, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} emissive="#ffffff" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[-eyeX, eyeY, eyeZ]}>
        <sphereGeometry args={[eyeSize, 12, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} emissive="#ffffff" emissiveIntensity={0.15} />
      </mesh>

      {/* Pupils/irises */}
      <mesh position={[eyeX, eyeY, eyeZ + eyeSize * 0.6]}>
        <sphereGeometry args={[pupilSize, 10, 10]} />
        <meshStandardMaterial color={eyeColor} roughness={0.2} />
      </mesh>
      <mesh position={[-eyeX, eyeY, eyeZ + eyeSize * 0.6]}>
        <sphereGeometry args={[pupilSize, 10, 10]} />
        <meshStandardMaterial color={eyeColor} roughness={0.2} />
      </mesh>

      {/* Pupil highlights (tiny white dots for life) */}
      <mesh position={[eyeX + pupilSize * 0.3, eyeY + pupilSize * 0.3, eyeZ + eyeSize * 0.8]}>
        <sphereGeometry args={[pupilSize * 0.3, 6, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-eyeX + pupilSize * 0.3, eyeY + pupilSize * 0.3, eyeZ + eyeSize * 0.8]}>
        <sphereGeometry args={[pupilSize * 0.3, 6, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Eyelids (upper) — subtle definition above eyes */}
      <mesh position={[eyeX, eyeY + eyeSize * 0.7, eyeZ]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[eyeSize * 1.8, eyeSize * 0.3, eyeSize * 0.3]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>
      <mesh position={[-eyeX, eyeY + eyeSize * 0.7, eyeZ]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[eyeSize * 1.8, eyeSize * 0.3, eyeSize * 0.3]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>

      {/* Nose — more defined with bridge and nostrils */}
      <mesh position={[0, eyeY - r * 0.1, eyeZ + r * 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[r * 0.1, r * 0.3, 6]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>
      {/* Nostrils */}
      <mesh position={[r * 0.06, eyeY - r * 0.28, eyeZ + r * 0.22]}>
        <sphereGeometry args={[r * 0.025, 6, 6]} />
        <meshBasicMaterial color="#5a3a2a" />
      </mesh>
      <mesh position={[-r * 0.06, eyeY - r * 0.28, eyeZ + r * 0.22]}>
        <sphereGeometry args={[r * 0.025, 6, 6]} />
        <meshBasicMaterial color="#5a3a2a" />
      </mesh>

      {/* Lips - upper */}
      <mesh position={[0, eyeY - r * 0.42, eyeZ + r * 0.1]}>
        <boxGeometry args={[r * 0.28, r * 0.07, r * 0.07]} />
        <meshStandardMaterial color={isFemale ? '#d4686a' : lipColor} roughness={0.5} />
      </mesh>
      {/* Lips - lower (slightly larger, rounded) */}
      <mesh position={[0, eyeY - r * 0.5, eyeZ + r * 0.08]}>
        <sphereGeometry args={[r * 0.14, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial color={isFemale ? '#d4686a' : lipColor} roughness={0.5} />
      </mesh>

      {/* Cheek blush (subtle) */}
      <mesh position={[r * 0.5, eyeY - r * 0.15, eyeZ - r * 0.1]}>
        <circleGeometry args={[r * 0.12, 8]} />
        <meshBasicMaterial color="#e8a090" transparent opacity={0.25} />
      </mesh>
      <mesh position={[-r * 0.5, eyeY - r * 0.15, eyeZ - r * 0.1]}>
        <circleGeometry args={[r * 0.12, 8]} />
        <meshBasicMaterial color="#e8a090" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}
