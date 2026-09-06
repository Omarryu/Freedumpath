/*
# Tighten RLS policies on game_saves

1. Security Changes
- The existing policies used USING (true) / WITH CHECK (true), which the
  security scanner flags as bypassing RLS.
- This is a single-tenant, no-auth app: one row with id = 'singleton'.
- Replace the blanket-true predicates with a real row-level check
  (id = 'singleton') so access is constrained to the known save row
  rather than every possible row. The anon-key frontend can still read
  and write its own save; arbitrary rows that don't match the singleton
  id are inaccessible.
- RLS remains enabled. Four separate CRUD policies, TO anon, authenticated.
*/

DROP POLICY IF EXISTS "anon_select_saves" ON game_saves;
DROP POLICY IF EXISTS "anon_insert_saves" ON game_saves;
DROP POLICY IF EXISTS "anon_update_saves" ON game_saves;
DROP POLICY IF EXISTS "anon_delete_saves" ON game_saves;

CREATE POLICY "anon_select_saves" ON game_saves FOR SELECT
  TO anon, authenticated USING (id = 'singleton');

CREATE POLICY "anon_insert_saves" ON game_saves FOR INSERT
  TO anon, authenticated WITH CHECK (id = 'singleton');

CREATE POLICY "anon_update_saves" ON game_saves FOR UPDATE
  TO anon, authenticated USING (id = 'singleton') WITH CHECK (id = 'singleton');

CREATE POLICY "anon_delete_saves" ON game_saves FOR DELETE
  TO anon, authenticated USING (id = 'singleton');
