@echo off
setlocal enabledelayedexpansion

echo ========================================
echo GITHUB WORKFLOW MASTER SCRIPT
echo ========================================
echo.
echo This script will guide you through:
echo   1. Review pending changes
echo   2. Commit and push to GitHub
echo   3. Clear PENDING_CHANGES.md
echo.
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "PENDING_CHANGES.md" (
    echo ERROR: PENDING_CHANGES.md not found!
    echo Please run this from the project root directory.
    echo.
    pause
    exit /b 1
)

REM ========================================
REM STEP 1: REVIEW CHANGES
REM ========================================
echo.
echo ========================================
echo STEP 1: REVIEW CHANGES
echo ========================================
echo.

echo Contents of PENDING_CHANGES.md:
echo ----------------------------------------
type PENDING_CHANGES.md
echo ----------------------------------------
echo.

echo.
echo Current Git Status:
echo ----------------------------------------
git status
echo ----------------------------------------
echo.

set /p continue1="Continue to commit? (yes/no): "
if /i not "%continue1%"=="yes" (
    echo.
    echo Workflow cancelled. No changes were made.
    pause
    exit /b 0
)

REM ========================================
REM STEP 2: COMMIT AND PUSH
REM ========================================
echo.
echo ========================================
echo STEP 2: COMMIT AND PUSH
echo ========================================
echo.

echo Files to be committed:
echo ----------------------------------------
git status --short
echo ----------------------------------------
echo.

echo Please copy the commit message from PENDING_CHANGES.md above
echo (the content in the "Commit Message (Draft)" section)
echo.
echo Paste the TITLE line here:
set /p title="> "

echo.
echo Paste the DESCRIPTION (press Enter after each line, type END when finished):
echo.

REM Create temp file for commit message
echo. > temp_commit_msg.txt
echo %title% > temp_commit_msg.txt
echo. >> temp_commit_msg.txt

:input_loop
set /p line="> "
if "%line%"=="END" goto done_input
echo %line% >> temp_commit_msg.txt
goto input_loop

:done_input

REM Show the commit message
echo.
echo ----------------------------------------
echo Your commit message will be:
echo ----------------------------------------
type temp_commit_msg.txt
echo ----------------------------------------
echo.

set /p confirm_commit="Commit and push with this message? (yes/no): "
if /i not "%confirm_commit%"=="yes" (
    del temp_commit_msg.txt
    echo.
    echo Commit cancelled.
    pause
    exit /b 0
)

REM Stage all changes
echo.
echo Staging all changes...
git add -A

REM Commit
echo.
echo Committing changes...
git commit -F temp_commit_msg.txt

if errorlevel 1 (
    echo.
    echo ERROR: Commit failed!
    del temp_commit_msg.txt
    pause
    exit /b 1
)

REM Push to GitHub
echo.
echo Pushing to GitHub...
git push origin main

if errorlevel 1 (
    echo.
    echo ERROR: Push failed!
    del temp_commit_msg.txt
    pause
    exit /b 1
)

REM Clean up temp file
del temp_commit_msg.txt

echo.
echo ========================================
echo SUCCESS! Changes pushed to GitHub
echo ========================================
echo.

REM ========================================
REM STEP 3: CLEAR PENDING CHANGES
REM ========================================
echo.
echo ========================================
echo STEP 3: CLEAR PENDING CHANGES
echo ========================================
echo.

set /p clear_pending="Reset PENDING_CHANGES.md for next session? (yes/no): "
if /i not "%clear_pending%"=="yes" (
    echo.
    echo Skipped clearing PENDING_CHANGES.md
    echo You can run clear-pending-changes.bat manually later.
    pause
    exit /b 0
)

REM Reset PENDING_CHANGES.md to template
echo.
echo Resetting PENDING_CHANGES.md...

echo # Pending Changes > PENDING_CHANGES.md
echo. >> PENDING_CHANGES.md
echo **Session Started:** [Date/Time will be filled in] >> PENDING_CHANGES.md
echo. >> PENDING_CHANGES.md
echo --- >> PENDING_CHANGES.md
echo. >> PENDING_CHANGES.md
echo ## Files Created >> PENDING_CHANGES.md
echo - [ ] None yet >> PENDING_CHANGES.md
echo. >> PENDING_CHANGES.md
echo --- >> PENDING_CHANGES.md
echo. >> PENDING_CHANGES.md
echo ## Files Modified >> PENDING_CHANGES.md
echo - [ ] None yet >> PENDING_CHANGES.md
echo. >> PENDING_CHANGES.md
echo --- >> PENDING_CHANGES.md
echo. >> PENDING_CHANGES.md
echo ## Files Deleted >> PENDING_CHANGES.md
echo - [ ] None yet >> PENDING_CHANGES.md
echo. >> PENDING_CHANGES.md
echo --- >> PENDING_CHANGES.md
echo. >> PENDING_CHANGES.md
echo ## Features Added >> PENDING_CHANGES.md
echo - [ ] None yet >> PENDING_CHANGES.md
echo. >> PENDING_CHANGES.md
echo --- >> PENDING_CHANGES.md
echo. >> PENDING_CHANGES.md
echo ## Bugs Fixed >> PENDING_CHANGES.md
echo - [ ] None yet >> PENDING_CHANGES.md
echo. >> PENDING_CHANGES.md
echo --- >> PENDING_CHANGES.md
echo. >> PENDING_CHANGES.md
echo ## Improvements Made >> PENDING_CHANGES.md
echo - [ ] None yet >> PENDING_CHANGES.md
echo. >> PENDING_CHANGES.md
echo --- >> PENDING_CHANGES.md
echo. >> PENDING_CHANGES.md
echo ## Notes/Reminders >> PENDING_CHANGES.md
echo - None yet >> PENDING_CHANGES.md
echo. >> PENDING_CHANGES.md
echo --- >> PENDING_CHANGES.md
echo. >> PENDING_CHANGES.md
echo ## Commit Message (Draft) >> PENDING_CHANGES.md
echo *This will be generated from the above items when ready to commit* >> PENDING_CHANGES.md
echo. >> PENDING_CHANGES.md
echo ``` >> PENDING_CHANGES.md
echo [Title - will be generated] >> PENDING_CHANGES.md
echo. >> PENDING_CHANGES.md
echo [Description - will be generated from items above] >> PENDING_CHANGES.md
echo ``` >> PENDING_CHANGES.md
echo. >> PENDING_CHANGES.md
echo --- >> PENDING_CHANGES.md
echo. >> PENDING_CHANGES.md
echo **Last Updated:** Never >> PENDING_CHANGES.md

echo.
echo ========================================
echo WORKFLOW COMPLETE!
echo ========================================
echo.
echo Summary:
echo   - Changes committed and pushed to GitHub
echo   - PENDING_CHANGES.md reset for next session
echo.
echo Ready for your next development session!
echo.

pause