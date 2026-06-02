-- Semantle daily-puzzle scores. Public read, auth insert (mirrors connections_scores).

CREATE TABLE IF NOT EXISTS semantle_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date text NOT NULL,
  solved boolean NOT NULL,
  guesses integer NOT NULL CHECK (guesses >= 0),
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS semantle_scores_user_date ON semantle_scores(user_id, date);
CREATE INDEX IF NOT EXISTS semantle_scores_date ON semantle_scores(date, solved, guesses);

ALTER TABLE semantle_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read" ON semantle_scores;
CREATE POLICY "Public read" ON semantle_scores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth insert" ON semantle_scores;
CREATE POLICY "Auth insert" ON semantle_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
