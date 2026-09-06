import { useRef, useMemo } from 'react';
import * as THREE from 'three';

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 1.2, 8]} />
        <meshStandardMaterial color="#4a3a2a" roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshStandardMaterial color="#2e7d32" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0.25, 1.3, 0.15]}>
        <sphereGeometry args={[0.42, 10, 10]} />
        <meshStandardMaterial color="#388e3c" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[-0.15, 1.7, 0.1]}>
        <sphereGeometry args={[0.38, 10, 10]} />
        <meshStandardMaterial color="#43a047" roughness={0.8} />
      </mesh>
    </group>
  );
}

function StreetLight({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.06, 0.1, 3, 8]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 3, 0]} castShadow>
        <boxGeometry args={[0.4, 0.12, 0.2]} />
        <meshStandardMaterial color="#1a1a1a" emissive="#ffcc66" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function Bench({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[1.2, 0.06, 0.35]} />
        <meshStandardMaterial color="#6a4a2a" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.55, -0.12]}>
        <boxGeometry args={[1.2, 0.4, 0.06]} />
        <meshStandardMaterial color="#6a4a2a" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0.5, 0.15, 0]}>
        <boxGeometry args={[0.06, 0.3, 0.35]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.6} />
      </mesh>
      <mesh castShadow position={[-0.5, 0.15, 0]}>
        <boxGeometry args={[0.06, 0.3, 0.35]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.6} />
      </mesh>
    </group>
  );
}

function Planter({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.2, 0]}>
        <boxGeometry args={[0.6, 0.4, 0.6]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.3, 10, 10]} />
        <meshStandardMaterial color="#2e7d32" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Hydrant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.5, 8]} />
        <meshStandardMaterial color="#cc3333" roughness={0.5} />
      </mesh>
      <mesh castShadow position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#cc3333" roughness={0.5} />
      </mesh>
    </group>
  );
}

function TrashCan({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.18, 0.15, 0.8, 8]} />
        <meshStandardMaterial color="#3a4a3a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.06, 8]} />
        <meshStandardMaterial color="#2a3a2a" roughness={0.6} />
      </mesh>
    </group>
  );
}

// Distant skyline buildings for depth (non-interactive)
function DistantBuilding({ position, height, color }: { position: [number, number, number]; height: number; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[3, height, 3]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
      </mesh>
      {/* Simple window pattern — single texture-like plane per face */}
      {[1.51, -1.51].map((z, faceIdx) => (
        <mesh key={`face-${faceIdx}`} position={[0, height / 2, z]}>
          <planeGeometry args={[2.8, height * 0.85]} />
          <meshBasicMaterial color="#1a1a2e" transparent opacity={0.4} />
        </mesh>
      ))}
      {[1.51, -1.51].map((x, faceIdx) => (
        <mesh key={`side-${faceIdx}`} position={[x, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[2.8, height * 0.85]} />
          <meshBasicMaterial color="#1a1a2e" transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

export default function Environment() {
  const trees = useMemo(() => {
    const positions: [number, number, number][] = [
      // Residential district (south) — lining the streets
      [-16, 0, 8], [-16, 0, 12], [16, 0, 8], [16, 0, 12],
      [-5, 0, 18], [5, 0, 18], [-5, 0, 6], [5, 0, 6],
      // Financial district (west) — formal rows
      [-22, 0, -2], [-22, 0, 2], [-22, 0, -10], [-22, 0, -14],
      [-14, 0, -2], [-14, 0, 2],
      // Entertainment district (east) — playful clusters
      [22, 0, -2], [22, 0, 2], [22, 0, -10], [22, 0, -14],
      [14, 0, -2], [14, 0, 2],
      // Event plaza (north) — decorative
      [-3, 0, -22], [3, 0, -22], [-8, 0, -22], [8, 0, -22],
      // Corner accents
      [-24, 0, 14], [24, 0, 14], [-24, 0, -18], [24, 0, -18],
    ];
    return positions.map((pos, i) => ({ pos, scale: 0.8 + (i % 3) * 0.25 }));
  }, []);

  const lights = useMemo(() => {
    const positions: [number, number, number][] = [
      // Main road intersections
      [-6, 0, 0], [6, 0, 0], [-6, 0, -12], [6, 0, -12],
      // Residential district
      [-6, 0, 10], [6, 0, 10], [-6, 0, 18], [6, 0, 18],
      // Financial district
      [-18, 0, 0], [-18, 0, -12], [-18, 0, -22],
      // Entertainment district
      [18, 0, 0], [18, 0, -12], [18, 0, 10],
      // Event plaza
      [-4, 0, -22], [4, 0, -22],
    ];
    return positions;
  }, []);

  const benches = useMemo(() => {
    const positions: { pos: [number, number, number]; rot: number }[] = [
      // Residential district — near home and cafe
      { pos: [-3, 0, 8], rot: 0 },
      { pos: [3, 0, 8], rot: 0 },
      // Event plaza area
      { pos: [-3, 0, -14], rot: 0 },
      { pos: [3, 0, -14], rot: 0 },
      // Financial district
      { pos: [-14, 0, -10], rot: 0 },
      // Entertainment district
      { pos: [14, 0, -10], rot: 0 },
    ];
    return positions;
  }, []);

  const planters = useMemo(() => {
    const positions: [number, number, number][] = [
      // Residential district
      [-7, 0, 8], [7, 0, 8], [-7, 0, 12], [7, 0, 12],
      // Financial district
      [-14, 0, -4], [-14, 0, 8],
      // Entertainment district
      [14, 0, -4], [14, 0, 8],
    ];
    return positions;
  }, []);

  const hydrants = useMemo(() => {
    const positions: [number, number, number][] = [
      // Residential district
      [-5, 0, 8], [5, 0, 8],
      // Financial district
      [-14, 0, -8],
      // Entertainment district
      [14, 0, -8],
    ];
    return positions;
  }, []);

  const trashCans = useMemo(() => {
    const positions: [number, number, number][] = [
      // Residential district
      [-8, 0, 8], [8, 0, 8],
      // Financial district
      [-14, 0, -10],
      // Entertainment district
      [14, 0, -10], [14, 0, 8],
      // Event plaza
      [-4, 0, -20], [4, 0, -20],
    ];
    return positions;
  }, []);

  const distantBuildings = useMemo(() => {
    const items: { pos: [number, number, number]; h: number; c: string }[] = [];
    // Vibrant skyline colors per district direction
    const northColors = ['#e74c3c', '#e67e22', '#f1c40f', '#e84393']; // warm — event district backdrop
    const southColors = ['#2ecc71', '#1abc9c', '#3498db', '#0984e3']; // cool — residential backdrop
    const eastColors = ['#9b59b6', '#8e44ad', '#e84393', '#fd79a8']; // purple/pink — entertainment
    const westColors = ['#3498db', '#2c3e50', '#16a085', '#1abc9c']; // blue/teal — financial

    // North skyline (behind Event Plaza)
    for (let x = -26; x <= 26; x += 7) {
      items.push({ pos: [x + (Math.random() - 0.5) * 2, 0, -28], h: 8 + Math.random() * 12, c: northColors[Math.floor(Math.random() * northColors.length)] });
    }
    // South skyline (behind Home)
    for (let x = -26; x <= 26; x += 7) {
      items.push({ pos: [x + (Math.random() - 0.5) * 2, 0, 28], h: 8 + Math.random() * 10, c: southColors[Math.floor(Math.random() * southColors.length)] });
    }
    // East skyline
    for (let z = -20; z <= 20; z += 7) {
      items.push({ pos: [30, 0, z + (Math.random() - 0.5) * 2], h: 8 + Math.random() * 12, c: eastColors[Math.floor(Math.random() * eastColors.length)] });
    }
    // West skyline
    for (let z = -20; z <= 20; z += 7) {
      items.push({ pos: [-30, 0, z + (Math.random() - 0.5) * 2], h: 8 + Math.random() * 12, c: westColors[Math.floor(Math.random() * westColors.length)] });
    }
    return items;
  }, []);

  return (
    <group>
      {trees.map((t, i) => (
        <Tree key={`tree-${i}`} position={t.pos} scale={t.scale} />
      ))}
      {lights.map((pos, i) => (
        <StreetLight key={`light-${i}`} position={pos} />
      ))}
      {benches.map((b, i) => (
        <Bench key={`bench-${i}`} position={b.pos} rotation={b.rot} />
      ))}
      {planters.map((pos, i) => (
        <Planter key={`planter-${i}`} position={pos} />
      ))}
      {hydrants.map((pos, i) => (
        <Hydrant key={`hydrant-${i}`} position={pos} />
      ))}
      {trashCans.map((pos, i) => (
        <TrashCan key={`trash-${i}`} position={pos} />
      ))}
      {distantBuildings.map((b, i) => (
        <DistantBuilding key={`distant-${i}`} position={b.pos} height={b.h} color={b.c} />
      ))}
    </group>
  );
}
