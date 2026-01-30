@echo off
echo Adding intro sound and related changes...
cd /d "C:\xampp\htdocs\dnd-labyrinth-v2"
git add client/public/audio/intro.mp3
git add client/src/services/AudioService.ts
git add client/src/components/Menu.tsx
git commit -m "Add intro sound that plays on landing page and stops when game starts"
echo.
echo Pushing to GitHub...
git push
echo.
echo Done! Press any key to exit...
pause > nul
