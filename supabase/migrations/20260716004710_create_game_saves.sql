/*
# Create game_saves table (single-tenant, no auth)

1. New Tables
- `game_saves`
  - `id` (text, primary key) — singleton row key for the game save
  - `state` (jsonb, not null) — full serialized GameState object
  - `updated_at` (timestamptz) — last save timestamp
2. Security
- Enable RLS on `game_saves`.
- Allow anon + authenticated full CRUD since this is a single-tenant game with no sign-in.
*/

CREATE TABLE IF NOT EXISTS game_saves (
  id text PRIMARY KEY,
  state jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_saves" ON game_saves;
CREATE POLICY "anon_select_saves" ON game_saves FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_saves" ON game_saves;
CREATE POLICY "anon_insert_saves" ON game_saves FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_saves" ON game_saves;
CREATE POLICY "anon_update_saves" ON game_saves FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_saves" ON game_saves;
CREATE POLICY "anon_delete_saves" ON game_saves FOR DELETE
  TO anon, authenticated USING (true);
