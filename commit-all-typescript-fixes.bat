@echo off
echo ================================================
echo Committing All TypeScript Fixes for Vercel
echo ================================================
echo.

cd /d "C:\xampp\htdocs\dnd-labyrinth-v2"

echo Staging files...
git add package.json
git add client/src/App.tsx
git add client/src/services/SupabaseService.ts
git add client/src/components/Leaderboard.tsx
git add client/src/components/Menu.tsx
git add client/src/vite-env.d.ts
echo.

echo Committing...
git commit -m "Fix TypeScript errors and JSON syntax for Vercel deployment

- Fix missing comma in root package.json
- Remove PlayerNameModal usage (component doesn't exist)
- Make Supabase optional with dynamic import
- Remove duplicate leaderboard modal rendering
- Fix unused variable warnings with underscore prefix
- Add Vite env types for Supabase credentials"
echo.

echo Pushing to GitHub...
git push
echo.

echo ================================================
echo Done! Vercel should now build successfully
echo ================================================
echo.
echo Note: Supabase will work when package is installed locally
echo but won't break the build when it's missing on Vercel
echo.
pause
