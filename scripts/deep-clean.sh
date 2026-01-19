#!/bin/bash

# WiredLiving Deep Clean Script
# WARNING: This removes EVERYTHING that can be regenerated
# Use this when you want a completely fresh start

set -e

echo "⚠️  WARNING: DEEP CLEAN MODE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "This will remove:"
echo "  • All build artifacts (.next, out, build, dist)"
echo "  • All dependencies (node_modules)"
echo "  • All logs"
echo "  • All lock files"
echo "  • All cache files"
echo "  • Environment files (.env.local)"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Deep clean cancelled"
    exit 0
fi

echo "🧹 Starting deep clean..."
echo ""

# Remove build artifacts
echo "📦 Removing build artifacts..."
rm -rf .next out build dist .vercel
echo "  ✓ Done"

# Remove dependencies
echo ""
echo "📚 Removing dependencies..."
rm -rf node_modules
echo "  ✓ Done"

# Remove lock files
echo ""
echo "🔒 Removing lock files..."
rm -f package-lock.json yarn.lock pnpm-lock.yaml
echo "  ✓ Done"

# Remove logs
echo ""
echo "📝 Removing logs..."
rm -rf logs
rm -f *.log
echo "  ✓ Done"

# Remove cache
echo ""
echo "💾 Removing cache files..."
rm -rf .next/cache
find . -name ".cache" -type d -exec rm -rf {} + 2>/dev/null || true
echo "  ✓ Done"

# Remove TypeScript build info
echo ""
echo "🔷 Removing TypeScript artifacts..."
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true
rm -f next-env.d.ts
echo "  ✓ Done"

# Remove OS files
echo ""
echo "💻 Removing OS-specific files..."
find . -name ".DS_Store" -type f -delete 2>/dev/null || true
find . -name "Thumbs.db" -type f -delete 2>/dev/null || true
echo "  ✓ Done"

# Remove editor files
echo ""
echo "✏️  Removing editor files..."
find . -name "*~" -type f -delete 2>/dev/null || true
find . -name "*.swp" -type f -delete 2>/dev/null || true
find . -name "*.swo" -type f -delete 2>/dev/null || true
echo "  ✓ Done"

# Remove debug logs
echo ""
echo "🐛 Removing debug logs..."
find . -name "npm-debug.log*" -type f -delete 2>/dev/null || true
find . -name "yarn-debug.log*" -type f -delete 2>/dev/null || true
find . -name "yarn-error.log*" -type f -delete 2>/dev/null || true
echo "  ✓ Done"

# Remove coverage
echo ""
echo "📊 Removing test coverage..."
rm -rf coverage .nyc_output
echo "  ✓ Done"

# Optional: Remove .env.local (commented by default for safety)
# echo ""
# echo "🔐 Removing local environment..."
# rm -f .env.local
# echo "  ✓ Done"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Deep clean complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Run 'npm install' to reinstall dependencies"
echo "  2. Copy .env.example to .env.local (if needed)"
echo "  3. Run 'npm run dev' to start fresh"
echo ""
echo "🔍 Git status:"
git status --short
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
