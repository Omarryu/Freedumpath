import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import FaceMesh from './FaceMesh';

interface PlayerProps {
  position: THREE.Vector3;
  rotation: number;
  playerName: string;
}

export default function Player({ position, rotation, playerName }: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const armRefL = useRef<THREE.Group>(null);
  const armRefR = useRef<THREE.Group>(null);
  const legRefL = useRef<THREE.Group>(null);
  const legRefR = useRef<THREE.Group>(null);
  const walkPhase = useRef(0);
  const currentPos = useRef(new THREE.Vector3(0, 0, 10));
  const currentRot = useRef(0);
  const isMoving = useRef(false);

  useFrame((_, delta) => {
    walkPhase.current += delta * (isMoving.current ? 10 : 0);
    if (groupRef.current) {
      currentPos.current.lerp(position, 0.18);
      groupRef.current.position.copy(currentPos.current);
      const rotDiff = rotation - currentRot.current;
      const normalized = Math.atan2(Math.sin(rotDiff), Math.cos(rotDiff));
      currentRot.current += normalized * 0.2;
      groupRef.current.rotation.y = currentRot.current;
    }
    const swing = Math.sin(walkPhase.current) * 0.35;
    if (legRefL.current) legRefL.current.rotation.x = swing;
    if (legRefR.current) legRefR.current.rotation.x = -swing;
    if (armRefL.current) armRefL.current.rotation.x = -swing * 0.6;
    if (armRefR.current) armRefR.current.rotation.x = swing * 0.6;

    const dist = currentPos.current.distanceTo(position);
    isMoving.current = dist > 0.01;
  });

  return (
    <group ref={groupRef}>
      <FaceMesh skinColor="#f4c2a1" hairColor="#2a1a0a" gender="male" />
      {/* Neck */}
      <mesh castShadow position={[0, 1.42, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.15, 8]} />
        <meshStandardMaterial color="#e8b89a" roughness={0.6} />
      </mesh>
      {/* Torso */}
      <mesh castShadow position={[0, 1.05, 0]}>
        <boxGeometry args={[0.46, 0.65, 0.28]} />
        <meshStandardMaterial color="#2a7c9c" roughness={0.55} />
      </mesh>
      {/* Jacket detail */}
      <mesh position={[0, 1.05, 0.15]}>
        <boxGeometry args={[0.12, 0.6, 0.01]} />
        <meshStandardMaterial color="#1a5c7c" roughness={0.5} />
      </mesh>
      {/* Backpack */}
      <mesh castShadow position={[0, 1.1, -0.2]}>
        <boxGeometry args={[0.32, 0.45, 0.18]} />
        <meshStandardMaterial color="#3a4a5a" roughness={0.7} />
      </mesh>

      {/* Left arm group (pivot at shoulder) */}
      <group ref={armRefL} position={[0.3, 1.32, 0]}>
        <mesh castShadow position={[0, -0.25, 0]}>
          <boxGeometry args={[0.13, 0.55, 0.13]} />
          <meshStandardMaterial color="#2a7c9c" roughness={0.55} />
        </mesh>
        {/* Hand */}
        <mesh castShadow position={[0, -0.55, 0]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#f4c2a1" roughness={0.5} />
        </mesh>
      </group>

      {/* Right arm group */}
      <group ref={armRefR} position={[-0.3, 1.32, 0]}>
        <mesh castShadow position={[0, -0.25, 0]}>
          <boxGeometry args={[0.13, 0.55, 0.13]} />
          <meshStandardMaterial color="#2a7c9c" roughness={0.55} />
        </mesh>
        <mesh castShadow position={[0, -0.55, 0]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#f4c2a1" roughness={0.5} />
        </mesh>
      </group>

      {/* Left leg group (pivot at hip) */}
      <group ref={legRefL} position={[0.13, 0.72, 0]}>
        <mesh castShadow position={[0, -0.3, 0]}>
          <boxGeometry args={[0.15, 0.6, 0.15]} />
          <meshStandardMaterial color="#1a3a5a" roughness={0.65} />
        </mesh>
        {/* Shoe */}
        <mesh castShadow position={[0, -0.62, 0.04]}>
          <boxGeometry args={[0.17, 0.1, 0.22]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
        </mesh>
      </group>

      {/* Right leg group */}
      <group ref={legRefR} position={[-0.13, 0.72, 0]}>
        <mesh castShadow position={[0, -0.3, 0]}>
          <boxGeometry args={[0.15, 0.6, 0.15]} />
          <meshStandardMaterial color="#1a3a5a" roughness={0.65} />
        </mesh>
        <mesh castShadow position={[0, -0.62, 0.04]}>
          <boxGeometry args={[0.17, 0.1, 0.22]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
        </mesh>
      </group>

      {/* Shadow blob */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.4, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.25} />
      </mesh>

      {/* Name label */}
      <Html position={[0, 2.3, 0]} center distanceFactor={12} occlude>
        <div className="pointer-events-none select-none">
          <div className="px-2.5 py-1 rounded-full bg-blue-600/90 backdrop-blur-sm border border-blue-300/40 text-white text-xs font-bold whitespace-nowrap shadow-lg">
            {playerName}
          </div>
        </div>
      </Html>
    </group>
  );
}
