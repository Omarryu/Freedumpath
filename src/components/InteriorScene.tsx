import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ChevronLeft, DoorOpen, Armchair, Bed, Briefcase, ShoppingBag, Monitor, Dumbbell } from 'lucide-react';
import type { NPCData } from './world/npcData';
import { BUILDING_NPCS } from './world/npcData';
import NPC from './world/NPC';
import Joystick from './world/Joystick';
import OrbitFollowCamera from './world/OrbitFollowCamera';
import FaceMesh from './world/FaceMesh';

const moveState = { x: 0, z: 0, active: false };

interface InteriorSceneProps {
  buildingType: 'home' | 'office' | 'bank' | 'mall' | 'invest' | 'life';
  buildingName: string;
  buildingIcon: string;
  playerName: string;
  onTalk: (npc: NPCData) => void;
  onExit: () => void;
}

const INTERIOR_CONFIG: Record<string, { width: number; depth: number; height: number; wallColor: string; floorColor: string; accentColor: string }> = {
  bank: { width: 16, depth: 12, height: 5, wallColor: '#5a7a6a', floorColor: '#9a9a9e', accentColor: '#aaccbb' },
  office: { width: 16, depth: 12, height: 5, wallColor: '#4a6a8a', floorColor: '#7a7a8e', accentColor: '#6a9aca' },
  mall: { width: 18, depth: 14, height: 6, wallColor: '#aa7a5a', floorColor: '#aa9a8a', accentColor: '#ccaa88' },
  invest: { width: 16, depth: 12, height: 6, wallColor: '#3a6a8a', floorColor: '#6a6a7e', accentColor: '#5a9aca' },
  home: { width: 14, depth: 10, height: 4, wallColor: '#c4a88a', floorColor: '#9a8a7a', accentColor: '#e8c89a' },
  life: { width: 18, depth: 14, height: 6, wallColor: '#8a5a8a', floorColor: '#8a7a8a', accentColor: '#bb88cc' },
};

// Furniture items that the player can interact with (sit on, use, etc.)
interface FurnitureItem {
  id: string;
  label: string;
  icon: string;
  position: [number, number, number];
  action: string;
}

function getFurnitureItems(buildingType: string): FurnitureItem[] {
  switch (buildingType) {
    case 'bank':
      return [
        { id: 'chair1', label: 'Sit & Wait', icon: 'chair', position: [-3, 0.3, -3], action: 'sit' },
        { id: 'chair2', label: 'Sit & Wait', icon: 'chair', position: [-1.5, 0.3, -3], action: 'sit' },
        { id: 'chair3', label: 'Sit & Wait', icon: 'chair', position: [1.5, 0.3, -3], action: 'sit' },
        { id: 'chair4', label: 'Sit & Wait', icon: 'chair', position: [3, 0.3, -3], action: 'sit' },
        { id: 'atm', label: 'Use ATM', icon: 'atm', position: [5, 1, -3], action: 'use_atm' },
      ];
    case 'office':
      return [
        { id: 'desk1', label: 'Work at Desk', icon: 'desk', position: [-4, 0.4, -2], action: 'work' },
        { id: 'desk2', label: 'Work at Desk', icon: 'desk', position: [0, 0.4, -2], action: 'work' },
        { id: 'desk3', label: 'Work at Desk', icon: 'desk', position: [4, 0.4, -2], action: 'work' },
        { id: 'cooler', label: 'Get Water', icon: 'water', position: [-6, 0.6, -3], action: 'drink' },
      ];
    case 'mall':
      return [
        { id: 'shelf1', label: 'Browse Products', icon: 'shelf', position: [-5, 0.75, -2], action: 'browse' },
        { id: 'shelf2', label: 'Browse Products', icon: 'shelf', position: [5, 0.75, -2], action: 'browse' },
        { id: 'counter', label: 'Checkout', icon: 'counter', position: [0, 0.6, 2], action: 'checkout' },
      ];
    case 'invest':
      return [
        { id: 'conf1', label: 'Take a Seat', icon: 'chair', position: [-2, 0.25, -2.3], action: 'sit' },
        { id: 'conf2', label: 'Take a Seat', icon: 'chair', position: [0, 0.25, -2.3], action: 'sit' },
        { id: 'conf3', label: 'Take a Seat', icon: 'chair', position: [2, 0.25, -2.3], action: 'sit' },
        { id: 'ticker', label: 'View Stock Ticker', icon: 'ticker', position: [0, 2, -5.8], action: 'view_stocks' },
      ];
    case 'home':
      return [
        { id: 'couch', label: 'Relax on Couch', icon: 'couch', position: [0, 0.3, -2], action: 'rest' },
        { id: 'bed', label: 'Sleep', icon: 'bed', position: [4, 0.3, 2], action: 'sleep' },
        { id: 'tv', label: 'Watch TV', icon: 'tv', position: [0, 1.2, -4.8], action: 'watch_tv' },
        { id: 'kitchen', label: 'Cook', icon: 'kitchen', position: [-5, 0.5, 2], action: 'cook' },
      ];
    case 'life':
      return [
        { id: 'seat1', label: 'Take a Seat', icon: 'chair', position: [-3, 0.2, 1], action: 'sit' },
        { id: 'seat2', label: 'Take a Seat', icon: 'chair', position: [-1, 0.2, 1], action: 'sit' },
        { id: 'seat3', label: 'Take a Seat', icon: 'chair', position: [1, 0.2, 1], action: 'sit' },
        { id: 'seat4', label: 'Take a Seat', icon: 'chair', position: [3, 0.2, 1], action: 'sit' },
        { id: 'stage', label: 'Go on Stage', icon: 'stage', position: [0, 0.3, -3], action: 'perform' },
      ];
    default:
      return [];
  }
}

function InteriorRoom({ config }: { config: { width: number; depth: number; height: number; wallColor: string; floorColor: string; accentColor: string } }) {
  const { width: w, depth: d, height: h, wallColor, floorColor, accentColor } = config;

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={floorColor} roughness={0.6} />
      </mesh>

      {/* Floor tiles pattern */}
      {Array.from({ length: Math.floor(w / 2) }).map((_, i) =>
        Array.from({ length: Math.floor(d / 2) }).map((_, j) => (
          <mesh key={`${i}-${j}`} rotation={[-Math.PI / 2, 0, 0]} position={[-w / 2 + 1 + i * 2, 0.01, -d / 2 + 1 + j * 2]}>
            <planeGeometry args={[1.9, 1.9]} />
            <meshStandardMaterial color={(i + j) % 2 === 0 ? floorColor : `${floorColor}aa`} roughness={0.5} />
          </mesh>
        ))
      )}

      {/* Back wall */}
      <mesh position={[0, h / 2, -d / 2]} receiveShadow castShadow>
        <boxGeometry args={[w, h, 0.2]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-w / 2, h / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.2, h, d]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>
      {/* Right wall */}
      <mesh position={[w / 2, h / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.2, h, d]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>
      {/* Front wall - only side pieces, leave door gap in center (NO full front wall, for cutaway view) */}
      <mesh position={[-w / 3 - 1, h / 2, d / 2]} receiveShadow castShadow>
        <boxGeometry args={[w / 3, h, 0.2]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>
      <mesh position={[w / 3 + 1, h / 2, d / 2]} receiveShadow castShadow>
        <boxGeometry args={[w / 3, h, 0.2]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>
      {/* Above door header */}
      <mesh position={[0, h - 0.5, d / 2]} receiveShadow castShadow>
        <boxGeometry args={[w / 3, 1, 0.2]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>

      {/* Baseboard accent along back wall */}
      <mesh position={[0, 0.15, -d / 2 + 0.11]}>
        <boxGeometry args={[w - 0.2, 0.3, 0.02]} />
        <meshStandardMaterial color={accentColor} roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Ceiling - only partial (cutaway for camera visibility) */}
      <mesh position={[0, h, -d / 4]} receiveShadow>
        <boxGeometry args={[w, 0.15, d / 2]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
      </mesh>

      {/* Ceiling lights */}
      {[-w / 4, w / 4].map(x =>
        [-d / 4, d / 8].map(z => (
          <mesh key={`${x}-${z}`} position={[x, h - 0.1, z]}>
            <boxGeometry args={[1.5, 0.05, 0.5]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffeecc" emissiveIntensity={0.8} />
          </mesh>
        ))
      )}

      {/* Door frame at front */}
      <mesh position={[-w / 6 - 0.5, h / 2, d / 2 + 0.05]}>
        <boxGeometry args={[0.15, h, 0.15]} />
        <meshStandardMaterial color={accentColor} roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[w / 6 + 0.5, h / 2, d / 2 + 0.05]}>
        <boxGeometry args={[0.15, h, 0.15]} />
        <meshStandardMaterial color={accentColor} roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0, h - 0.35, d / 2 + 0.05]}>
        <boxGeometry args={[w / 3 + 1, 0.15, 0.15]} />
        <meshStandardMaterial color={accentColor} roughness={0.3} metalness={0.4} />
      </mesh>
    </group>
  );
}

function InteriorFurniture({ buildingType }: { buildingType: string }) {
  const furniture = useMemo(() => {
    switch (buildingType) {
      case 'bank':
        return (
          <group>
            {/* Teller counter */}
            <mesh position={[0, 0.6, 1]} castShadow receiveShadow>
              <boxGeometry args={[6, 1.2, 0.6]} />
              <meshStandardMaterial color="#4a5a4a" roughness={0.6} />
            </mesh>
            <mesh position={[0, 1.25, 1]} castShadow>
              <boxGeometry args={[6.2, 0.1, 0.8]} />
              <meshStandardMaterial color="#6a8a6a" roughness={0.3} metalness={0.2} />
            </mesh>
            {/* Teller window dividers */}
            {[-2, 0, 2].map(x => (
              <mesh key={x} position={[x, 1.6, 1]} castShadow>
                <boxGeometry args={[0.1, 0.8, 0.1]} />
                <meshStandardMaterial color="#3a4a3a" roughness={0.5} />
              </mesh>
            ))}
            {/* Glass above counter */}
            <mesh position={[0, 1.6, 1]}>
              <boxGeometry args={[6, 0.8, 0.05]} />
              <meshStandardMaterial color="#88aabb" transparent opacity={0.3} roughness={0.1} metalness={0.8} />
            </mesh>
            {/* Waiting chairs */}
            {[-3, -1.5, 1.5, 3].map(x => (
              <group key={x} position={[x, 0, -3]}>
                <mesh position={[0, 0.25, 0]} castShadow>
                  <boxGeometry args={[0.7, 0.1, 0.7]} />
                  <meshStandardMaterial color="#5a4a3a" roughness={0.7} />
                </mesh>
                <mesh position={[0, 0.5, -0.3]} castShadow>
                  <boxGeometry args={[0.7, 0.5, 0.1]} />
                  <meshStandardMaterial color="#5a4a3a" roughness={0.7} />
                </mesh>
                <mesh position={[-0.3, 0.15, 0]} castShadow>
                  <boxGeometry args={[0.08, 0.3, 0.7]} />
                  <meshStandardMaterial color="#4a3a2a" roughness={0.7} />
                </mesh>
                <mesh position={[0.3, 0.15, 0]} castShadow>
                  <boxGeometry args={[0.08, 0.3, 0.7]} />
                  <meshStandardMaterial color="#4a3a2a" roughness={0.7} />
                </mesh>
              </group>
            ))}
            {/* Potted plant */}
            <mesh position={[-5, 0.3, -3]} castShadow>
              <cylinderGeometry args={[0.3, 0.25, 0.6, 8]} />
              <meshStandardMaterial color="#4a3a2a" roughness={0.8} />
            </mesh>
            <mesh position={[-5, 0.8, -3]} castShadow>
              <sphereGeometry args={[0.4, 10, 10]} />
              <meshStandardMaterial color="#2e7d32" roughness={0.8} />
            </mesh>
            {/* ATM */}
            <mesh position={[5, 1, -3]} castShadow>
              <boxGeometry args={[0.8, 2, 0.6]} />
              <meshStandardMaterial color="#3a3a3a" metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[5, 1.4, -2.68]}>
              <planeGeometry args={[0.5, 0.4]} />
              <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.4} />
            </mesh>
            {/* Welcome mat */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 4.5]}>
              <planeGeometry args={[1.5, 0.8]} />
              <meshStandardMaterial color="#8a4a2a" roughness={0.9} />
            </mesh>
          </group>
        );
      case 'office':
        return (
          <group>
            {/* Desks with chairs */}
            {[-4, 0, 4].map(x => (
              <group key={x} position={[x, 0, -2]}>
                {/* Desk top */}
                <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
                  <boxGeometry args={[1.5, 0.08, 0.8]} />
                  <meshStandardMaterial color="#5a4a3a" roughness={0.6} />
                </mesh>
                {/* Desk legs */}
                {[[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]].map((p, i) => (
                  <mesh key={i} position={[p[0], 0.2, p[1]]} castShadow>
                    <boxGeometry args={[0.08, 0.4, 0.08]} />
                    <meshStandardMaterial color="#4a3a2a" roughness={0.6} />
                  </mesh>
                ))}
                {/* Monitor */}
                <mesh position={[0, 0.55, -0.2]} castShadow>
                  <boxGeometry args={[0.6, 0.4, 0.05]} />
                  <meshStandardMaterial color="#1a1a1a" emissive="#3344aa" emissiveIntensity={0.3} />
                </mesh>
                {/* Monitor stand */}
                <mesh position={[0, 0.46, -0.2]} castShadow>
                  <boxGeometry args={[0.1, 0.04, 0.1]} />
                  <meshStandardMaterial color="#2a2a2a" roughness={0.5} />
                </mesh>
                {/* Keyboard */}
                <mesh position={[0, 0.45, 0.1]} castShadow>
                  <boxGeometry args={[0.4, 0.02, 0.15]} />
                  <meshStandardMaterial color="#2a2a2a" roughness={0.5} />
                </mesh>
                {/* Office chair */}
                <group position={[0, 0, 0.6]}>
                  <mesh position={[0, 0.25, 0]} castShadow>
                    <boxGeometry args={[0.5, 0.08, 0.5]} />
                    <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
                  </mesh>
                  <mesh position={[0, 0.45, -0.2]} castShadow>
                    <boxGeometry args={[0.5, 0.5, 0.08]} />
                    <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
                  </mesh>
                  <mesh position={[0, 0.5, -0.28]} castShadow>
                    <boxGeometry args={[0.4, 0.1, 0.05]} />
                    <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
                  </mesh>
                  {/* Chair pole */}
                  <mesh position={[0, 0.12, 0]} castShadow>
                    <cylinderGeometry args={[0.03, 0.03, 0.25, 6]} />
                    <meshStandardMaterial color="#3a3a3a" metalness={0.6} />
                  </mesh>
                  {/* Wheels */}
                  {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map((p, i) => (
                    <mesh key={i} position={[p[0], 0.03, p[1]]} castShadow>
                      <sphereGeometry args={[0.05, 6, 6]} />
                      <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
                    </mesh>
                  ))}
                </group>
              </group>
            ))}
            {/* Water cooler */}
            <mesh position={[-6, 0.6, -3]} castShadow>
              <cylinderGeometry args={[0.3, 0.3, 1.2, 8]} />
              <meshStandardMaterial color="#4488cc" transparent opacity={0.7} />
            </mesh>
            <mesh position={[-6, 1.25, -3]} castShadow>
              <boxGeometry args={[0.4, 0.15, 0.3]} />
              <meshStandardMaterial color="#3a3a3a" roughness={0.5} />
            </mesh>
            <mesh position={[-6, 1.15, -3.15]}>
              <cylinderGeometry args={[0.02, 0.02, 0.1, 6]} />
              <meshStandardMaterial color="#88aacc" />
            </mesh>
            {/* Filing cabinet */}
            <mesh position={[6, 0.6, -3]} castShadow>
              <boxGeometry args={[1, 1.2, 0.5]} />
              <meshStandardMaterial color="#4a4a5a" metalness={0.4} roughness={0.5} />
            </mesh>
            {[0.3, 0.7].map(y => (
              <mesh key={y} position={[6, y, -3.26]}>
                <boxGeometry args={[0.9, 0.04, 0.02]} />
                <meshStandardMaterial color="#2a2a3a" metalness={0.5} />
              </mesh>
            ))}
            {/* Whiteboard */}
            <mesh position={[0, 2, -5.85]} castShadow>
              <boxGeometry args={[4, 2, 0.1]} />
              <meshStandardMaterial color="#f0f0f0" roughness={0.3} />
            </mesh>
          </group>
        );
      case 'mall':
        return (
          <group>
            {/* Shop shelves with products */}
            {[-5, 5].map(x => (
              <group key={x} position={[x, 0, -2]}>
                {/* Shelf unit */}
                <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
                  <boxGeometry args={[1, 1.5, 4]} />
                  <meshStandardMaterial color="#6a5a4a" roughness={0.7} />
                </mesh>
                {/* Shelf boards */}
                {[0.3, 0.8, 1.3].map(y => (
                  <mesh key={y} position={[0, y, 0]} castShadow>
                    <boxGeometry args={[1.05, 0.04, 4.05]} />
                    <meshStandardMaterial color="#7a6a5a" roughness={0.6} />
                  </mesh>
                ))}
                {/* Products */}
                {[-1.5, 0, 1.5].map(z =>
                  [0.5, 1.0].map(y => (
                    <mesh key={`${z}-${y}`} position={[0, y, z]} castShadow>
                      <boxGeometry args={[0.7, 0.3, 0.3]} />
                      <meshStandardMaterial color={['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#e67e22'][(z + 1.5) * 2 + (y > 0.7 ? 1 : 0)]} roughness={0.5} />
                    </mesh>
                  ))
                )}
              </group>
            ))}
            {/* Checkout counter */}
            <mesh position={[0, 0.6, 2]} castShadow receiveShadow>
              <boxGeometry args={[3, 1.2, 0.6]} />
              <meshStandardMaterial color="#7a5a3a" roughness={0.6} />
            </mesh>
            <mesh position={[0, 1.25, 2]} castShadow>
              <boxGeometry args={[3.1, 0.08, 0.7]} />
              <meshStandardMaterial color="#9a7a5a" roughness={0.4} />
            </mesh>
            {/* Cash register */}
            <mesh position={[0, 1.35, 2]} castShadow>
              <boxGeometry args={[0.5, 0.2, 0.35]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.5} />
            </mesh>
            <mesh position={[0, 1.42, 1.82]}>
              <planeGeometry args={[0.3, 0.1]} />
              <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.3} />
            </mesh>
            {/* Mannequin */}
            <mesh position={[-6, 0.9, 2]} castShadow>
              <cylinderGeometry args={[0.15, 0.2, 1.8, 8]} />
              <meshStandardMaterial color="#ddd" roughness={0.4} />
            </mesh>
            <mesh position={[-6, 1.9, 2]} castShadow>
              <sphereGeometry args={[0.18, 10, 10]} />
              <meshStandardMaterial color="#ddd" roughness={0.4} />
            </mesh>
            {/* Clothing rack */}
            <mesh position={[6, 1, 2]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 2, 6]} />
              <meshStandardMaterial color="#3a3a3a" metalness={0.6} />
            </mesh>
            <mesh position={[6, 0.05, 1.8]} castShadow>
              <boxGeometry args={[0.4, 0.1, 0.4]} />
              <meshStandardMaterial color="#2a2a2a" />
            </mesh>
            <mesh position={[6, 0.05, 2.2]} castShadow>
              <boxGeometry args={[0.4, 0.1, 0.4]} />
              <meshStandardMaterial color="#2a2a2a" />
            </mesh>
            {/* Hanging clothes */}
            {[-0.5, 0, 0.5].map(z => (
              <mesh key={z} position={[6, 0.7, 2 + z]} castShadow>
                <boxGeometry args={[0.3, 0.6, 0.15]} />
                <meshStandardMaterial color={['#e74c3c', '#3498db', '#2ecc71'][Math.floor((z + 0.5) * 3)]} roughness={0.7} />
              </mesh>
            ))}
          </group>
        );
      case 'invest':
        return (
          <group>
            {/* Conference table */}
            <mesh position={[0, 0.4, -1]} castShadow receiveShadow>
              <boxGeometry args={[5, 0.1, 2.5]} />
              <meshStandardMaterial color="#3a2a1a" roughness={0.4} metalness={0.2} />
            </mesh>
            {/* Table base */}
            <mesh position={[0, 0.2, -1]} castShadow>
              <boxGeometry args={[3, 0.3, 1]} />
              <meshStandardMaterial color="#2a1a0a" roughness={0.5} />
            </mesh>
            {/* Chairs around table */}
            {[-2, 0, 2].map(x => (
              <group key={`c-${x}`} position={[x, 0, -2.3]}>
                <mesh position={[0, 0.25, 0]} castShadow>
                  <boxGeometry args={[0.6, 0.08, 0.6]} />
                  <meshStandardMaterial color="#1a1a2a" roughness={0.6} />
                </mesh>
                <mesh position={[0, 0.5, -0.25]} castShadow>
                  <boxGeometry args={[0.6, 0.5, 0.08]} />
                  <meshStandardMaterial color="#1a1a2a" roughness={0.6} />
                </mesh>
                <mesh position={[-0.25, 0.12, 0]} castShadow>
                  <boxGeometry args={[0.08, 0.24, 0.6]} />
                  <meshStandardMaterial color="#1a1a2a" roughness={0.6} />
                </mesh>
                <mesh position={[0.25, 0.12, 0]} castShadow>
                  <boxGeometry args={[0.08, 0.24, 0.6]} />
                  <meshStandardMaterial color="#1a1a2a" roughness={0.6} />
                </mesh>
              </group>
            ))}
            {[-2, 0, 2].map(x => (
              <group key={`c2-${x}`} position={[x, 0, 0.3]}>
                <mesh position={[0, 0.25, 0]} castShadow>
                  <boxGeometry args={[0.6, 0.08, 0.6]} />
                  <meshStandardMaterial color="#1a1a2a" roughness={0.6} />
                </mesh>
                <mesh position={[0, 0.5, 0.25]} castShadow>
                  <boxGeometry args={[0.6, 0.5, 0.08]} />
                  <meshStandardMaterial color="#1a1a2a" roughness={0.6} />
                </mesh>
                <mesh position={[-0.25, 0.12, 0]} castShadow>
                  <boxGeometry args={[0.08, 0.24, 0.6]} />
                  <meshStandardMaterial color="#1a1a2a" roughness={0.6} />
                </mesh>
                <mesh position={[0.25, 0.12, 0]} castShadow>
                  <boxGeometry args={[0.08, 0.24, 0.6]} />
                  <meshStandardMaterial color="#1a1a2a" roughness={0.6} />
                </mesh>
              </group>
            ))}
            {/* Stock ticker screen */}
            <mesh position={[0, 2, -5.85]} castShadow>
              <boxGeometry args={[4, 1.5, 0.1]} />
              <meshStandardMaterial color="#1a1a1a" emissive="#00ff88" emissiveIntensity={0.4} />
            </mesh>
            {/* Ticker text lines */}
            {[-0.5, 0, 0.5].map(y => (
              <mesh key={y} position={[0, 2 + y, -5.79]}>
                <planeGeometry args={[3.8, 0.3]} />
                <meshStandardMaterial color="#003322" emissive="#00ff88" emissiveIntensity={0.2} />
              </mesh>
            ))}
            {/* Bookshelf */}
            <mesh position={[-7, 1, -3]} castShadow receiveShadow>
              <boxGeometry args={[0.5, 2, 3]} />
              <meshStandardMaterial color="#4a3a2a" roughness={0.7} />
            </mesh>
            {[0.5, 1, 1.5].map(y => (
              <mesh key={y} position={[-7, y, -3]}>
                <boxGeometry args={[0.52, 0.04, 3.02]} />
                <meshStandardMaterial color="#5a4a3a" roughness={0.6} />
              </mesh>
            ))}
            {/* Books */}
            {[-1, -0.5, 0, 0.5, 1].map((z, i) => (
              <mesh key={i} position={[-7, 0.75, z]} castShadow>
                <boxGeometry args={[0.35, 0.4, 0.12]} />
                <meshStandardMaterial color={['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'][i]} roughness={0.6} />
              </mesh>
            ))}
            {[-1, -0.5, 0, 0.5, 1].map((z, i) => (
              <mesh key={`b2-${i}`} position={[-7, 1.25, z]} castShadow>
                <boxGeometry args={[0.35, 0.4, 0.12]} />
                <meshStandardMaterial color={['#9b59b6', '#e67e22', '#1abc9c', '#34495e', '#e84393'][i]} roughness={0.6} />
              </mesh>
            ))}
            {/* Globe */}
            <mesh position={[6, 0.8, -3]} castShadow>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshStandardMaterial color="#2a6a4a" roughness={0.5} />
            </mesh>
            <mesh position={[6, 0.4, -3]} castShadow>
              <cylinderGeometry args={[0.04, 0.08, 0.3, 6]} />
              <meshStandardMaterial color="#3a3a3a" metalness={0.5} />
            </mesh>
          </group>
        );
      case 'home':
        return (
          <group>
            {/* Couch */}
            <group position={[0, 0, -2]}>
              <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
                <boxGeometry args={[3, 0.4, 1]} />
                <meshStandardMaterial color="#5a4a6a" roughness={0.7} />
              </mesh>
              {/* Back rest */}
              <mesh position={[0, 0.6, -0.4]} castShadow>
                <boxGeometry args={[3, 0.6, 0.2]} />
                <meshStandardMaterial color="#5a4a6a" roughness={0.7} />
              </mesh>
              {/* Arm rests */}
              <mesh position={[-1.5, 0.5, 0]} castShadow>
                <boxGeometry args={[0.2, 0.5, 1]} />
                <meshStandardMaterial color="#4a3a5a" roughness={0.7} />
              </mesh>
              <mesh position={[1.5, 0.5, 0]} castShadow>
                <boxGeometry args={[0.2, 0.5, 1]} />
                <meshStandardMaterial color="#4a3a5a" roughness={0.7} />
              </mesh>
              {/* Cushions */}
              <mesh position={[-0.7, 0.55, 0.05]} castShadow>
                <boxGeometry args={[1.2, 0.15, 0.8]} />
                <meshStandardMaterial color="#6a5a7a" roughness={0.6} />
              </mesh>
              <mesh position={[0.7, 0.55, 0.05]} castShadow>
                <boxGeometry args={[1.2, 0.15, 0.8]} />
                <meshStandardMaterial color="#6a5a7a" roughness={0.6} />
              </mesh>
            </group>
            {/* TV stand */}
            <mesh position={[0, 0.3, -4.8]} castShadow>
              <boxGeometry args={[2.8, 0.6, 0.4]} />
              <meshStandardMaterial color="#4a3a2a" roughness={0.6} />
            </mesh>
            {/* TV */}
            <mesh position={[0, 1.2, -4.8]} castShadow>
              <boxGeometry args={[2.5, 1.4, 0.1]} />
              <meshStandardMaterial color="#1a1a1a" emissive="#3344aa" emissiveIntensity={0.3} />
            </mesh>
            {/* TV frame */}
            <mesh position={[0, 1.2, -4.83]}>
              <boxGeometry args={[2.6, 1.5, 0.04]} />
              <meshStandardMaterial color="#0a0a0a" roughness={0.3} metalness={0.5} />
            </mesh>
            {/* Coffee table */}
            <mesh position={[0, 0.2, -0.5]} castShadow>
              <boxGeometry args={[1.5, 0.1, 0.8]} />
              <meshStandardMaterial color="#4a3a2a" roughness={0.6} />
            </mesh>
            {[[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]].map((p, i) => (
              <mesh key={i} position={[p[0], 0.1, p[1]]} castShadow>
                <boxGeometry args={[0.08, 0.2, 0.08]} />
                <meshStandardMaterial color="#3a2a1a" roughness={0.6} />
              </mesh>
            ))}
            {/* Kitchen counter */}
            <mesh position={[-5, 0.5, 2]} castShadow receiveShadow>
              <boxGeometry args={[2, 1, 0.6]} />
              <meshStandardMaterial color="#6a6a6a" roughness={0.5} />
            </mesh>
            <mesh position={[-5, 1.02, 2]} castShadow>
              <boxGeometry args={[2.1, 0.06, 0.7]} />
              <meshStandardMaterial color="#8a8a8a" roughness={0.3} metalness={0.2} />
            </mesh>
            {/* Stove burners */}
            {[-5.4, -4.6].map(x => (
              <mesh key={x} position={[x, 1.05, 2]}>
                <cylinderGeometry args={[0.12, 0.12, 0.02, 8]} />
                <meshStandardMaterial color="#2a2a2a" roughness={0.4} />
              </mesh>
            ))}
            {/* Bed */}
            <group position={[4, 0, 2]}>
              <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
                <boxGeometry args={[2, 0.5, 1.5]} />
                <meshStandardMaterial color="#5a4a3a" roughness={0.7} />
              </mesh>
              {/* Mattress */}
              <mesh position={[0, 0.55, 0]} castShadow>
                <boxGeometry args={[1.9, 0.2, 1.4]} />
                <meshStandardMaterial color="#ddd" roughness={0.8} />
              </mesh>
              {/* Pillow */}
              <mesh position={[0, 0.7, -0.5]} castShadow>
                <boxGeometry args={[1.6, 0.12, 0.4]} />
                <meshStandardMaterial color="#fff" roughness={0.9} />
              </mesh>
              {/* Blanket */}
              <mesh position={[0, 0.62, 0.3]} castShadow>
                <boxGeometry args={[1.85, 0.08, 0.8]} />
                <meshStandardMaterial color="#7a6a8a" roughness={0.8} />
              </mesh>
              {/* Headboard */}
              <mesh position={[0, 0.7, -0.8]} castShadow>
                <boxGeometry args={[2, 0.8, 0.1]} />
                <meshStandardMaterial color="#4a3a2a" roughness={0.6} />
              </mesh>
            </group>
            {/* Rug */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -1]}>
              <planeGeometry args={[3.5, 2.5]} />
              <meshStandardMaterial color="#8a6a5a" roughness={0.9} />
            </mesh>
            {/* Lamp */}
            <mesh position={[5.5, 0, -3]} castShadow>
              <cylinderGeometry args={[0.15, 0.2, 0.05, 8]} />
              <meshStandardMaterial color="#3a3a3a" />
            </mesh>
            <mesh position={[5.5, 1.2, -3]}>
              <cylinderGeometry args={[0.02, 0.02, 2.4, 4]} />
              <meshStandardMaterial color="#3a3a3a" />
            </mesh>
            <mesh position={[5.5, 2.3, -3]} castShadow>
              <coneGeometry args={[0.25, 0.35, 8]} />
              <meshStandardMaterial color="#ccaa66" emissive="#ffcc66" emissiveIntensity={0.3} />
            </mesh>
          </group>
        );
      case 'life':
        return (
          <group>
            {/* Stage */}
            <mesh position={[0, 0.3, -3]} castShadow receiveShadow>
              <boxGeometry args={[6, 0.6, 2]} />
              <meshStandardMaterial color="#5a3a5a" roughness={0.6} />
            </mesh>
            {/* Stage front trim */}
            <mesh position={[0, 0.05, -2]} castShadow>
              <boxGeometry args={[6.1, 0.1, 0.1]} />
              <meshStandardMaterial color="#7a5a7a" roughness={0.5} metalness={0.3} />
            </mesh>
            {/* Speaker stacks */}
            {[-4, 4].map(x => (
              <group key={x} position={[x, 0, -4]}>
                <mesh position={[0, 1, 0]} castShadow>
                  <boxGeometry args={[0.8, 2, 0.8]} />
                  <meshStandardMaterial color="#2a2a2a" roughness={0.5} />
                </mesh>
                {/* Speaker cones */}
                {[0.5, 1.2, 1.7].map(y => (
                  <mesh key={y} position={[0, y, 0.41]}>
                    <cylinderGeometry args={[0.2, 0.2, 0.02, 12]} />
                    <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
                  </mesh>
                ))}
              </group>
            ))}
            {/* Seating */}
            {[-3, -1, 1, 3].map(x => (
              <group key={x} position={[x, 0, 1]}>
                <mesh position={[0, 0.2, 0]} castShadow>
                  <boxGeometry args={[0.9, 0.08, 0.8]} />
                  <meshStandardMaterial color="#6a4a5a" roughness={0.7} />
                </mesh>
                <mesh position={[0, 0.4, -0.35]} castShadow>
                  <boxGeometry args={[0.9, 0.4, 0.08]} />
                  <meshStandardMaterial color="#6a4a5a" roughness={0.7} />
                </mesh>
                <mesh position={[-0.4, 0.1, 0]} castShadow>
                  <boxGeometry args={[0.08, 0.2, 0.8]} />
                  <meshStandardMaterial color="#4a3a4a" roughness={0.7} />
                </mesh>
                <mesh position={[0.4, 0.1, 0]} castShadow>
                  <boxGeometry args={[0.08, 0.2, 0.8]} />
                  <meshStandardMaterial color="#4a3a4a" roughness={0.7} />
                </mesh>
              </group>
            ))}
            {/* Decorative hanging lights */}
            {[-5, -2.5, 0, 2.5, 5].map((x, i) => (
              <group key={x} position={[x, 0, 0]}>
                <mesh position={[0, 3.5, 0]}>
                  <cylinderGeometry args={[0.01, 0.01, 1, 4]} />
                  <meshStandardMaterial color="#3a3a3a" />
                </mesh>
                <mesh position={[0, 2.8, 0]} castShadow>
                  <sphereGeometry args={[0.15, 8, 8]} />
                  <meshStandardMaterial color="#ff66cc" emissive="#ff66cc" emissiveIntensity={0.8} />
                </mesh>
                <pointLight position={[0, 2.8, 0]} intensity={0.2} distance={4} color="#ff66cc" />
              </group>
            ))}
            {/* DJ booth */}
            <mesh position={[0, 0.5, -3.5]} castShadow>
              <boxGeometry args={[2, 1, 0.6]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
            </mesh>
            <mesh position={[0, 1.05, -3.5]} castShadow>
              <boxGeometry args={[1.8, 0.1, 0.5]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.3} />
            </mesh>
            {/* DJ equipment */}
            <mesh position={[-0.4, 1.12, -3.5]}>
              <boxGeometry args={[0.5, 0.04, 0.3]} />
              <meshStandardMaterial color="#1a1a1a" emissive="#00ff88" emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[0.4, 1.12, -3.5]}>
              <boxGeometry args={[0.5, 0.04, 0.3]} />
              <meshStandardMaterial color="#1a1a1a" emissive="#ff4488" emissiveIntensity={0.3} />
            </mesh>
          </group>
        );
      default:
        return null;
    }
  }, [buildingType]);

  return <>{furniture}</>;
}

// Door component that animates opening
function InteriorDoor({ isOpen, config }: { isOpen: boolean; config: { width: number; depth: number; height: number; accentColor: string } }) {
  const leftDoorRef = useRef<THREE.Group>(null);
  const rightDoorRef = useRef<THREE.Group>(null);
  const doorOpenness = useRef(0);

  useFrame((_, delta) => {
    const target = isOpen ? 1 : 0;
    doorOpenness.current += (target - doorOpenness.current) * delta * 4;
    const angle = doorOpenness.current * Math.PI * 0.4;
    if (leftDoorRef.current) leftDoorRef.current.rotation.y = angle;
    if (rightDoorRef.current) rightDoorRef.current.rotation.y = -angle;
  });

  const doorH = 2.2;
  const doorW = 0.6;
  const z = config.depth / 2 + 0.06;

  return (
    <group>
      {/* Left door */}
      <group ref={leftDoorRef} position={[-doorW / 2, 0, z]}>
        <mesh position={[0, doorH / 2, 0]} castShadow>
          <boxGeometry args={[doorW, doorH, 0.06]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.4} emissive="#222244" emissiveIntensity={0.15} />
        </mesh>
        {/* Door handle */}
        <mesh position={[doorW / 2 - 0.08, doorH / 2, 0.04]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#cccccc" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Glass panel */}
        <mesh position={[0, doorH * 0.65, 0.01]}>
          <planeGeometry args={[doorW * 0.7, doorH * 0.4]} />
          <meshStandardMaterial color="#88aabb" transparent opacity={0.3} roughness={0.1} metalness={0.8} />
        </mesh>
      </group>
      {/* Right door */}
      <group ref={rightDoorRef} position={[doorW / 2, 0, z]}>
        <mesh position={[0, doorH / 2, 0]} castShadow>
          <boxGeometry args={[doorW, doorH, 0.06]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.4} emissive="#222244" emissiveIntensity={0.15} />
        </mesh>
        <mesh position={[-doorW / 2 + 0.08, doorH / 2, 0.04]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#cccccc" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, doorH * 0.65, 0.01]}>
          <planeGeometry args={[doorW * 0.7, doorH * 0.4]} />
          <meshStandardMaterial color="#88aabb" transparent opacity={0.3} roughness={0.1} metalness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

function InteriorPlayer({ playerName, playerRef }: { playerName: string; playerRef: React.MutableRefObject<THREE.Vector3> }) {
  const groupRef = useRef<THREE.Group>(null);
  const armRefL = useRef<THREE.Group>(null);
  const armRefR = useRef<THREE.Group>(null);
  const legRefL = useRef<THREE.Group>(null);
  const legRefR = useRef<THREE.Group>(null);
  const walkPhase = useRef(0);
  const playerObj = useRef(new THREE.Vector3(0, 0, 3.5));
  const rot = useRef(Math.PI);
  const sittingRef = useRef(false);
  const sittingPosRef = useRef<[number, number, number] | null>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent, down: boolean) => {
      const k = (window as any).__interiorKeys || ((window as any).__interiorKeys = {});
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': k.forward = down; if (down) sittingRef.current = false; break;
        case 'KeyS': case 'ArrowDown': k.backward = down; if (down) sittingRef.current = false; break;
        case 'KeyA': case 'ArrowLeft': k.left = down; if (down) sittingRef.current = false; break;
        case 'KeyD': case 'ArrowRight': k.right = down; if (down) sittingRef.current = false; break;
      }
    };
    const kd = (e: KeyboardEvent) => handleKey(e, true);
    const ku = (e: KeyboardEvent) => handleKey(e, false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  useFrame((_, delta) => {
    if (sittingRef.current && sittingPosRef.current) {
      // Sit on furniture
      playerObj.current.set(sittingPosRef.current[0], 0, sittingPosRef.current[2]);
      if (groupRef.current) {
        groupRef.current.position.copy(playerObj.current);
        groupRef.current.rotation.y = 0;
      }
      // Relax arms
      if (armRefL.current) armRefL.current.rotation.x = 0.2;
      if (armRefR.current) armRefR.current.rotation.x = 0.2;
      if (legRefL.current) legRefL.current.rotation.x = -0.6;
      if (legRefR.current) legRefR.current.rotation.x = -0.6;
    } else {
      const k = (window as any).__interiorKeys || {};
      const speed = 4 * delta;
      let dx = 0, dz = 0;
      if (k.forward) dz -= speed;
      if (k.backward) dz += speed;
      if (k.left) dx -= speed;
      if (k.right) dx += speed;
      if (moveState.active) { dx += moveState.x * speed * 1.2; dz += moveState.z * speed * 1.2; }

      const moved = dx !== 0 || dz !== 0;
      if (moved) {
        const targetRot = Math.atan2(dx, -dz);
        let diff = targetRot - rot.current;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        rot.current += diff * 0.25;
        walkPhase.current += delta * 10;
      }

      playerObj.current.x = Math.max(-6, Math.min(6, playerObj.current.x + dx));
      playerObj.current.z = Math.max(-4, Math.min(4, playerObj.current.z + dz));

      if (groupRef.current) {
        groupRef.current.position.copy(playerObj.current);
        groupRef.current.rotation.y = rot.current;
      }
      const swing = Math.sin(walkPhase.current) * 0.35;
      if (legRefL.current) legRefL.current.rotation.x = swing;
      if (legRefR.current) legRefR.current.rotation.x = -swing;
      if (armRefL.current) armRefL.current.rotation.x = -swing * 0.6;
      if (armRefR.current) armRefR.current.rotation.x = swing * 0.6;
    }

    playerRef.current.copy(playerObj.current);
    forceUpdate(v => v + 1);
  });

  // Expose sit function via ref
  (groupRef as any).current?.sit?.();

  return (
    <group ref={groupRef} position={[0, 0, 3.5]} rotation={[0, Math.PI, 0]}>
      <FaceMesh skinColor="#f4c2a1" hairColor="#2a1a0a" />
      <mesh castShadow position={[0, 1.05, 0]}>
        <boxGeometry args={[0.46, 0.65, 0.28]} />
        <meshStandardMaterial color="#2a7c9c" roughness={0.55} />
      </mesh>
      <mesh castShadow position={[0, 1.1, -0.2]}>
        <boxGeometry args={[0.32, 0.45, 0.18]} />
        <meshStandardMaterial color="#3a4a5a" roughness={0.7} />
      </mesh>
      <group ref={armRefL} position={[0.3, 1.32, 0]}>
        <mesh castShadow position={[0, -0.25, 0]}>
          <boxGeometry args={[0.13, 0.55, 0.13]} />
          <meshStandardMaterial color="#2a7c9c" roughness={0.55} />
        </mesh>
      </group>
      <group ref={armRefR} position={[-0.3, 1.32, 0]}>
        <mesh castShadow position={[0, -0.25, 0]}>
          <boxGeometry args={[0.13, 0.55, 0.13]} />
          <meshStandardMaterial color="#2a7c9c" roughness={0.55} />
        </mesh>
      </group>
      <group ref={legRefL} position={[0.13, 0.72, 0]}>
        <mesh castShadow position={[0, -0.3, 0]}>
          <boxGeometry args={[0.15, 0.6, 0.15]} />
          <meshStandardMaterial color="#1a3a5a" roughness={0.65} />
        </mesh>
      </group>
      <group ref={legRefR} position={[-0.13, 0.72, 0]}>
        <mesh castShadow position={[0, -0.3, 0]}>
          <boxGeometry args={[0.15, 0.6, 0.15]} />
          <meshStandardMaterial color="#1a3a5a" roughness={0.65} />
        </mesh>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.4, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.2} />
      </mesh>

      <Html position={[0, 2.3, 0]} center distanceFactor={10} occlude={false}>
        <div className="pointer-events-none select-none">
          <div className="px-2.5 py-1 rounded-full bg-blue-600/90 backdrop-blur-sm border border-blue-300/40 text-white text-xs font-bold whitespace-nowrap shadow-lg">
            {playerName}
          </div>
        </div>
      </Html>
    </group>
  );
}

// Interactive furniture markers
function FurnitureMarkers({ items, onInteract }: { items: FurnitureItem[]; onInteract: (item: FurnitureItem) => void }) {
  return (
    <>
      {items.map(item => (
        <Html key={item.id} position={item.position} center distanceFactor={10} occlude={false}>
          <button
            onClick={(e) => { e.stopPropagation(); onInteract(item); }}
            className="pointer-events-auto select-none cursor-pointer group"
          >
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-amber-500/80 border-2 border-amber-300 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-400 transition-all shadow-lg">
                <div className="w-3 h-3 rounded-full bg-white" />
              </div>
              <div className="mt-1 px-2 py-0.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-400 text-[9px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                {item.label}
              </div>
            </div>
          </button>
        </Html>
      ))}
    </>
  );
}

export default function InteriorScene({ buildingType, buildingName, buildingIcon, playerName, onTalk, onExit }: InteriorSceneProps) {
  const config = INTERIOR_CONFIG[buildingType] ?? INTERIOR_CONFIG.office;
  const npcs = BUILDING_NPCS[buildingType] ?? [];
  const playerRef = useRef(new THREE.Vector3(0, 0, 3.5));
  const [doorOpen, setDoorOpen] = useState(false);
  const [entering, setEntering] = useState(true);
  const [interactMessage, setInteractMessage] = useState<string | null>(null);
  const furnitureItems = useMemo(() => getFurnitureItems(buildingType), [buildingType]);

  // Door opening sequence
  useEffect(() => {
    const t1 = setTimeout(() => setDoorOpen(true), 400);
    const t2 = setTimeout(() => setEntering(false), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleJoystickMove = (dx: number, dz: number) => {
    moveState.x = dx; moveState.z = dz; moveState.active = true;
  };
  const handleJoystickEnd = () => {
    moveState.active = false; moveState.x = 0; moveState.z = 0;
  };

  const handleFurnitureInteract = useCallback((item: FurnitureItem) => {
    sfxClick();
    const messages: Record<string, string> = {
      sit: 'You take a seat and relax.',
      sleep: 'You lie down and rest. Energy restored!',
      rest: 'You relax on the couch. Happiness +5',
      work: 'You sit at the desk and get to work.',
      drink: 'You grab a cup of water. Refreshing!',
      browse: 'You browse the products on the shelf.',
      checkout: 'You head to the checkout counter.',
      view_stocks: 'You check the latest stock prices.',
      watch_tv: 'You watch some TV. Happiness +3',
      cook: 'You cook a meal. Energy +10',
      perform: 'You step on stage and feel the energy!',
    };
    setInteractMessage(messages[item.action] ?? 'You interact with the furniture.');
    setTimeout(() => setInteractMessage(null), 2500);
  }, []);

  return (
    <div className="fixed inset-0 z-40 bg-slate-950">
      {/* 3D Interior Canvas */}
      <div className="absolute inset-0">
        <Canvas shadows camera={{ position: [0, 9, 10], fov: 50 }} gl={{ antialias: true }}>
          <color attach="background" args={['#1a1a2e']} />
          <fog attach="fog" args={['#1a1a2e', 20, 35]} />
          <ambientLight intensity={0.6} color="#ffeecc" />
          <directionalLight position={[5, 8, 5]} intensity={0.5} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
          <pointLight position={[0, config.height - 0.5, 0]} intensity={1.2} distance={20} color="#ffeecc" castShadow />
          <pointLight position={[-config.width / 3, config.height - 0.5, -config.depth / 3]} intensity={0.6} distance={12} color="#ffeecc" />
          <pointLight position={[config.width / 3, config.height - 0.5, config.depth / 3]} intensity={0.6} distance={12} color="#ffeecc" />
          <pointLight position={[0, config.height - 0.5, config.depth / 2]} intensity={0.4} distance={10} color="#ffeecc" />
          <InteriorRoom config={config} />
          <InteriorFurniture buildingType={buildingType} />
          <InteriorDoor isOpen={doorOpen} config={config} />
          <InteriorPlayer playerName={playerName} playerRef={playerRef} />
          {npcs.map(npc => (
            <NPC key={npc.id} data={npc} onTalk={onTalk} />
          ))}
          <FurnitureMarkers items={furnitureItems} onInteract={handleFurnitureInteract} />
          <OrbitFollowCamera targetRef={playerRef} followHeight={6} followDistance={10} />
        </Canvas>
      </div>

      {/* Entering overlay */}
      {entering && (
        <div className="absolute inset-0 z-40 bg-slate-950/80 flex items-center justify-center pointer-events-none">
          <div className="text-center" style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <DoorOpen size={48} className="text-amber-400 mx-auto mb-3" />
            <p className="text-white font-bold text-lg">Entering {buildingName}...</p>
          </div>
        </div>
      )}

      {/* Interaction message */}
      {interactMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30" style={{ animation: 'slideUp 0.3s ease-out' }}>
          <div className="px-4 py-2.5 bg-slate-900/90 backdrop-blur-md border border-amber-500/30 rounded-xl text-amber-400 text-sm font-bold shadow-lg">
            {interactMessage}
          </div>
        </div>
      )}

      {/* Exit button */}
      <button
        onClick={() => { sfxClick(); setDoorOpen(false); setTimeout(onExit, 300); }}
        className="absolute top-4 left-4 z-30 flex items-center gap-2 px-4 py-2.5 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl text-white font-bold text-sm hover:bg-slate-800/90 transition-colors"
      >
        <ChevronLeft size={18} />
        Exit Building
      </button>

      {/* Building name banner */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2 px-4 py-2.5 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl">
        <span className="text-xl">{buildingIcon}</span>
        <span className="text-white font-bold text-sm">{buildingName}</span>
      </div>

      {/* Touch joystick - visible on all touch devices */}
      <div className="absolute bottom-6 left-4 z-30 touch-joystick" data-joystick>
        <Joystick onMove={handleJoystickMove} onEnd={handleJoystickEnd} />
      </div>

      {/* Desktop controls hint */}
      <div className="absolute bottom-4 left-4 z-30 bg-slate-950/70 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10 non-touch-only">
        <span className="text-xs text-slate-400">
          <kbd className="px-1 py-0.5 bg-white/10 rounded text-[10px] font-bold">WASD</kbd> move · Drag mouse to look · Click NPCs to talk · Click glowing markers to interact
        </span>
      </div>

      {/* Touch controls hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-slate-950/70 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10 touch-only hidden">
        <span className="text-xs text-slate-400">
          Joystick to move · Drag screen to look · Tap NPCs to talk · Tap glowing markers to interact
        </span>
      </div>

      <style>{`
        @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes slideUp { 0% { transform: translateY(20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

function sfxClick() {
  // Lightweight click sound without importing sfx module
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.05;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.stop(ctx.currentTime + 0.1);
  } catch {}
}
