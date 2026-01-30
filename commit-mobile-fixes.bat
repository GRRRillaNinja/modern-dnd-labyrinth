@echo off
echo Committing mobile layout fixes...
cd /d "C:\xampp\htdocs\dnd-labyrinth-v2"
git add client/src/App.tsx client/src/components/RightSidebar.tsx client/src/components/HelpSidebar.tsx
git commit -m "Fix mobile layout: prevent gameboard overlap, reorder components, add responsive warrior info"
echo.
echo Pushing to GitHub...
git push
echo.
echo Done! Press any key to exit...
pause > nul
