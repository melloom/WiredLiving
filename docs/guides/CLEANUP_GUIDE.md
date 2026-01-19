# 🧹 WiredLiving Cleanup Guide

Quick reference for cleaning up your repository.

## 🎯 Quick Commands

### Make Scripts Executable (First Time)
```bash
chmod +x *.sh
```

### Build & Dependencies Cleanup
```bash
./cleanup.sh              # Safe cleanup
npm run cleanup           # Same as above

./deep-clean.sh          # Aggressive cleanup (asks confirmation)
npm run deep-clean       # Same as above
```

### Documentation Cleanup
```bash
./cleanup-docs.sh        # Interactive - asks before removing each file
npm run cleanup:docs     # Same as above

./cleanup-docs-auto.sh   # Automatic - removes redundant docs
npm run cleanup:docs:auto # Same as above

./organize-docs.sh       # Organize docs into folders (recommended!)
npm run organize:docs    # Same as above
```

## 📋 What Each Script Does

### `cleanup.sh` - Build Cleanup
Removes:
- `.next/`, `out/`, `build/`, `dist/`
- `node_modules/`
- `logs/`
- Lock files
- Temporary files

**Safe to run anytime**

### `deep-clean.sh` - Complete Reset
Does everything cleanup.sh does, plus:
- Removes all cache
- More aggressive cleanup
- Asks for confirmation

**Use when you need fresh start**

### `cleanup-docs.sh` - Interactive Doc Cleanup
- Shows each redundant file
- Asks if you want to remove it
- You decide what to keep

**Best for careful cleanup**

### `cleanup-docs-auto.sh` - Auto Doc Cleanup
Automatically removes:
- 3x security docs (keeps SECURITY_GUIDE.md)
- 2x markdown docs (keeps MARKDOWN_GUIDE.md)
- 5x setup guides (keeps README.md & DEPLOYMENT.md)
- News API docs (if not using)
- Test files
- Temporary comparison docs

**Asks for confirmation before starting**

### `organize-docs.sh` - Organize Docs (RECOMMENDED!)
**Instead of deleting**, moves docs to organized folders:
```
docs/
├── setup/         → All setup guides
├── security/      → All security docs
├── features/      → Feature documentation
├── markdown/      → Markdown guides
└── README.md      → Documentation index

migrations/        → All SQL files
```

**Best option - keeps everything organized!**

## 🎯 Recommended Workflow

### Option 1: Organize (Recommended)
```bash
chmod +x organize-docs.sh
./organize-docs.sh
```
Result: Clean root, organized docs

### Option 2: Aggressive Cleanup
```bash
chmod +x cleanup-docs-auto.sh
./cleanup-docs-auto.sh
```
Result: Minimal docs, removed redundancy

### Option 3: Manual Control
```bash
chmod +x cleanup-docs.sh
./cleanup-docs.sh
```
Result: You choose what to keep/remove

## 📊 Current File Count

You have **25+ markdown files** in root directory:
- Security docs: 4 files
- Setup guides: 6 files  
- Markdown docs: 3 files
- Feature docs: 4 files
- SEO docs: 2 files
- Others: 6 files

Plus **9 SQL files** in root.

## ✅ What to Keep in Root

Essential files only:
- `README.md` - Main documentation
- `CONTRIBUTING.md` - How to contribute
- `LICENSE` - License file
- `DEPLOYMENT.md` - Deployment guide
- `TROUBLESHOOTING.md` - Common issues

Everything else → move to `docs/` folder

## 🔧 After Cleanup

Check what's left:
```bash
ls -1 *.md
ls -1 *.sql
```

Check git status:
```bash
git status
```

Add organized structure to git:
```bash
git add docs/ migrations/
git commit -m "docs: organize documentation structure"
```

## 💡 Pro Tips

1. **Run organize-docs.sh first** - doesn't delete anything
2. **Review before committing** - check what was moved/removed
3. **Update links** - if you have internal doc links, update them
4. **Create .github/docs** - for GitHub-specific docs
5. **Use a CHANGELOG.md** - instead of NEW_FEATURES.md

## 🚨 Safety

All cleanup scripts:
- ✅ Ask for confirmation (except cleanup.sh)
- ✅ Show what they're doing
- ✅ Don't delete source code
- ✅ Don't delete .env files
- ✅ Reversible (with git)

Always commit before running aggressive cleanup!

```bash
git add .
git commit -m "chore: backup before cleanup"
./cleanup-docs-auto.sh
```
