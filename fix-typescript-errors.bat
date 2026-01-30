@echo off
echo ================================================
echo Fixing TypeScript Errors and Committing
echo ================================================
echo.

cd /d "C:\xampp\htdocs\dnd-labyrinth-v2"

echo Adding TypeScript fixes...
git add client/src/vite-env.d.ts
git add client/src/components/Leaderboard.tsx
git add client/src/components/Menu.tsx
echo.

echo Committing TypeScript fixes...
git commit -m "Fix TypeScript errors for leaderboard system

- Add vite-env.d.ts for Supabase env variable types
- Remove unused AnimatePresence import in Leaderboard
- Mark unused props with underscore prefix
- Remove unused mode parameter from renderLeaderboardList"
echo.

echo Pushing to GitHub...
git push
echo.

echo ================================================
echo Done! All TypeScript errors fixed and pushed
echo ================================================
pause
