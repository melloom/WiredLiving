#!/bin/bash

# WiredLiving AGGRESSIVE Documentation Cleanup
# WARNING: This will automatically remove redundant files without prompting

set -e

echo "⚠️  AGGRESSIVE DOCUMENTATION CLEANUP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This will automatically remove redundant documentation files."
echo ""
read -p "Continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Cleanup cancelled"
    exit 0
fi

REMOVED=0

remove_file() {
    if [ -f "$1" ]; then
        echo "🗑️  Removing: $1"
        rm "$1"
        ((REMOVED++))
    fi
}

echo "🧹 Removing redundant documentation..."
echo ""

# Redundant security docs (keep SECURITY_GUIDE.md)
remove_file "SECURITY_CHECKLIST.md"
remove_file "SECURITY_IMPLEMENTATION.md"
remove_file "SECURITY_QUICKSTART.md"
remove_file "SUPABASE_SECURITY.md"

# Redundant markdown docs (keep MARKDOWN_GUIDE.md)
remove_file "MARKDOWN_FEATURES_SUMMARY.md"
remove_file "MARKDOWN_TOOLBAR_REFERENCE.md"

# Redundant setup docs (keep README.md and DEPLOYMENT.md)
remove_file "QUICKSTART.md"
remove_file "PRODUCTION_SETUP.md"
remove_file "ADMIN_SETUP.md"
remove_file "ANALYTICS_SETUP.md"
remove_file "SUPABASE_SETUP.md"

# News API docs (if not using)
remove_file "README_NEWS_API.md"
remove_file "SETUP_NEWS_API.md"

# Feature docs (consolidate elsewhere)
remove_file "RELATED_LINKS_FEATURE.md"
remove_file "NEW_FEATURES.md"
remove_file "SEO_UPDATE_SUMMARY.md"
remove_file "AUTH_COMPARISON.md"

# Extra cleanup docs
remove_file "CLEANUP_README.md"

# Test files
remove_file "test-email.js"

# One-time scripts
remove_file "make-executable.sh"

# Move SQL files suggestion
echo ""
echo "📦 SQL Migration Files:"
echo "   Found SQL files in root. Consider moving to migrations/ folder:"
ls -1 *.sql 2>/dev/null | while read file; do
    echo "   - $file"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Removed $REMOVED files"
echo ""
echo "📁 Remaining docs:"
ls -1 *.md 2>/dev/null | while read file; do
    echo "   ✓ $file"
done
echo ""
echo "💡 Next steps:"
echo "   1. Review remaining docs"
echo "   2. Create docs/ folder: mkdir -p docs"
echo "   3. Move detailed guides to docs/"
echo "   4. Create migrations/ folder for SQL files"
echo "   5. Update README.md with essential info only"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
