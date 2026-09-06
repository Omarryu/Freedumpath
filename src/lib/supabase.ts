import { createClient, type Session, type User } from '@supabase/supabase-js';
import type { GameState } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type { Session, User };

const TABLE = 'game_saves';

function saveIdFor(user: User | null): string {
  return user?.id ?? 'singleton';
}

export async function loadCloudSave(user: User | null): Promise<GameState | null> {
  if (!user) return null;
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('state')
      .eq('id', saveIdFor(user))
      .maybeSingle();
    if (error || !data) return null;
    const state = data.state as GameState;
    if (!state || typeof state.cash !== 'number' || !Array.isArray(state.assets) || !Array.isArray(state.loans)) {
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

export async function saveCloudSave(user: User | null, state: GameState): Promise<void> {
  if (!user) return;
  try {
    await supabase
      .from(TABLE)
      .upsert({ id: saveIdFor(user), user_id: user.id, state, updated_at: new Date().toISOString() });
  } catch {
    // silent fail — localStorage is the primary save
  }
}

export async function clearCloudSave(user: User | null): Promise<void> {
  if (!user) return;
  try {
    await supabase.from(TABLE).delete().eq('id', saveIdFor(user));
  } catch {
    // silent
  }
}

export interface AccessStatus {
  hasAccess: boolean;
  trialActive: boolean;
  trialExpired: boolean;
  trialHoursLeft: number;
  hasLifetimeAccess: boolean;
}

const TRIAL_MS = 24 * 60 * 60 * 1000;

export async function ensureProfile(user: User): Promise<void> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    if (!data) {
      await supabase.from('profiles').insert({ id: user.id });
    }
  } catch {
    // silent
  }
}

export async function getAccessStatus(user: User): Promise<AccessStatus> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('trial_started_at, has_lifetime_access')
      .eq('id', user.id)
      .maybeSingle();

    const hasLifetimeAccess = profile?.has_lifetime_access === true;

    if (hasLifetimeAccess) {
      return { hasAccess: true, trialActive: false, trialExpired: false, trialHoursLeft: 0, hasLifetimeAccess: true };
    }

    if (!profile?.trial_started_at) {
      return { hasAccess: true, trialActive: true, trialExpired: false, trialHoursLeft: 24, hasLifetimeAccess: false };
    }

    const elapsed = Date.now() - new Date(profile.trial_started_at).getTime();
    const remaining = TRIAL_MS - elapsed;
    const trialActive = remaining > 0;
    return {
      hasAccess: trialActive,
      trialActive,
      trialExpired: !trialActive,
      trialHoursLeft: Math.max(0, Math.ceil(remaining / (60 * 60 * 1000))),
      hasLifetimeAccess: false,
    };
  } catch {
    return { hasAccess: true, trialActive: true, trialExpired: false, trialHoursLeft: 24, hasLifetimeAccess: false };
  }
}
