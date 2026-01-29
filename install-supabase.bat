@echo off
echo Installing Supabase client library...
cd /d "C:\xampp\htdocs\dnd-labyrinth-v2\client"
npm install @supabase/supabase-js
echo.
echo Installation complete!
echo.
echo Next steps:
echo 1. Follow LEADERBOARD_SETUP.md to set up your Supabase project
echo 2. Create a .env file in the client directory with your credentials
echo 3. Restart your dev server
echo.
pause
