/*
  # Add admin flag for the player/subscriber management panel

  1. Changes
    - `profiles.is_admin` (boolean, default false) — marks which account(s)
      can access the new admin panel.

  2. Security
    - Same pattern as `has_lifetime_access`: RLS lets users read/update
      their own profile row (for trial tracking), which would otherwise
      let anyone grant themselves admin access via the client SDK.
      Column-level REVOKE closes that off — only the service-role client
      inside the `admin-api` edge function can write this column.
    - No signed-in user can read another user's `is_admin` value either
      (RLS still restricts row access to your own row), so this doesn't
      leak who the admin is.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean NOT NULL DEFAULT false;
  END IF;
END $$;

REVOKE UPDATE (is_admin) ON profiles FROM authenticated;
