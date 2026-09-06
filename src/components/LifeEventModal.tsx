import { useState } from 'react';
import { X, ChevronRight, TrendingUp, TrendingDown, DollarSign, Heart, Zap, Repeat, Sparkles } from 'lucide-react';
import type { LifeEvent, LifeEventChoice, LifeEventImpact } from '../types';
import { sfx } from '../sfx';

interface Props {
  event: LifeEvent;
  onResolve: (choiceIndex: number) => void;
}

const categoryConfig = {
  relationship: {
    badge: 'bg-rose-500/25 text-rose-300 border-rose-500/40',
    badgeText: 'Relationship',
    cardBorder: 'border-rose-500/30',
    glow: 'shadow-rose-500/15',
    accent: 'text-rose-400',
  },
  temptation: {
    badge: 'bg-amber-500/25 text-amber-300 border-amber-500/40',
    badgeText: 'Temptation',
    cardBorder: 'border-amber-500/30',
    glow: 'shadow-amber-500/15',
    accent: 'text-amber-400',
  },
  risk: {
    badge: 'bg-violet-500/25 text-violet-300 border-violet-500/40',
    badgeText: 'High Risk / High Reward',
    cardBorder: 'border-violet-500/30',
    glow: 'shadow-violet-500/15',
    accent: 'text-violet-400',
  },
};

function ImpactBadge({ impact }: { impact: LifeEventImpact }) {
  const items: { icon: typeof DollarSign; value: number; label: string; color: string }[] = [];
  if (impact.cash) items.push({ icon: DollarSign, value: impact.cash, label: 'Cash', color: impact.cash > 0 ? 'text-emerald-400' : 'text-red-400' });
  if (impact.happiness) items.push({ icon: Heart, value: impact.happiness, label: 'Happy', color: impact.happiness > 0 ? 'text-emerald-400' : 'text-red-400' });
  if (impact.energy) items.push({ icon: Zap, value: impact.energy, label: 'Energy', color: impact.energy > 0 ? 'text-emerald-400' : 'text-red-400' });
  if (impact.monthlyExpense) items.push({ icon: Repeat, value: impact.monthlyExpense, label: '/mo', color: impact.monthlyExpense > 0 ? 'text-emerald-400' : 'text-red-400' });
  if (impact.passiveIncome) items.push({ icon: TrendingUp, value: impact.passiveIncome, label: '/mo passive', color: 'text-emerald-400' });

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {items.map((item, i) => {
        const Icon = item.icon;
        const sign = item.value > 0 ? '+' : '';
        return (
          <span key={i} className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/5 ${item.color}`}>
            <Icon size={9} />
            {sign}{item.value.toLocaleString()}{item.label !== 'Cash' && item.label !== 'Happy' && item.label !== 'Energy' ? item.label : ''}
          </span>
        );
      })}
    </div>
  );
}

export default function LifeEventModal({ event, onResolve }: Props) {
  const [hovering, setHovering] = useState<number | null>(null);
  const [resolving, setResolving] = useState(false);
  const cfg = categoryConfig[event.category];

  const handleChoice = (i: number) => {
    setResolving(true);
    sfx.click();
    setTimeout(() => onResolve(i), 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md" onClick={() => {}} />

      <div
        className={`relative w-full max-w-md overflow-hidden rounded-3xl border ${cfg.cardBorder} shadow-2xl ${cfg.glow} bg-slate-900`}
        style={{ animation: 'slideUp 0.35s cubic-bezier(0.34,1.2,0.64,1)', opacity: resolving ? 0.5 : 1, transition: 'opacity 0.2s' }}
      >
        {/* Image header */}
        <div className="relative h-44 overflow-hidden">
          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/40 to-slate-900" />

          <div className="absolute top-4 left-4">
            <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border backdrop-blur-sm ${cfg.badge}`}>
              <Sparkles size={11} />
              {cfg.badgeText}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <h3 className="text-2xl font-black text-white mb-2">{event.title}</h3>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">{event.description}</p>

          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">What do you do?</p>

          <div className="space-y-2.5">
            {event.choices.map((choice: LifeEventChoice, i: number) => (
              <button
                key={i}
                onMouseEnter={() => setHovering(i)}
                onMouseLeave={() => setHovering(null)}
                onClick={() => handleChoice(i)}
                disabled={resolving}
                className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-150 disabled:opacity-50 ${
                  hovering === i
                    ? 'bg-white/12 border-white/30 scale-[1.015] shadow-lg'
                    : 'bg-white/5 border-white/10 hover:bg-white/8'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-white font-medium text-sm leading-snug block">{choice.label}</span>
                    <span className="text-slate-500 text-xs mt-0.5 block">{choice.description}</span>
                    <ImpactBadge impact={choice.previewImpact} />
                  </div>
                  <ChevronRight size={16} className="text-slate-500 flex-shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>

          {event.choices.some(c => c.randomOutcomes) && (
            <p className="text-slate-600 text-[10px] text-center mt-4 flex items-center justify-center gap-1">
              <Sparkles size={9} />
              Outcomes are randomized — you take your chances
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          0% { transform: translateY(30px) scale(0.95); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
