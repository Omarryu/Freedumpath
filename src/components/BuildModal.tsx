import { useState, useRef, useEffect } from 'react';
import { X, Building2, Home, Store, Factory, Trees, Landmark, Wallet, MapPin, Check, Lock } from 'lucide-react';
import type { PlacedBuilding } from '../types';
import { sfx } from '../sfx';
import { BUILDINGS } from './world/Buildings';

interface Props {
  cash: number;
  existingCustom: PlacedBuilding[];
  onBuyLand: (cost: number) => void;
  onPlace: (building: Omit<PlacedBuilding, 'id' | 'builtMonth'>) => void;
  onClose: () => void;
}

const COST = 5000;
const LAND_COST = 10000;

const BUILDING_TYPES = [
  { type: 'home', name: 'Home', icon: '🏠', color: '#d4a574', roofColor: '#8b4513', size: [3, 2.5, 3] as [number, number, number], desc: 'A cozy residential home' },
  { type: 'shop', name: 'Shop', icon: '🏪', color: '#e8a87c', roofColor: '#c0392b', size: [3, 2, 3] as [number, number, number], desc: 'A small retail shop' },
  { type: 'office', name: 'Office', icon: '🏢', color: '#778899', roofColor: '#2c3e50', size: [3, 4, 3] as [number, number, number], desc: 'An office building' },
  { type: 'factory', name: 'Factory', icon: '🏭', color: '#888888', roofColor: '#555555', size: [4, 2.5, 3] as [number, number, number], desc: 'A production factory' },
  { type: 'park', name: 'Park', icon: '🌳', color: '#3a6a3a', roofColor: '#2e7d32', size: [3, 0.2, 3] as [number, number, number], desc: 'A green park space' },
  { type: 'tower', name: 'Tower', icon: '🏛️', color: '#bdc3c7', roofColor: '#34495e', size: [3, 6, 3] as [number, number, number], desc: 'A tall tower building' },
];

// Land plots beyond current city boundaries — organized in rings
// Current city spans roughly -24..24 X, -24..24 Z
const LAND_PLOTS: { id: string; position: [number, number, number]; label: string; region: string }[] = [
  // Ring 1 — just beyond current boundary
  { id: 'r1_n1', position: [0, 0, 30], label: 'North Gate', region: 'North District' },
  { id: 'r1_n2', position: [10, 0, 30], label: 'North-East Outpost', region: 'North District' },
  { id: 'r1_n3', position: [-10, 0, 30], label: 'North-West Outpost', region: 'North District' },
  { id: 'r1_e1', position: [30, 0, 0], label: 'East Gate', region: 'East District' },
  { id: 'r1_e2', position: [30, 0, 10], label: 'East-Port', region: 'East District' },
  { id: 'r1_e3', position: [30, 0, -10], label: 'East-Industrial', region: 'East District' },
  { id: 'r1_s1', position: [0, 0, -30], label: 'South Gate', region: 'South District' },
  { id: 'r1_s2', position: [10, 0, -30], label: 'South-Port', region: 'South District' },
  { id: 'r1_s3', position: [-10, 0, -30], label: 'South-Residential', region: 'South District' },
  { id: 'r1_w1', position: [-30, 0, 0], label: 'West Gate', region: 'West District' },
  { id: 'r1_w2', position: [-30, 0, 10], label: 'West-Hills', region: 'West District' },
  { id: 'r1_w3', position: [-30, 0, -10], label: 'West-Meadows', region: 'West District' },
  // Ring 2 — further out
  { id: 'r2_ne', position: [40, 0, 40], label: 'Far North-East', region: 'Frontier' },
  { id: 'r2_nw', position: [-40, 0, 40], label: 'Far North-West', region: 'Frontier' },
  { id: 'r2_se', position: [40, 0, -40], label: 'Far South-East', region: 'Frontier' },
  { id: 'r2_sw', position: [-40, 0, -40], label: 'Far South-West', region: 'Frontier' },
];

// Map scale: world coords -60..60 → map 0..300px
const MAP_SIZE = 320;
const WORLD_RANGE = 60;
const worldToMap = (v: number) => ((v + WORLD_RANGE) / (WORLD_RANGE * 2)) * MAP_SIZE;

export default function BuildModal({ cash, existingCustom, onBuyLand, onPlace, onClose }: Props) {
  const [selectedType, setSelectedType] = useState<typeof BUILDING_TYPES[0] | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<typeof LAND_PLOTS[0] | null>(null);
  const [purchasedLand, setPurchasedLand] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'land' | 'build'>('land');
  const mapRef = useRef<HTMLDivElement>(null);

  // All occupied positions (existing + custom + purchased land)
  const occupiedPositions = [
    ...BUILDINGS.map(b => ({ x: b.position[0], z: b.position[2], name: b.name, color: b.color })),
    ...existingCustom.map(b => ({ x: b.position[0], z: b.position[2], name: b.name, color: b.color })),
  ];

  const handleBuyLand = () => {
    if (!selectedPlot) {
      setError('Select a land plot on the map first.');
      return;
    }
    if (purchasedLand.has(selectedPlot.id)) {
      setError('You already own this land.');
      return;
    }
    if (cash < LAND_COST) {
      setError(`You need ${LAND_COST.toLocaleString()} to buy land. You have ${cash.toLocaleString()}.`);
      return;
    }
    sfx.milestone();
    onBuyLand(LAND_COST);
    setPurchasedLand(prev => new Set(prev).add(selectedPlot.id));
    setMode('build');
    setError('');
  };

  const handleBuild = () => {
    if (!selectedType) {
      setError('Pick a building type first.');
      return;
    }
    if (!selectedPlot) {
      setError('Select a land plot on the map.');
      return;
    }
    if (!purchasedLand.has(selectedPlot.id)) {
      setError('You must buy this land before building on it.');
      return;
    }
    if (cash < COST) {
      setError(`You need $${COST.toLocaleString()} to build. You have $${cash.toLocaleString()}.`);
      return;
    }
    sfx.milestone();
    onPlace({
      type: selectedType.type,
      name: selectedType.name,
      icon: selectedType.icon,
      position: selectedPlot.position,
      color: selectedType.color,
      roofColor: selectedType.roofColor,
      size: selectedType.size,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4">
      <div className="bg-slate-900 border-2 border-emerald-500/30 rounded-3xl p-5 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
        <button onClick={() => { sfx.click(); onClose(); }} className="absolute top-4 right-4 text-slate-500 hover:text-white z-10">
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-1 flex items-center gap-2 text-white">
          <Building2 size={20} className="text-emerald-400" />
          City Builder
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Buy land beyond the city limits, then place buildings to grow your world.
        </p>

        <div className="flex items-center gap-2 mb-4 bg-amber-950/40 rounded-xl px-3 py-2 border border-amber-700/30">
          <Wallet size={14} className="text-amber-400" />
          <span className="text-amber-400 font-bold text-sm">${cash.toLocaleString()} available</span>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { sfx.click(); setMode('land'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              mode === 'land' ? 'bg-emerald-500/20 border-2 border-emerald-500/60 text-emerald-400' : 'bg-white/5 border-2 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <MapPin size={14} /> 1. Buy Land
          </button>
          <button
            onClick={() => { sfx.click(); setMode('build'); setError(''); }}
            disabled={purchasedLand.size === 0}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 ${
              mode === 'build' ? 'bg-emerald-500/20 border-2 border-emerald-500/60 text-emerald-400' : 'bg-white/5 border-2 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Building2 size={14} /> 2. Build ({purchasedLand.size})
          </button>
        </div>

        {/* City Map */}
        <div className="mb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
            {mode === 'land' ? 'Select Land to Purchase' : 'Select Your Land to Build On'}
          </h3>
          <div className="relative bg-slate-950 rounded-2xl border border-white/10 p-2 mx-auto" style={{ width: MAP_SIZE + 16, height: MAP_SIZE + 16 }}>
            <svg width={MAP_SIZE} height={MAP_SIZE} className="block mx-auto">
              {/* Grid */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width={MAP_SIZE} height={MAP_SIZE} fill="url(#grid)" />

              {/* City boundary circle */}
              <circle
                cx={worldToMap(0)} cy={worldToMap(0)} r={worldToMap(24) - worldToMap(0)}
                fill="rgba(16,185,129,0.04)" stroke="rgba(16,185,129,0.2)" strokeWidth="1.5" strokeDasharray="4 4"
              />
              <text x={worldToMap(0)} y={worldToMap(0) - worldToMap(24) + worldToMap(0) - 4} fill="rgba(16,185,129,0.4)" fontSize="8" textAnchor="middle" fontWeight="bold">CITY LIMITS</text>

              {/* Existing buildings */}
              {occupiedPositions.map((b, i) => (
                <g key={`occ_${i}`}>
                  <circle cx={worldToMap(b.x)} cy={worldToMap(b.z)} r="5" fill={b.color} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                </g>
              ))}

              {/* Land plots */}
              {LAND_PLOTS.map(plot => {
                const owned = purchasedLand.has(plot.id);
                const isSel = selectedPlot?.id === plot.id;
                const canClick = mode === 'land' || owned;
                return (
                  <g
                    key={plot.id}
                    onClick={() => { if (canClick) { sfx.click(); setSelectedPlot(plot); setError(''); } }}
                    style={{ cursor: canClick ? 'pointer' : 'default' }}
                  >
                    <circle
                      cx={worldToMap(plot.position[0])} cy={worldToMap(plot.position[2])} r="8"
                      fill={owned ? 'rgba(16,185,129,0.3)' : isSel ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.06)'}
                      stroke={owned ? '#10b981' : isSel ? '#fbbf24' : 'rgba(255,255,255,0.2)'}
                      strokeWidth={isSel ? 2.5 : 1.5}
                    />
                    {owned && (
                      <text x={worldToMap(plot.position[0])} y={worldToMap(plot.position[2]) + 3} fill="#10b981" fontSize="8" textAnchor="middle" fontWeight="bold">✓</text>
                    )}
                    {!owned && mode === 'land' && (
                      <text x={worldToMap(plot.position[0])} y={worldToMap(plot.position[2]) + 3} fill="rgba(255,255,255,0.4)" fontSize="7" textAnchor="middle" fontWeight="bold">$</text>
                    )}
                  </g>
                );
              })}

              {/* Player start position */}
              <circle cx={worldToMap(0)} cy={worldToMap(10)} r="4" fill="#fbbf24" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
            </svg>

            {/* Legend */}
            <div className="absolute bottom-2 right-2 flex flex-col gap-1 bg-slate-900/80 rounded-lg px-2 py-1.5 border border-white/10">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-[8px] text-slate-400">You</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[8px] text-slate-400">Owned land</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-white/30" /><span className="text-[8px] text-slate-400">For sale</span></div>
            </div>
          </div>
          {selectedPlot && (
            <div className="mt-2 text-center text-xs text-slate-400">
              <span className="text-emerald-400 font-bold">{selectedPlot.label}</span> — {selectedPlot.region}
              {purchasedLand.has(selectedPlot.id) && <span className="text-emerald-400 ml-2">✓ Owned</span>}
            </div>
          )}
        </div>

        {/* Land mode: buy button */}
        {mode === 'land' && (
          <button
            onClick={handleBuyLand}
            disabled={!selectedPlot || purchasedLand.has(selectedPlot?.id ?? '') || cash < LAND_COST}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-sm rounded-2xl transition-all hover:scale-[1.02]"
          >
            <MapPin size={16} />
            {cash < LAND_COST ? 'Not Enough Cash' : purchasedLand.has(selectedPlot?.id ?? '') ? 'Already Owned' : `Buy Land for $${LAND_COST.toLocaleString()}`}
          </button>
        )}

        {/* Build mode: building type selector + build button */}
        {mode === 'build' && (
          <>
            <div className="mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Building Type</h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {BUILDING_TYPES.map(bt => (
                  <button
                    key={bt.type}
                    onClick={() => { sfx.click(); setSelectedType(bt); setError(''); }}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${
                      selectedType?.type === bt.type
                        ? 'bg-emerald-500/15 border-emerald-500/60 scale-105'
                        : 'bg-white/5 border-white/10 hover:border-white/25'
                    }`}
                  >
                    <span className="text-xl">{bt.icon}</span>
                    <span className="text-white font-bold text-[10px]">{bt.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl px-3 py-2 mb-4">
                <p className="text-rose-300 text-xs">{error}</p>
              </div>
            )}

            <button
              onClick={handleBuild}
              disabled={!selectedType || !selectedPlot || cash < COST}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-sm rounded-2xl transition-all hover:scale-[1.02]"
            >
              <Building2 size={16} />
              {cash < COST ? 'Not Enough Cash' : `Build for $${COST.toLocaleString()}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
