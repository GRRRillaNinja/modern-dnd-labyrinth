# Quick Reference: GitHub Commands

After you've done the initial setup (see GITHUB_GUIDE.md), use these commands for future updates.

## 📍 Navigate to Project

```cmd
cd C:\xampp\htdocs\dnd-labyrinth-v2
```

---

## 🔄 Making Updates

### 1. Check What Changed

```cmd
git status
```

This shows which files you've modified.

### 2. Stage Your Changes

```cmd
:: Stage all changes
git add .

:: Or stage specific files
git add client/src/components/Board.tsx
git add README.md
```

### 3. Commit with Message

```cmd
git commit -m "Brief description of what you changed"
```

**Good commit messages:**
- `"Fix dragon attack bug"`
- `"Add sound preview feature"`
- `"Update README with new instructions"`
- `"Version 1.1.0 - Add new game mode"`

### 4. Push to GitHub

```cmd
git push
```

---

## 🏷️ Creating a New Version

When releasing a new version (e.g., v1.1.0):

```cmd
:: Update package.json version first (manually edit the file)

:: Stage and commit the version change
git add package.json CHANGELOG.md
git commit -m "Version 1.1.0"

:: Create and push the tag
git tag -a v1.1.0 -m "Version 1.1.0 - Description"
git push origin v1.1.0

:: Push the commit
git push
```

Then go to GitHub and create a release from the tag.

---

## 📥 Getting Latest Code (if you work from multiple computers)

```cmd
git pull
```

---

## 🌿 Common Workflows

### Workflow 1: Quick Bug Fix

```cmd
git add .
git commit -m "Fix treasure pickup bug"
git push
```

### Workflow 2: New Feature

```cmd
git add .
git commit -m "Add multiplayer chat feature"
git push
```

### Workflow 3: Update Documentation

```cmd
git add README.md CHANGELOG.md
git commit -m "Update documentation"
git push
```

---

## ❓ Troubleshooting

### Forgot to commit before making more changes?

```cmd
git add .
git commit -m "Fix multiple issues"
```

### Want to undo changes to a file?

```cmd
:: CAREFUL: This deletes your changes!
git checkout -- filename.txt
```

### See commit history

```cmd
git log
```

Press `q` to exit the log view.

### Accidentally committed wrong files?

```cmd
:: Undo last commit but keep the changes
git reset --soft HEAD~1

:: Now you can add/commit again
git add correct-files.txt
git commit -m "Fixed commit"
```

---

## 🔍 Useful Commands

```cmd
:: See what's changed
git status

:: See commit history
git log --oneline

:: See what you changed in files
git diff

:: See your remote URL
git remote -v

:: Update remote URL if needed
git remote set-url origin https://github.com/USERNAME/repo.git
```

---

## 📦 Your Typical Update Workflow

This is what you'll do 90% of the time:

```cmd
:: 1. Navigate to project
cd C:\xampp\htdocs\dnd-labyrinth-v2

:: 2. Check what changed
git status

:: 3. Add everything
git add .

:: 4. Commit with message
git commit -m "Your change description"

:: 5. Push to GitHub
git push
```

**That's it!** Four commands (after the `cd`) to update GitHub.

---

## 🎯 Best Practices

1. **Commit often** - Don't wait until you have 50 files changed
2. **Write clear messages** - Future you will thank you
3. **Test before committing** - Make sure your changes work
4. **Update CHANGELOG.md** - Keep track of what you added
5. **Pull before push** - If working from multiple computers

---

## 📚 Want to Learn More?

- **Full beginner guide**: See GITHUB_GUIDE.md in this folder
- **GitHub docs**: https://docs.github.com
- **Git cheatsheet**: https://education.github.com/git-cheat-sheet-education.pdf

Happy coding! 🚀
