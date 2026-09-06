import React from 'react';
import type { GameAction } from '../types';
import {
  BookOpen, Zap, TrendingUp, Hammer, ArrowUpRight,
  DollarSign, Lock, ChevronRight
} from 'lucide-react';

interface Props {
  action: GameAction;
  onSelect: () => void;
  disabled?: boolean;
  cash: number;
}

const categoryMeta: Record<string, {
  label: string;
  labelColor: string;
  badgeBg: string;
  btnBg: string;
  btnHover: string;
  borderColor: string;
  gradientFrom: string;
  gradientTo: string;
  img: string;
  LucideIcon: React.ElementType;
}> = {
  learn: {
    label: 'Learn',
    labelColor: 'text-blue-300',
    badgeBg: 'bg-blue-500/15 border-blue-500/30',
    btnBg: 'bg-blue-500',
    btnHover: 'hover:bg-blue-400',
    borderColor: 'border-blue-500/25 hover:border-blue-400/50',
    gradientFrom: 'from-blue-900/80',
    gradientTo: 'to-slate-900/95',
    img: 'https://images.pexels.com/photos/256395/pexels-photo-256395.jpeg?auto=compress&cs=tinysrgb&w=600',
    LucideIcon: BookOpen,
  },
  hustle: {
    label: 'Hustle',
    labelColor: 'text-amber-300',
    badgeBg: 'bg-amber-500/15 border-amber-500/30',
    btnBg: 'bg-amber-500',
    btnHover: 'hover:bg-amber-400',
    borderColor: 'border-amber-500/25 hover:border-amber-400/50',
    gradientFrom: 'from-amber-900/80',
    gradientTo: 'to-slate-900/95',
    img: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=600',
    LucideIcon: Zap,
  },
  invest: {
    label: 'Invest',
    labelColor: 'text-emerald-300',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
    btnBg: 'bg-emerald-500',
    btnHover: 'hover:bg-emerald-400',
    borderColor: 'border-emerald-500/25 hover:border-emerald-400/50',
    gradientFrom: 'from-emerald-900/80',
    gradientTo: 'to-slate-900/95',
    img: 'https://images.pexels.com/photos/534216/pexels-photo-534216.jpeg?auto=compress&cs=tinysrgb&w=600',
    LucideIcon: TrendingUp,
  },
  build: {
    label: 'Build',
    labelColor: 'text-rose-300',
    badgeBg: 'bg-rose-500/15 border-rose-500/30',
    btnBg: 'bg-rose-500',
    btnHover: 'hover:bg-rose-400',
    borderColor: 'border-rose-500/25 hover:border-rose-400/50',
    gradientFrom: 'from-rose-900/80',
    gradientTo: 'to-slate-900/95',
    img: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=600',
    LucideIcon: Hammer,
  },
  grow: {
    label: 'Scale',
    labelColor: 'text-violet-300',
    badgeBg: 'bg-violet-500/15 border-violet-500/30',
    btnBg: 'bg-violet-500',
    btnHover: 'hover:bg-violet-400',
    borderColor: 'border-violet-500/25 hover:border-violet-400/50',
    gradientFrom: 'from-violet-900/80',
    gradientTo: 'to-slate-900/95',
    img: 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=600',
    LucideIcon: ArrowUpRight,
  },
};

export default function ActionCard({ action, onSelect, disabled, cash }: Props) {
  const meta = categoryMeta[action.category] || categoryMeta.hustle;
  const canAfford = cash >= action.cost;
  const isDisabled = disabled || !canAfford;
  const { LucideIcon } = meta;

  return (
    <div
      onClick={() => !isDisabled && onSelect()}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-250 ${meta.borderColor} ${
        isDisabled
          ? 'opacity-55 cursor-not-allowed bg-slate-900/60'
          : 'cursor-pointer hover:scale-[1.025] hover:shadow-2xl bg-slate-900/80'
      }`}
    >
      {/* Image header */}
      <div className="relative h-28 overflow-hidden">
        <img
          src={meta.img}
          alt={meta.label}
          className={`w-full h-full object-cover transition-transform duration-500 ${!isDisabled ? 'group-hover:scale-110' : ''}`}
        />
        <div className={`absolute inset-0 bg-gradient-to-b ${meta.gradientFrom} ${meta.gradientTo}`} />

        {/* Category badge + icon */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${meta.badgeBg} border backdrop-blur-sm`}>
            <LucideIcon size={15} className={meta.labelColor} />
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm ${meta.badgeBg} ${meta.labelColor}`}>
            {meta.label}
          </span>
        </div>

        {/* Big emoji icon in the image */}
        <div className="absolute bottom-2 right-3 text-3xl opacity-80 drop-shadow-lg">{action.icon}</div>
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4">
        <h4 className="font-black text-white text-base leading-snug mb-1.5">{action.name}</h4>
        <p className="text-slate-400 text-xs leading-relaxed mb-3 flex-1">{action.description}</p>

        {/* Flavor text */}
        <p className="text-slate-500 text-xs italic mb-4 leading-relaxed pl-3 border-l-2 border-white/10">
          "{action.flavorText}"
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          <div className={`flex items-center gap-1.5 text-sm font-bold ${
            action.cost === 0 ? 'text-emerald-400' : canAfford ? 'text-white' : 'text-rose-400'
          }`}>
            {action.cost === 0 ? (
              <>
                <Zap size={13} className="text-emerald-400" />
                Free
              </>
            ) : !canAfford ? (
              <>
                <Lock size={13} />
                ${action.cost.toLocaleString()}
              </>
            ) : (
              <>
                <DollarSign size={13} />
                {action.cost.toLocaleString()}
              </>
            )}
          </div>
          <button
            disabled={isDisabled}
            onClick={e => { e.stopPropagation(); !isDisabled && onSelect(); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all duration-150 ${
              isDisabled
                ? 'bg-slate-700/60 text-slate-500 cursor-not-allowed'
                : `${meta.btnBg} ${meta.btnHover} group-hover:shadow-lg`
            }`}
          >
            {disabled && canAfford ? 'End turn first' : !canAfford ? 'Need cash' : (
              <>Take Action <ChevronRight size={14} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
