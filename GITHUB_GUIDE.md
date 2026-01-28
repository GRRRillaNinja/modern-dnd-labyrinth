# Complete Beginner's Guide to GitHub

This guide will walk you through publishing your D&D Labyrinth Game to GitHub, step by step.

## 📋 Prerequisites Checklist

Before starting, you need:
- [ ] A GitHub account (we'll create one in Step 1)
- [ ] Git installed on your computer (we'll install in Step 2)
- [ ] Your project cleaned up (remove dev .md files)

---

## Step 1: Create a GitHub Account

1. **Go to GitHub:**
   - Visit https://github.com
   - Click **"Sign up"** in the top right

2. **Fill out the form:**
   - Enter your email address
   - Create a password
   - Choose a username (this will be in your project URL)
   - Verify you're human (puzzle)

3. **Verify your email:**
   - Check your email inbox
   - Click the verification link

4. **Choose a plan:**
   - Select **"Free"** (it's perfect for this)

✅ **Done!** You now have a GitHub account.

---

## Step 2: Install Git on Your Computer

### For Windows:

1. **Download Git:**
   - Go to https://git-scm.com/download/win
   - Download will start automatically

2. **Install Git:**
   - Run the downloaded file
   - Click **"Next"** through the installer
   - Use all default settings (just keep clicking Next)
   - Click **"Install"**
   - Click **"Finish"**

3. **Verify installation:**
   - Open Command Prompt (press Win+R, type `cmd`, press Enter)
   - Type: `git --version`
   - You should see something like: `git version 2.43.0.windows.1`

✅ **Done!** Git is installed.

---

## Step 3: Clean Up Your Project

Before uploading to GitHub, remove the development notes files:

```cmd
cd C:\xampp\htdocs\dnd-labyrinth-v2

:: Option A: Move to docs folder (if you want to keep them)
mkdir docs
mkdir docs\development-notes
move BOARD_HEIGHT_EXPANSION.md docs\development-notes\
move COMBINED_TREASURE_MESSAGE_FIX.md docs\development-notes\
move CONDITIONAL_MOVES_DISPLAY.md docs\development-notes\
move CONTEXT_AWARE_HELP_MESSAGES.md docs\development-notes\
move DRAGON_BEHAVIOR_UPDATE.md docs\development-notes\
move DRAGON_IMPROVEMENTS.md docs\development-notes\
move DRAGON_PATROL.md docs\development-notes\
move DRAGON_PATROL_FIX.md docs\development-notes\
move DRAGON_TURN_HINT_FIX.md docs\development-notes\
move DRAGON_TURN_ORDER_FIX.md docs\development-notes\
move FIXES_APPLIED.md docs\development-notes\
move GAME_IMPROVEMENTS_JAN_28.md docs\development-notes\
move GAME_OVER_FIX.md docs\development-notes\
move HELP_TIPS_PERSISTENCE.md docs\development-notes\
move ICON_CHANGES.md docs\development-notes\
move LEGEND_SLIDE_ANIMATION.md docs\development-notes\
move LEVEL_SELECTION_MENU.md docs\development-notes\
move MAGICAL_PROTECTION_EFFECTS.md docs\development-notes\
move MOVE_TRACKING_FIX.md docs\development-notes\
move PLAYER_DRAGON_COLLISION_FIX.md docs\development-notes\
move PLAY_AGAIN_LEVEL_FIX.md docs\development-notes\
move PROJECT_SUMMARY.md docs\development-notes\
move QUICK_REFERENCE.md docs\development-notes\
move RESPAWN_AND_PATROL_FIX.md docs\development-notes\
move RIGHT_SIDEBAR_LAYOUT.md docs\development-notes\
move SECRET_ROOM_ICONS_UPDATE.md docs\development-notes\
move SECRET_ROOM_ICON_CSS.md docs\development-notes\
move SECRET_ROOM_ICON_ENHANCEMENT.md docs\development-notes\
move SETUP.md docs\development-notes\
move SIDEBAR_FLEX_SPACING.md docs\development-notes\
move SIDEBAR_LAYOUT_ADJUSTMENTS.md docs\development-notes\
move SIDEBAR_REORGANIZATION.md docs\development-notes\
move SINGLE_PLAYER_FIX.md docs\development-notes\
move SMOOTH_SLIDE_ANIMATION.md docs\development-notes\
move SOLO_DRAGON_WAKE_RULE.md docs\development-notes\
move START_HERE.md docs\development-notes\
move SYMMETRIC_WALL_DISCOVERY_FIX.md docs\development-notes\
move TREASURE_FOUND_CELEBRATION.md docs\development-notes\
move TREASURE_HINT_IMPROVEMENTS.md docs\development-notes\
move TREASURE_HINT_MARKER.md docs\development-notes\
move TREASURE_HINT_OPACITY_UPDATE.md docs\development-notes\
move TREASURE_ICON_CONSISTENCY_FIX.md docs\development-notes\
move TREASURE_MARKER_ENHANCEMENT.md docs\development-notes\
move TREASURE_PICKUP_TURN_FLOW_FIX.md docs\development-notes\
move TREASURE_SPAWN_FIX.md docs\development-notes\
move TWO_PLAYER_IMPROVEMENTS.md docs\development-notes\
move VIEWPORT_BOARD_SIZING.md docs\development-notes\
move VISUAL_ICON_IMPROVEMENTS.md docs\development-notes\
move WALL_HIT_MOVE_COST.md docs\development-notes\
move WARRIOR_BATTLE_SYSTEM.md docs\development-notes\
move WARRIOR_INFO_LAYOUT.md docs\development-notes\
move WAYSTONE_AND_TIMER_UPDATE.md docs\development-notes\
move WORKING_SMOOTH_ANIMATION.md docs\development-notes\

:: Delete the cleanup instructions file
del CLEANUP_INSTRUCTIONS.md

:: Option B: Delete them all (if you don't need them)
:: del BOARD_HEIGHT_EXPANSION.md
:: del COMBINED_TREASURE_MESSAGE_FIX.md
:: ... etc (delete all the above files)
```

✅ **Done!** Project is clean.

---

## Step 4: Configure Git (First Time Only)

Open Command Prompt and run these commands (replace with YOUR info):

```cmd
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

Example:
```cmd
git config --global user.name "John Smith"
git config --global user.email "johnsmith@gmail.com"
```

✅ **Done!** Git knows who you are.

---

## Step 5: Create a Repository on GitHub

1. **Go to GitHub:**
   - Visit https://github.com
   - Make sure you're logged in

2. **Create a new repository:**
   - Click the **"+"** icon in the top right
   - Select **"New repository"**

3. **Fill out the form:**
   - **Repository name**: `dnd-computer-labyrinth`
   - **Description**: `A modernized tribute to the 1980 Mattel Electronics D&D Computer Labyrinth Game`
   - **Public or Private**: Choose **Public** (so others can see it)
   - **DO NOT** check "Initialize with README" (you already have one)
   - **DO NOT** add .gitignore (you already have one)
   - **DO NOT** choose a license (you already have one)

4. **Click "Create repository"**

✅ **Done!** Your empty repository is created on GitHub.

---

## Step 6: Upload Your Project to GitHub

Now we connect your local project to GitHub and upload it.

### 6.1: Navigate to Your Project

```cmd
cd C:\xampp\htdocs\dnd-labyrinth-v2
```

### 6.2: Initialize Git (Makes Your Folder a Git Repository)

```cmd
git init
```

You should see: `Initialized empty Git repository...`

### 6.3: Add All Your Files

```cmd
git add .
```

This stages all your files for commit. (The `.` means "everything")

### 6.4: Create Your First Commit

```cmd
git commit -m "Initial commit - v1.0.0"
```

You should see a summary of files added.

### 6.5: Connect to GitHub

**IMPORTANT:** Replace `YOUR-USERNAME` with your actual GitHub username:

```cmd
git remote add origin https://github.com/YOUR-USERNAME/dnd-computer-labyrinth.git
```

Example:
```cmd
git remote add origin https://github.com/johnsmith/dnd-computer-labyrinth.git
```

### 6.6: Rename Branch to 'main'

```cmd
git branch -M main
```

### 6.7: Push to GitHub

```cmd
git push -u origin main
```

**You'll be asked to log in:**
- GitHub will open a browser window
- Click **"Authorize Git Credential Manager"**
- Your code will start uploading!

✅ **Done!** Your code is now on GitHub!

---

## Step 7: Create a v1.0.0 Release

Let's make an official v1.0.0 release with a downloadable package.

### 7.1: Create a Tag

```cmd
git tag -a v1.0.0 -m "Version 1.0.0 - Initial Release"
git push origin v1.0.0
```

### 7.2: Create the Release on GitHub

1. **Go to your repository:**
   - Visit `https://github.com/YOUR-USERNAME/dnd-computer-labyrinth`

2. **Click "Releases"** (on the right side of the page)

3. **Click "Create a new release"**

4. **Fill out the release form:**
   - **Choose a tag**: Select `v1.0.0` from dropdown
   - **Release title**: `v1.0.0 - Initial Release`
   - **Description**: Copy this:

```markdown
# 🎮 D&D Computer Labyrinth v1.0.0

The first official release of the modernized D&D Computer Labyrinth Game!

## 🎉 What's Included

- ✅ Single-player and two-player local multiplayer
- ✅ Two difficulty levels (with/without locking doors)
- ✅ Complete audio system with 13 sound effects
- ✅ Smooth animations and visual effects
- ✅ Responsive design (desktop, tablet, mobile)
- ✅ Procedurally generated mazes

## 🚀 Quick Start

1. Clone or download the repository
2. Install Node.js 18+ if you haven't already
3. Run `npm install` then `cd client && npm install`
4. Run `npm run setup` to copy audio files
5. Run `npm run dev` from the client directory
6. Open http://localhost:3000 and play!

See [README.md](README.md) for detailed instructions.

## 📖 Documentation

- [README.md](README.md) - Complete setup and gameplay guide
- [CHANGELOG.md](CHANGELOG.md) - Full feature list and history
- [LICENSE](LICENSE) - MIT License with attribution

## 🎯 Future Plans

- Phase 2: Visual polish and effects
- Phase 3: Online multiplayer
- Phase 4: Statistics and achievements
- Phase 5: New game modes

Enjoy! 🐉⚔️💎
```

5. **Click "Publish release"**

✅ **Done!** You have an official v1.0.0 release!

---

## Step 8: Add a Nice README Screenshot (Optional but Recommended)

1. **Take a screenshot:**
   - Run your game locally (`npm run dev`)
   - Take a screenshot of the game board
   - Save it as `screenshot.png`

2. **Add to repository:**
   ```cmd
   copy screenshot.png C:\xampp\htdocs\dnd-labyrinth-v2\
   git add screenshot.png
   git commit -m "Add game screenshot"
   git push
   ```

3. **Update README.md:**
   - Add this line near the top after the title:
   ```markdown
   ![Game Screenshot](screenshot.png)
   ```

---

## 🎊 You're Done!

Your project is now on GitHub! Here's what you accomplished:

- ✅ Created a GitHub account
- ✅ Installed Git
- ✅ Cleaned up your project
- ✅ Uploaded your code to GitHub
- ✅ Created an official v1.0.0 release

## 🔗 Share Your Project

Your project URL is:
```
https://github.com/YOUR-USERNAME/dnd-computer-labyrinth
```

You can now:
- Share this link with friends
- Add it to your resume/portfolio
- Let others download and play your game
- Accept contributions from other developers

---

## 📝 Future Updates

When you make changes and want to upload them:

```cmd
cd C:\xampp\htdocs\dnd-labyrinth-v2

:: Stage your changes
git add .

:: Commit with a message
git commit -m "Description of what you changed"

:: Push to GitHub
git push
```

---

## ❓ Common Issues

**"Permission denied" when pushing:**
- Make sure you're logged into GitHub
- Try: `git push` again and authorize in the browser

**"Repository not found":**
- Check that you used the correct username in the remote URL
- Run: `git remote -v` to see your current URL
- Fix with: `git remote set-url origin https://github.com/YOUR-USERNAME/dnd-computer-labyrinth.git`

**"Cannot find Git":**
- Restart Command Prompt after installing Git
- Make sure Git is installed (run `git --version`)

**Files are staged but not committing:**
- Make sure you ran `git config` commands in Step 4
- Check with: `git config user.name` and `git config user.email`

---

## 🎓 Learning More

Want to learn more about Git/GitHub?
- **GitHub Docs**: https://docs.github.com
- **Git Handbook**: https://guides.github.com/introduction/git-handbook/
- **Interactive Tutorial**: https://learngitbranching.js.org/

---

**Congratulations on publishing your first GitHub project!** 🎉
