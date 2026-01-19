#!/bin/bash

# WiredLiving Project Cleanup Script
# Removes build artifacts, logs, cache, and other files that shouldn't be in git

set -e  # Exit on error

echo "🧹 Starting WiredLiving cleanup..."
echo ""

# Track what we're cleaning
CLEANED=0

# Function to safely remove files/directories
safe_remove() {
    local path="$1"
    local description="$2"
    
    if [ -e "$path" ]; then
        echo "  ✓ Removing $description: $path"
        rm -rf "$path"
        ((CLEANED++))
    fi
}

# 1. Remove Next.js build artifacts
echo "📦 Cleaning Next.js build artifacts..."
safe_remove ".next" "Next.js build directory"
safe_remove "out" "Next.js static export"
safe_remove ".next/cache" "Next.js cache"

# 2. Remove node_modules (can be reinstalled)
echo ""
echo "📚 Cleaning dependencies..."
safe_remove "node_modules" "Node modules"
safe_remove "package-lock.json" "package-lock.json"
safe_remove "yarn.lock" "yarn.lock"
safe_remove "pnpm-lock.yaml" "pnpm-lock.yaml"

# 3. Remove logs
echo ""
echo "📝 Cleaning logs..."
safe_remove "logs/combined.log" "Combined logs"
safe_remove "logs/error.log" "Error logs"
safe_remove "logs" "Logs directory"

# 4. Remove TypeScript build info
echo ""
echo "🔷 Cleaning TypeScript artifacts..."
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null && echo "  ✓ Removed *.tsbuildinfo files" || true

# 5. Remove OS-specific files
echo ""
echo "💻 Cleaning OS-specific files..."
find . -name ".DS_Store" -type f -delete 2>/dev/null && echo "  ✓ Removed .DS_Store files" || true
find . -name "Thumbs.db" -type f -delete 2>/dev/null && echo "  ✓ Removed Thumbs.db files" || true

# 6. Remove editor temporary files
echo ""
echo "✏️  Cleaning editor temporary files..."
find . -name "*~" -type f -delete 2>/dev/null && echo "  ✓ Removed backup files (*~)" || true
find . -name "*.swp" -type f -delete 2>/dev/null && echo "  ✓ Removed vim swap files" || true
find . -name "*.swo" -type f -delete 2>/dev/null && echo "  ✓ Removed vim swap files" || true

# 7. Remove npm/yarn debug logs
echo ""
echo "🐛 Cleaning debug logs..."
find . -name "npm-debug.log*" -type f -delete 2>/dev/null && echo "  ✓ Removed npm debug logs" || true
find . -name "yarn-debug.log*" -type f -delete 2>/dev/null && echo "  ✓ Removed yarn debug logs" || true
find . -name "yarn-error.log*" -type f -delete 2>/dev/null && echo "  ✓ Removed yarn error logs" || true

# 8. Remove coverage directories
echo ""
echo "📊 Cleaning test coverage..."
safe_remove "coverage" "Test coverage directory"
safe_remove ".nyc_output" "NYC output directory"

# 9. Remove build/dist directories
echo ""
echo "🏗️  Cleaning build outputs..."
safe_remove "build" "Build directory"
safe_remove "dist" "Distribution directory"

# 10. Remove Vercel artifacts
echo ""
echo "▲ Cleaning Vercel artifacts..."
safe_remove ".vercel" "Vercel directory"

# 11. Show git status of ignored files (optional check)
echo ""
echo "🔍 Checking for files that should be ignored by git..."
git status --ignored --short 2>/dev/null | grep "^!!" | head -n 20 || echo "  ✓ No additional ignored files found in git status"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Cleanup complete! Removed $CLEANED items."
echo ""
echo "📋 Next steps:"
echo "  1. Run 'npm install' to reinstall dependencies"
echo "  2. Run 'npm run build' to rebuild the project"
echo "  3. Check 'git status' to see what's ready to commit"
echo ""
echo "💡 Tip: Add this to package.json scripts:"
echo '   "clean": "./cleanup.sh"'
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
