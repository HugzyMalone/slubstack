-- Connections daily-puzzle scores. Schema mirrors the draft in supabase/connections_scores.sql.

CREATE TABLE IF NOT EXISTS connections_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date text NOT NULL,
  solved boolean NOT NULL,
  mistakes integer NOT NULL CHECK (mistakes >= 0 AND mistakes <= 4),
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS connections_scores_user_date ON connections_scores(user_id, date);
CREATE INDEX IF NOT EXISTS connections_scores_date ON connections_scores(date, solved, mistakes);

ALTER TABLE connections_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read" ON connections_scores;
CREATE POLICY "Public read" ON connections_scores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth insert" ON connections_scores;
CREATE POLICY "Auth insert" ON connections_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
