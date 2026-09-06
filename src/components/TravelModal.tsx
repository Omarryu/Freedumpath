import { useState } from 'react';
import {
  X, Plane, Train, Car, Bus, MapPin, Clock, DollarSign,
  ArrowRight, CheckCircle2, Lock,
} from 'lucide-react';
import type { GameState } from '../types';

export interface Destination {
  id: string;
  name: string;
  country: string;
  description: string;
  emoji: string;
  travelOptions: TravelOption[];
  color: string;
  bgColor: string;
}

export interface TravelOption {
  type: 'plane' | 'train' | 'car' | 'bus';
  label: string;
  cost: number;
  duration: string;
  description: string;
}

const DESTINATIONS: Destination[] = [
  {
    id: 'nyork',
    name: 'New York City',
    country: 'USA',
    description: 'The financial capital. High costs but premium investment opportunities await.',
    emoji: '🏙️',
    color: '#3b82f6',
    bgColor: '#1e3a5a',
    travelOptions: [
      { type: 'plane', label: 'Fly', cost: 800, duration: '3 hours', description: 'Direct flight to JFK' },
      { type: 'train', label: 'Train', cost: 120, duration: '8 hours', description: 'Amtrak express' },
      { type: 'bus', label: 'Bus', cost: 45, duration: '12 hours', description: 'Intercity coach' },
      { type: 'car', label: 'Drive', cost: 200, duration: '10 hours', description: 'Road trip with gas & tolls' },
    ],
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    description: 'A vibrant metropolis blending tradition and innovation. Explore tech and culture.',
    emoji: '🗼',
    color: '#ec4899',
    bgColor: '#4a1a3a',
    travelOptions: [
      { type: 'plane', label: 'Fly', cost: 1500, duration: '14 hours', description: 'International flight' },
      { type: 'train', label: 'Train', cost: 0, duration: 'N/A', description: 'Not available by train' },
      { type: 'bus', label: 'Bus', cost: 0, duration: 'N/A', description: 'Not available by bus' },
      { type: 'car', label: 'Drive', cost: 0, duration: 'N/A', description: 'Not available by car' },
    ],
  },
  {
    id: 'london',
    name: 'London',
    country: 'UK',
    description: 'Historic financial hub with world-class markets and rich heritage.',
    emoji: '🎡',
    color: '#8b5cf6',
    bgColor: '#2a1a4a',
    travelOptions: [
      { type: 'plane', label: 'Fly', cost: 1000, duration: '7 hours', description: 'Transatlantic flight' },
      { type: 'train', label: 'Train', cost: 0, duration: 'N/A', description: 'Not available by train' },
      { type: 'bus', label: 'Bus', cost: 0, duration: 'N/A', description: 'Not available by bus' },
      { type: 'car', label: 'Drive', cost: 0, duration: 'N/A', description: 'Not available by car' },
    ],
  },
  {
    id: 'miami',
    name: 'Miami',
    country: 'USA',
    description: 'Sunny beaches and a booming real estate market. Perfect for property investments.',
    emoji: '🏖️',
    color: '#f59e0b',
    bgColor: '#4a3a1a',
    travelOptions: [
      { type: 'plane', label: 'Fly', cost: 350, duration: '2 hours', description: 'Domestic flight' },
      { type: 'train', label: 'Train', cost: 80, duration: '6 hours', description: 'Silver Meteor' },
      { type: 'bus', label: 'Bus', cost: 35, duration: '9 hours', description: 'Greyhound coach' },
      { type: 'car', label: 'Drive', cost: 120, duration: '5 hours', description: 'Highway road trip' },
    ],
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    description: 'The city of lights. European luxury markets and art de vivre.',
    emoji: '🗼',
    color: '#a855f7',
    bgColor: '#3a2a4a',
    travelOptions: [
      { type: 'plane', label: 'Fly', cost: 1200, duration: '8 hours', description: 'International flight' },
      { type: 'train', label: 'Train', cost: 0, duration: 'N/A', description: 'Not available by train' },
      { type: 'bus', label: 'Bus', cost: 0, duration: 'N/A', description: 'Not available by bus' },
      { type: 'car', label: 'Drive', cost: 0, duration: 'N/A', description: 'Not available by car' },
    ],
  },
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'UAE',
    description: 'Luxury and opportunity in the desert. Tax-free wealth building at its finest.',
    emoji: '🕌',
    color: '#06b6d4',
    bgColor: '#1a3a4a',
    travelOptions: [
      { type: 'plane', label: 'Fly', cost: 1300, duration: '13 hours', description: 'Emirates direct' },
      { type: 'train', label: 'Train', cost: 0, duration: 'N/A', description: 'Not available by train' },
      { type: 'bus', label: 'Bus', cost: 0, duration: 'N/A', description: 'Not available by bus' },
      { type: 'car', label: 'Drive', cost: 0, duration: 'N/A', description: 'Not available by car' },
    ],
  },
  {
    id: 'chicago',
    name: 'Chicago',
    country: 'USA',
    description: 'The Windy City. Central hub for commodities trading and real estate.',
    emoji: '🌬️',
    color: '#14b8a6',
    bgColor: '#1a3a3a',
    travelOptions: [
      { type: 'plane', label: 'Fly', cost: 250, duration: '1.5 hours', description: 'Domestic flight' },
      { type: 'train', label: 'Train', cost: 60, duration: '5 hours', description: 'Amtrak route' },
      { type: 'bus', label: 'Bus', cost: 25, duration: '7 hours', description: 'Intercity bus' },
      { type: 'car', label: 'Drive', cost: 80, duration: '4 hours', description: 'Highway drive' },
    ],
  },
  {
    id: 'vegas',
    name: 'Las Vegas',
    country: 'USA',
    description: 'Entertainment capital. High risk, high reward opportunities abound.',
    emoji: '🎰',
    color: '#ef4444',
    bgColor: '#4a1a1a',
    travelOptions: [
      { type: 'plane', label: 'Fly', cost: 200, duration: '2 hours', description: 'Domestic flight' },
      { type: 'train', label: 'Train', cost: 0, duration: 'N/A', description: 'Not available by train' },
      { type: 'bus', label: 'Bus', cost: 30, duration: '8 hours', description: 'Desert route bus' },
      { type: 'car', label: 'Drive', cost: 100, duration: '6 hours', description: 'Desert highway' },
    ],
  },
];

const TRAVEL_ICONS: Record<TravelOption['type'], React.ElementType> = {
  plane: Plane,
  train: Train,
  car: Car,
  bus: Bus,
};

interface Props {
  state: GameState;
  onClose: () => void;
  onTravel: (destination: Destination) => void;
}

export default function TravelModal({ state, onClose, onTravel }: Props) {
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);
  const [selectedOption, setSelectedOption] = useState<TravelOption | null>(null);
  const [traveling, setTraveling] = useState(false);

  const handleTravel = () => {
    if (!selectedDest || !selectedOption || state.cash < selectedOption.cost) return;
    setTraveling(true);
    setTimeout(() => {
      onTravel(selectedDest);
      setTraveling(false);
      setSelectedDest(null);
      setSelectedOption(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl border border-white/10 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
              <Plane size={17} className="text-sky-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Travel the World</h2>
              <p className="text-slate-500 text-xs">Choose your destination and travel method</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cash display */}
        <div className="px-5 py-3 border-b border-white/8 flex items-center gap-2">
          <DollarSign size={16} className="text-emerald-400" />
          <span className="text-emerald-400 font-bold text-lg">${state.cash.toLocaleString()}</span>
          <span className="text-slate-500 text-xs ml-2">available</span>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4">
          {!selectedDest ? (
            /* Destination grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DESTINATIONS.map(dest => (
                <button
                  key={dest.id}
                  onClick={() => {
                    setSelectedDest(dest);
                    setSelectedOption(null);
                  }}
                  className="group relative overflow-hidden rounded-2xl border border-white/8 hover:border-white/20 transition-all hover:scale-[1.02] text-left"
                  style={{ background: `linear-gradient(135deg, ${dest.bgColor}, #1a1a2e)` }}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-3xl">{dest.emoji}</div>
                      <MapPin size={14} style={{ color: dest.color }} className="opacity-60" />
                    </div>
                    <h3 className="text-white font-bold text-base mb-0.5">{dest.name}</h3>
                    <p className="text-slate-400 text-xs mb-2">{dest.country}</p>
                    <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2">{dest.description}</p>
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/8">
                      <span className="text-[10px] text-slate-500">From</span>
                      <span style={{ color: dest.color }} className="text-xs font-bold">
                        ${Math.min(...dest.travelOptions.filter(o => o.cost > 0).map(o => o.cost)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Travel options for selected destination */
            <div>
              <button
                onClick={() => { setSelectedDest(null); setSelectedOption(null); }}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-4 transition-colors"
              >
                <ArrowRight size={14} className="rotate-180" />
                Back to destinations
              </button>

              <div className="rounded-2xl border border-white/8 p-4 mb-4" style={{ background: `linear-gradient(135deg, ${selectedDest.bgColor}, #1a1a2e)` }}>
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{selectedDest.emoji}</div>
                  <div>
                    <h3 className="text-white font-black text-xl">{selectedDest.name}</h3>
                    <p className="text-slate-400 text-sm">{selectedDest.country}</p>
                  </div>
                </div>
                <p className="text-slate-400 text-xs mt-3 leading-relaxed">{selectedDest.description}</p>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-2">Choose Travel Method</h4>
                {selectedDest.travelOptions.map(opt => {
                  const Icon = TRAVEL_ICONS[opt.type];
                  const isAvailable = opt.cost > 0;
                  const canAfford = state.cash >= opt.cost;
                  const isSelected = selectedOption === opt;

                  return (
                    <button
                      key={opt.type}
                      onClick={() => isAvailable && canAfford && setSelectedOption(opt)}
                      disabled={!isAvailable || !canAfford}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all text-left ${
                        !isAvailable
                          ? 'bg-slate-950/50 border-white/5 opacity-40 cursor-not-allowed'
                          : !canAfford
                          ? 'bg-rose-950/30 border-rose-500/15 cursor-not-allowed'
                          : isSelected
                          ? 'bg-sky-500/15 border-sky-500/50 scale-[1.01]'
                          : 'bg-white/5 border-white/8 hover:bg-white/8 hover:border-white/15'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-sky-500/25' : 'bg-white/5'
                      }`}>
                        {isAvailable ? (
                          <Icon size={18} className={isSelected ? 'text-sky-400' : 'text-slate-300'} />
                        ) : (
                          <Lock size={16} className="text-slate-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-bold">{opt.label}</span>
                          {isAvailable && (
                            <span className="flex items-center gap-1 text-slate-500 text-xs">
                              <Clock size={11} /> {opt.duration}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {!isAvailable ? opt.description : canAfford ? opt.description : 'Not enough cash'}
                        </p>
                      </div>
                      {isAvailable && (
                        <div className="text-right flex-shrink-0">
                          <div className={`font-bold text-sm ${canAfford ? 'text-emerald-400' : 'text-rose-400'}`}>
                            ${opt.cost.toLocaleString()}
                          </div>
                        </div>
                      )}
                      {isSelected && (
                        <CheckCircle2 size={18} className="text-sky-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Confirm button */}
              {selectedOption && (
                <button
                  onClick={handleTravel}
                  disabled={traveling}
                  className="w-full mt-4 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-bold text-sm transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
                >
                  {traveling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Traveling to {selectedDest.name}...
                    </>
                  ) : (
                    <>
                      <Plane size={16} />
                      Travel to {selectedDest.name} — ${selectedOption.cost.toLocaleString()}
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
