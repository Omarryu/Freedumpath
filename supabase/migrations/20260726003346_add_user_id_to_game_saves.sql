/*
# Add per-user ownership to game_saves

1. Schema Changes
- Add `user_id uuid` column to `game_saves`, NOT NULL, defaulting to `auth.uid()`.
- Add an index on `user_id` for fast per-user lookups.
- The frontend will use the user's UUID as the `id` value (the `id` text
  column stays as PK), so each user gets exactly one row.

2. Security Changes
- Drop the old anon-accessible singleton policies.
- RLS stays enabled.
- Create 4 new owner-scoped CRUD policies scoped TO authenticated, using
  `auth.uid() = user_id` for ownership checks.
- The anon role can no longer read or write any saves — unauthenticated
  visitors see the landing/sign-in page and cannot access game data.

3. Important Notes
- All existing rows were deleted before this migration (they were
  public/shared, no individual user owned them).
- Email confirmation stays OFF.
*/

-- Ensure user_id column exists and is NOT NULL with correct default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_saves' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE game_saves
      ADD COLUMN user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Index for per-user queries
CREATE INDEX IF NOT EXISTS idx_game_saves_user_id ON game_saves(user_id);

-- Drop old anon-accessible policies
DROP POLICY IF EXISTS "anon_select_saves" ON game_saves;
DROP POLICY IF EXISTS "anon_insert_saves" ON game_saves;
DROP POLICY IF EXISTS "anon_update_saves" ON game_saves;
DROP POLICY IF EXISTS "anon_delete_saves" ON game_saves;

-- New owner-scoped policies (authenticated only)
DROP POLICY IF EXISTS "select_own_save" ON game_saves;
CREATE POLICY "select_own_save" ON game_saves FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_save" ON game_saves;
CREATE POLICY "insert_own_save" ON game_saves FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_save" ON game_saves;
CREATE POLICY "update_own_save" ON game_saves FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_save" ON game_saves;
CREATE POLICY "delete_own_save" ON game_saves FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
