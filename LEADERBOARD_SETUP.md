# Leaderboard Installation Guide

## Step 1: Install Supabase Client

In your project's `client` directory, run:

```bash
cd C:\xampp\htdocs\dnd-labyrinth-v2\client
npm install @supabase/supabase-js
```

## Step 2: Create Supabase Project

1. Go to https://supabase.com
2. Sign in or create an account
3. Click "New Project"
4. Fill in:
   - Project name: `dnd-labyrinth` (or your choice)
   - Database password: (choose a strong password)
   - Region: (choose closest to you)
5. Click "Create new project" and wait for it to finish setting up

## Step 3: Create Database Table

1. In your Supabase project, go to the **SQL Editor** (left sidebar)
2. Click "New Query"
3. Paste this SQL and click "Run":

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

## Step 4: Get Your API Credentials

1. In your Supabase project, click **Settings** (gear icon in left sidebar)
2. Click **API** in the settings menu
3. You'll see:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")
4. Copy both of these - you'll need them next

## Step 5: Create Environment Variables

1. In your `client` directory, create a file called `.env`:

```bash
# In C:\xampp\htdocs\dnd-labyrinth-v2\client\.env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Replace** `your_project_url_here` and `your_anon_key_here` with the values you copied.

Example:
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 6: Add .env to .gitignore

Make sure your `.env` file is NOT committed to git!

1. Open `client/.gitignore`
2. Add these lines if they're not there:

```
.env
.env.local
.env.*.local
```

## Step 7: Test the Leaderboard

1. Start your dev server:
```bash
npm run dev
```

2. Play a game and finish it (win or loss)
3. After the game ends, click "Leaderboards"
4. You should see your score appear!

5. Go to your Supabase project → **Table Editor** → **leaderboard** to see the data

## Troubleshooting

### "Leaderboard features not configured"
- Check that your `.env` file exists in the `client` directory
- Make sure the environment variables start with `VITE_`
- Restart your dev server after creating `.env`

### Scores not appearing
- Check browser console for errors
- Verify RLS policies are enabled in Supabase
- Check that the table was created successfully

### Can't connect to Supabase
- Verify your Project URL and API key are correct
- Make sure you're using the **anon public** key, not the service role key
- Check your internet connection

## Features

✅ Automatic score submission on game end
✅ Four leaderboard categories:
  - 🏆 Fastest Wins
  - 🐌 Slowest Wins  
  - 💀 Fastest Defeats
  - ⏳ Longest Defeats
✅ Filtered by game mode (solo/multiplayer) and difficulty (1/2)
✅ Anonymous tracking with persistent session IDs
✅ Beautiful UI with medal icons for top 3
✅ "View Leaderboards" button on menu and game over screen

Enjoy competing for the top spots! 🎮
