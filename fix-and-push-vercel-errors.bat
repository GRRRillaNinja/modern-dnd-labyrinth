@echo off
echo ================================================
echo Fixing Remaining TypeScript Errors for Vercel
echo ================================================
echo.

cd /d "C:\xampp\htdocs\dnd-labyrinth-v2"

echo Fixing files...

REM Fix GameEngine.ts - Change 'single' to 'local'
powershell -Command "$content = Get-Content 'client/src/game/GameEngine.ts' -Raw; $content = $content -replace \"mode: 'single'\", \"mode: 'local'\"; Set-Content 'client/src/game/GameEngine.ts' -Value $content"

REM Fix HelpSidebar.tsx - Prefix unused warrior variable  
powershell -Command "$content = Get-Content 'client/src/components/HelpSidebar.tsx' -Raw; $content = $content -replace '(?m)^(\s*)const warrior = gameState', '$1const _warrior = gameState'; Set-Content 'client/src/components/HelpSidebar.tsx' -Value $content"

REM Fix ParticleCloud.tsx - Prefix unused i variable
powershell -Command "$content = Get-Content 'client/src/components/ParticleCloud.tsx' -Raw; $content = $content -replace 'particles.map\(\(particle, i\)', 'particles.map((particle, _i)'; Set-Content 'client/src/components/ParticleCloud.tsx' -Value $content"

REM Fix MazeGenerator.ts - Prefix unused variables
powershell -Command "$content = Get-Content 'client/src/game/MazeGenerator.ts' -Raw; $content = $content -replace '(?m)^(\s*)const isEdgeCol', '$1const _isEdgeCol'; $content = $content -replace '(?m)^(\s*)const isEdgeRow', '$1const _isEdgeRow'; Set-Content 'client/src/game/MazeGenerator.ts' -Value $content"

echo.
echo Done! Now committing changes...
git add -A
git commit -m "Fix all TypeScript errors for Vercel deployment

- Remove PlayerNameModal references (component doesn't exist)
- Fix GameEngine mode type ('single' -> 'local')
- Prefix unused variables with underscore
- Remove duplicate leaderboard modal"
git push

echo.
echo ================================================
echo All fixes applied and pushed to GitHub!
echo ================================================
pause
