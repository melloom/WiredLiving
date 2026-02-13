# Git Push Scripts

Quick scripts to add, commit, and push changes to git.

## Quick Push (Interactive)

Prompts you for a commit message:

```bash
# Run directly
./scripts/quick-push.sh

# Or use npm script
npm run push
```

## Git Push (With Message)

Provide commit message as argument:

```bash
# Run directly
./scripts/git-push.sh "Your commit message here"

# Or use npm script
npm run git:push "Your commit message here"
```

## Examples

```bash
# Interactive (will prompt for message)
npm run push

# With message
npm run git:push "Add analytics dashboard with real-time charts"

# Or directly
./scripts/quick-push.sh
./scripts/git-push.sh "Fix analytics tracking bug"
```

## What They Do

Both scripts:
1. ✅ `git add -A` - Stage all changes
2. ✅ `git commit -m "message"` - Commit with your message
3. ✅ `git push origin main` - Push to main branch

The only difference:
- `quick-push.sh` - Interactive (prompts for message)
- `git-push.sh` - Requires message as argument
