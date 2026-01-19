#!/bin/bash

# WiredLiving Documentation & File Cleanup
# Identifies and removes redundant/unnecessary files

set -e

echo "📚 WiredLiving Documentation & File Cleanup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

REMOVED_COUNT=0

# Function to prompt for removal
ask_remove() {
    local file="$1"
    local reason="$2"
    
    if [ -f "$file" ]; then
        echo -e "${YELLOW}❓ Remove: $file${NC}"
        echo "   Reason: $reason"
        read -p "   Delete? (y/n): " -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm "$file"
            echo -e "${GREEN}   ✓ Removed${NC}"
            ((REMOVED_COUNT++))
        else
            echo "   ⊘ Skipped"
        fi
        echo ""
    fi
}

# Function to auto-remove (for obvious candidates)
auto_remove() {
    local file="$1"
    local reason="$2"
    
    if [ -f "$file" ]; then
        echo -e "${RED}🗑️  Auto-removing: $file${NC}"
        echo "   Reason: $reason"
        rm "$file"
        ((REMOVED_COUNT++))
        echo -e "${GREEN}   ✓ Removed${NC}"
        echo ""
    fi
}

echo "🔍 Scanning for redundant documentation..."
echo ""

# === REDUNDANT/DUPLICATE DOCS ===
echo "━━━ Redundant Documentation ━━━"
echo ""

# Multiple security guides - probably can consolidate
ask_remove "SECURITY_CHECKLIST.md" "Likely duplicates SECURITY_GUIDE.md"
ask_remove "SECURITY_IMPLEMENTATION.md" "Consolidate with SECURITY_GUIDE.md"
ask_remove "SECURITY_QUICKSTART.md" "Consolidate with SECURITY_GUIDE.md"

# Multiple Supabase setup docs
ask_remove "SUPABASE_SECURITY.md" "Likely covered in SECURITY_GUIDE.md"
ask_remove "SUPABASE_SETUP.md" "Should be in main README or docs folder"

# Multiple markdown guides
ask_remove "MARKDOWN_FEATURES_SUMMARY.md" "Duplicate of MARKDOWN_GUIDE.md"
ask_remove "MARKDOWN_TOOLBAR_REFERENCE.md" "Should be in MARKDOWN_GUIDE.md"

# Multiple setup guides
ask_remove "QUICKSTART.md" "Should be in README.md"
ask_remove "PRODUCTION_SETUP.md" "Consolidate with DEPLOYMENT.md"
ask_remove "ADMIN_SETUP.md" "Should be in DEPLOYMENT.md or docs folder"
ask_remove "ANALYTICS_SETUP.md" "Should be in DEPLOYMENT.md or docs folder"

# News API docs (if not using News API)
ask_remove "README_NEWS_API.md" "Remove if not using News API"
ask_remove "SETUP_NEWS_API.md" "Remove if not using News API"

# Feature-specific docs (could go in docs folder)
ask_remove "RELATED_LINKS_FEATURE.md" "Move to docs/ folder or remove"
ask_remove "NEW_FEATURES.md" "Use CHANGELOG.md instead"
ask_remove "SEO_UPDATE_SUMMARY.md" "Consolidate with SEO_GUIDE.md"
ask_remove "AUTH_COMPARISON.md" "Temporary doc, probably not needed"

# Recently created cleanup docs (might want to consolidate)
ask_remove "CLEANUP_README.md" "Info is in cleanup.sh comments"

echo ""
echo "━━━ SQL Migration Files ━━━"
echo ""

# SQL files that should probably be in a migrations folder
ask_remove "supabase-analytics-schema.sql" "Move to migrations/ folder or remove if applied"
ask_remove "supabase-migration-add-created-by.sql" "Move to migrations/ folder or remove if applied"
ask_remove "supabase-migration-add-related-links.sql" "Move to migrations/ folder or remove if applied"
ask_remove "supabase-migration-add-user-id.sql" "Move to migrations/ folder or remove if applied"
ask_remove "supabase-migration-fix-all-columns.sql" "Move to migrations/ folder or remove if applied"
ask_remove "supabase-migration-new-features.sql" "Move to migrations/ folder or remove if applied"
ask_remove "supabase-schema.sql" "Move to migrations/ folder or keep main schema"
ask_remove "supabase-security-schema.sql" "Move to migrations/ folder or remove if applied"
ask_remove "supabase-storage-setup.sql" "Move to migrations/ folder or remove if applied"

echo ""
echo "━━━ Miscellaneous Files ━━━"
echo ""

ask_remove "test-email.js" "Test file - should not be in production repo"
ask_remove "wiredliving_blogpost_ai_prompt.txt" "Move to docs/ or .github/ folder"
ask_remove "make-executable.sh" "One-time use script"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✨ Cleanup complete!${NC}"
echo ""
echo "📊 Summary:"
echo "   Files removed: $REMOVED_COUNT"
echo ""
echo "💡 Recommendations:"
echo "   1. Create a docs/ folder for detailed documentation"
echo "   2. Create a migrations/ folder for SQL files"
echo "   3. Keep only essential docs in root (README.md, CONTRIBUTING.md, LICENSE)"
echo "   4. Use CHANGELOG.md for feature updates"
echo "   5. Consolidate similar guides (security, setup, etc.)"
echo ""
echo "🔍 Check what's left:"
echo "   ls -1 *.md *.sql *.txt 2>/dev/null || echo 'All clean!'"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
