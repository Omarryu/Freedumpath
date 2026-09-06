import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const ROAD_WIDTH = 4;
export const HALF_W = ROAD_WIDTH / 2;

interface RoadSegment {
  x1: number; z1: number; x2: number; z2: number;
}

const ROAD_SEGMENTS: RoadSegment[] = [
  // Main horizontal road (East-West) through center
  { x1: -26, z1: 0, x2: 26, z2: 0 },
  // Horizontal road through residential district (south)
  { x1: -14, z1: 10, x2: 14, z2: 10 },
  // Horizontal road through event plaza (north)
  { x1: -14, z1: -12, x2: 14, z2: -12 },
  // Vertical road West (through financial district)
  { x1: -12, z1: 14, x2: -12, z2: -18 },
  // Vertical road East (through entertainment district)
  { x1: 12, z1: 14, x2: 12, z2: -18 },
  // Vertical road center
  { x1: 0, z1: 14, x2: 0, z2: -18 },
];

// Intersection positions
const INTERSECTIONS: [number, number][] = [
  [-12, 0], [12, 0], [0, 0],
  [-12, 10], [12, 10], [0, 10],
  [-12, -12], [12, -12], [0, -12],
];

interface CarData {
  segmentIdx: number;
  progress: number;
  speed: number;
  color: string;
  laneOffset: number;
  direction: 1 | -1;
  stopped: boolean;
}

const CAR_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#ecf0f1', '#e67e22', '#1abc9c', '#34495e', '#e84393'];

function RoadMesh({ segment }: { segment: RoadSegment }) {
  const isHorizontal = segment.z1 === segment.z2;
  const length = Math.abs(isHorizontal ? segment.x2 - segment.x1 : segment.z2 - segment.z1);
  const cx = (segment.x1 + segment.x2) / 2;
  const cz = (segment.z1 + segment.z2) / 2;

  return (
    <group position={[cx, 0, cz]} rotation={[0, isHorizontal ? 0 : Math.PI / 2, 0]}>
      {/* Asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROAD_WIDTH, length]} />
        <meshStandardMaterial color="#2e2e32" roughness={0.95} />
      </mesh>

      {/* Center double yellow lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.08, 0.02, 0]}>
        <planeGeometry args={[0.06, length * 0.96]} />
        <meshBasicMaterial color="#ffcc00" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.08, 0.02, 0]}>
        <planeGeometry args={[0.06, length * 0.96]} />
        <meshBasicMaterial color="#ffcc00" />
      </mesh>

      {/* White lane divider lines (dashed) */}
      {[-1, 1].map(side => (
        <group key={side}>
          {Array.from({ length: Math.floor(length / 2.5) }).map((_, i) => {
            const z = -length / 2 + 1.2 + i * 2.5;
            return (
              <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[side * 1.2, 0.02, z]}>
                <planeGeometry args={[0.08, 1]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            );
          })}
        </group>
      ))}

      {/* Solid white edge lines */}
      {[-1, 1].map(side => (
        <mesh key={`edge-${side}`} rotation={[-Math.PI / 2, 0, 0]} position={[side * (HALF_W - 0.05), 0.02, 0]}>
          <planeGeometry args={[0.06, length * 0.96]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* Sidewalk curbs */}
      {[-1, 1].map(side => (
        <mesh key={`curb-${side}`} position={[side * (HALF_W + 0.4), 0.08, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.16, length]} />
          <meshStandardMaterial color="#9a9a9e" roughness={0.85} />
        </mesh>
      ))}

      {/* Sidewalk walkable surfaces */}
      {[-1, 1].map(side => (
        <mesh key={`sw-${side}`} rotation={[-Math.PI / 2, 0, 0]} position={[side * (HALF_W + 1.8), 0.09, 0]} receiveShadow>
          <planeGeometry args={[2.4, length]} />
          <meshStandardMaterial color="#b8b8bc" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// Stop line (solid white line before intersection)
function StopLine({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, rotation]} position={[position[0], 0.03, position[2]]}>
      <planeGeometry args={[ROAD_WIDTH * 0.8, 0.15]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
  );
}

// Turn arrow on road surface
function TurnArrow({ position, rotation, direction }: { position: [number, number, number]; rotation: number; direction: 'straight' | 'left' | 'right' }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Arrow shaft */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[0.15, 1.2]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Arrow head */}
      {direction === 'straight' && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0.7]}>
          <coneGeometry args={[0.2, 0.3, 4]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      )}
    </group>
  );
}

function Crosswalk({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-1.5 + i * 0.6, 0.03, 0]}>
          <planeGeometry args={[0.3, 3]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  );
}

// Traffic light pole with animated lights
interface TrafficLightData {
  position: [number, number, number];
  rotation: number;
  group: number; // which sync group
}

const TRAFFIC_LIGHTS: TrafficLightData[] = [
  // Intersection at (-12, 0)
  { position: [-12 - 3, 0, 0 - 3], rotation: 0, group: 0 },
  { position: [-12 + 3, 0, 0 + 3], rotation: Math.PI, group: 0 },
  // Intersection at (12, 0)
  { position: [12 - 3, 0, 0 - 3], rotation: 0, group: 1 },
  { position: [12 + 3, 0, 0 + 3], rotation: Math.PI, group: 1 },
  // Intersection at (-12, -12)
  { position: [-12 - 3, 0, -12 - 3], rotation: 0, group: 2 },
  { position: [-12 + 3, 0, -12 + 3], rotation: Math.PI, group: 2 },
  // Intersection at (12, -12)
  { position: [12 - 3, 0, -12 - 3], rotation: 0, group: 3 },
  { position: [12 + 3, 0, -12 + 3], rotation: Math.PI, group: 3 },
  // Intersection at (0, 10)
  { position: [0 - 3, 0, 10 - 3], rotation: 0, group: 0 },
  { position: [0 + 3, 0, 10 + 3], rotation: Math.PI, group: 0 },
  // Intersection at (-12, 10)
  { position: [-12 - 3, 0, 10 - 3], rotation: 0, group: 1 },
  { position: [-12 + 3, 0, 10 + 3], rotation: Math.PI, group: 1 },
  // Intersection at (12, 10)
  { position: [12 - 3, 0, 10 - 3], rotation: 0, group: 2 },
  { position: [12 + 3, 0, 10 + 3], rotation: Math.PI, group: 2 },
];

// Shared traffic light state - which groups are currently red
const trafficLightState = { groups: [false, false, false, false], cycleTime: 0 };

function TrafficLight({ data }: { data: TrafficLightData }) {
  const redRef = useRef<THREE.MeshStandardMaterial>(null);
  const yellowRef = useRef<THREE.MeshStandardMaterial>(null);
  const greenRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_, delta) => {
    // Cycle: green 5s, yellow 1s, red 4s, repeat
    trafficLightState.cycleTime += delta;
    const cycle = trafficLightState.cycleTime % 10;
    const groupActive = Math.floor(trafficLightState.cycleTime / 10) % 4;
    const isMyGroup = groupActive === data.group;

    // My group gets green when active, others get red
    let phase: 'red' | 'yellow' | 'green';
    if (isMyGroup) {
      if (cycle < 5) phase = 'green';
      else if (cycle < 6) phase = 'yellow';
      else phase = 'red';
    } else {
      phase = 'red';
    }

    // Update shared state for cars
    trafficLightState.groups[data.group] = phase === 'green';

    if (redRef.current) {
      redRef.current.emissiveIntensity = phase === 'red' ? 0.8 : 0.05;
      redRef.current.color.set(phase === 'red' ? '#ff3333' : '#441111');
    }
    if (yellowRef.current) {
      yellowRef.current.emissiveIntensity = phase === 'yellow' ? 0.8 : 0.05;
      yellowRef.current.color.set(phase === 'yellow' ? '#ffcc00' : '#442200');
    }
    if (greenRef.current) {
      greenRef.current.emissiveIntensity = phase === 'green' ? 0.8 : 0.05;
      greenRef.current.color.set(phase === 'green' ? '#33ff33' : '#114411');
    }
  });

  return (
    <group position={data.position} rotation={[0, data.rotation, 0]}>
      {/* Pole */}
      <mesh castShadow position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 3, 8]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Light housing */}
      <mesh castShadow position={[0, 2.8, 0.1]}>
        <boxGeometry args={[0.3, 0.9, 0.25]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </mesh>
      {/* Red light */}
      <mesh position={[0, 3.1, 0.23]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial ref={redRef} color="#ff3333" emissive="#ff3333" emissiveIntensity={0.8} />
      </mesh>
      {/* Yellow light */}
      <mesh position={[0, 2.8, 0.23]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial ref={yellowRef} color="#ffcc00" emissive="#ffcc00" emissiveIntensity={0.05} />
      </mesh>
      {/* Green light */}
      <mesh position={[0, 2.5, 0.23]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial ref={greenRef} color="#33ff33" emissive="#33ff33" emissiveIntensity={0.05} />
      </mesh>
      {/* Base */}
      <mesh castShadow position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.2, 8]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
      </mesh>
    </group>
  );
}

function Car({ data }: { data: CarData }) {
  const ref = useRef<THREE.Group>(null);
  const seg = ROAD_SEGMENTS[data.segmentIdx];
  const isHorizontal = seg.z1 === seg.z2;

  useFrame((_, delta) => {
    if (!ref.current) return;

    // Check if approaching a red light - stop if the light group for nearest intersection is red
    const currentX = ref.current.position.x;
    const currentZ = ref.current.position.z;

    // Find nearest intersection ahead
    let shouldStop = false;
    for (const [ix, iz] of INTERSECTIONS) {
      const dx = ix - currentX;
      const dz = iz - currentZ;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 3.5 && dist > 1.5) {
        // Near an intersection - check if it's red
        // Find which traffic light group this intersection belongs to
        const groupIdx = INTERSECTIONS.findIndex(([px, pz]) => px === ix && pz === iz);
        // Map intersection index to traffic light group
        const lightGroups = [0, 1, 2, 3, 0, 1]; // maps 6 intersections to 4 groups
        const group = lightGroups[groupIdx];
        if (group !== undefined && !trafficLightState.groups[group]) {
          shouldStop = true;
        }
      }
    }

    data.stopped = shouldStop;

    if (!shouldStop) {
      data.progress += data.direction * data.speed * delta;
    }

    const segLen = Math.abs(isHorizontal ? seg.x2 - seg.x1 : seg.z2 - seg.z1);
    if (data.progress > segLen) data.progress = 0;
    if (data.progress < 0) data.progress = segLen;

    const t = data.progress / segLen;
    const baseX = seg.x1 + (seg.x2 - seg.x1) * t;
    const baseZ = seg.z1 + (seg.z2 - seg.z1) * t;

    const laneX = isHorizontal ? 0 : data.laneOffset * 1.2;
    const laneZ = isHorizontal ? data.laneOffset * 1.2 : 0;

    ref.current.position.set(baseX + laneX, 0.3, baseZ + laneZ);

    if (isHorizontal) {
      ref.current.rotation.y = data.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      ref.current.rotation.y = data.direction > 0 ? 0 : Math.PI;
    }

    // Brake lights when stopped
    const brakeIntensity = shouldStop ? 1 : 0.1;
    const brakeLights = ref.current.children.filter(c => c.userData?.isBrake);
    brakeLights.forEach(light => {
      const mat = (light as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (mat) mat.color.setRGB(brakeIntensity, brakeIntensity * 0.1, brakeIntensity * 0.1);
    });
  });

  return (
    <group ref={ref}>
      {/* Body */}
      <mesh castShadow position={[0, 0.2, 0]}>
        <boxGeometry args={[0.9, 0.35, 1.8]} />
        <meshStandardMaterial color={data.color} roughness={0.25} metalness={0.7} />
      </mesh>
      {/* Cabin */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[0.72, 0.28, 1]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.15} metalness={0.5} />
      </mesh>
      {/* Wheels */}
      {[[0.42, -0.55], [-0.42, -0.55], [0.42, 0.55], [-0.42, 0.55]].map((p, i) => (
        <mesh key={i} castShadow position={[p[0], 0.08, p[1]]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.12, 0.12, 0.08, 12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
        </mesh>
      ))}
      {/* Headlights */}
      <mesh position={[0.28, 0.2, 0.92]}>
        <boxGeometry args={[0.12, 0.1, 0.04]} />
        <meshBasicMaterial color="#ffffcc" />
      </mesh>
      <mesh position={[-0.28, 0.2, 0.92]}>
        <boxGeometry args={[0.12, 0.1, 0.04]} />
        <meshBasicMaterial color="#ffffcc" />
      </mesh>
      {/* Taillights / Brake lights */}
      <mesh userData={{ isBrake: true }} position={[0.28, 0.2, -0.92]}>
        <boxGeometry args={[0.1, 0.08, 0.04]} />
        <meshBasicMaterial color="#ff3333" />
      </mesh>
      <mesh userData={{ isBrake: true }} position={[-0.28, 0.2, -0.92]}>
        <boxGeometry args={[0.1, 0.08, 0.04]} />
        <meshBasicMaterial color="#ff3333" />
      </mesh>
    </group>
  );
}

export default function Roads() {
  const cars = useMemo<CarData[]>(() => {
    const list: CarData[] = [];
    ROAD_SEGMENTS.forEach((seg, idx) => {
      const isHorizontal = seg.z1 === seg.z2;
      const segLen = Math.abs(isHorizontal ? seg.x2 - seg.x1 : seg.z2 - seg.z1);
      const count = 1 + Math.floor(Math.random() * 1);
      for (let i = 0; i < count; i++) {
        list.push({
          segmentIdx: idx,
          progress: Math.random() * segLen,
          speed: 3 + Math.random() * 2.5,
          color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
          laneOffset: i % 2 === 0 ? 1 : -1,
          direction: i % 2 === 0 ? 1 : -1,
          stopped: false,
        });
      }
    });
    return list;
  }, []);

  return (
    <group>
      {ROAD_SEGMENTS.map((seg, i) => (
        <RoadMesh key={i} segment={seg} />
      ))}

      {/* Crosswalks at intersections */}
      <Crosswalk position={[-12, 0, 0]} rotation={0} />
      <Crosswalk position={[12, 0, 0]} rotation={0} />
      <Crosswalk position={[-12, 0, -12]} rotation={0} />
      <Crosswalk position={[12, 0, -12]} rotation={0} />
      <Crosswalk position={[0, 0, 0]} rotation={Math.PI / 2} />
      <Crosswalk position={[0, 0, -12]} rotation={Math.PI / 2} />

      {/* Stop lines before intersections */}
      <StopLine position={[-12, 0, 2]} rotation={0} />
      <StopLine position={[12, 0, 2]} rotation={0} />
      <StopLine position={[-12, 0, -10]} rotation={0} />
      <StopLine position={[12, 0, -10]} rotation={0} />
      <StopLine position={[-2, 0, 0]} rotation={Math.PI / 2} />
      <StopLine position={[-2, 0, -12]} rotation={Math.PI / 2} />
      <StopLine position={[2, 0, 0]} rotation={Math.PI / 2} />
      <StopLine position={[2, 0, -12]} rotation={Math.PI / 2} />

      {/* Turn arrows at intersections */}
      <TurnArrow position={[-10, 0, 0.5]} rotation={0} direction="straight" />
      <TurnArrow position={[10, 0, 0.5]} rotation={Math.PI} direction="straight" />
      <TurnArrow position={[-10, 0, -11.5]} rotation={0} direction="straight" />
      <TurnArrow position={[10, 0, -11.5]} rotation={Math.PI} direction="straight" />

      {/* Traffic lights at intersections */}
      {TRAFFIC_LIGHTS.map((tl, i) => (
        <TrafficLight key={i} data={tl} />
      ))}

      {cars.map((car, i) => (
        <Car key={i} data={car} />
      ))}
    </group>
  );
}
