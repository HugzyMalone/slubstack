-- Friendships graph. Edges stored as (sender, receiver, status). Bidirectional once accepted.

CREATE TABLE IF NOT EXISTS friendships (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending','accepted')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, friend_id),
  CHECK (user_id <> friend_id)
);

CREATE INDEX IF NOT EXISTS friendships_friend_id ON friendships(friend_id);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read own edges" ON friendships;
CREATE POLICY "Read own edges" ON friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Insert outgoing" ON friendships;
CREATE POLICY "Insert outgoing" ON friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Update incoming" ON friendships;
CREATE POLICY "Update incoming" ON friendships
  FOR UPDATE USING (auth.uid() = friend_id) WITH CHECK (auth.uid() = friend_id);

DROP POLICY IF EXISTS "Delete own edges" ON friendships;
CREATE POLICY "Delete own edges" ON friendships
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);
