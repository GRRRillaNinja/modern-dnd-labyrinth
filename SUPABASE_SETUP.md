# Supabase Leaderboard Setup Guide

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Create a new project
3. Note your project URL and anon public key

## Step 2: Create Database Table

Run this SQL in your Supabase SQL Editor:

```sql
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

-- Create indexes for faster queries
CREATE INDEX idx_game_result ON leaderboard(game_result);
CREATE INDEX idx_game_mode ON leaderboard(game_mode);
CREATE INDEX idx_game_time ON leaderboard(game_time);
CREATE INDEX idx_created_at ON leaderboard(created_at DESC);

-- Enable Row Level Security
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert scores
CREATE POLICY "Allow public insert" ON leaderboard
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow anonymous users to read scores
CREATE POLICY "Allow public select" ON leaderboard
  FOR SELECT TO anon
  USING (true);
```

## Step 3: Install Supabase Client

In your `client` directory, run:

```bash
npm install @supabase/supabase-js
```

## Step 4: Add Environment Variables

Create a `.env` file in your `client` directory:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important:** Add `.env` to your `.gitignore` to keep your keys private!

## Step 5: Update .gitignore

Add to `client/.gitignore`:

```
.env
.env.local
```

## Leaderboard Categories

The app will track 4 leaderboards:
1. **Fastest Win** - Shortest game_time with game_result='win'
2. **Slowest Win** - Longest game_time with game_result='win'
3. **Fastest Loss** - Shortest game_time with game_result='loss'
4. **Longest Loss** - Longest game_time with game_result='loss'

All filtered by game_mode and difficulty_level as selected by the user.
