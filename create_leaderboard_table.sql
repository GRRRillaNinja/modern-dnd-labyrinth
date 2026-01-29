-- ============================================
-- D&D Labyrinth Leaderboard Database Schema
-- ============================================
-- Run this script in your Supabase SQL Editor
-- ============================================

-- Create leaderboard table
CREATE TABLE leaderboard (
  id BIGSERIAL PRIMARY KEY,
  player_name TEXT,
  session_id UUID NOT NULL,
  game_time BIGINT NOT NULL,
  game_result TEXT NOT NULL CHECK (game_result IN ('win', 'loss')),
  game_mode TEXT NOT NULL CHECK (game_mode IN ('solo', 'multiplayer')),
  difficulty_level SMALLINT NOT NULL CHECK (difficulty_level IN (1, 2)),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE leaderboard IS 'Stores game completion times for leaderboard rankings';
COMMENT ON COLUMN leaderboard.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN leaderboard.player_name IS 'Optional player name (null for anonymous)';
COMMENT ON COLUMN leaderboard.session_id IS 'Anonymous session identifier';
COMMENT ON COLUMN leaderboard.game_time IS 'Game completion time in milliseconds';
COMMENT ON COLUMN leaderboard.game_result IS 'Game outcome: win or loss';
COMMENT ON COLUMN leaderboard.game_mode IS 'Game mode: solo or multiplayer';
COMMENT ON COLUMN leaderboard.difficulty_level IS 'Difficulty: 1 (open passages) or 2 (locked doors)';
COMMENT ON COLUMN leaderboard.created_at IS 'Timestamp when record was created';

-- Create indexes for faster queries
CREATE INDEX idx_leaderboard_game_result ON leaderboard(game_result);
CREATE INDEX idx_leaderboard_game_mode ON leaderboard(game_mode);
CREATE INDEX idx_leaderboard_game_time ON leaderboard(game_time);
CREATE INDEX idx_leaderboard_difficulty ON leaderboard(difficulty_level);
CREATE INDEX idx_leaderboard_created_at ON leaderboard(created_at DESC);

-- Create composite indexes for common query patterns
CREATE INDEX idx_leaderboard_win_solo_level1 ON leaderboard(game_result, game_mode, difficulty_level, game_time) 
  WHERE game_result = 'win' AND game_mode = 'solo' AND difficulty_level = 1;

CREATE INDEX idx_leaderboard_win_solo_level2 ON leaderboard(game_result, game_mode, difficulty_level, game_time) 
  WHERE game_result = 'win' AND game_mode = 'solo' AND difficulty_level = 2;

CREATE INDEX idx_leaderboard_win_multi_level1 ON leaderboard(game_result, game_mode, difficulty_level, game_time) 
  WHERE game_result = 'win' AND game_mode = 'multiplayer' AND difficulty_level = 1;

CREATE INDEX idx_leaderboard_win_multi_level2 ON leaderboard(game_result, game_mode, difficulty_level, game_time) 
  WHERE game_result = 'win' AND game_mode = 'multiplayer' AND difficulty_level = 2;

-- Enable Row Level Security
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous users to insert their own scores
CREATE POLICY "Allow public insert" ON leaderboard
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Create policy to allow anonymous users to read all scores
CREATE POLICY "Allow public select" ON leaderboard
  FOR SELECT 
  TO anon
  USING (true);

-- Optional: Create policy to prevent updates (scores should be immutable)
CREATE POLICY "Prevent updates" ON leaderboard
  FOR UPDATE 
  TO anon
  USING (false);

-- Optional: Create policy to prevent deletes from anonymous users
CREATE POLICY "Prevent deletes" ON leaderboard
  FOR DELETE 
  TO anon
  USING (false);

-- ============================================
-- Helper Views (Optional but useful)
-- ============================================

-- View for fastest wins (solo, level 1)
CREATE OR REPLACE VIEW fastest_wins_solo_level1 AS
SELECT 
  id,
  player_name,
  game_time,
  created_at,
  RANK() OVER (ORDER BY game_time ASC) as rank
FROM leaderboard
WHERE game_result = 'win' 
  AND game_mode = 'solo' 
  AND difficulty_level = 1
ORDER BY game_time ASC
LIMIT 100;

-- View for slowest wins (solo, level 1)
CREATE OR REPLACE VIEW slowest_wins_solo_level1 AS
SELECT 
  id,
  player_name,
  game_time,
  created_at,
  RANK() OVER (ORDER BY game_time DESC) as rank
FROM leaderboard
WHERE game_result = 'win' 
  AND game_mode = 'solo' 
  AND difficulty_level = 1
ORDER BY game_time DESC
LIMIT 100;

-- ============================================
-- Verification Queries
-- ============================================

-- Verify table was created
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'leaderboard';

-- Verify indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'leaderboard';

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'leaderboard';

-- Verify policies were created
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'leaderboard';

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- Uncomment to insert sample data
/*
INSERT INTO leaderboard (player_name, session_id, game_time, game_result, game_mode, difficulty_level) VALUES
  ('TestPlayer1', gen_random_uuid(), 45000, 'win', 'solo', 1),
  ('TestPlayer2', gen_random_uuid(), 67000, 'win', 'solo', 1),
  ('TestPlayer3', gen_random_uuid(), 89000, 'win', 'solo', 1),
  (NULL, gen_random_uuid(), 34000, 'loss', 'solo', 1),
  (NULL, gen_random_uuid(), 120000, 'win', 'solo', 2),
  ('ProPlayer', gen_random_uuid(), 55000, 'win', 'multiplayer', 1);
*/

-- ============================================
-- Cleanup Queries (Use with caution!)
-- ============================================

-- Uncomment to drop everything and start over
/*
DROP VIEW IF EXISTS fastest_wins_solo_level1;
DROP VIEW IF EXISTS slowest_wins_solo_level1;
DROP TABLE IF EXISTS leaderboard CASCADE;
*/
