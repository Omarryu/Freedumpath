import { useState, useEffect } from 'react';
import {
  X, Settings as SettingsIcon, RotateCcw, Volume2, VolumeX,
  Bell, BellOff, Moon, Sun, Info, Trash2, ChevronRight, Zap,
  Gamepad2, Keyboard,
} from 'lucide-react';
import type { GameState } from '../types';

export interface Settings {
  sound: boolean;
  notifications: boolean;
  compactMode: boolean;
}

export interface ButtonConfig {
  up: string;
  down: string;
  left: string;
  right: string;
  action: string;
  interact: string;
}

interface Props {
  state: GameState;
  settings: Settings;
  buttonConfig: ButtonConfig;
  onSettingsChange: (s: Settings) => void;
  onButtonConfigChange: (c: ButtonConfig) => void;
  onClose: () => void;
  onRestart: () => void;
  onClearSave: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  sound: true,
  notifications: true,
  compactMode: false,
};

export { DEFAULT_SETTINGS };

const DEFAULT_BUTTON_CONFIG: ButtonConfig = {
  up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD',
  action: 'Space', interact: 'KeyE',
};

const KEY_LABELS: Record<string, string> = {
  KeyW: 'W', KeyA: 'A', KeyS: 'S', KeyD: 'D',
  ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
  Space: 'Space', KeyE: 'E', KeyQ: 'Q', KeyF: 'F', KeyR: 'R',
  ShiftLeft: 'L-Shift', ShiftRight: 'R-Shift',
  ControlLeft: 'L-Ctrl', ControlRight: 'R-Ctrl',
  Enter: 'Enter', Tab: 'Tab',
};

function keyLabel(code: string): string {
  return KEY_LABELS[code] ?? code.replace('Key', '').replace('Digit', '');
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${on ? 'bg-amber-500' : 'bg-slate-700'}`}
      aria-pressed={on}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

function SettingRow({
  icon: Icon, title, desc, children,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-white/6 last:border-b-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0">
          <Icon size={16} className="text-slate-400" />
        </div>
        <div className="min-w-0">
          <div className="text-white text-sm font-medium truncate">{title}</div>
          <div className="text-slate-500 text-xs truncate">{desc}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function KeyBindRow({ label, code, onRebind, listening }: { label: string; code: string; onRebind: () => void; listening: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/6 last:border-b-0">
      <span className="text-white text-sm font-medium">{label}</span>
      <button
        onClick={onRebind}
        className={`px-4 py-1.5 rounded-lg text-sm font-bold border transition-colors ${
          listening
            ? 'bg-amber-500 border-amber-300 text-slate-950 animate-pulse'
            : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
        }`}
      >
        {listening ? 'Press a key...' : keyLabel(code)}
      </button>
    </div>
  );
}

export default function SettingsModal({ state, settings, buttonConfig, onSettingsChange, onButtonConfigChange, onClose, onRestart, onClearSave }: Props) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [rebindKey, setRebindKey] = useState<string | null>(null);

  const totalMonths = state.turnsPlayed ?? 0;
  const sourceIncome = (state.incomeSources ?? []).reduce((s, st) => s + (st.monthlyAmount ?? 0), 0);
  const assetIncome = (state.assets ?? []).reduce((s, a) => s + (a.monthlyIncome ?? 0), 0);
  const totalIncome = sourceIncome + assetIncome;

  useEffect(() => {
    if (!rebindKey) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.code === 'Escape') { setRebindKey(null); return; }
      onButtonConfigChange({ ...buttonConfig, [rebindKey]: e.code });
      setRebindKey(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [rebindKey, buttonConfig, onButtonConfigChange]);

  const rebindRows: { key: keyof ButtonConfig; label: string }[] = [
    { key: 'up', label: 'Move Forward' },
    { key: 'down', label: 'Move Backward' },
    { key: 'left', label: 'Move Left' },
    { key: 'right', label: 'Move Right' },
    { key: 'action', label: 'Action / Confirm' },
    { key: 'interact', label: 'Interact' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md" onClick={onClose} />

      <div
        className="relative w-full sm:max-w-md bg-slate-900 sm:rounded-3xl rounded-t-3xl border border-white/10 shadow-2xl max-h-[90vh] flex flex-col"
        style={{ animation: 'slideUp 0.3s cubic-bezier(0.34,1.2,0.64,1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
              <SettingsIcon size={17} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Settings</h2>
              <p className="text-slate-500 text-xs">Customize your experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">
          {/* Preferences */}
          <div className="px-5 pt-4 pb-2">
            <div className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-1">Preferences</div>
          </div>
          <div className="bg-slate-950/50 mx-4 rounded-2xl border border-white/6 overflow-hidden">
            <SettingRow icon={settings.sound ? Volume2 : VolumeX} title="Sound Effects" desc="Feedback on actions and events">
              <Toggle on={settings.sound} onClick={() => onSettingsChange({ ...settings, sound: !settings.sound })} />
            </SettingRow>
            <SettingRow icon={settings.notifications ? Bell : BellOff} title="Notifications" desc="In-game event alerts">
              <Toggle on={settings.notifications} onClick={() => onSettingsChange({ ...settings, notifications: !settings.notifications })} />
            </SettingRow>
            <SettingRow icon={settings.compactMode ? Moon : Sun} title="Compact Mode" desc="Smaller panels, more game world visible">
              <Toggle on={settings.compactMode} onClick={() => onSettingsChange({ ...settings, compactMode: !settings.compactMode })} />
            </SettingRow>
          </div>

          {/* Button Configuration */}
          <div className="px-5 pt-5 pb-2">
            <div className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1.5">
              <Gamepad2 size={11} /> Button Configuration
            </div>
          </div>
          <div className="bg-slate-950/50 mx-4 rounded-2xl border border-white/6 overflow-hidden">
            <div className="px-4 py-2.5 bg-white/3 border-b border-white/6">
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Keyboard size={13} />
                <span>Click a key to rebind. Press Esc to cancel.</span>
              </div>
            </div>
            {rebindRows.map(row => (
              <KeyBindRow
                key={row.key}
                label={row.label}
                code={buttonConfig[row.key]}
                onRebind={() => setRebindKey(row.key)}
                listening={rebindKey === row.key}
              />
            ))}
            <div className="px-4 py-3">
              <button
                onClick={() => onButtonConfigChange(DEFAULT_BUTTON_CONFIG)}
                className="w-full py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/8 transition-colors"
              >
                Reset to Defaults
              </button>
            </div>
          </div>

          {/* Game Stats */}
          <div className="px-5 pt-5 pb-2">
            <div className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-1">Game Stats</div>
          </div>
          <div className="mx-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Months', value: totalMonths, icon: Zap, color: 'text-amber-400' },
              { label: 'Income/mo', value: `$${totalIncome.toLocaleString()}`, icon: ChevronRight, color: 'text-emerald-400' },
              { label: 'Streams', value: (state.incomeSources ?? []).length, icon: ChevronRight, color: 'text-blue-400' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-slate-950/50 border border-white/6 rounded-2xl p-3 text-center">
                  <Icon size={14} className={`mx-auto mb-1.5 ${s.color}`} />
                  <div className={`text-lg font-black ${s.color}`}>{s.value}</div>
                  <div className="text-slate-600 text-[10px] mt-0.5">{s.label}</div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="px-5 pt-5 pb-2">
            <div className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-1">Game</div>
          </div>
          <div className="mx-4 mb-4 space-y-2">
            <button
              onClick={() => { onRestart(); onClose(); }}
              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-white/5 border border-white/8 rounded-2xl hover:bg-white/8 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                  <RotateCcw size={16} className="text-amber-400" />
                </div>
                <div>
                  <div className="text-white text-sm font-medium">Start New Game</div>
                  <div className="text-slate-500 text-xs">Begin a fresh journey</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-600" />
            </button>

            {!confirmClear ? (
              <button
                onClick={() => setConfirmClear(true)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-rose-500/5 border border-rose-500/15 rounded-2xl hover:bg-rose-500/10 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center">
                    <Trash2 size={16} className="text-rose-400" />
                  </div>
                  <div>
                    <div className="text-rose-300 text-sm font-medium">Delete Save Data</div>
                    <div className="text-slate-500 text-xs">Permanently remove this game</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            ) : (
              <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-4" style={{ animation: 'slideUp 0.2s ease-out' }}>
                <div className="flex items-start gap-2 mb-3">
                  <Info size={14} className="text-rose-400 mt-0.5 flex-shrink-0" />
                  <p className="text-rose-200 text-xs leading-relaxed">This will permanently delete your save. This cannot be undone.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/8 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { onClearSave(); onClose(); }}
                    className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-sm font-bold transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* About */}
          <div className="px-5 pb-5 pt-2">
            <div className="bg-slate-950/50 border border-white/6 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info size={13} className="text-slate-500" />
                <span className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">About</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                FreedomPath v1.0 — A wealth-building strategy game. Build multiple income streams, navigate life events, and achieve financial freedom.
              </p>
              <div className="mt-3 pt-3 border-t border-white/6">
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  &copy; 2026 Omara Alexander Morgan. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
