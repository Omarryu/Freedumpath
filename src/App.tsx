import { useState, useEffect, useCallback } from 'react';
import type { GameState, Archetype } from './types';
import { createNewGame, saveGame, loadGame, clearSave } from './gameEngine';
import GameIntro from './components/GameIntro';
import GameBoard from './components/GameBoard';
import World3D from './components/World3D';
import ErrorBoundary from './components/ErrorBoundary';
import AuthScreen from './components/AuthScreen';
import Paywall from './components/Paywall';
import VideoIntro from './components/VideoIntro';
import { supabase, loadCloudSave, saveCloudSave, clearCloudSave, ensureProfile, getAccessStatus, type User, type Session, type AccessStatus } from './lib/supabase';
import { sfx } from './sfx';

const ARCHETYPE_NAMES: Record<Archetype, string> = {
  hustler: 'Hustler',
  creative: 'Creative',
  investor: 'Investor',
  scholar: 'Scholar',
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<AccessStatus | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [introDone, setIntroDone] = useState(() => sessionStorage.getItem('fp_intro_seen') === '1');

  // Auth state listener — check session on mount
  useEffect(() => {
    let cancelled = false;
    // Get initial session
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session?.user) {
          setUser(data.session.user);
        }
      } catch {
        // ignore
      }
      setAuthChecked(true);
    })();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
      (async () => {
        if (session?.user) {
          setUser(session.user);
          await ensureProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          clearSave(user);
          setUser(null);
          setGameState(null);
          setAccess(null);
        }
      })();
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Load game save when user becomes available
  useEffect(() => {
    if (!user) {
      setLoading(true);
      return;
    }
    let cancelled = false;
    (async () => {
      // Ensure a profile row exists for trial tracking
      await ensureProfile(user);
      // Check access status (trial + subscription)
      const status = await getAccessStatus(user);
      if (cancelled) return;
      setAccess(status);
      setAccessLoading(false);
      if (!status.hasAccess) {
        setLoading(false);
        return;
      }
      // Try this user's local save first (fast, per-user key)
      const local = loadGame(user.id);
      if (local) {
        if (!cancelled) { setGameState(local); setLoading(false); }
        return;
      }
      // Try cloud save (per-user, RLS-scoped)
      try {
        const cloudPromise = loadCloudSave(user).catch(() => null);
        const timeoutPromise = new Promise<null>(resolve => setTimeout(() => resolve(null), 3000));
        const cloud = await Promise.race([cloudPromise, timeoutPromise]);
        if (cancelled) return;
        if (cloud) {
          setGameState(cloud);
          saveGame(cloud, user.id);
        }
      } catch { /* network error */ }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleStart = useCallback(async (name: string, archetype: Archetype, age: number) => {
    clearSave(user.id);
    clearCloudSave(user).catch(() => {});
    const state = createNewGame(name, archetype, age);
    setGameState(state);
    saveGame(state, user.id);
    saveCloudSave(user, state).catch(() => {});
    sfx.guideNewGame(name, ARCHETYPE_NAMES[archetype]);
  }, [user]);

  const handleContinue = useCallback(() => {
    const saved = loadGame(user.id);
    if (saved) setGameState(saved);
  }, [user]);

  const handleChange = useCallback((state: GameState) => {
    setGameState(state);
    saveGame(state, user.id);
    saveCloudSave(user, state).catch(() => {});
  }, [user]);

  const handleRestart = useCallback(() => {
    clearSave(user.id);
    clearCloudSave(user).catch(() => {});
    setGameState(null);
  }, [user]);

  const handleExit = useCallback(() => {
    setGameState(null);
  }, []);

  const handleSignOut = useCallback(async () => {
    const u = user;
    await supabase.auth.signOut();
    clearSave(u?.id);
    setGameState(null);
    setAccess(null);
    setAccessLoading(true);
  }, [user]);

  const refreshAccess = useCallback(async () => {
    if (!user) return;
    const status = await getAccessStatus(user);
    setAccess(status);
  }, [user]);

  // Loading state before auth is checked
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-amber-400 font-bold text-lg animate-pulse">Loading FreedomPath...</div>
      </div>
    );
  }

  // Show cinematic video intro once per browser session, before login
  if (!introDone) {
    return <VideoIntro onComplete={() => { sessionStorage.setItem('fp_intro_seen', '1'); setIntroDone(true); }} />;
  }

  // Not signed in — show auth screen
  if (!user) {
    return <AuthScreen onAuthed={() => {}} />;
  }

  // Check access (trial / subscription)
  if (accessLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-amber-400 font-bold text-lg animate-pulse">Checking your access...</div>
      </div>
    );
  }

  // Trial expired and not subscribed — show paywall
  if (access && !access.hasAccess) {
    return (
      <Paywall
        user={user}
        trialExpired={access.trialExpired}
        trialHoursLeft={access.trialHoursLeft}
        onSubscribed={refreshAccess}
      />
    );
  }

  // Signed in but loading save
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-amber-400 font-bold text-lg animate-pulse">Loading your game...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary onReset={() => { clearSave(user.id); clearCloudSave(user); setGameState(null); }}>
      <div className="min-h-screen flex flex-col">
      {access && !access.hasLifetimeAccess && access.trialActive && (
        <div className="flex-shrink-0 bg-amber-500/15 backdrop-blur-md border-b border-amber-500/30 px-4 py-1.5 text-center text-xs font-medium text-amber-300">
          Free trial — {access.trialHoursLeft} hour{access.trialHoursLeft === 1 ? '' : 's'} remaining.{' '}
          <button onClick={() => setAccess({ ...access, hasAccess: false, trialExpired: true })} className="underline font-bold hover:text-amber-200">
            Get lifetime access — $25 one-time
          </button>
        </div>
      )}
      <div className="flex-1">
      {gameState
        ? <World3D state={gameState} onChange={handleChange} onRestart={handleRestart} onExit={handleExit} onSignOut={handleSignOut} userEmail={user.email ?? ''} />
        : <GameIntro onStart={handleStart} onContinue={handleContinue} />}
      </div>
      </div>
    </ErrorBoundary>
  );
}
