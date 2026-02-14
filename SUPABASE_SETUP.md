# Supabase Leaderboard Setup (Optional)

The game works perfectly without this setup - leaderboards are an optional feature.

## Quick Start (No Database)

Just want to play the game locally? Skip this entirely!

```bash
git clone https://github.com/GRRRillaNinja/modern-dnd-labyrinth.git
cd modern-dnd-labyrinth/client
npm install
npm run dev
```

The game will work with all features except leaderboards.

---

## Setting Up Leaderboards (Optional)

If you want to enable the leaderboard feature, follow these steps:

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project
4. Wait for the database to initialize (~2 minutes)

### 2. Create the Leaderboard Table

Go to the SQL Editor in your Supabase dashboard and run:

```sql
-- Create leaderboard table
CREATE TABLE leaderboard (
  id BIGSERIAL PRIMARY KEY,
  player_name TEXT,
  session_id TEXT NOT NULL,
  game_time INTEGER NOT NULL,
  game_result TEXT NOT NULL CHECK (game_result IN ('win', 'loss')),
  game_mode TEXT NOT NULL CHECK (game_mode IN ('solo', 'multiplayer')),
  difficulty_level INTEGER NOT NULL CHECK (difficulty_level IN (1, 2)),
  total_moves INTEGER,
  total_deaths INTEGER,
  walls_discovered_pct NUMERIC(5,2),
  vs_cpu BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_leaderboard_game_result_mode ON leaderboard(game_result, game_mode);
CREATE INDEX idx_leaderboard_created_at ON leaderboard(created_at DESC);
```

### 3. Enable Row Level Security (RLS)

Still in the SQL Editor, run:

```sql
-- Enable RLS
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read leaderboard
CREATE POLICY "Allow public read access"
ON leaderboard FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to insert scores
CREATE POLICY "Allow public insert"
ON leaderboard FOR INSERT
TO anon
WITH CHECK (
  char_length(player_name) <= 50 AND
  player_name !~* '<script|javascript:|onerror'
);

-- Prevent unauthorized updates and deletes
CREATE POLICY "Prevent public updates"
ON leaderboard FOR UPDATE
TO anon
USING (false);

CREATE POLICY "Prevent public deletes"
ON leaderboard FOR DELETE
TO anon
USING (false);
```

### 4. Get Your API Credentials

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (the long key starting with `eyJ...`)

### 5. Create Environment File

In the `client/` directory, create a file named `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:**
- Replace with YOUR actual values from step 4
- Never commit this file to Git (already in `.gitignore`)
- The anon key is safe to expose in client-side code

### 6. Restart Development Server

```bash
npm run dev
```

Leaderboards should now work! 🎉

---

## Troubleshooting

**"Supabase credentials not found" warning:**
- Make sure `.env.local` is in the `client/` folder
- Restart the dev server after creating `.env.local`
- Check that variable names start with `VITE_`

**Leaderboards not loading:**
- Verify RLS policies are enabled in Supabase dashboard
- Check browser console for errors
- Ensure your Supabase project is active (not paused)

**Submissions not working:**
- Verify the INSERT policy is created
- Check that player names are under 50 characters
- Look for errors in browser console

---

## Free Tier Limits

Supabase free tier includes:
- 500 MB database storage
- 50,000 monthly active users
- 2 GB bandwidth

This is more than enough for a personal leaderboard!

---

## Production Deployment

If deploying to production (Vercel, Netlify, etc.):

1. Add environment variables in your hosting platform's dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. Add your production domain to Supabase:
   - Go to **Authentication** → **URL Configuration**
   - Add your domain to redirect URLs

---

**Still need help?** Open an issue on GitHub!
