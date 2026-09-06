/*
# Create profiles table for 24-hour trial tracking

1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users) — one row per user
  - `trial_started_at` (timestamptz) — when the user first signed up / started their trial
  - `trial_expired` (boolean, default false) — whether the 24-hour trial has ended
  - `created_at` (timestamptz)

2. Security
- Enable RLS on `profiles`.
- Owner-scoped CRUD: each authenticated user can read and update only their own profile row.
- `user_id` defaults to `auth.uid()` so inserts from the client succeed.

3. Important Notes
- The trial period is 24 hours from `trial_started_at`.
- The frontend checks `trial_started_at` to determine if the trial is still active.
- When a user subscribes via Stripe, the subscription status in `stripe_user_subscriptions`
  overrides the trial check — active subscribers always have access.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_started_at timestamptz NOT NULL DEFAULT now(),
  trial_expired boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);
