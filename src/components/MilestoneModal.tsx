import { useEffect, useState } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import type { Milestone } from '../types';

interface Props {
  milestone: Milestone;
  onContinue: () => void;
}

const milestoneImages: Record<number, string> = {
  1: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=800',
  2: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800',
  3: 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=800',
  4: 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=800',
  5: 'https://images.pexels.com/photos/1449452/pexels-photo-1449452.jpeg?auto=compress&cs=tinysrgb&w=800',
};

// Simple sparkle particle
function Particle({ delay, x, color }: { delay: number; x: number; color: string }) {
  return (
    <div
      className={`absolute w-2 h-2 rounded-full ${color} pointer-events-none`}
      style={{
        left: `${x}%`,
        top: '-10px',
        animation: `particleFall 1.8s ease-in ${delay}s forwards`,
      }}
    />
  );
}

const particleColors = ['bg-amber-400', 'bg-rose-400', 'bg-emerald-400', 'bg-blue-400', 'bg-violet-400', 'bg-orange-400'];
const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.floor(Math.random() * 100),
  delay: Math.random() * 1.2,
  color: particleColors[Math.floor(Math.random() * particleColors.length)],
}));

export default function MilestoneModal({ milestone, onContinue }: Props) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 50); }, []);

  const img = milestoneImages[milestone.level];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-lg" />

      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map(p => <Particle key={p.id} {...p} />)}
      </div>

      {/* Glow effect */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/8 rounded-full blur-3xl" />
      </div>

      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-500/30 shadow-2xl shadow-amber-500/10"
        style={{ animation: visible ? 'milestoneIn 0.5s cubic-bezier(0.34,1.4,0.64,1) forwards' : 'none', opacity: 0 }}
      >
        {/* Image header */}
        {img && (
          <div className="relative h-52 overflow-hidden">
            <img src={img} alt={milestone.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-slate-900" />

            {/* Trophy badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${milestone.color} flex items-center justify-center shadow-2xl border-4 border-amber-500/40`}
                style={{ boxShadow: '0 0 60px rgba(251,191,36,0.4)' }}>
                <span className="text-3xl">🏆</span>
              </div>
            </div>

            {/* Level badge */}
            <div className="absolute top-4 left-4">
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-500/25 border border-amber-500/40 text-amber-300 backdrop-blur-sm">
                <Sparkles size={10} />
                Level {milestone.level} Reached
              </span>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="bg-slate-900 p-7 text-center">
          <h2 className="text-3xl font-black text-white mb-1">{milestone.title}</h2>
          <p className="text-amber-400 font-semibold text-sm mb-4">{milestone.subtitle}</p>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">{milestone.description}</p>

          {/* Reward box */}
          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl px-5 py-4 mb-6 text-left">
            <div className="text-xs text-emerald-500/70 uppercase tracking-wider font-semibold mb-1.5">Reward Unlocked</div>
            <div className="text-emerald-300 font-bold flex items-center gap-2">
              <Sparkles size={14} className="text-emerald-400" />
              {milestone.reward}
            </div>
          </div>

          <button
            onClick={onContinue}
            className="w-full flex items-center justify-center gap-2 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base rounded-2xl transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/30"
          >
            Keep Building
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
