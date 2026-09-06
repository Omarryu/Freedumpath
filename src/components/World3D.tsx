import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import {
  Wallet, TrendingUp, Heart, Zap,
  Volume2, VolumeX, Headphones, ChevronRight, Building2, Landmark,
  Sparkles, Trophy, X, RotateCcw, LogOut, Home, Settings as SettingsIcon,
  Calendar, Navigation, Phone, Plane, Train, Car, Bus, Move,
} from 'lucide-react';
import type { GameState, GameAction, LoanProduct, LifeEvent } from '../types';
import { getActionPool } from '../actions';
import { executeAction, advanceMonth, takeLoan, collectAssetIncome, liquidateAsset, toggleRental, buildOnLand, transferToBank, transferFromBank, applyLifeEvent, placeBuilding, buyLand } from '../gameEngine';
import { getRandomLifeEvent } from '../lifeEvents';
import { sfx } from '../sfx';
import Buildings, { BUILDINGS, type BuildingData } from './world/Buildings';
import Roads from './world/Roads';
import Player from './world/Player';
import Environment from './world/Environment';
import Joystick from './world/Joystick';
import OrbitFollowCamera from './world/OrbitFollowCamera';
import NPC from './world/NPC';
import { STREET_NPCS, type NPCData } from './world/npcData';
import InteriorScene from './InteriorScene';
import DialoguePanel from './DialoguePanel';
import PhoneCallModal from './PhoneCallModal';
import ActionGrid from './ActionGrid';
import SettingsModal from './SettingsModal';
import LoanModal from './LoanModal';
import BankModal from './BankModal';
import AssetModal from './AssetModal';
import Toast, { type ToastData } from './Toast';
import TravelModal from './TravelModal';
import BuildModal from './BuildModal';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WORLD_BOUND = 60;

interface Props {
  state: GameState;
  onChange: (state: GameState) => void;
  onRestart: () => void;
  onExit: () => void;
  onSignOut: () => void;
  userEmail: string;
}

function DayNightCycle({ timeRef }: { timeRef: React.MutableRefObject<number> }) {
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);

  useFrame((_, delta) => {
    timeRef.current += delta * 0.015;
    const t = timeRef.current % (Math.PI * 2);
    const sunHeight = Math.sin(t);
    if (sunRef.current) {
      sunRef.current.position.set(Math.cos(t) * 30, Math.max(-5, sunHeight * 25), Math.sin(t) * 30);
      sunRef.current.intensity = Math.max(0.08, sunHeight * 1.3);
    }
    if (ambientRef.current) {
      ambientRef.current.intensity = Math.max(0.2, sunHeight * 0.4 + 0.3);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.45} color="#a0b0d0" />
      <directionalLight ref={sunRef} position={[15, 20, 8]} intensity={1.3} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-far={60} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} />
      <hemisphereLight args={['#87ceeb', '#3a4a3a', 0.35]} />
    </>
  );
}

function SkyDome({ timeRef }: { timeRef: React.MutableRefObject<number> }) {
  const sunPos = useRef(new THREE.Vector3(0, 1, 0));
  useFrame(() => {
    const t = timeRef.current % (Math.PI * 2);
    const sunHeight = Math.sin(t);
    sunPos.current.set(Math.cos(t) * 100, Math.max(-10, sunHeight * 100), 0.3);
  });
  return (
    <>
      <Sky distance={450000} sunPosition={sunPos.current} inclination={0.5} azimuth={0.25} turbidity={6} rayleigh={1.5} mieCoefficient={0.005} mieDirectionalG={0.8} />
      <Stars radius={120} depth={60} count={2000} factor={4} fade speed={0.5} />
    </>
  );
}

const moveState = { x: 0, z: 0, active: false };

function PlayerController({ playerPosRef, playerRotRef, playerName, cameraAzimuthRef }: { playerPosRef: React.MutableRefObject<THREE.Vector3>; playerRotRef: React.MutableRefObject<number>; playerName: string; cameraAzimuthRef: React.MutableRefObject<number> }) {
  const keys = useRef({ forward: false, backward: false, left: false, right: false });
  const playerObj = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 10));
  const rot = useRef(0);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent, down: boolean) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': keys.current.forward = down; break;
        case 'KeyS': case 'ArrowDown': keys.current.backward = down; break;
        case 'KeyA': case 'ArrowLeft': keys.current.left = down; break;
        case 'KeyD': case 'ArrowRight': keys.current.right = down; break;
      }
    };
    const kd = (e: KeyboardEvent) => handleKey(e, true);
    const ku = (e: KeyboardEvent) => handleKey(e, false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  useFrame((_, delta) => {
    const k = keys.current;
    const speed = 5.5 * delta;
    // Raw input in camera space: forward = -Z (away from camera), right = +X
    let rawDx = 0, rawDz = 0;
    if (k.forward) rawDz -= speed;
    if (k.backward) rawDz += speed;
    if (k.left) rawDx -= speed;
    if (k.right) rawDx += speed;
    if (moveState.active) { rawDx += moveState.x * speed * 1.2; rawDz += moveState.z * speed * 1.2; }

    // Rotate input by the camera's azimuth so "forward" is always away from the camera.
    // The camera sits at +Z when azimuth=0, so forward (rawDz negative) should move the
    // player away from the camera. Rotating by azimuth keeps that true as the camera orbits.
    const az = cameraAzimuthRef.current;
    const cosA = Math.cos(az);
    const sinA = Math.sin(az);
    const dx = rawDx * cosA - rawDz * sinA;
    const dz = rawDx * sinA + rawDz * cosA;

    const moved = dx !== 0 || dz !== 0;
    if (moved) {
      const targetRot = Math.atan2(dx, -dz);
      let diff = targetRot - rot.current;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      rot.current += diff * 0.25;
    }
    playerObj.current.x = Math.max(-WORLD_BOUND, Math.min(WORLD_BOUND, playerObj.current.x + dx));
    playerObj.current.z = Math.max(-WORLD_BOUND, Math.min(WORLD_BOUND, playerObj.current.z + dz));
    playerPosRef.current.copy(playerObj.current);
    playerRotRef.current = rot.current;
    forceUpdate(v => v + 1);
  });

  return <Player position={playerObj.current} rotation={rot.current} playerName={playerName} />;
}

function Ground({ onMoveToPosition, moveModeActive }: { onMoveToPosition?: (pos: [number, number, number]) => void; moveModeActive?: boolean }) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      onClick={(e) => {
        if (moveModeActive && onMoveToPosition) {
          e.stopPropagation();
          onMoveToPosition([e.point.x, 0, e.point.z]);
        }
      }}
      onPointerOver={() => { if (moveModeActive) document.body.style.cursor = 'crosshair'; }}
      onPointerOut={() => { if (moveModeActive) document.body.style.cursor = 'default'; }}
    >
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial color={moveModeActive ? '#2a5a2a' : '#3a6a3a'} roughness={0.95} />
    </mesh>
  );
}

function Sidewalks() {
  const slabs = useMemo(() => {
    const items: { pos: [number, number, number]; size: [number, number, number] }[] = [];
    for (let x = -24; x <= 24; x += 6) {
      for (let z = -24; z <= 24; z += 6) {
        items.push({ pos: [x, 0.02, z], size: [6, 0.04, 6] });
      }
    }
    return items;
  }, []);
  return (
    <group>
      {slabs.map((s, i) => (
        <mesh key={i} position={s.pos} receiveShadow>
          <boxGeometry args={s.size} />
          <meshStandardMaterial color="#6a6a6e" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

export default function World3D({ state, onChange, onRestart, onExit, onSignOut, userEmail }: Props) {
  const [actionPool, setActionPool] = useState<GameAction[]>([]);
  const [showActions, setShowActions] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const [showAssets, setShowAssets] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExitMenu, setShowExitMenu] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const [activeLoanId, setActiveLoanId] = useState<string | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [musicOn, setMusicOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [buttonConfig, setButtonConfig] = useState({
    up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD',
    action: 'Space', interact: 'KeyE',
  });
  const [showTravel, setShowTravel] = useState(false);
  const [showBuild, setShowBuild] = useState(false);
  const [moveMode, setMoveMode] = useState(false);
  const [selectedMoveId, setSelectedMoveId] = useState<string | null>(null);
  const [activeLifeEvent, setActiveLifeEvent] = useState<LifeEvent | null>(null);
  const [phoneCallEvent, setPhoneCallEvent] = useState<LifeEvent | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [highlightedBuilding, setHighlightedBuilding] = useState<string | null>(null);
  const [nearbyBuilding, setNearbyBuilding] = useState<BuildingData | null>(null);
  const [showCelebration, setShowCelebration] = useState<null | 'income' | 'level' | 'asset'>(null);
  const [floatingText, setFloatingText] = useState<{ text: string; color: string } | null>(null);
  const [prevCash, setPrevCash] = useState(state.cash);
  const [prevLevel, setPrevLevel] = useState(state.level);
  const [prevIncome, setPrevIncome] = useState(state.monthlyIncome);
  const [prevAssetCount, setPrevAssetCount] = useState(state.assets.length);

  // Interior + dialogue state
  const [interiorBuilding, setInteriorBuilding] = useState<BuildingData | null>(null);
  const [talkingNPC, setTalkingNPC] = useState<NPCData | null>(null);

  const playerPosRef = useRef(new THREE.Vector3(0, 0, 10));
  const playerRotRef = useRef(0);
  const cameraAzimuthRef = useRef(0);
  const timeRef = useRef(0.5);

  const actionsLeft = state.actionsPerMonth - state.actionsUsedThisMonth;

  useEffect(() => { setActionPool(getActionPool(state)); }, [state.level]);

  useEffect(() => {
    if (musicOn) {
      sfx.startMusic();
      sfx.startAmbient();
    } else {
      sfx.stopMusic();
      sfx.stopAmbient();
    }
    return () => { sfx.stopMusic(); sfx.stopAmbient(); };
  }, [musicOn]);

  useEffect(() => { sfx.setSpeechEnabled(voiceOn); }, [voiceOn]);

  // Phone ring only while the call is incoming (not after answered)
  const [callPhase, setCallPhase] = useState<'incoming' | 'connected' | 'ended'>('incoming');
  useEffect(() => {
    if (!phoneCallEvent || !musicOn || callPhase !== 'incoming') return;
    let stopped = false;
    const ringLoop = () => {
      if (stopped || !musicOn) return;
      sfx.phoneRing();
      setTimeout(ringLoop, 4000);
    };
    ringLoop();
    return () => { stopped = true; };
  }, [phoneCallEvent, musicOn, callPhase]);

  useEffect(() => {
    if (state.level > prevLevel) {
      setShowCelebration('level');
      setShowMilestone(true);
      sfx.milestone();
      if (voiceOn) sfx.guideMilestone(state.level);
      setTimeout(() => setShowCelebration(null), 3000);
    }
    if (state.monthlyIncome > prevIncome) {
      setShowCelebration('income');
      sfx.income();
      if (voiceOn) sfx.speak(`New income stream unlocked! You now earn ${state.monthlyIncome} dollars per month!`);
      setTimeout(() => setShowCelebration(null), 2500);
    }
    if (state.assets.length > prevAssetCount) {
      setShowCelebration('asset');
      sfx.milestone();
      if (voiceOn) sfx.speak('New asset acquired! Congratulations!');
      setTimeout(() => setShowCelebration(null), 2500);
    }
    if (state.cash > prevCash && state.cash - prevCash > 100) {
      setFloatingText({ text: `+${(state.cash - prevCash).toLocaleString()}`, color: 'text-emerald-400' });
      setTimeout(() => setFloatingText(null), 2000);
    } else if (state.cash < prevCash && prevCash - state.cash > 100) {
      setFloatingText({ text: `-${(prevCash - state.cash).toLocaleString()}`, color: 'text-red-400' });
      setTimeout(() => setFloatingText(null), 2000);
    }
    setPrevCash(state.cash);
    setPrevLevel(state.level);
    setPrevIncome(state.monthlyIncome);
    setPrevAssetCount(state.assets.length);
  }, [state.cash, state.level, state.monthlyIncome, state.assets.length]);

  // Nearby building detection (only when outside)
  useEffect(() => {
    if (interiorBuilding) return;
    const interval = setInterval(() => {
      const player = playerPosRef.current;
      let closest: BuildingData | null = null;
      let closestDist = 5;
      for (const b of BUILDINGS) {
        if (b.type === 'deco') continue;
        const dx = player.x - b.position[0];
        const dz = player.z - b.position[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < closestDist) { closestDist = dist; closest = b; }
      }
      setNearbyBuilding(prev => {
        if (prev?.id === closest?.id) return prev;
        if (closest) setHighlightedBuilding(closest.id);
        else setHighlightedBuilding(null);
        return closest;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [interiorBuilding]);

  const handleAction = useCallback((action: GameAction) => {
    sfx.action();
    const next = executeAction(state, action);
    onChange(next);
    if (voiceOn) { const cashChange = next.cash - state.cash; sfx.guideActionTaken(action.name, cashChange); }
  }, [state, onChange, voiceOn]);

  const handleEndTurn = useCallback(() => {
    sfx.turn();
    const next = advanceMonth(state);
    onChange(next);
    setActionPool(getActionPool(next));
    if (next.lastIncomeCollected && next.lastIncomeCollected > 0) {
      if (voiceOn) sfx.guideIncome(next.lastIncomeCollected);
    } else if (voiceOn) { sfx.speak('New month. No passive income yet — keep building!'); }
    // Life events now come as phone calls
    if (Math.random() < 0.45) {
      setTimeout(() => {
        setPhoneCallEvent(getRandomLifeEvent());
        sfx.action();
      }, 600);
    }
  }, [state, onChange, voiceOn]);

  const handleLifeEventResolve = useCallback((choiceIndex: number) => {
    if (!activeLifeEvent && !phoneCallEvent) return;
    const event = activeLifeEvent ?? phoneCallEvent;
    if (!event) return;
    const next = applyLifeEvent(state, event, choiceIndex);
    onChange(next);
    const choice = event.choices[choiceIndex];
    let outcome = choice.deterministicOutcome;
    if (!outcome && choice.randomOutcomes) { outcome = choice.randomOutcomes[Math.floor(Math.random() * choice.randomOutcomes.length)]; }
    if (outcome) {
      setToasts(prev => [...prev, {
        id: `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        message: outcome.isPositive ? 'Great choice!' : 'Ouch...',
        isPositive: !!outcome.isPositive,
        details: outcome.message,
      }]);
    }
    setActiveLifeEvent(null);
    setPhoneCallEvent(null);
  }, [activeLifeEvent, phoneCallEvent, state, onChange]);

  const triggerRandomEvent = useCallback(() => {
    sfx.action();
    setPhoneCallEvent(getRandomLifeEvent());
  }, []);

  const dismissToast = useCallback((id: string) => { setToasts(prev => prev.filter(t => t.id !== id)); }, []);

  const handleBuildingClick = useCallback((data: BuildingData) => {
    sfx.click();
    if (data.type === 'deco') return;
    setInteriorBuilding(data);
  }, []);

  const handleEnterBuilding = useCallback(() => {
    if (!nearbyBuilding) return;
    handleBuildingClick(nearbyBuilding);
  }, [nearbyBuilding, handleBuildingClick]);

  const handleLoan = useCallback((amount: number, purpose: string, bankId: string, product: LoanProduct) => {
    sfx.loan();
    const next = takeLoan(state, amount, purpose, bankId, product);
    onChange(next);
    if (voiceOn) sfx.guideLoan(amount);
    setShowBank(false);
    setSelectedBankId(null);
    const newLoan = next.loans[next.loans.length - 1];
    if (newLoan) setActiveLoanId(newLoan.id);
  }, [state, onChange, voiceOn]);

  const activeLoan = state.loans.find(l => l.id === activeLoanId);

  // NPC talk handler
  const handleTalkNPC = useCallback((npc: NPCData) => {
    sfx.click();
    setTalkingNPC(npc);
  }, []);

  // NPC dialogue action handler
  const handleDialogueAction = useCallback((action: string) => {
    sfx.click();
    setTalkingNPC(null);
    switch (action) {
      case 'open_bank': setShowBank(true); break;
      case 'open_loans': setShowAssets(true); break;
      case 'open_actions': setShowActions(true); break;
      case 'open_assets': setShowAssets(true); break;
      case 'trigger_event': setPhoneCallEvent(getRandomLifeEvent()); break;
      case 'rest': {
        const restAction: GameAction = {
          id: 'rest', name: 'Rest at Home', icon: '😴', category: 'wellness', cost: 0,
          description: 'Rest and recharge', effects: { energy: 30, happiness: 10 },
        };
        handleAction(restAction);
        break;
      }
    }
  }, [handleAction]);

  const handleSelectForMove = useCallback((id: string) => {
    sfx.click();
    setSelectedMoveId(id);
  }, []);

  const handleMoveToPosition = useCallback((pos: [number, number, number]) => {
    if (!selectedMoveId) return;
    sfx.milestone();
    const custom = state.customBuildings || [];
    const updated = custom.map(b => b.id === selectedMoveId ? { ...b, position: pos } : b);
    onChange({ ...state, customBuildings: updated });
    setSelectedMoveId(null);
    setMoveMode(false);
  }, [selectedMoveId, state, onChange]);

  const handleToggleMoveMode = useCallback(() => {
    sfx.click();
    setMoveMode(m => !m);
    setSelectedMoveId(null);
  }, []);

  // Joystick handlers
  const handleJoystickMove = useCallback((dx: number, dz: number) => {
    moveState.x = dx; moveState.z = dz; moveState.active = true;
  }, []);
  const handleJoystickEnd = useCallback(() => {
    moveState.active = false; moveState.x = 0; moveState.z = 0;
  }, []);

  // If inside a building, show interior scene
  if (interiorBuilding) {
    return (
      <>
        <InteriorScene
          buildingType={interiorBuilding.type}
          buildingName={interiorBuilding.name}
          buildingIcon={interiorBuilding.icon}
          playerName={state.playerName}
          onTalk={handleTalkNPC}
          onExit={() => { sfx.click(); setInteriorBuilding(null); }}
        />
        {/* Modals accessible from interior */}
        {talkingNPC && (
          <DialoguePanel npc={talkingNPC} onAction={handleDialogueAction} onClose={() => setTalkingNPC(null)} />
        )}
        {showActions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <div className="bg-slate-900 border-2 border-white/10 rounded-3xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto relative">
              <button onClick={() => setShowActions(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white z-10"><X size={20} /></button>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Sparkles size={18} className="text-amber-400" /> This Month's Opportunities</h2>
              <div className="mb-3"><span className={`text-sm font-bold px-2 py-1 rounded-lg ${actionsLeft > 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>{actionsLeft} actions left</span></div>
              <ActionGrid actions={actionPool} cash={state.cash} onSelect={(a) => { handleAction(a); }} disabled={actionsLeft === 0} maxSlots={25} compact={compactMode} />
            </div>
          </div>
        )}
        {showBank && (
          <BankModal state={state} selectedBankId={selectedBankId} onSelectBank={setSelectedBankId} onClose={() => setShowBank(false)} onTakeLoan={handleLoan} onAction={handleAction} />
        )}
        {activeLoan && (
          <LoanModal state={state} loan={activeLoan} onClose={() => setActiveLoanId(null)} onChange={onChange} />
        )}
        {showAssets && (
          <AssetModal state={state} onClose={() => setShowAssets(false)}
            onCollectIncome={(assetId, dest) => onChange(collectAssetIncome(state, assetId, dest))}
            onLiquidate={(assetId) => onChange(liquidateAsset(state, assetId))}
            onToggleRental={(assetId, rentalType) => onChange(toggleRental(state, assetId, rentalType))}
            onBuild={(assetId, buildingType) => onChange(buildOnLand(state, assetId, buildingType))}
            onTransferToBank={(amount) => onChange(transferToBank(state, amount))}
            onTransferFromBank={(amount) => onChange(transferFromBank(state, amount))}
          />
        )}
        {phoneCallEvent && (
          <PhoneCallModal event={phoneCallEvent} onResolve={handleLifeEventResolve} onDismiss={() => setPhoneCallEvent(null)} onPhaseChange={setCallPhase} />
        )}
        {toasts.map(t => <Toast key={t.id} toast={t} onDismiss={dismissToast} />)}
      </>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 overflow-hidden">
      <div className="absolute inset-0">
        <Canvas shadows="soft" dpr={[1, 1.5]} camera={{ position: [0, 7, 18], fov: 55 }} gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}>
          <color attach="background" args={['#87ceeb']} />
          <fog attach="fog" args={['#87ceeb', 35, 65]} />
          <SkyDome timeRef={timeRef} />
          <DayNightCycle timeRef={timeRef} />
          <Ground onMoveToPosition={handleMoveToPosition} moveModeActive={moveMode && !selectedMoveId} />
          <Sidewalks />
          <Buildings onBuildingClick={handleBuildingClick} highlightedId={highlightedBuilding} customBuildings={state.customBuildings || []} moveMode={moveMode} selectedMoveId={selectedMoveId} onSelectForMove={handleSelectForMove} onMoveToPosition={handleMoveToPosition} />
          <Roads />
          <Environment />
          {STREET_NPCS.map(npc => (
            <NPC key={npc.id} data={npc} onTalk={handleTalkNPC} isTalking={talkingNPC?.id === npc.id} />
          ))}
          <PlayerController playerPosRef={playerPosRef} playerRotRef={playerRotRef} playerName={state.playerName} cameraAzimuthRef={cameraAzimuthRef} />
          <OrbitFollowCamera targetRef={playerPosRef} followHeight={4} followDistance={9} azimuthRef={cameraAzimuthRef} />
        </Canvas>
      </div>

      {/* Top HUD Bar */}
      <header className={`absolute top-0 left-0 right-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-white/10 ${compactMode ? 'px-2 py-1' : 'px-2 py-1.5 sm:px-4 sm:py-2.5'}`}>
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-base sm:text-xl">🚀</span>
            <span className="font-black text-xs sm:text-base hidden sm:inline">FreedomPath</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 text-xs">
            <div className="bg-white/5 rounded-lg px-1.5 py-0.5 sm:px-2 sm:py-1 flex items-center gap-1">
              <Calendar size={10} className="text-slate-500" />
              <span className="font-bold text-[11px] sm:text-sm">{MONTHS[state.month - 1]} {state.year}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="bg-amber-950/40 rounded-lg px-1.5 py-0.5 sm:px-2.5 sm:py-1 flex items-center gap-1 border border-amber-700/30">
              <Wallet size={11} className="text-amber-400" />
              <span className="font-bold text-amber-400 text-[11px] sm:text-sm">${(state.cash ?? 0).toLocaleString()}</span>
            </div>
            <div className="bg-emerald-950/40 rounded-lg px-1.5 py-0.5 sm:px-2.5 sm:py-1 flex items-center gap-1 border border-emerald-700/30">
              <TrendingUp size={11} className="text-emerald-400" />
              <span className="font-bold text-emerald-400 text-[11px] sm:text-sm">${(state.monthlyIncome ?? 0).toLocaleString()}/mo</span>
            </div>
            <div className="bg-rose-950/40 rounded-lg px-1.5 py-0.5 sm:px-2.5 sm:py-1 hidden sm:flex items-center gap-1 border border-rose-700/30">
              <Heart size={11} className="text-rose-400" />
              <span className="font-bold text-rose-400 text-xs">{state.happiness}%</span>
            </div>
            <div className="bg-yellow-950/40 rounded-lg px-1.5 py-0.5 sm:px-2.5 sm:py-1 hidden sm:flex items-center gap-1 border border-yellow-700/30">
              <Zap size={11} className="text-yellow-400" />
              <span className="font-bold text-yellow-400 text-xs">{state.energy}</span>
            </div>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button onClick={() => setMusicOn(v => !v)} className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg border transition-colors ${musicOn ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/8 text-slate-500'}`} aria-label="Toggle music">
              {musicOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>
            <button onClick={() => setVoiceOn(v => !v)} className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg border transition-colors ${voiceOn ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/8 text-slate-500'}`} aria-label="Toggle voice">
              <Headphones size={13} className={voiceOn ? '' : 'opacity-40'} />
            </button>
            <button onClick={() => { sfx.click(); setShowSettings(true); }} className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg border bg-white/5 border-white/8 text-slate-400 hover:text-white" aria-label="Settings">
              <SettingsIcon size={13} />
            </button>
            <button onClick={() => { sfx.click(); setShowExitMenu(true); }} className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg border bg-white/5 border-white/8 text-slate-500 hover:text-red-400" aria-label="Exit">
              <LogOut size={13} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
          <span className="text-[10px]">⭐</span>
          <span className="font-bold text-[10px] sm:text-xs">Lv {state.level}</span>
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500" style={{ width: `${(state.xp / state.xpToNext) * 100}%` }} />
          </div>
          <span className="text-[9px] sm:text-[10px] text-slate-500 hidden sm:inline">{state.xp}/{state.xpToNext} XP</span>
          <span className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded ${actionsLeft > 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>{actionsLeft} actions</span>
        </div>
      </header>

      {/* Touch joystick - extreme left of screen */}
      <div className="absolute bottom-4 left-0 z-20 touch-joystick -translate-x-1/3" data-joystick>
        <Joystick onMove={handleJoystickMove} onEnd={handleJoystickEnd} />
      </div>

      {/* Move mode banner */}
      {moveMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-emerald-950/90 backdrop-blur-md border-2 border-emerald-500/50 rounded-xl px-4 py-2 text-center">
          <p className="text-emerald-400 text-xs font-bold">
            {selectedMoveId ? 'Tap the ground to place your building' : 'Tap a custom building to select it'}
          </p>
          <button onClick={handleToggleMoveMode} className="mt-1 text-[10px] text-slate-400 hover:text-white underline">Cancel move</button>
        </div>
      )}

      {/* Controls hint - moved to bottom-left to avoid action bar overlap */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-slate-950/70 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10 non-touch-only pointer-events-none">
        <div className="flex items-center gap-2 text-xs text-slate-400 whitespace-nowrap">
          <Navigation size={14} className="text-amber-400" />
          <span><kbd className="px-1 py-0.5 bg-white/10 rounded text-[10px] font-bold">WASD</kbd> walk · Drag to look · Click buildings · Talk to people</span>
        </div>
      </div>

      {/* Touch controls hint - moved above joystick to avoid overlap */}
      <div className="absolute bottom-36 left-2 z-10 bg-slate-950/70 backdrop-blur-sm rounded-xl px-2.5 py-1.5 border border-white/10 touch-only hidden pointer-events-none">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 whitespace-nowrap">
          <Navigation size={12} className="text-amber-400" />
          <span>Joystick to walk · Drag to look · Tap buildings · Tap people</span>
        </div>
      </div>

      {/* Nearby building prompt */}
      {nearbyBuilding && (
        <div className="absolute bottom-24 sm:bottom-20 left-1/2 -translate-x-1/2 z-20" style={{ animation: 'slideUp 0.3s ease-out' }}>
          <button onClick={handleEnterBuilding} className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border-2 border-amber-500/50 rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 hover:scale-105 transition-transform shadow-xl shadow-amber-500/20">
            <span className="text-xl sm:text-2xl">{nearbyBuilding.icon}</span>
            <div className="text-left">
              <div className="text-white font-bold text-xs sm:text-sm">Enter {nearbyBuilding.name}</div>
              <div className="text-slate-400 text-[10px] sm:text-xs">Tap to go inside</div>
            </div>
            <ChevronRight size={16} className="text-amber-400" />
          </button>
        </div>
      )}

      {/* Bottom action bar */}
      <div className="absolute bottom-4 right-4 z-20 flex gap-1.5 sm:gap-2 flex-wrap justify-end max-w-[60%] sm:max-w-none">
        <button onClick={() => { sfx.click(); setShowBuild(true); }} className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 sm:px-4 sm:py-3 bg-emerald-950/70 backdrop-blur-md border-2 border-emerald-700/40 hover:border-emerald-500/70 rounded-xl text-emerald-400 font-bold transition-all hover:scale-105">
          <Building2 size={16} />
          <span className="hidden lg:inline text-sm">Build</span>
        </button>
        <button onClick={handleToggleMoveMode} className={`flex items-center justify-center gap-1.5 px-2.5 py-2.5 sm:px-4 sm:py-3 backdrop-blur-md border-2 rounded-xl font-bold transition-all hover:scale-105 ${moveMode ? 'bg-emerald-500/30 border-emerald-400/70 text-emerald-300' : 'bg-emerald-950/70 border-emerald-700/40 hover:border-emerald-500/70 text-emerald-400'}`}>
          <Move size={16} />
          <span className="hidden lg:inline text-sm">Move</span>
        </button>
        <button onClick={() => { sfx.click(); setShowTravel(true); }} className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 sm:px-4 sm:py-3 bg-sky-950/70 backdrop-blur-md border-2 border-sky-700/40 hover:border-sky-500/70 rounded-xl text-sky-400 font-bold transition-all hover:scale-105">
          <Plane size={16} />
          <span className="hidden lg:inline text-sm">Travel</span>
        </button>
        <button onClick={triggerRandomEvent} className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 sm:px-4 sm:py-3 bg-violet-950/70 backdrop-blur-md border-2 border-violet-700/40 hover:border-violet-500/70 rounded-xl text-violet-400 font-bold transition-all hover:scale-105">
          <Phone size={16} />
          <span className="hidden lg:inline text-sm">Life Event</span>
        </button>
        <button onClick={() => { sfx.click(); setShowBank(true); }} className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 sm:px-4 sm:py-3 bg-cyan-950/70 backdrop-blur-md border-2 border-cyan-700/40 hover:border-cyan-500/70 rounded-xl text-cyan-400 font-bold transition-all hover:scale-105">
          <Landmark size={16} />
          <span className="hidden lg:inline text-sm">Bank</span>
        </button>
        <button onClick={() => { sfx.click(); setShowAssets(true); }} className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 sm:px-4 sm:py-3 bg-white/5 backdrop-blur-md border-2 border-white/10 hover:border-white/30 rounded-xl text-white font-bold transition-all hover:scale-105">
          <Building2 size={16} />
          <span className="hidden lg:inline text-sm">Assets ({state.assets.length})</span>
        </button>
        <button onClick={() => { sfx.click(); setShowActions(true); }} className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 sm:px-4 sm:py-3 bg-amber-950/70 backdrop-blur-md border-2 border-amber-700/40 hover:border-amber-500/70 rounded-xl text-amber-400 font-bold transition-all hover:scale-105">
          <Sparkles size={16} />
          <span className="hidden lg:inline text-sm">Actions</span>
        </button>
        <button onClick={handleEndTurn} disabled={actionsLeft > 0} className={`flex items-center justify-center gap-1.5 px-3 py-2.5 sm:px-5 sm:py-3 rounded-xl font-black transition-all ${actionsLeft > 0 ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:scale-105 shadow-lg shadow-amber-500/30'}`}>
          <ChevronRight size={16} />
          <span className="hidden lg:inline text-sm">Next Month</span>
        </button>
      </div>

      {/* Floating text */}
      {floatingText && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <span className={`text-4xl font-black ${floatingText.color} drop-shadow-lg animate-float-up`}>{floatingText.text}</span>
        </div>
      )}

      {/* Celebration overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-blue-500/20 animate-pulse" />
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute text-2xl animate-bounce" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 0.5}s` }}>
              {['🎉','💰','🚀','⭐','💎','🏆'][i % 6]}
            </div>
          ))}
          <div className="relative z-10 text-center animate-zoom-in">
            {showCelebration === 'level' && <><div className="text-7xl mb-4 animate-bounce">🏆</div><h2 className="text-4xl font-black text-amber-400 drop-shadow-lg">LEVEL UP!</h2><p className="text-xl text-white mt-2">Level {state.level}!</p></>}
            {showCelebration === 'income' && <><div className="text-7xl mb-4 animate-bounce">💰</div><h2 className="text-4xl font-black text-emerald-400 drop-shadow-lg">NEW INCOME!</h2><p className="text-xl text-white mt-2">${(state.monthlyIncome ?? 0).toLocaleString()}/mo</p></>}
            {showCelebration === 'asset' && <><div className="text-7xl mb-4 animate-bounce">🏢</div><h2 className="text-4xl font-black text-cyan-400 drop-shadow-lg">ASSET!</h2></>}
          </div>
        </div>
      )}

      {/* Dialogue panel */}
      {talkingNPC && (
        <DialoguePanel npc={talkingNPC} onAction={handleDialogueAction} onClose={() => setTalkingNPC(null)} />
      )}

      {/* Phone call modal */}
      {phoneCallEvent && (
        <PhoneCallModal event={phoneCallEvent} onResolve={handleLifeEventResolve} onDismiss={() => setPhoneCallEvent(null)} onPhaseChange={setCallPhase} />
      )}

      {/* Modals */}
      {showSettings && (
        <SettingsModal state={state} settings={{ sound: musicOn, notifications: true, compactMode }} buttonConfig={buttonConfig} onSettingsChange={(s) => { setMusicOn(s.sound); setCompactMode(s.compactMode); }} onButtonConfigChange={setButtonConfig} onClose={() => setShowSettings(false)} onRestart={() => { if (voiceOn) sfx.guideRestart(); onRestart(); }} onClearSave={() => onRestart()} />
      )}
      {showExitMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-slate-900 border-2 border-amber-500/30 rounded-3xl p-8 max-w-md w-full text-center relative">
            <button onClick={() => { sfx.click(); setShowExitMenu(false); }} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20} /></button>
            <div className="text-5xl mb-4">🚪</div>
            <h2 className="text-2xl font-black text-white mb-2">Exit Game</h2>
            <p className="text-slate-400 text-sm mb-6">Your progress is saved automatically.</p>
            <div className="space-y-3">
              <button onClick={() => { sfx.click(); setShowExitMenu(false); }} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border-2 border-white/10 hover:border-white/20 rounded-xl text-white font-bold transition-all hover:scale-[1.02]"><Home size={18} /> Keep Playing</button>
              <button onClick={() => { sfx.click(); if (voiceOn) sfx.guideRestart(); setShowExitMenu(false); onRestart(); }} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-500/15 border-2 border-amber-500/30 hover:border-amber-500/60 rounded-xl text-amber-400 font-bold transition-all hover:scale-[1.02]"><RotateCcw size={18} /> Restart New Game</button>
              <button onClick={() => { sfx.click(); if (voiceOn) sfx.guideExit(); setShowExitMenu(false); onExit(); }} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500/15 border-2 border-red-500/30 hover:border-red-500/60 rounded-xl text-red-400 font-bold transition-all hover:scale-[1.02]"><LogOut size={18} /> Exit to Main Menu</button>
              <button onClick={() => { sfx.click(); setShowExitMenu(false); onSignOut(); }} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-500/15 border-2 border-slate-500/30 hover:border-slate-500/60 rounded-xl text-slate-300 font-bold transition-all hover:scale-[1.02]"><LogOut size={18} /> Sign Out ({userEmail})</button>
            </div>
          </div>
        </div>
      )}
      {showMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-8 max-w-md text-center relative">
            <button onClick={() => setShowMilestone(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20} /></button>
            <Trophy size={48} className="text-amber-400 mx-auto mb-4" />
            <h2 className="text-3xl font-black text-white mb-2">Level {state.level}!</h2>
            <p className="text-slate-400 mb-6">You're making great progress on your freedom path.</p>
            <button onClick={() => { sfx.click(); setShowMilestone(false); }} className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors">Continue</button>
          </div>
        </div>
      )}
      {showActions && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-slate-900 border-2 border-white/10 rounded-3xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto relative">
            <button onClick={() => setShowActions(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white z-10"><X size={20} /></button>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Sparkles size={18} className="text-amber-400" /> This Month's Opportunities</h2>
            <div className="mb-3"><span className={`text-sm font-bold px-2 py-1 rounded-lg ${actionsLeft > 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>{actionsLeft} actions left</span></div>
            <ActionGrid actions={actionPool} cash={state.cash} onSelect={(a) => { handleAction(a); }} disabled={actionsLeft === 0} maxSlots={25} />
          </div>
        </div>
      )}
      {showBank && (
        <BankModal state={state} selectedBankId={selectedBankId} onSelectBank={setSelectedBankId} onClose={() => setShowBank(false)} onTakeLoan={handleLoan} onAction={handleAction} />
      )}
      {activeLoan && (
        <LoanModal state={state} loan={activeLoan} onClose={() => setActiveLoanId(null)} onChange={onChange} />
      )}
      {showAssets && (
        <AssetModal state={state} onClose={() => setShowAssets(false)}
          onCollectIncome={(assetId, dest) => onChange(collectAssetIncome(state, assetId, dest))}
          onLiquidate={(assetId) => onChange(liquidateAsset(state, assetId))}
          onToggleRental={(assetId, rentalType) => onChange(toggleRental(state, assetId, rentalType))}
          onBuild={(assetId, buildingType) => onChange(buildOnLand(state, assetId, buildingType))}
          onTransferToBank={(amount) => onChange(transferToBank(state, amount))}
          onTransferFromBank={(amount) => onChange(transferFromBank(state, amount))}
        />
      )}
      {showTravel && (
        <TravelModal state={state} onClose={() => setShowTravel(false)} onTravel={(dest) => { sfx.click(); setShowTravel(false); setToasts(prev => [...prev, { id: `toast_travel_${Date.now()}`, message: `Traveled to ${dest.name}!`, isPositive: true, details: `Welcome to ${dest.name}` }]); }} />
      )}
      {showBuild && (
        <BuildModal
          cash={state.cash}
          existingCustom={state.customBuildings || []}
          onBuyLand={(cost) => onChange(buyLand(state, cost))}
          onPlace={(building) => onChange(placeBuilding(state, building))}
          onClose={() => setShowBuild(false)}
        />
      )}
      {toasts.map(t => <Toast key={t.id} toast={t} onDismiss={dismissToast} />)}

      <style>{`
        @keyframes zoom-in { 0% { transform: scale(0.5); opacity: 0; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        .animate-zoom-in { animation: zoom-in 0.4s ease-out; }
        @keyframes float-up { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-80px) scale(1.5); opacity: 0; } }
        .animate-float-up { animation: float-up 2s ease-out forwards; }
        @keyframes slideUp { 0% { transform: translateY(20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
