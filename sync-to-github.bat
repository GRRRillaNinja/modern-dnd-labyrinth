@echo off
echo ========================================
echo GitHub Repository Sync Script
echo ========================================
echo.

echo Step 1: Checking current status...
git status
echo.
echo ----------------------------------------
echo.

echo Step 2: Files that will be committed:
git status --short
echo.
echo ----------------------------------------
echo.

echo Step 3: Summary of changes:
git diff --stat
echo.
echo ----------------------------------------
echo.

echo Ready to commit and push ALL changes to GitHub!
echo.
set /p confirm="Do you want to continue? (yes/no): "

if /i "%confirm%"=="yes" (
    echo.
    echo Adding all files...
    git add -A
    
    echo.
    echo Committing changes...
    git commit -m "Sync all local changes to GitHub - Complete game update"
    
    echo.
    echo Pushing to GitHub...
    git push origin main
    
    echo.
    echo ========================================
    echo SUCCESS! All changes pushed to GitHub
    echo ========================================
) else (
    echo.
    echo Operation cancelled. No changes were committed.
)

echo.
pause
