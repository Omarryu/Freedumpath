import { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck, Loader2, AlertCircle, LogOut, RefreshCw, Search,
  CheckCircle2, XCircle, Trash2, RotateCcw, Gift, Ban,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Session } from '../lib/supabase';
import AuthScreen from './AuthScreen';

interface AdminUserRow {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  trial_started_at: string | null;
  trial_expired: boolean;
  has_lifetime_access: boolean;
  lifetime_access_order_id: string | null;
  lifetime_access_granted_at: string | null;
  is_admin: boolean;
  has_save: boolean;
  save_updated_at: string | null;
}

async function callAdminApi(action: string, extra: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, ...extra }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminPanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionChecked(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await callAdminApi('list_users');
      setUsers(data.users);
      setAuthorized(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load users';
      if (msg.includes('Not authorized')) {
        setAuthorized(false);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) loadUsers();
  }, [session, loadUsers]);

  const runAction = async (id: string, action: string, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setActioningId(id);
    setError('');
    try {
      await callAdminApi(action, { user_id: id });
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActioningId(null);
    }
  };

  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-500" size={28} />
      </div>
    );
  }

  if (!session) {
    return <AuthScreen onAuthed={() => { /* session listener above picks this up */ }} />;
  }

  if (authorized === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-8 max-w-sm text-center">
          <Ban className="text-rose-400 mx-auto mb-3" size={32} />
          <h1 className="text-white font-bold text-lg mb-1">Not authorized</h1>
          <p className="text-slate-400 text-sm mb-5">
            Signed in as {session.user.email}, but this account doesn't have admin access.
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-slate-500 hover:text-slate-300 text-sm underline"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const filtered = users.filter((u) =>
    !search.trim() || (u.email ?? '').toLowerCase().includes(search.trim().toLowerCase())
  );

  const stats = {
    total: users.length,
    paid: users.filter((u) => u.has_lifetime_access).length,
    trialing: users.filter((u) => !u.has_lifetime_access && !u.trial_expired).length,
    expired: users.filter((u) => !u.has_lifetime_access && u.trial_expired).length,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="border-b border-white/10 bg-slate-900/60 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-amber-400" size={22} />
            <div>
              <h1 className="text-white font-bold text-sm sm:text-base leading-tight">FreedomPath Admin</h1>
              <p className="text-slate-500 text-xs">Signed in as {session.user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadUsers}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-rose-300 bg-white/5 hover:bg-rose-500/10 border border-white/10 rounded-lg px-3 py-2 transition-colors"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total players', value: stats.total, color: 'text-white' },
            { label: 'Paid (lifetime)', value: stats.paid, color: 'text-emerald-400' },
            { label: 'Trialing', value: stats.trialing, color: 'text-sky-400' },
            { label: 'Trial expired', value: stats.expired, color: 'text-amber-400' },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900/60 border border-white/10 rounded-xl p-4">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/25 rounded-xl px-4 py-3 mb-4">
            <AlertCircle size={16} className="text-rose-400 mt-0.5 flex-shrink-0" />
            <p className="text-rose-300 text-sm">{error}</p>
          </div>
        )}

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email..."
            className="w-full bg-slate-900/60 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-slate-500" size={24} />
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-white/10 text-left text-slate-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Player</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Last seen</th>
                  <th className="px-4 py-3 font-medium">Access status</th>
                  <th className="px-4 py-3 font-medium">Save</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="text-white font-medium">{u.email ?? '(no email)'}</div>
                      {u.is_admin && (
                        <span className="inline-flex items-center gap-1 text-amber-400 text-xs mt-0.5">
                          <ShieldCheck size={11} /> Admin
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{fmtDate(u.created_at)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{fmtDate(u.last_sign_in_at)}</td>
                    <td className="px-4 py-3">
                      {u.has_lifetime_access ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
                          <CheckCircle2 size={13} /> Lifetime access
                        </span>
                      ) : u.trial_expired ? (
                        <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-medium">
                          <XCircle size={13} /> Trial expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sky-400 text-xs font-medium">
                          <Loader2 size={13} /> Trialing
                        </span>
                      )}
                      {u.lifetime_access_order_id && (
                        <div className="text-slate-600 text-[11px] mt-0.5 font-mono">{u.lifetime_access_order_id}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {u.has_save ? `Saved ${fmtDate(u.save_updated_at)}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {u.has_lifetime_access ? (
                          <button
                            title="Revoke lifetime access"
                            disabled={actioningId === u.id}
                            onClick={() => runAction(u.id, 'revoke_access', `Revoke lifetime access for ${u.email}?`)}
                            className="p-1.5 rounded-md bg-white/5 hover:bg-rose-500/15 text-slate-400 hover:text-rose-300 transition-colors disabled:opacity-40"
                          >
                            <Ban size={14} />
                          </button>
                        ) : (
                          <button
                            title="Grant lifetime access"
                            disabled={actioningId === u.id}
                            onClick={() => runAction(u.id, 'grant_access', `Grant free lifetime access to ${u.email}?`)}
                            className="p-1.5 rounded-md bg-white/5 hover:bg-emerald-500/15 text-slate-400 hover:text-emerald-300 transition-colors disabled:opacity-40"
                          >
                            <Gift size={14} />
                          </button>
                        )}
                        <button
                          title="Reset trial (fresh 24 hours)"
                          disabled={actioningId === u.id}
                          onClick={() => runAction(u.id, 'reset_trial', `Reset ${u.email}'s trial to a fresh 24 hours?`)}
                          className="p-1.5 rounded-md bg-white/5 hover:bg-sky-500/15 text-slate-400 hover:text-sky-300 transition-colors disabled:opacity-40"
                        >
                          <RotateCcw size={14} />
                        </button>
                        <button
                          title="Clear their save (support action)"
                          disabled={actioningId === u.id || !u.has_save}
                          onClick={() => runAction(u.id, 'clear_save', `Delete ${u.email}'s save data? This can't be undone.`)}
                          className="p-1.5 rounded-md bg-white/5 hover:bg-rose-500/15 text-slate-400 hover:text-rose-300 transition-colors disabled:opacity-40 disabled:hover:bg-white/5 disabled:hover:text-slate-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500 text-sm">
                      No players match "{search}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
