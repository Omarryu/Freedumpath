import { useState } from 'react';
import { AlertTriangle, Star, Zap, ChevronRight } from 'lucide-react';
import type { GameEvent, GameState } from '../types';

interface Props {
  event: GameEvent;
  state: GameState;
  onResolve: (choiceIndex?: number) => void;
}

const eventImages: Record<string, string> = {
  viral_post:      'https://images.pexels.com/photos/1557251/pexels-photo-1557251.jpeg?auto=compress&cs=tinysrgb&w=800',
  big_client:      'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=800',
  market_boom:     'https://images.pexels.com/photos/534216/pexels-photo-534216.jpeg?auto=compress&cs=tinysrgb&w=800',
  tax_refund:      'https://images.pexels.com/photos/4386373/pexels-photo-4386373.jpeg?auto=compress&cs=tinysrgb&w=800',
  referral_windfall:'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=800',
  car_breakdown:   'https://images.pexels.com/photos/164634/pexels-photo-164634.jpeg?auto=compress&cs=tinysrgb&w=800',
  health_expense:  'https://images.pexels.com/photos/3376790/pexels-photo-3376790.jpeg?auto=compress&cs=tinysrgb&w=800',
  market_crash:    'https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&w=800',
  client_ghosted:  'https://images.pexels.com/photos/3243090/pexels-photo-3243090.jpeg?auto=compress&cs=tinysrgb&w=800',
  burnout:         'https://images.pexels.com/photos/3807571/pexels-photo-3807571.jpeg?auto=compress&cs=tinysrgb&w=800',
  algo_change:     'https://images.pexels.com/photos/6248577/pexels-photo-6248577.jpeg?auto=compress&cs=tinysrgb&w=800',
  opportunity_collab:'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800',
  mentor_offer:    'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=800',
  unexpected_expense:'https://images.pexels.com/photos/4386433/pexels-photo-4386433.jpeg?auto=compress&cs=tinysrgb&w=800',
};

const typeConfig = {
  good: {
    overlayFrom: 'from-emerald-950/90',
    overlayTo: 'to-emerald-900/70',
    badge: 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40',
    badgeText: 'Good Fortune',
    BadgeIcon: Star,
    cardBorder: 'border-emerald-500/30',
    btnClass: 'bg-emerald-500 hover:bg-emerald-400 text-white',
    btnText: 'Celebrate!',
    glow: 'shadow-emerald-500/15',
  },
  bad: {
    overlayFrom: 'from-rose-950/90',
    overlayTo: 'to-rose-900/70',
    badge: 'bg-rose-500/25 text-rose-300 border-rose-500/40',
    badgeText: 'Life Event',
    BadgeIcon: AlertTriangle,
    cardBorder: 'border-rose-500/30',
    btnClass: 'bg-rose-500 hover:bg-rose-400 text-white',
    btnText: 'Deal with it',
    glow: 'shadow-rose-500/15',
  },
  neutral: {
    overlayFrom: 'from-slate-950/90',
    overlayTo: 'to-slate-800/70',
    badge: 'bg-slate-500/25 text-slate-300 border-slate-500/40',
    badgeText: 'Life Event',
    BadgeIcon: Zap,
    cardBorder: 'border-slate-500/30',
    btnClass: 'bg-slate-600 hover:bg-slate-500 text-white',
    btnText: 'Continue',
    glow: 'shadow-slate-500/10',
  },
  opportunity: {
    overlayFrom: 'from-amber-950/90',
    overlayTo: 'to-amber-900/70',
    badge: 'bg-amber-500/25 text-amber-300 border-amber-500/40',
    badgeText: 'Opportunity',
    BadgeIcon: Star,
    cardBorder: 'border-amber-500/30',
    btnClass: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black',
    btnText: 'Seize it!',
    glow: 'shadow-amber-500/15',
  },
};

export default function EventModal({ event, onResolve }: Props) {
  const [hovering, setHovering] = useState<number | null>(null);
  const cfg = typeConfig[event.type];
  const { BadgeIcon } = cfg;
  const img = eventImages[event.id];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md" onClick={() => {}} />

      <div
        className={`relative w-full max-w-md overflow-hidden rounded-3xl border ${cfg.cardBorder} shadow-2xl ${cfg.glow}`}
        style={{ animation: 'slideUp 0.35s cubic-bezier(0.34,1.2,0.64,1)' }}
      >
        {/* Image header */}
        {img && (
          <div className="relative h-48 overflow-hidden">
            <img src={img} alt={event.title} className="w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-b ${cfg.overlayFrom} ${cfg.overlayTo}`} />

            {/* Badge over image */}
            <div className="absolute top-4 left-4">
              <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border backdrop-blur-sm ${cfg.badge}`}>
                <BadgeIcon size={11} />
                {cfg.badgeText}
              </span>
            </div>

            {/* Event icon */}
            <div className="absolute bottom-4 left-4 flex items-end gap-3">
              <span className="text-5xl drop-shadow-lg">{event.icon}</span>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="bg-slate-900 p-6">
          {!img && (
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{event.icon}</span>
              <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${cfg.badge}`}>
                <BadgeIcon size={11} />
                {cfg.badgeText}
              </span>
            </div>
          )}

          <h3 className="text-2xl font-black text-white mb-2">{event.title}</h3>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">{event.description}</p>

          {event.choices ? (
            <div className="space-y-2.5">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">What do you do?</p>
              {event.choices.map((choice, i) => (
                <button
                  key={i}
                  onMouseEnter={() => setHovering(i)}
                  onMouseLeave={() => setHovering(null)}
                  onClick={() => onResolve(i)}
                  className={`w-full flex items-center justify-between text-left px-5 py-4 rounded-2xl border transition-all duration-150 ${
                    hovering === i
                      ? 'bg-white/12 border-white/30 scale-[1.015] shadow-lg'
                      : 'bg-white/5 border-white/10 hover:bg-white/8'
                  }`}
                >
                  <span className="text-white font-medium text-sm leading-snug pr-3">{choice.label}</span>
                  <ChevronRight size={16} className="text-slate-500 flex-shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={() => onResolve()}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all duration-150 hover:scale-[1.02] hover:shadow-lg ${cfg.btnClass}`}
            >
              {cfg.btnText} <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
