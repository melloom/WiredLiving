# Troubleshooting Guide

## Webpack Cache Errors

If you're experiencing webpack module errors like:
```
Error: Cannot find module './948.js'
```

### Quick Fix

1. **Stop the dev server** (Ctrl+C)

2. **Clean all caches:**
   ```bash
   npm run clean
   # or manually:
   rm -rf .next node_modules/.cache .next/cache
   ```

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

### Nuclear Option (If above doesn't work)

```bash
# Remove everything
rm -rf .next node_modules package-lock.json

# Reinstall dependencies
npm install

# Rebuild
npm run build
npm run dev
```

## Build Errors

### TypeScript Errors
```bash
npm run type-check
```

### Linting Errors
```bash
npm run lint
```

## Common Issues

### 1. Module Not Found
- Clean `.next` folder: `rm -rf .next`
- Reinstall: `npm install`

### 2. Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### 3. Stale Build Cache
```bash
npm run clean
npm run build
```

## Getting Help

1. Check the error message in the terminal
2. Try the cleanup steps above
3. Check Next.js documentation: https://nextjs.org/docs
4. Review build logs for specific errors


