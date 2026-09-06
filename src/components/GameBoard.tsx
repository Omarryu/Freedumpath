import { useState, useEffect, useCallback } from 'react';
import {
  Wallet, TrendingUp, BookOpen, Users, Heart, Zap, Star,
  Volume2, VolumeX, Headphones, ChevronRight, Building2, Landmark,
  Sparkles, Trophy, AlertCircle, X, RotateCcw, LogOut, Home, Settings as SettingsIcon,
  Calendar, DollarSign,
} from 'lucide-react';
import type { GameState, GameAction, LoanProduct } from '../types';
import { getActionPool } from '../actions';
import { executeAction, advanceMonth, takeLoan, makeLoanPayment, collectAssetIncome, liquidateAsset, toggleRental, buildOnLand, transferToBank, transferFromBank, applyLifeEvent } from '../gameEngine';
import { getRandomLifeEvent } from '../lifeEvents';
import type { LifeEvent } from '../types';
import LifeEventModal from './LifeEventModal';
import Toast, { type ToastData } from './Toast';
import { sfx } from '../sfx';
import ActionGrid from './ActionGrid';
import SettingsModal from './SettingsModal';
import LoanModal from './LoanModal';
import BankModal from './BankModal';
import AssetModal from './AssetModal';

interface Props {
  state: GameState;
  onChange: (state: GameState) => void;
  onRestart: () => void;
  onExit: () => void;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function GameBoard({ state, onChange, onRestart, onExit }: Props) {
  const [actionPool, setActionPool] = useState<GameAction[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const [showAssets, setShowAssets] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const [showExitMenu, setShowExitMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeLoanId, setActiveLoanId] = useState<string | null>(null);
  const [showBankReminder, setShowBankReminder] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState<null | 'income' | 'level' | 'asset' | 'cash'>(null);
  const [floatingText, setFloatingText] = useState<{ text: string; color: string } | null>(null);
  const [musicOn, setMusicOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [prevCash, setPrevCash] = useState(state.cash);
  const [prevLevel, setPrevLevel] = useState(state.level);
  const [prevIncome, setPrevIncome] = useState(state.monthlyIncome);
  const [prevAssetCount, setPrevAssetCount] = useState(state.assets.length);
  const [prevLoanCount, setPrevLoanCount] = useState(state.loans.length);
  const [prevNetWorth, setPrevNetWorth] = useState(0);
  const [hasHadFirstAsset, setHasHadFirstAsset] = useState(state.assets.length > 0);
  const [lastSpokenMonth, setLastSpokenMonth] = useState(state.month + state.year * 12);
  const [activeLifeEvent, setActiveLifeEvent] = useState<LifeEvent | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [lifeEventTriggered, setLifeEventTriggered] = useState(false);

  const actionsLeft = state.actionsPerMonth - state.actionsUsedThisMonth;

  useEffect(() => { setActionPool(getActionPool(state)); }, [state.level]);

  useEffect(() => {
    if (musicOn) sfx.startMusic();
    return () => sfx.stopMusic();
  }, [musicOn]);

  useEffect(() => { sfx.setSpeechEnabled(voiceOn); }, [voiceOn]);

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
      if (voiceOn) {
        if (!hasHadFirstAsset) {
          sfx.guideFirstAsset();
          setHasHadFirstAsset(true);
        } else {
          sfx.speak('New asset acquired! Congratulations!');
        }
      }
      setTimeout(() => setShowCelebration(null), 2500);
    }
    if (state.loans.length < prevLoanCount && state.loans.length >= 0) {
      const paidOff = state.loans.length < prevLoanCount;
      if (paidOff && voiceOn && prevLoanCount > 0) {
        sfx.guideLoanPaidOff('your investment');
      }
    }
    if (state.cash > prevCash && state.cash - prevCash > 100) {
      setFloatingText({ text: `+${(state.cash - prevCash).toLocaleString()}`, color: 'text-emerald-400' });
      setTimeout(() => setFloatingText(null), 2000);
    } else if (state.cash < prevCash && prevCash - state.cash > 100) {
      setFloatingText({ text: `-${(prevCash - state.cash).toLocaleString()}`, color: 'text-red-400' });
      setTimeout(() => setFloatingText(null), 2000);
    }

    const netWorth = state.cash + state.assets.reduce((sum, a) => sum + (a.purchasePrice ?? 0), 0) - state.loans.reduce((sum, l) => sum + (l.remaining ?? 0), 0);
    const milestones = [10000, 50000, 100000, 500000, 1000000];
    for (const m of milestones) {
      if (netWorth >= m && prevNetWorth < m && voiceOn) {
        sfx.guideWealthMilestone(m);
        break;
      }
    }

    if (state.energy <= 20 && voiceOn && state.energy > 0) {
      sfx.guideLowEnergy();
    }
    if (state.happiness <= 15 && voiceOn && state.happiness > 0) {
      sfx.guideLowHappiness();
    }
    if (state.cash > 25000 && prevCash <= 25000 && voiceOn) {
      sfx.guideHighCash(Math.round(state.cash / 1000) * 1000);
    }

    setPrevCash(state.cash);
    setPrevLevel(state.level);
    setPrevIncome(state.monthlyIncome);
    setPrevAssetCount(state.assets.length);
    setPrevLoanCount(state.loans.length);
    setPrevNetWorth(netWorth);
  }, [state.cash, state.level, state.monthlyIncome, state.assets.length, state.loans.length, state.energy, state.happiness]);

  useEffect(() => {
    if (state.phase !== 'playing') return;
    const currentKey = state.month + state.year * 12;
    const hasOverdue = state.loans.some(l => {
      const dueKey = (l.nextPaymentMonth ?? 1) + (l.nextPaymentYear ?? state.year) * 12;
      return currentKey >= dueKey && l.remaining > 0 && (l.missedPayments ?? 0) > 0;
    });
    if (hasOverdue && voiceOn) {
      setShowBankReminder(true);
      sfx.speak('The bank is contacting you about an overdue loan payment. Please visit the bank to make a payment.');
    }
  }, [state.month, state.year, state.loans, state.phase, voiceOn]);

  const handleAction = useCallback((action: GameAction) => {
    sfx.action();
    const next = executeAction(state, action);
    onChange(next);
    if (voiceOn) {
      const cashChange = next.cash - state.cash;
      sfx.guideActionTaken(action.name, cashChange);
      const remaining = next.actionsPerMonth - next.actionsUsedThisMonth;
      if (remaining > 0) {
        setTimeout(() => sfx.guideEndTurnReminder(remaining), 2500);
      }
    }
  }, [state, onChange, voiceOn]);

  const handleEndTurn = useCallback(() => {
    sfx.turn();
    const next = advanceMonth(state);
    onChange(next);
    setActionPool(getActionPool(next));
    if (next.lastIncomeCollected && next.lastIncomeCollected > 0) {
      if (voiceOn) sfx.guideIncome(next.lastIncomeCollected);
    } else if (voiceOn) {
      sfx.speak('New month. No passive income yet — keep building!');
    }
    if (Math.random() < 0.45) {
      setTimeout(() => {
        setActiveLifeEvent(getRandomLifeEvent());
        sfx.action();
      }, 600);
    }
  }, [state, onChange, voiceOn]);

  const handleLifeEventResolve = useCallback((choiceIndex: number) => {
    if (!activeLifeEvent) return;
    const next = applyLifeEvent(state, activeLifeEvent, choiceIndex);
    onChange(next);
    const choice = activeLifeEvent.choices[choiceIndex];
    let outcome = choice.deterministicOutcome;
    if (!outcome && choice.randomOutcomes) {
      outcome = choice.randomOutcomes[0];
    }
    if (outcome) {
      const toast: ToastData = {
        id: `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        message: outcome.isPositive ? 'Great choice!' : 'Ouch...',
        isPositive: !!outcome.isPositive,
        details: outcome.message,
      };
      setToasts(prev => [...prev, toast]);
    }
    setActiveLifeEvent(null);
  }, [activeLifeEvent, state, onChange]);

  const triggerRandomEvent = useCallback(() => {
    sfx.action();
    setActiveLifeEvent(getRandomLifeEvent());
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

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

  const handleLoanPayment = useCallback((loanId: string) => {
    sfx.click();
    const next = makeLoanPayment(state, loanId);
    onChange(next);
    if (voiceOn) sfx.speak('Payment received. Thank you.');
  }, [state, onChange, voiceOn]);

  const activeLoan = state.loans.find(l => l.id === activeLoanId);

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-x-hidden">
      {showCelebration && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-blue-500/20 animate-pulse" />
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-2xl animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${0.5 + Math.random() * 1}s`,
              }}
            >
              {['🎉','💰','🚀','⭐','🎊','💎','🏆'][i % 7]}
            </div>
          ))}
          <div className="relative z-10 text-center animate-zoom-in">
            {showCelebration === 'level' && (
              <>
                <div className="text-7xl mb-4 animate-bounce">🏆</div>
                <h2 className="text-4xl font-black text-amber-400 drop-shadow-lg">LEVEL UP!</h2>
                <p className="text-xl text-white mt-2">You reached Level {state.level}!</p>
              </>
            )}
            {showCelebration === 'income' && (
              <>
                <div className="text-7xl mb-4 animate-bounce">💰</div>
                <h2 className="text-4xl font-black text-emerald-400 drop-shadow-lg">NEW INCOME!</h2>
                <p className="text-xl text-white mt-2">${(state.monthlyIncome ?? 0).toLocaleString()}/month</p>
              </>
            )}
            {showCelebration === 'asset' && (
              <>
                <div className="text-7xl mb-4 animate-bounce">🏢</div>
                <h2 className="text-4xl font-black text-cyan-400 drop-shadow-lg">ASSET ACQUIRED!</h2>
                <p className="text-xl text-white mt-2">Your portfolio is growing!</p>
              </>
            )}
          </div>
        </div>
      )}

      {floatingText && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <span className={`text-4xl font-black ${floatingText.color} drop-shadow-lg animate-float-up`}>
            {floatingText.text}
          </span>
        </div>
      )}

      {showSettings && (
        <SettingsModal
          state={state}
          settings={{ sound: musicOn, notifications: true, compactMode: false }}
          onSettingsChange={(s) => { setMusicOn(s.sound); }}
          onClose={() => setShowSettings(false)}
          onRestart={() => { if (voiceOn) sfx.guideRestart(); onRestart(); }}
          onClearSave={() => { onRestart(); }}
        />
      )}

      {showExitMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-slate-900 border-2 border-amber-500/30 rounded-3xl p-8 max-w-md w-full text-center relative">
            <button onClick={() => { sfx.click(); setShowExitMenu(false); }} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <X size={20} />
            </button>
            <div className="text-5xl mb-4">🚪</div>
            <h2 className="text-2xl font-black text-white mb-2">Exit Game</h2>
            <p className="text-slate-400 text-sm mb-6">Your progress is saved automatically. What would you like to do?</p>
            <div className="space-y-3">
              <button
                onClick={() => { sfx.click(); setShowExitMenu(false); }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border-2 border-white/10 hover:border-white/20 rounded-xl text-white font-bold transition-all hover:scale-[1.02]"
              >
                <Home size={18} />
                Keep Playing
              </button>
              <button
                onClick={() => { sfx.click(); if (voiceOn) sfx.guideRestart(); setShowExitMenu(false); onRestart(); }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-500/15 border-2 border-amber-500/30 hover:border-amber-500/60 rounded-xl text-amber-400 font-bold transition-all hover:scale-[1.02]"
              >
                <RotateCcw size={18} />
                Restart New Game
              </button>
              <button
                onClick={() => { sfx.click(); if (voiceOn) sfx.guideExit(); setShowExitMenu(false); onExit(); }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500/15 border-2 border-red-500/30 hover:border-red-500/60 rounded-xl text-red-400 font-bold transition-all hover:scale-[1.02]"
              >
                <LogOut size={18} />
                Exit to Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {showMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-8 max-w-md text-center relative">
            <button onClick={() => setShowMilestone(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <X size={20} />
            </button>
            <Trophy size={48} className="text-amber-400 mx-auto mb-4" />
            <h2 className="text-3xl font-black text-white mb-2">Level {state.level}!</h2>
            <p className="text-slate-400 mb-6">You're making great progress on your freedom path. Keep building!</p>
            <button
              onClick={() => { sfx.click(); setShowMilestone(false); }}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-white/10 px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🚀</span>
            <span className="font-black text-base sm:text-lg hidden sm:inline">FreedomPath</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="bg-white/5 rounded-lg px-2 py-1 sm:px-3 sm:py-1.5">
              <span className="text-slate-500">📅 </span>
              <span className="font-bold">{MONTHS[state.month - 1]} {state.year}</span>
            </div>
            <div className="bg-white/5 rounded-lg px-2 py-1 sm:px-3 sm:py-1.5">
              <span className="text-slate-500">👤 </span>
              <span className="font-bold">{state.playerName}, {state.age}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setMusicOn(v => !v)}
              className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl border transition-colors ${musicOn ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/8 text-slate-500 hover:text-white'}`}
              aria-label="Toggle music"
            >
              {musicOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              onClick={() => setVoiceOn(v => !v)}
              className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl border transition-colors ${voiceOn ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/8 text-slate-500 hover:text-white'}`}
              aria-label="Toggle voice"
            >
              <Headphones size={16} className={voiceOn ? '' : 'opacity-40'} />
            </button>
            <button
              onClick={() => { sfx.click(); setShowSettings(true); }}
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl border bg-white/5 border-white/8 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Settings"
            >
              <SettingsIcon size={16} />
            </button>
            <button
              onClick={() => { sfx.click(); setShowExitMenu(true); }}
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl border bg-white/5 border-white/8 text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-colors"
              aria-label="Exit or restart game"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 sm:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 sm:gap-6">
          <div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
              <StatCard icon={<Wallet size={16} />} label="Cash" value={`${(state.cash ?? 0).toLocaleString()}`} color="text-amber-400" highlight={state.cash > prevCash} />
              <StatCard icon={<TrendingUp size={16} />} label="Income" value={`${(state.monthlyIncome ?? 0).toLocaleString()}/mo`} color="text-emerald-400" highlight={state.monthlyIncome > 0} />
              <StatCard icon={<Zap size={16} />} label="Energy" value={`${state.energy}`} color="text-yellow-400" />
              <StatCard icon={<Star size={16} />} label="Happy" value={`${state.happiness}`} color="text-rose-400" />
              <StatCard icon={<BookOpen size={16} />} label="Know" value={`${state.knowledge}`} color="text-blue-400" />
              <StatCard icon={<Users size={16} />} label="Network" value={`${state.connections}`} color="text-purple-400" />
            </div>

            <div className="flex items-center gap-3 mb-4 bg-white/5 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">⭐</span>
                <span className="font-bold text-sm">Level {state.level}</span>
              </div>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500" style={{ width: `${(state.xp / state.xpToNext) * 100}%` }} />
              </div>
              <span className="text-xs text-slate-500">{state.xp}/{state.xpToNext} XP</span>
            </div>

            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                This Month's Opportunities
              </h2>
              <span className={`text-xs sm:text-sm font-bold px-2 py-1 rounded-lg ${actionsLeft > 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>
                {actionsLeft} actions left
              </span>
            </div>

            <ActionGrid actions={actionPool} cash={state.cash} onSelect={handleAction} disabled={actionsLeft === 0} maxSlots={25} />

            <div className="flex gap-2 mt-4">
              <button
                onClick={triggerRandomEvent}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-violet-950/40 border-2 border-violet-700/30 hover:border-violet-500/60 rounded-xl text-violet-400 font-bold transition-all hover:scale-[1.02]"
              >
                <Sparkles size={18} />
                Life Event
              </button>
              <button
                onClick={() => { sfx.click(); setShowBank(true); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-950/40 border-2 border-cyan-700/30 hover:border-cyan-500/60 rounded-xl text-cyan-400 font-bold transition-all hover:scale-[1.02]"
              >
                <Landmark size={18} />
                Visit Bank
              </button>
              <button
                onClick={() => { sfx.click(); setShowAssets(true); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border-2 border-white/10 hover:border-white/20 rounded-xl text-white font-bold transition-all hover:scale-[1.02]"
              >
                <Building2 size={18} />
                My Assets ({state.assets.length})
              </button>
              {(state.bankBalance ?? 0) > 0 && (
                <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-cyan-950/30 border border-cyan-700/30 rounded-xl text-xs font-bold text-cyan-400">
                  <Landmark size={12} />
                  Bank: ${(state.bankBalance ?? 0).toLocaleString()}
                </div>
              )}
            </div>

            <div className="mt-4">
              <button
                onClick={handleEndTurn}
                disabled={actionsLeft > 0}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-lg transition-all ${
                  actionsLeft > 0
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-500/30 cursor-pointer'
                }`}
              >
                <ChevronRight size={22} />
                End Turn — Next Month
              </button>
              {actionsLeft > 0 && (
                <p className="text-center text-slate-600 text-xs mt-2">
                  Use all {actionsLeft} action{actionsLeft > 1 ? 's' : ''} before ending your turn
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {state.monthlyIncome > 0 && (
              <div className="bg-gradient-to-br from-emerald-950/60 to-emerald-900/30 border-2 border-emerald-600/40 rounded-2xl p-4 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-6xl opacity-10">💰</div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={18} className="text-emerald-400" />
                    <h3 className="font-bold text-emerald-400">Monthly Income</h3>
                  </div>
                  <p className="text-3xl font-black text-emerald-300">
                    +${(state.monthlyIncome ?? 0).toLocaleString()}<span className="text-sm text-emerald-500">/mo</span>
                  </p>
                  <div className="mt-3 space-y-1.5">
                    {state.incomeSources && state.incomeSources.length > 0 ? (
                      state.incomeSources.map(src => (
                        <div key={src.id} className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-2 py-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm flex-shrink-0">{src.icon}</span>
                            <div className="min-w-0">
                              <div className="text-slate-300 truncate font-medium">{src.name}</div>
                              <div className="text-slate-600 text-[10px]">{src.category} • Since {MONTHS[src.acquiredMonth - 1]} {src.acquiredYear}</div>
                            </div>
                          </div>
                          <span className="text-emerald-400 font-bold flex-shrink-0">+${src.monthlyAmount}/mo</span>
                        </div>
                      ))
                    ) : (
                      state.assets.filter(a => (a.monthlyIncome ?? 0) > 0).map(a => (
                        <div key={a.id} className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">{a.icon} {a.name}</span>
                          <span className="text-emerald-400 font-bold">+${a.monthlyIncome}/mo</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {state.loans.length > 0 && (
              <div className="bg-red-950/30 border border-red-700/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={16} className="text-red-400" />
                  <h3 className="font-bold text-red-400 text-sm">Active Loans</h3>
                </div>
                {state.loans.map(l => {
                  const currentKey = state.month + state.year * 12;
                  const dueKey = (l.nextPaymentMonth ?? 1) + (l.nextPaymentYear ?? state.year) * 12;
                  const overdue = currentKey >= dueKey && l.remaining > 0;
                  return (
                    <button
                      key={l.id}
                      onClick={() => { sfx.click(); setActiveLoanId(l.id); }}
                      className={`w-full text-left text-xs mb-1 p-2 rounded-lg transition-colors ${overdue ? 'bg-red-950/50 border border-red-500/30 hover:bg-red-950/70' : 'bg-white/5 hover:bg-white/8'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-medium">{l.purpose}</span>
                        {overdue && <span className="text-red-400 font-bold text-[10px] animate-pulse">OVERDUE</span>}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-slate-400">${(l.remaining ?? 0).toLocaleString()} left</span>
                        <span className="text-cyan-400">${(l.monthlyPayment ?? 0)}/mo</span>
                      </div>
                      <div className="text-slate-600 text-[10px] mt-0.5">
                        Due: {MONTHS[(l.nextPaymentMonth ?? 1) - 1]} {l.nextPaymentYear ?? state.year}
                        {(l.missedPayments ?? 0) > 0 && <span className="text-red-400 ml-1">• {l.missedPayments} missed</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <button onClick={() => setShowLog(v => !v)} className="flex items-center justify-between w-full mb-2">
                <h3 className="font-bold text-sm">Activity Log</h3>
                <ChevronRight size={16} className={`transition-transform ${showLog ? 'rotate-90' : ''}`} />
              </button>
              {showLog && (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {state.log.slice(0, 30).map((entry, i) => (
                    <div key={i} className={`text-xs p-2 rounded-lg ${
                      entry.type === 'milestone' ? 'bg-amber-500/10 text-amber-300' :
                      entry.type === 'income' ? 'bg-emerald-500/10 text-emerald-300' :
                      entry.type === 'loan' ? 'bg-red-500/10 text-red-300' :
                      'bg-white/5 text-slate-400'
                    }`}>
                      <span className="text-slate-600">{MONTHS[entry.month - 1]} {entry.year}: </span>
                      {entry.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-3 border-t border-white/5">
        <p className="text-slate-600 text-xs">
          &copy; {new Date().getFullYear()} Omara Alexander Morgan. All rights reserved.
        </p>
      </footer>

      {activeLoan && (
        <LoanModal
          state={state}
          loan={activeLoan}
          onClose={() => setActiveLoanId(null)}
          onChange={onChange}
        />
      )}

      {showBankReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-slate-900 border-2 border-red-500/40 rounded-3xl p-6 max-w-md w-full text-center relative">
            <button onClick={() => setShowBankReminder(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <X size={20} />
            </button>
            <div className="w-16 h-16 rounded-full bg-red-500/15 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <Landmark size={32} className="text-red-400" />
            </div>
            <h2 className="text-2xl font-black text-red-400 mb-2">Bank Alert</h2>
            <p className="text-slate-400 text-sm mb-4">
              You have overdue loan payments. The bank is contacting you to make a payment.
              Please review your loans and pay now to avoid penalties.
            </p>
            <div className="space-y-2">
              {state.loans.filter(l => (l.missedPayments ?? 0) > 0).map(l => (
                <div key={l.id} className="bg-red-950/40 border border-red-500/20 rounded-xl p-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-sm">{l.purpose}</span>
                    <span className="text-red-400 font-bold text-xs">{l.missedPayments} missed</span>
                  </div>
                  <div className="text-slate-400 text-xs mt-1">
                    Pay ${l.monthlyPayment}/mo • Remaining: ${l.remaining.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setShowBankReminder(false);
                const firstOverdue = state.loans.find(l => (l.missedPayments ?? 0) > 0);
                if (firstOverdue) setActiveLoanId(firstOverdue.id);
              }}
              className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition-all hover:scale-[1.02]"
            >
              <DollarSign size={18} />
              Review & Pay Now
            </button>
          </div>
        </div>
      )}

      {showBank && (
        <BankModal
          state={state}
          selectedBankId={selectedBankId}
          onSelectBank={setSelectedBankId}
          onClose={() => setShowBank(false)}
          onTakeLoan={handleLoan}
          onAction={handleAction}
        />
      )}

      {activeLifeEvent && (
        <LifeEventModal event={activeLifeEvent} onResolve={handleLifeEventResolve} />
      )}

      {toasts.map(t => (
        <Toast key={t.id} toast={t} onDismiss={dismissToast} />
      ))}

      {showAssets && (
        <AssetModal
          state={state}
          onClose={() => setShowAssets(false)}
          onCollectIncome={(assetId, dest) => {
            const next = collectAssetIncome(state, assetId, dest);
            onChange(next);
          }}
          onLiquidate={(assetId) => {
            const next = liquidateAsset(state, assetId);
            onChange(next);
          }}
          onToggleRental={(assetId, rentalType) => {
            const next = toggleRental(state, assetId, rentalType);
            onChange(next);
          }}
          onBuild={(assetId, buildingType) => {
            const next = buildOnLand(state, assetId, buildingType);
            onChange(next);
          }}
          onTransferToBank={(amount) => {
            const next = transferToBank(state, amount);
            onChange(next);
          }}
          onTransferFromBank={(amount) => {
            const next = transferFromBank(state, amount);
            onChange(next);
          }}
        />
      )}

      <style>{`
        @keyframes zoom-in {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-zoom-in { animation: zoom-in 0.4s ease-out; }
        @keyframes float-up {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-80px) scale(1.5); opacity: 0; }
        }
        .animate-float-up { animation: float-up 2s ease-out forwards; }
      `}</style>
    </div>
  );
}

function StatCard({ icon, label, value, color, highlight }: { icon: React.ReactNode; label: string; value: string; color: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-2 sm:p-3 transition-all ${highlight ? 'bg-emerald-950/40 border-emerald-600/40 shadow-lg shadow-emerald-500/10' : 'bg-white/5 border-white/10'}`}>
      <div className="flex items-center gap-1 mb-1">
        <span className={color}>{icon}</span>
        <span className="text-[10px] sm:text-xs text-slate-500 font-medium">{label}</span>
      </div>
      <div className={`text-sm sm:text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}
