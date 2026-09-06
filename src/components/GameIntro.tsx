import { useState } from 'react';
import { Play, ArrowRight, RotateCcw } from 'lucide-react';
import type { Archetype } from '../types';
import { ARCHETYPES } from '../types';
import { loadGame } from '../gameEngine';
import { sfx } from '../sfx';

interface Props {
  onStart: (name: string, archetype: Archetype, age: number) => void;
  onContinue: () => void;
}

export default function GameIntro({ onStart, onContinue }: Props) {
  const [name, setName] = useState('');
  const [age, setAge] = useState(22);
  const [selected, setSelected] = useState<Archetype | null>(null);
  const [step, setStep] = useState<'landing' | 'setup'>('landing');
  const hasSave = !!loadGame();

  if (step === 'landing') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt=""
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/80 to-amber-950/30" />
        </div>

        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <div className="mb-6 text-6xl animate-bounce">🚀</div>
          <h1 className="text-5xl sm:text-7xl font-black text-white mb-3 tracking-tight">
            Freedom<span className="text-amber-400">Path</span>
          </h1>
          <p className="text-slate-400 text-lg mb-2">Life Strategy Game — Any Age</p>
          <p className="text-slate-500 text-sm mb-10 max-w-md mx-auto">
            Escape the 9-5. Build income streams. Invest in real estate. Live on your own terms.
          </p>

          <div className="flex flex-col items-center gap-4">
            {hasSave && (
              <button
                onClick={() => { sfx.select(); onContinue(); }}
                className="group flex items-center gap-3 px-10 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-lg rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/30"
              >
                <RotateCcw size={20} />
                Continue Your Journey
              </button>
            )}
            <button
              onClick={() => { sfx.click(); setStep('setup'); }}
              className="group flex items-center gap-3 px-10 py-4 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-lg rounded-2xl transition-all duration-200 hover:scale-105"
            >
              <Play size={20} fill="currentColor" />
              {hasSave ? 'Start New Game' : 'Start Your Journey'}
            </button>
          </div>

          <footer className="mt-12 text-center">
            <p className="text-slate-600 text-xs">
              &copy; {new Date().getFullYear()} Omara Alexander Morgan. All rights reserved.
            </p>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 py-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-black text-white text-center mb-2">Create Your Character</h2>
        <p className="text-slate-500 text-center mb-8 text-sm">Choose your path to financial freedom</p>

        <div className="max-w-sm mx-auto mb-6">
          <label className="block text-slate-400 text-sm font-medium mb-2">What's your name?</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name..."
            maxLength={24}
            autoFocus
            className="w-full bg-white/5 border border-white/12 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/60 focus:bg-white/8 transition-all text-lg"
          />
        </div>

        <div className="max-w-sm mx-auto mb-8">
          <label className="block text-slate-400 text-sm font-medium mb-2">
            How old are you? <span className="text-amber-400 font-bold">({age} years)</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={13}
              max={65}
              value={age}
              onChange={e => setAge(Number(e.target.value))}
              className="flex-1 accent-amber-500 cursor-pointer"
            />
            <div className="w-16 text-center bg-white/5 border border-white/12 rounded-xl px-3 py-2 text-white font-bold text-lg">
              {age}
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-1">
            <span>13</span><span>65</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {(Object.keys(ARCHETYPES) as Archetype[]).map(key => {
            const a = ARCHETYPES[key];
            const isSelected = selected === key;
            return (
              <button
                key={key}
                onClick={() => { sfx.select(); setSelected(key); }}
                className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-200 text-left ${
                  isSelected ? 'border-amber-500 scale-[1.02] shadow-lg shadow-amber-500/20' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="h-24 overflow-hidden">
                  <img src={a.img} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                </div>
                <div className="absolute top-2 left-3 text-3xl">{a.icon}</div>
                <div className="p-4 pt-2">
                  <h3 className="text-white font-bold text-lg">{a.name}</h3>
                  <p className="text-slate-400 text-xs mt-1">{a.desc}</p>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                    <span className="text-slate-950 text-xs font-black">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="text-center">
          <button
            onClick={() => { if (name.trim() && selected) { sfx.success(); onStart(name.trim(), selected, age); } }}
            disabled={!name.trim() || !selected}
            className="group flex items-center gap-3 px-12 py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black text-lg rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/30 disabled:cursor-not-allowed disabled:scale-100 mx-auto"
          >
            <Play size={20} fill="currentColor" />
            Begin Your Freedom Path
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          {(!name.trim() || !selected) && (
            <p className="text-slate-600 text-sm mt-3">
              {!name.trim() ? 'Enter a name above' : 'Select an archetype'} to start
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
