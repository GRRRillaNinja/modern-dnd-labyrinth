@echo off
echo ================================================
echo Committing Leaderboard System to GitHub
echo ================================================
echo.

cd /d "C:\xampp\htdocs\dnd-labyrinth-v2"

echo Adding .env to .gitignore (if not already there)...
echo .env >> client\.gitignore
echo .env.local >> client\.gitignore
echo.

echo Staging files...
git add client/src/services/SupabaseService.ts
git add client/src/components/Leaderboard.tsx
git add client/src/App.tsx
git add client/src/components/Menu.tsx
git add client/src/store/gameStore.ts
git add create_leaderboard_table.sql
git add LEADERBOARD_SETUP.md
git add SUPABASE_SETUP.md
git add install-supabase.bat
git add client/.gitignore
echo.

echo Committing changes...
git commit -m "Add leaderboard system with Supabase integration" -m "- Add SupabaseService for database operations" -m "- Add Leaderboard component with 4 categories (fastest/slowest wins/losses)" -m "- Add optional player name input on game over screen" -m "- Auto-submit scores to leaderboard" -m "- Add 'View Leaderboards' button to menu and game over screen" -m "- Add SQL schema and setup documentation" -m "- Filter leaderboards by game mode and difficulty" -m "- Anonymous session tracking with optional names"
echo.

echo Pushing to GitHub...
git push
echo.

echo ================================================
echo Done! Your leaderboard system is now on GitHub
echo ================================================
echo.
echo IMPORTANT: Make sure you have a .env file in client/ directory
echo with your Supabase credentials (this file is NOT committed)
echo.
pause
