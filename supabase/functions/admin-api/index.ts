import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

// Service-role client — bypasses RLS. Never exposed to the browser; only
// ever runs here, server-side, inside this edge function.
const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
  if (status === 204) return new Response(null, { status, headers });
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return corsResponse({}, 204);
    if (req.method !== 'POST') return corsResponse({ error: 'Method not allowed' }, 405);

    // --- Authenticate the caller and confirm they're actually an admin ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return corsResponse({ error: 'Missing authorization header' }, 401);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: getUserError } = await supabase.auth.getUser(token);
    if (getUserError || !user) return corsResponse({ error: 'Failed to authenticate user' }, 401);

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (!callerProfile?.is_admin) {
      // Deliberately vague — don't confirm/deny whether admin panel exists
      // to a non-admin caller poking at the endpoint.
      return corsResponse({ error: 'Not authorized' }, 403);
    }

    const { action, user_id } = await req.json();

    // -----------------------------------------------------------------
    if (action === 'list_users') {
      const [{ data: authUsers, error: authErr }, { data: profiles, error: profileErr }, { data: saves, error: savesErr }] =
        await Promise.all([
          supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
          supabase.from('profiles').select('*'),
          supabase.from('game_saves').select('user_id, updated_at'),
        ]);
      if (authErr) throw authErr;
      if (profileErr) throw profileErr;
      if (savesErr) throw savesErr;

      const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
      const saveById = new Map((saves ?? []).map((s) => [s.user_id, s]));

      const rows = (authUsers?.users ?? []).map((u) => {
        const profile = profileById.get(u.id);
        const save = saveById.get(u.id);
        return {
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          trial_started_at: profile?.trial_started_at ?? null,
          trial_expired: profile?.trial_expired ?? false,
          has_lifetime_access: profile?.has_lifetime_access ?? false,
          lifetime_access_order_id: profile?.lifetime_access_order_id ?? null,
          lifetime_access_granted_at: profile?.lifetime_access_granted_at ?? null,
          is_admin: profile?.is_admin ?? false,
          has_save: !!save,
          save_updated_at: save?.updated_at ?? null,
        };
      });

      rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return corsResponse({ users: rows });
    }

    // -----------------------------------------------------------------
    if (action === 'grant_access') {
      if (!user_id) return corsResponse({ error: 'user_id is required' }, 400);
      const { error } = await supabase
        .from('profiles')
        .update({
          has_lifetime_access: true,
          lifetime_access_order_id: 'ADMIN_GRANT',
          lifetime_access_granted_at: new Date().toISOString(),
        })
        .eq('id', user_id);
      if (error) throw error;
      return corsResponse({ ok: true });
    }

    // -----------------------------------------------------------------
    if (action === 'revoke_access') {
      if (!user_id) return corsResponse({ error: 'user_id is required' }, 400);
      const { error } = await supabase
        .from('profiles')
        .update({
          has_lifetime_access: false,
          lifetime_access_order_id: null,
          lifetime_access_granted_at: null,
        })
        .eq('id', user_id);
      if (error) throw error;
      return corsResponse({ ok: true });
    }

    // -----------------------------------------------------------------
    if (action === 'reset_trial') {
      if (!user_id) return corsResponse({ error: 'user_id is required' }, 400);
      const { error } = await supabase
        .from('profiles')
        .update({ trial_started_at: new Date().toISOString(), trial_expired: false })
        .eq('id', user_id);
      if (error) throw error;
      return corsResponse({ ok: true });
    }

    // -----------------------------------------------------------------
    if (action === 'clear_save') {
      if (!user_id) return corsResponse({ error: 'user_id is required' }, 400);
      const { error } = await supabase.from('game_saves').delete().eq('user_id', user_id);
      if (error) throw error;
      return corsResponse({ ok: true });
    }

    return corsResponse({ error: `Unknown action: ${action}` }, 400);
  } catch (err) {
    console.error(err);
    return corsResponse({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});
