# Cleanup Scripts

This directory contains scripts to clean up the WiredLiving project and remove files that shouldn't be committed to git.

## Available Scripts

### 1. `cleanup.sh` - Standard Cleanup
**Safe for regular use**

Removes:
- Build artifacts (`.next`, `out`, `build`, `dist`)
- Dependencies (`node_modules`)
- Lock files (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`)
- Logs (`logs/` directory)
- TypeScript build info
- OS-specific files (`.DS_Store`, `Thumbs.db`)
- Editor temporary files (`*~`, `*.swp`)
- Debug logs
- Test coverage
- Vercel artifacts

**Usage:**
```bash
./cleanup.sh
```

### 2. `deep-clean.sh` - Deep Clean
**Use when you need a completely fresh start**

Does everything `cleanup.sh` does, plus:
- Removes all cache files
- Removes `next-env.d.ts`
- More aggressive file removal

**Usage:**
```bash
./deep-clean.sh
```

You'll be prompted to confirm before the script runs.

## Adding to package.json

You can add these as npm scripts for easier access:

```json
{
  "scripts": {
    "clean": "./cleanup.sh",
    "deep-clean": "./deep-clean.sh"
  }
}
```

Then run:
```bash
npm run clean
# or
npm run deep-clean
```

## What's Ignored by Git

Check [.gitignore](./.gitignore) for the complete list of ignored files and directories.

Key ignored items:
- `node_modules/`
- `.next/`
- `logs/`
- `*.log`
- `.env*.local`
- Lock files (configurable)
- Build outputs
- Cache directories
- OS and editor files

## After Cleanup

After running cleanup scripts:

1. **Reinstall dependencies:**
   ```bash
   npm install
   ```

2. **Rebuild the project:**
   ```bash
   npm run build
   ```

3. **Start development:**
   ```bash
   npm run dev
   ```

## Git Status Check

After cleanup, check what files are ready to commit:

```bash
git status
```

To see what files are currently being ignored:
```bash
git status --ignored
```

## Best Practices

1. **Run cleanup before committing** to ensure you're not adding unnecessary files
2. **Don't commit sensitive data** (`.env` files, API keys)
3. **Don't commit build artifacts** (let CI/CD or deployment handle builds)
4. **Don't commit dependencies** (node_modules should always be ignored)
5. **Do commit lock files** if you want consistent dependency versions across environments (optional)

## Troubleshooting

**Script permission denied:**
```bash
chmod +x cleanup.sh deep-clean.sh
```

**Want to see what would be deleted:**
Add `echo` before `rm` commands in the script to dry-run.

**Accidentally committed something:**
```bash
# Remove from git but keep local file
git rm --cached <file>

# Remove from git and delete file
git rm <file>
```

## Manual Cleanup Commands

If you prefer manual cleanup:

```bash
# Remove build artifacts
rm -rf .next out build dist

# Remove dependencies
rm -rf node_modules

# Remove logs
rm -rf logs

# Remove lock files
rm -f package-lock.json yarn.lock pnpm-lock.yaml

# Find and remove OS files
find . -name ".DS_Store" -delete
```
