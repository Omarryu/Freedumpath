/*
  # Add lifetime access tracking (replaces Stripe subscription model)

  FreedomPath is switching from a $5/month Stripe subscription to a single
  one-time PayPal payment that unlocks the game forever. This adds the
  columns needed to track that on the existing `profiles` table rather than
  introducing a whole new subscriptions schema — there's no recurring state
  to track, just "have they paid, and with which order".

  1. Changes
    - `profiles.has_lifetime_access` (boolean, default false) — the single
      source of truth for whether a user has paid.
    - `profiles.lifetime_access_order_id` (text, nullable) — the PayPal
      order ID that granted access, kept for support/reconciliation.
    - `profiles.lifetime_access_granted_at` (timestamptz, nullable) — when
      access was granted.

  2. Security
    - No RLS policy changes needed — `profiles` already has RLS enabled
      with a "users can read/update their own profile" policy from the
      earlier trial-tracking migration, which covers these new columns'
      row-level visibility too.
    - IMPORTANT: RLS controls which rows a user can touch, not which
      columns. Since the existing policy lets users update their own
      profile row (needed for trial tracking), we explicitly REVOKE
      column-level UPDATE on the three new payment columns from the
      `authenticated` role below — otherwise any signed-in user could
      grant themselves lifetime access for free via the client SDK.
      Only the service-role client inside `paypal-capture-order` (never
      exposed to the browser) can write these columns.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'has_lifetime_access'
  ) THEN
    ALTER TABLE profiles ADD COLUMN has_lifetime_access boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'lifetime_access_order_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN lifetime_access_order_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'lifetime_access_granted_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN lifetime_access_granted_at timestamptz;
  END IF;
END $$;

-- SECURITY: the existing "update_own_profile" RLS policy lets a signed-in
-- user update their own row (that's needed for trial tracking) — but RLS
-- controls which ROWS you can touch, not which COLUMNS. Without this,
-- anyone could open devtools and run
--   supabase.from('profiles').update({ has_lifetime_access: true })...
-- and grant themselves the game for free. Revoking column-level UPDATE
-- privilege on just the payment columns closes that off for the
-- `authenticated` role, while the edge function's service-role client
-- (which never runs in the browser) is unaffected and can still write
-- these columns normally.
REVOKE UPDATE (has_lifetime_access, lifetime_access_order_id, lifetime_access_granted_at)
  ON profiles FROM authenticated;
