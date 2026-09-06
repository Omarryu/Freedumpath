import { Lock, DollarSign, TrendingUp, BookOpen, Users, Heart, Building2 } from 'lucide-react';
import type { GameAction, ActionCategory } from '../types';
import { sfx } from '../sfx';

interface Props {
  actions: GameAction[];
  cash: number;
  onSelect: (action: GameAction) => void;
  disabled: boolean;
  maxSlots?: number;
  compact?: boolean;
}

const categoryStyles: Record<ActionCategory, { bg: string; border: string; hoverBorder: string; glow: string; iconColor: string; LucideIcon: any }> = {
  hustle: { bg: 'bg-amber-950/40', border: 'border-amber-700/30', hoverBorder: 'hover:border-amber-500/60', glow: 'hover:shadow-amber-500/20', iconColor: 'text-amber-400', LucideIcon: DollarSign },
  learn: { bg: 'bg-blue-950/40', border: 'border-blue-700/30', hoverBorder: 'hover:border-blue-500/60', glow: 'hover:shadow-blue-500/20', iconColor: 'text-blue-400', LucideIcon: BookOpen },
  invest: { bg: 'bg-emerald-950/40', border: 'border-emerald-700/30', hoverBorder: 'hover:border-emerald-500/60', glow: 'hover:shadow-emerald-500/20', iconColor: 'text-emerald-400', LucideIcon: TrendingUp },
  network: { bg: 'bg-purple-950/40', border: 'border-purple-700/30', hoverBorder: 'hover:border-purple-500/60', glow: 'hover:shadow-purple-500/20', iconColor: 'text-purple-400', LucideIcon: Users },
  wellness: { bg: 'bg-rose-950/40', border: 'border-rose-700/30', hoverBorder: 'hover:border-rose-500/60', glow: 'hover:shadow-rose-500/20', iconColor: 'text-rose-400', LucideIcon: Heart },
  bank: { bg: 'bg-cyan-950/40', border: 'border-cyan-700/30', hoverBorder: 'hover:border-cyan-500/60', glow: 'hover:shadow-cyan-500/20', iconColor: 'text-cyan-400', LucideIcon: Building2 },
};

export default function ActionGrid({ actions, cash, onSelect, disabled, maxSlots = 25, compact = false }: Props) {
  const slots: (GameAction | null)[] = [];
  for (let i = 0; i < maxSlots; i++) {
    slots.push(actions[i] || null);
  }

  return (
    <div className={`grid grid-cols-5 ${compact ? 'gap-1' : 'gap-2 sm:gap-3'}`}>
      {slots.map((action, i) => {
        if (!action) {
          return (
            <div
              key={`empty-${i}`}
              className="aspect-square rounded-2xl border border-dashed border-white/10 bg-white/5 flex items-center justify-center"
            >
              <Lock size={20} className="text-slate-700" />
            </div>
          );
        }

        const style = categoryStyles[action.category] || categoryStyles.hustle;
        const canAfford = cash >= action.cost;
        const isDisabled = disabled || !canAfford;
        const { LucideIcon } = style;

        return (
          <button
            key={action.id}
            onClick={() => { if (!isDisabled) { sfx.click(); onSelect(action); } }}
            onMouseEnter={() => !isDisabled && sfx.hover()}
            disabled={isDisabled}
            className={`group relative aspect-square rounded-2xl border-2 ${style.bg} ${style.border} ${style.hoverBorder} flex flex-col items-center justify-center gap-1 ${compact ? 'p-1' : 'p-1.5 sm:p-2'} transition-all duration-200 ${
              isDisabled
                ? 'opacity-50 cursor-not-allowed'
                : `cursor-pointer hover:scale-110 hover:shadow-lg ${style.glow} hover:-translate-y-0.5 active:scale-95`
            }`}
            title={action.description}
          >
            <span className={`${compact ? 'text-xl' : 'text-2xl sm:text-3xl'} leading-none drop-shadow-lg`}>{action.icon}</span>
            <span className={`text-[10px] sm:text-xs leading-tight text-slate-100 font-semibold text-center truncate w-full px-0.5`}>
              {action.name.length > 12 ? action.name.slice(0, 11) + '…' : action.name}
            </span>
            <LucideIcon size={14} className={style.iconColor} />
            {action.monthlyIncome && action.monthlyIncome > 0 && (
              <span className="absolute -top-1 -left-1 bg-emerald-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full leading-none">
                +${action.monthlyIncome}/mo
              </span>
            )}
            {!canAfford && (
              <div className="absolute inset-0 rounded-2xl bg-slate-950/50 flex items-center justify-center">
                <Lock size={18} className="text-slate-400" />
              </div>
            )}
            {canAfford && !disabled && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 border-2 border-slate-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <DollarSign size={10} className="text-slate-950" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
