import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { NPCData } from './npcData';
import FaceMesh from './FaceMesh';

interface NPCProps {
  data: NPCData;
  onTalk: (npc: NPCData) => void;
  isTalking?: boolean;
}

const TASK_LABELS: Record<string, string> = {
  street: 'Out for a walk',
  bank: 'Heading to the bank',
  office: 'Commuting to work',
  mall: 'Going shopping',
  invest: 'Meeting advisor',
  home: 'Walking home',
  life: 'Heading to the plaza',
};

export default function NPC({ data, onTalk, isTalking }: NPCProps) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const hairRef = useRef<THREE.Group>(null);
  const dressRef = useRef<THREE.Group>(null);
  const idlePhase = useRef(0);
  const walkPhase = useRef(0);
  const talkPhase = useRef(0);

  const isFemale = data.gender === 'female';
  const dressColor = data.dressColor ?? data.shirtColor;

  const waypoints = useMemo(() => {
    const [sx, , sz] = data.position;
    const pts: THREE.Vector3[] = [];
    const numWaypoints = 4;
    const radius = 6 + Math.random() * 4;
    for (let i = 0; i < numWaypoints; i++) {
      const angle = (i / numWaypoints) * Math.PI * 2 + Math.random() * 0.5;
      pts.push(new THREE.Vector3(
        sx + Math.cos(angle) * radius,
        0,
        sz + Math.sin(angle) * radius,
      ));
    }
    return pts;
  }, [data.position]);

  const currentTarget = useRef(0);
  const currentPos = useRef(new THREE.Vector3(data.position[0], 0, data.position[2]));
  const currentRot = useRef(data.rotation);
  const isMoving = useRef(true);
  const pauseTimer = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (isTalking) {
      idlePhase.current += delta * 2;
      talkPhase.current += delta * 5;
      if (innerRef.current) {
        innerRef.current.position.y = Math.sin(idlePhase.current) * 0.03;
      }
      // Head bob and hair sway while speaking
      const talkBob = Math.sin(talkPhase.current * 2) * 0.04;
      if (hairRef.current) {
        hairRef.current.rotation.x = talkBob;
        hairRef.current.position.z = Math.sin(talkPhase.current * 1.5) * 0.02;
      }
      // Dress sways gently when speaking
      if (dressRef.current) {
        dressRef.current.rotation.z = Math.sin(talkPhase.current) * 0.05;
      }
      // Subtle weight shift on heels
      const shift = Math.sin(talkPhase.current * 0.8) * 0.08;
      if (leftLegRef.current) leftLegRef.current.rotation.z = shift;
      if (rightLegRef.current) rightLegRef.current.rotation.z = -shift;
      // Relax leg swing
      if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.85;
      if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.85;
      if (leftArmRef.current) leftArmRef.current.rotation.x *= 0.85;
      if (rightArmRef.current) rightArmRef.current.rotation.x *= 0.85;
      // Arms gesture while talking
      if (leftArmRef.current) leftArmRef.current.rotation.x = -0.15 + Math.sin(talkPhase.current) * 0.12;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.15 - Math.sin(talkPhase.current) * 0.12;
      return;
    }

    const target = waypoints[currentTarget.current];
    const dx = target.x - currentPos.current.x;
    const dz = target.z - currentPos.current.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.5) {
      isMoving.current = false;
      pauseTimer.current += delta;
      if (pauseTimer.current > 1.5 + Math.random() * 2) {
        pauseTimer.current = 0;
        isMoving.current = true;
        currentTarget.current = (currentTarget.current + 1) % waypoints.length;
      }
    }

    if (isMoving.current) {
      const speed = 1.8;
      const moveDist = Math.min(speed * delta, dist);
      const nx = dx / dist;
      const nz = dz / dist;
      currentPos.current.x += nx * moveDist;
      currentPos.current.z += nz * moveDist;

      const targetRot = Math.atan2(nx, -nz);
      let diff = targetRot - currentRot.current;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      currentRot.current += diff * 0.15;

      // Walking gait: legs and arms swing in opposition
      walkPhase.current += delta * 7;
      const swing = Math.sin(walkPhase.current) * 0.5;
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.7;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.7;
      // Hair bounces while walking
      if (hairRef.current) {
        hairRef.current.rotation.x = Math.sin(walkPhase.current) * 0.08;
      }
      // Dress swishes while walking
      if (dressRef.current) {
        dressRef.current.rotation.z = Math.sin(walkPhase.current) * 0.04;
      }
      // Slight body bob synced to steps
      if (innerRef.current) {
        innerRef.current.position.y = Math.abs(Math.sin(walkPhase.current)) * 0.06;
      }
    } else {
      idlePhase.current += delta * 2;
      if (innerRef.current) {
        innerRef.current.position.y = Math.sin(idlePhase.current) * 0.03;
      }
      // Settle limbs to rest
      if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.85;
      if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.85;
      if (leftArmRef.current) leftArmRef.current.rotation.x *= 0.85;
      if (rightArmRef.current) rightArmRef.current.rotation.x *= 0.85;
      if (leftLegRef.current) leftLegRef.current.rotation.z *= 0.85;
      if (rightLegRef.current) rightLegRef.current.rotation.z *= 0.85;
      if (hairRef.current) hairRef.current.rotation.x *= 0.85;
      if (dressRef.current) dressRef.current.rotation.z *= 0.85;
    }

    groupRef.current.position.x = currentPos.current.x;
    groupRef.current.position.z = currentPos.current.z;
    groupRef.current.rotation.y = currentRot.current;
  });

  const taskLabel = isTalking ? undefined : TASK_LABELS[data.buildingType];

  return (
    <group
      ref={groupRef}
      position={data.position}
      rotation={[0, data.rotation, 0]}
      onClick={(e) => { e.stopPropagation(); onTalk(data); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      <group ref={innerRef}>
        {/* Hair group (separate so it can sway/bounce) */}
        <group ref={hairRef}>
          <FaceMesh
            skinColor={data.skinColor}
            hairColor={data.hairColor}
            gender={data.gender}
          />
        </group>

        {/* Neck */}
        <mesh castShadow position={[0, 1.42, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.15, 8]} />
          <meshStandardMaterial color={data.skinColor} roughness={0.6} />
        </mesh>

        {isFemale ? (
          <>
            {/* Dress — fitted bodice + flared skirt */}
            <group ref={dressRef}>
              {/* Bodice (upper torso) */}
              <mesh castShadow position={[0, 1.08, 0]}>
                <cylinderGeometry args={[0.2, 0.26, 0.5, 12]} />
                <meshStandardMaterial color={dressColor} roughness={0.5} />
              </mesh>
              {/* Skirt flaring outward */}
              <mesh castShadow position={[0, 0.72, 0]}>
                <coneGeometry args={[0.4, 0.55, 12, 1, true]} />
                <meshStandardMaterial color={dressColor} roughness={0.5} side={THREE.DoubleSide} />
              </mesh>
              {/* Dress hem detail */}
              <mesh position={[0, 0.46, 0]}>
                <torusGeometry args={[0.38, 0.03, 8, 16]} />
                <meshStandardMaterial color={dressColor} roughness={0.4} />
              </mesh>
            </group>

            {/* Arms — pivoted at shoulder */}
            <group ref={leftArmRef} position={[0.26, 1.3, 0]}>
              <mesh castShadow position={[0, -0.22, 0]}>
                <capsuleGeometry args={[0.06, 0.4, 4, 8]} />
                <meshStandardMaterial color={dressColor} roughness={0.5} />
              </mesh>
              <mesh castShadow position={[0, -0.48, 0]}>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshStandardMaterial color={data.skinColor} roughness={0.5} />
              </mesh>
            </group>
            <group ref={rightArmRef} position={[-0.26, 1.3, 0]}>
              <mesh castShadow position={[0, -0.22, 0]}>
                <capsuleGeometry args={[0.06, 0.4, 4, 8]} />
                <meshStandardMaterial color={dressColor} roughness={0.5} />
              </mesh>
              <mesh castShadow position={[0, -0.48, 0]}>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshStandardMaterial color={data.skinColor} roughness={0.5} />
              </mesh>
            </group>

            {/* Legs in high heels — shorter since dress covers */}
            <group ref={leftLegRef} position={[0.1, 0.72, 0]}>
              <mesh castShadow position={[0, -0.18, 0]}>
                <capsuleGeometry args={[0.05, 0.28, 4, 8]} />
                <meshStandardMaterial color={data.skinColor} roughness={0.6} />
              </mesh>
              {/* High heel shoe */}
              <mesh castShadow position={[0, -0.34, 0.02]}>
                <boxGeometry args={[0.09, 0.06, 0.18]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.2} />
              </mesh>
              {/* Heel spike */}
              <mesh castShadow position={[0, -0.4, -0.06]}>
                <cylinderGeometry args={[0.015, 0.02, 0.08, 6]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.3} />
              </mesh>
            </group>
            <group ref={rightLegRef} position={[-0.1, 0.72, 0]}>
              <mesh castShadow position={[0, -0.18, 0]}>
                <capsuleGeometry args={[0.05, 0.28, 4, 8]} />
                <meshStandardMaterial color={data.skinColor} roughness={0.6} />
              </mesh>
              <mesh castShadow position={[0, -0.34, 0.02]}>
                <boxGeometry args={[0.09, 0.06, 0.18]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.2} />
              </mesh>
              <mesh castShadow position={[0, -0.4, -0.06]}>
                <cylinderGeometry args={[0.015, 0.02, 0.08, 6]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.3} />
              </mesh>
            </group>
          </>
        ) : (
          <>
            {/* Male torso */}
            <mesh castShadow position={[0, 1.05, 0]}>
              <boxGeometry args={[0.46, 0.65, 0.28]} />
              <meshStandardMaterial color={data.shirtColor} roughness={0.55} />
            </mesh>

            {/* Arms — pivoted at shoulder so they swing */}
            <group ref={leftArmRef} position={[0.3, 1.35, 0]}>
              <mesh castShadow position={[0, -0.27, 0]}>
                <boxGeometry args={[0.13, 0.55, 0.13]} />
                <meshStandardMaterial color={data.shirtColor} roughness={0.55} />
              </mesh>
              <mesh castShadow position={[0, -0.55, 0]}>
                <sphereGeometry args={[0.07, 8, 8]} />
                <meshStandardMaterial color={data.skinColor} roughness={0.5} />
              </mesh>
            </group>
            <group ref={rightArmRef} position={[-0.3, 1.35, 0]}>
              <mesh castShadow position={[0, -0.27, 0]}>
                <boxGeometry args={[0.13, 0.55, 0.13]} />
                <meshStandardMaterial color={data.shirtColor} roughness={0.55} />
              </mesh>
              <mesh castShadow position={[0, -0.55, 0]}>
                <sphereGeometry args={[0.07, 8, 8]} />
                <meshStandardMaterial color={data.skinColor} roughness={0.5} />
              </mesh>
            </group>

            {/* Legs — pivoted at hip so they swing */}
            <group ref={leftLegRef} position={[0.13, 0.72, 0]}>
              <mesh castShadow position={[0, -0.3, 0]}>
                <boxGeometry args={[0.15, 0.6, 0.15]} />
                <meshStandardMaterial color={data.pantsColor} roughness={0.65} />
              </mesh>
              <mesh castShadow position={[0, -0.62, 0.04]}>
                <boxGeometry args={[0.17, 0.1, 0.22]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
              </mesh>
            </group>
            <group ref={rightLegRef} position={[-0.13, 0.72, 0]}>
              <mesh castShadow position={[0, -0.3, 0]}>
                <boxGeometry args={[0.15, 0.6, 0.15]} />
                <meshStandardMaterial color={data.pantsColor} roughness={0.65} />
              </mesh>
              <mesh castShadow position={[0, -0.62, 0.04]}>
                <boxGeometry args={[0.17, 0.1, 0.22]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
              </mesh>
            </group>
          </>
        )}

        {/* Shadow */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <circleGeometry args={[0.4, 16]} />
          <meshBasicMaterial color="#000" transparent opacity={0.2} />
        </mesh>
      </group>

      {/* Name label */}
      <Html position={[0, 2.3, 0]} center distanceFactor={12} occlude style={{ pointerEvents: 'none' }}>
        <button
          onClick={(e) => { e.stopPropagation(); onTalk(data); }}
          className={`pointer-events-auto select-none cursor-pointer transition-transform ${isTalking ? 'scale-110' : 'hover:scale-105'}`}
        >
          <div className={`flex flex-col items-center`}>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md border whitespace-nowrap ${
              isTalking
                ? 'bg-emerald-600/90 border-emerald-300/50 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-slate-900/85 border-white/15 text-white hover:bg-slate-800/90'
            }`}>
              <span className="text-[10px] font-bold">{data.name}</span>
              <span className="text-[9px] text-slate-400">·</span>
              <span className="text-[9px] text-slate-300">{data.role}</span>
            </div>
            {!isTalking && (
              <>
                {taskLabel && (
                  <div className="mb-0.5 px-1.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[8px] font-medium whitespace-nowrap">
                    {taskLabel}
                  </div>
                )}
                <div className="mt-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/90 text-slate-950 text-[8px] font-bold whitespace-nowrap">
                  TAP TO TALK
                </div>
              </>
            )}
          </div>
        </button>
      </Html>
    </group>
  );
}
