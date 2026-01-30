@echo off
echo ================================================
echo Fixing ALL TypeScript Errors
echo ================================================
echo.

cd /d "C:\xampp\htdocs\dnd-labyrinth-v2\client"

REM Fix App.tsx - Remove PlayerNameModal usage
powershell -Command "(Get-Content src/App.tsx) -replace '^.*PlayerNameModal.*$', '' | Set-Content src/App.tsx"
powershell -Command "(Get-Content src/App.tsx) -replace 'showPlayerNameModal|showLeaderboardAfterGame|submitScore|skipScoreSubmission|closeLeaderboard,?', '' | Set-Content src/App.tsx"
powershell -Command "(Get-Content src/App.tsx) -replace 'const getGameTime', 'const _getGameTime' | Set-Content src/App.tsx"
powershell -Command "(Get-Content src/App.tsx) -replace 'getGameTime\(\)', '_getGameTime()' | Set-Content src/App.tsx"

REM Fix Chamber.tsx - Remove unused DiscoveredWalls import
powershell -Command "(Get-Content src/components/Chamber.tsx) -replace '  DiscoveredWalls,', '' | Set-Content src/components/Chamber.tsx"

REM Fix HelpSidebar.tsx - Prefix unused warrior variable
powershell -Command "(Get-Content src/components/HelpSidebar.tsx) -replace 'const warrior =', 'const _warrior =' | Set-Content src/components/HelpSidebar.tsx"

REM Fix ParticleCloud.tsx - Prefix unused i variable
powershell -Command "(Get-Content src/components/ParticleCloud.tsx) -replace '\{particles\.map\(\(particle, i\)', '{particles.map((particle, _i)' | Set-Content src/components/ParticleCloud.tsx"

REM Fix GameEngine.ts - Remove unused imports and fix 'single' type
powershell -Command "(Get-Content src/game/GameEngine.ts) -replace '  MoveAction,', '' | Set-Content src/game/GameEngine.ts"
powershell -Command "(Get-Content src/game/GameEngine.ts) -replace '  Dragon,', '' | Set-Content src/game/GameEngine.ts"
powershell -Command "(Get-Content src/game/GameEngine.ts) -replace '  Treasure,', '' | Set-Content src/game/GameEngine.ts"
powershell -Command "(Get-Content src/game/GameEngine.ts) -replace '  DiscoveredWalls,', '' | Set-Content src/game/GameEngine.ts"
powershell -Command "(Get-Content src/game/GameEngine.ts) -replace \"mode: 'single'\", \"mode: 'local'\" | Set-Content src/game/GameEngine.ts"

REM Fix MazeGenerator.ts - Prefix unused variables
powershell -Command "(Get-Content src/game/MazeGenerator.ts) -replace 'const isEdgeCol', 'const _isEdgeCol' | Set-Content src/game/MazeGenerator.ts"
powershell -Command "(Get-Content src/game/MazeGenerator.ts) -replace 'const isEdgeRow', 'const _isEdgeRow' | Set-Content src/game/MazeGenerator.ts"

echo.
echo All fixes applied!
echo.
pause
