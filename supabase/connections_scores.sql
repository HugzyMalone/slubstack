-- Run this in the Supabase SQL editor

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

CREATE POLICY "Public read" ON connections_scores FOR SELECT USING (true);
CREATE POLICY "Auth insert" ON connections_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
