import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export interface BuildingData {
  id: string;
  name: string;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  roofColor: string;
  type: 'home' | 'office' | 'bank' | 'mall' | 'invest' | 'life' | 'deco';
  icon: string;
  accentColor: string;
  bannerText: string;
}

export const BUILDINGS: BuildingData[] = [
  // === RESIDENTIAL DISTRICT (South, +Z) — uniform row along south side ===
  { id: 'home', name: 'Your Home', position: [0, 0, 16], size: [5, 4, 5], color: '#e8a87c', roofColor: '#c0392b', type: 'home', icon: '🏠', accentColor: '#f9e79f', bannerText: 'HOME' },
  { id: 'deco1', name: 'Cafe', position: [-9, 0, 16], size: [4, 3.5, 4], color: '#d4a574', roofColor: '#8b4513', type: 'deco', icon: '☕', accentColor: '#f5cba7', bannerText: 'CAFE' },
  { id: 'deco2', name: 'Gym', position: [9, 0, 16], size: [4, 4, 4], color: '#48c9b0', roofColor: '#16a085', type: 'deco', icon: '🏋️', accentColor: '#a3e4d7', bannerText: 'GYM' },

  // === FINANCIAL DISTRICT (West, -X) — uniform column along west side ===
  { id: 'bank', name: 'Freedom Bank', position: [-20, 0, 6], size: [6, 7, 6], color: '#27ae60', roofColor: '#145a32', type: 'bank', icon: '🏦', accentColor: '#abebc6', bannerText: 'BANK' },
  { id: 'office', name: 'Office Tower', position: [-20, 0, -6], size: [6, 12, 6], color: '#3498db', roofColor: '#1a5276', type: 'office', icon: '🏢', accentColor: '#85c1e9', bannerText: 'OFFICE' },
  { id: 'invest', name: 'Investment Tower', position: [-20, 0, -18], size: [6, 16, 6], color: '#1abc9c', roofColor: '#0e6655', type: 'invest', icon: '📈', accentColor: '#76d7c4', bannerText: 'INVESTMENTS' },

  // === ENTERTAINMENT DISTRICT (East, +X) — uniform column along east side ===
  { id: 'deco3', name: 'Restaurant', position: [20, 0, 6], size: [4, 3.5, 4], color: '#f39c12', roofColor: '#b9770e', type: 'deco', icon: '🍽️', accentColor: '#fad7a0', bannerText: 'RESTAURANT' },
  { id: 'mall', name: 'Shopping Mall', position: [20, 0, -6], size: [8, 6, 6], color: '#e74c3c', roofColor: '#922b21', type: 'mall', icon: '🛍️', accentColor: '#f5b7b1', bannerText: 'MALL' },
  { id: 'deco4', name: 'Bookstore', position: [20, 0, -18], size: [4, 3.5, 4], color: '#9b59b6', roofColor: '#6c3483', type: 'deco', icon: '📚', accentColor: '#d2b4de', bannerText: 'BOOKSTORE' },

  // === EVENT PLAZA (Far North, -Z) — centered, off the road ===
  { id: 'life', name: 'Event Plaza', position: [0, 0, -20], size: [8, 4, 5], color: '#e91e63', roofColor: '#880e4f', type: 'life', icon: '✨', accentColor: '#f8bbd0', bannerText: 'EVENTS' },
];

interface BuildingMeshProps {
  data: BuildingData;
  isHighlighted: boolean;
  isMoveSelected?: boolean;
  moveMode?: boolean;
  onSelectForMove?: (id: string) => void;
  onMoveToPosition?: (id: string, position: [number, number, number]) => void;
  onClick: (data: BuildingData) => void;
}

function BuildingMesh({ data, isHighlighted, isMoveSelected = false, moveMode = false, onSelectForMove, onMoveToPosition, onClick }: BuildingMeshProps) {
  const ref = useRef<THREE.Group>(null);
  const [w, h, d] = data.size;

  const windows = useMemo(() => {
    const items: { pos: [number, number, number]; rot: [number, number, number]; lit: boolean }[] = [];
    const rows = Math.max(1, Math.floor(h / 1.3));
    const colsW = Math.max(1, Math.floor(w / 1.3));
    const colsD = Math.max(1, Math.floor(d / 1.3));

    for (let r = 1; r <= rows; r++) {
      for (let c = 0; c < colsW; c++) {
        const wx = -w / 2 + (w / colsW) * (c + 0.5);
        const wy = 0.8 + r * 1.3;
        if (wy < h - 0.5) {
          const lit = Math.random() > 0.4;
          items.push({ pos: [wx, wy, d / 2 + 0.01], rot: [0, 0, 0], lit });
          items.push({ pos: [wx, wy, -d / 2 - 0.01], rot: [0, Math.PI, 0], lit: Math.random() > 0.4 });
        }
      }
      for (let c = 0; c < colsD; c++) {
        const wz = -d / 2 + (d / colsD) * (c + 0.5);
        const wy = 0.8 + r * 1.3;
        if (wy < h - 0.5) {
          const lit = Math.random() > 0.4;
          items.push({ pos: [w / 2 + 0.01, wy, wz], rot: [0, Math.PI / 2, 0], lit });
          items.push({ pos: [-w / 2 - 0.01, wy, wz], rot: [0, -Math.PI / 2, 0], lit: Math.random() > 0.4 });
        }
      }
    }
    return items;
  }, [w, h, d]);

  useFrame(() => {
    if (ref.current && isHighlighted) {
      ref.current.position.y = Math.sin(Date.now() * 0.003) * 0.06;
    } else if (ref.current) {
      ref.current.position.y = 0;
    }
  });

  const isInteractive = data.type !== 'deco';
  const winColor = data.type === 'office' || data.type === 'invest' ? '#4a8acc' : '#ffcc77';

  return (
    <group
      ref={ref}
      position={data.position}
      onClick={(e) => {
        e.stopPropagation();
        if (moveMode && onSelectForMove) {
          onSelectForMove(data.id);
        } else if (isInteractive) {
          onClick(data);
        }
      }}
      onPointerOver={(e) => { e.stopPropagation(); if (isInteractive || moveMode) document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      {/* Deep foundation that goes below ground level - buildings sit firmly on the ground */}
      <mesh position={[0, -1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[w + 1, 3.5, d + 1]} />
        <meshStandardMaterial color="#3a3a3e" roughness={0.9} />
      </mesh>
      {/* Foundation cap at ground level */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.6, 0.5, d + 0.6]} />
        <meshStandardMaterial color="#5a5a5e" roughness={0.85} />
      </mesh>
      {/* Ground-level base trim */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.3, 0.1, d + 0.3]} />
        <meshStandardMaterial color={data.accentColor} roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Main body */}
      <mesh position={[0, h / 2 + 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={data.color} roughness={0.6} metalness={0.15} />
      </mesh>

      {/* Accent trim band */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[w + 0.05, 0.15, d + 0.05]} />
        <meshStandardMaterial color={data.accentColor} roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, h + 0.75, 0]} castShadow>
        <boxGeometry args={[w + 0.3, 0.3, d + 0.3]} />
        <meshStandardMaterial color={data.roofColor} roughness={0.8} />
      </mesh>

      {/* Roof detail - small box for AC units / rooftop elements */}
      {isInteractive && (
        <mesh position={[w * 0.2, h + 1.0, d * 0.2]} castShadow>
          <boxGeometry args={[w * 0.25, 0.4, d * 0.25]} />
          <meshStandardMaterial color={data.roofColor} roughness={0.8} />
        </mesh>
      )}

      {/* Antenna for tall buildings */}
      {(data.type === 'office' || data.type === 'invest') && (
        <mesh position={[0, h + 1.8, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.5, 6]} />
          <meshStandardMaterial color="#888" metalness={0.6} roughness={0.4} />
        </mesh>
      )}

      {/* Door for interactive buildings */}
      {isInteractive && (
        <>
          <mesh position={[0, 1.2, d / 2 + 0.03]}>
            <boxGeometry args={[1, 1.4, 0.06]} />
            <meshStandardMaterial
              color="#1a1a2e"
              emissive={isHighlighted ? '#ffcc00' : '#222244'}
              emissiveIntensity={isHighlighted ? 0.6 : 0.2}
              roughness={0.3}
              metalness={0.4}
            />
          </mesh>
          {/* Door frame */}
          <mesh position={[0, 1.2, d / 2 + 0.025]}>
            <boxGeometry args={[1.15, 1.55, 0.04]} />
            <meshStandardMaterial color={data.accentColor} roughness={0.3} metalness={0.4} />
          </mesh>
          {/* Steps */}
          <mesh position={[0, 0.38, d / 2 + 0.4]} castShadow>
            <boxGeometry args={[1.6, 0.15, 0.6]} />
            <meshStandardMaterial color="#666" roughness={0.85} />
          </mesh>
        </>
      )}

      {/* Windows on all 4 sides */}
      {windows.map((win, i) => (
        <mesh key={i} position={win.pos} rotation={win.rot}>
          <planeGeometry args={[0.7, 0.9]} />
          <meshStandardMaterial
            color={win.lit ? winColor : '#2a3a4a'}
            emissive={win.lit ? winColor : '#000'}
            emissiveIntensity={win.lit ? 0.5 : 0}
            side={THREE.DoubleSide}
            roughness={0.2}
            metalness={0.5}
          />
        </mesh>
      ))}

      {/* Highlight ring */}
      {(isHighlighted || isMoveSelected) && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(w, d) * 0.65, Math.max(w, d) * 0.78, 32]} />
          <meshBasicMaterial color={isMoveSelected ? '#10b981' : '#ffcc00'} transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Move-mode indicator */}
      {isMoveSelected && (
        <Html position={[0, h + 3.0, 0]} center distanceFactor={15} occlude style={{ pointerEvents: 'none' }}>
          <div className="pointer-events-none select-none">
            <div className="px-2 py-1 rounded-full bg-emerald-500/90 text-slate-950 text-[10px] font-bold whitespace-nowrap">
              Tap ground to place
            </div>
          </div>
        </Html>
      )}

      {/* Building banner sign on the front wall */}
      <Html position={[0, h - 0.5 + 0.6, d / 2 + 0.15]} center distanceFactor={12} occlude style={{ pointerEvents: 'none' }}>
        <div className="pointer-events-none select-none">
          <div
            className="px-3 py-1 rounded-md border-2 text-center whitespace-nowrap"
            style={{
              background: `${data.roofColor}f0`,
              borderColor: data.accentColor,
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            <div className="text-[10px] font-black tracking-wider" style={{ color: data.accentColor }}>
              {data.bannerText}
            </div>
          </div>
        </div>
      </Html>

      {/* Floating name label above building */}
      <Html position={[0, h + 2.0, 0]} center distanceFactor={15} occlude style={{ pointerEvents: 'none' }}>
        <div className={`flex flex-col items-center pointer-events-none select-none ${isHighlighted ? 'scale-110' : ''} transition-transform`}>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border whitespace-nowrap ${
            isHighlighted
              ? 'bg-amber-500/90 border-amber-300 text-slate-950 shadow-lg shadow-amber-500/40'
              : 'bg-slate-900/85 border-white/15 text-white'
          }`}>
            <span className="text-sm">{data.icon}</span>
            <span className="text-xs font-bold">{data.name}</span>
          </div>
          {isInteractive && (
            <div className={`w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent ${
              isHighlighted ? 'border-t-amber-500' : 'border-t-slate-900/85'
            }`} />
          )}
        </div>
      </Html>
    </group>
  );
}

interface BuildingsProps {
  onBuildingClick: (data: BuildingData) => void;
  highlightedId: string | null;
  customBuildings?: BuildingData[];
  moveMode?: boolean;
  selectedMoveId?: string | null;
  onSelectForMove?: (id: string) => void;
  onMoveToPosition?: (id: string, position: [number, number, number]) => void;
}

export default function Buildings({ onBuildingClick, highlightedId, customBuildings = [], moveMode = false, selectedMoveId = null, onSelectForMove, onMoveToPosition }: BuildingsProps) {
  return (
    <group>
      {BUILDINGS.map(b => (
        <BuildingMesh
          key={b.id}
          data={b}
          isHighlighted={highlightedId === b.id}
          onClick={onBuildingClick}
        />
      ))}
      {customBuildings.map(b => (
        <BuildingMesh
          key={b.id}
          data={b}
          isHighlighted={highlightedId === b.id || selectedMoveId === b.id}
          isMoveSelected={selectedMoveId === b.id}
          moveMode={moveMode}
          onSelectForMove={onSelectForMove}
          onMoveToPosition={onMoveToPosition}
          onClick={onBuildingClick}
        />
      ))}
    </group>
  );
}
