#!/bin/bash

# WiredLiving Documentation Organization Script
# Moves docs into organized folders instead of deleting

set -e

echo "📁 Organizing WiredLiving Documentation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create folder structure
mkdir -p docs/{setup,security,features,markdown}
mkdir -p migrations

MOVED=0

move_file() {
    local file="$1"
    local dest="$2"
    
    if [ -f "$file" ]; then
        echo "📦 Moving: $file → $dest/"
        mv "$file" "$dest/"
        ((MOVED++))
    fi
}

echo "🗂️  Creating organized structure..."
echo ""

# Setup guides
echo "Setup Guides → docs/setup/"
move_file "ADMIN_SETUP.md" "docs/setup"
move_file "ANALYTICS_SETUP.md" "docs/setup"
move_file "PRODUCTION_SETUP.md" "docs/setup"
move_file "QUICKSTART.md" "docs/setup"
move_file "SUPABASE_SETUP.md" "docs/setup"
move_file "SETUP_NEWS_API.md" "docs/setup"
echo ""

# Security docs
echo "Security Docs → docs/security/"
move_file "SECURITY_CHECKLIST.md" "docs/security"
move_file "SECURITY_GUIDE.md" "docs/security"
move_file "SECURITY_IMPLEMENTATION.md" "docs/security"
move_file "SECURITY_QUICKSTART.md" "docs/security"
move_file "SUPABASE_SECURITY.md" "docs/security"
echo ""

# Feature docs
echo "Feature Docs → docs/features/"
move_file "NEW_FEATURES.md" "docs/features"
move_file "RELATED_LINKS_FEATURE.md" "docs/features"
move_file "README_NEWS_API.md" "docs/features"
move_file "AUTH_COMPARISON.md" "docs/features"
echo ""

# Markdown docs
echo "Markdown Docs → docs/markdown/"
move_file "MARKDOWN_GUIDE.md" "docs/markdown"
move_file "MARKDOWN_FEATURES_SUMMARY.md" "docs/markdown"
move_file "MARKDOWN_TOOLBAR_REFERENCE.md" "docs/markdown"
move_file "wiredliving_blogpost_ai_prompt.txt" "docs/markdown"
echo ""

# SEO docs
echo "SEO Docs → docs/"
move_file "SEO_GUIDE.md" "docs"
move_file "SEO_UPDATE_SUMMARY.md" "docs"
echo ""

# SQL migrations
echo "SQL Files → migrations/"
move_file "supabase-analytics-schema.sql" "migrations"
move_file "supabase-migration-add-created-by.sql" "migrations"
move_file "supabase-migration-add-related-links.sql" "migrations"
move_file "supabase-migration-add-user-id.sql" "migrations"
move_file "supabase-migration-fix-all-columns.sql" "migrations"
move_file "supabase-migration-new-features.sql" "migrations"
move_file "supabase-schema.sql" "migrations"
move_file "supabase-security-schema.sql" "migrations"
move_file "supabase-storage-setup.sql" "migrations"
echo ""

# Create index files
echo "📝 Creating index files..."
cat > docs/README.md << 'EOF'
# WiredLiving Documentation

## Setup Guides
- [Admin Setup](./setup/ADMIN_SETUP.md)
- [Analytics Setup](./setup/ANALYTICS_SETUP.md)
- [Production Setup](./setup/PRODUCTION_SETUP.md)
- [Quick Start](./setup/QUICKSTART.md)
- [Supabase Setup](./setup/SUPABASE_SETUP.md)

## Security
- [Security Guide](./security/SECURITY_GUIDE.md)
- [Security Checklist](./security/SECURITY_CHECKLIST.md)
- [Security Implementation](./security/SECURITY_IMPLEMENTATION.md)

## Features
- [New Features](./features/NEW_FEATURES.md)
- [Related Links](./features/RELATED_LINKS_FEATURE.md)

## Markdown
- [Markdown Guide](./markdown/MARKDOWN_GUIDE.md)
- [Markdown Features](./markdown/MARKDOWN_FEATURES_SUMMARY.md)

## SEO
- [SEO Guide](./SEO_GUIDE.md)
EOF

cat > migrations/README.md << 'EOF'
# Database Migrations

SQL migration files for WiredLiving blog database.

## Files
- `supabase-schema.sql` - Main database schema
- `supabase-security-schema.sql` - Security policies
- `supabase-analytics-schema.sql` - Analytics tables
- `supabase-storage-setup.sql` - Storage setup

## Migration Files
- `supabase-migration-add-created-by.sql`
- `supabase-migration-add-related-links.sql`
- `supabase-migration-add-user-id.sql`
- `supabase-migration-fix-all-columns.sql`
- `supabase-migration-new-features.sql`
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Organization complete!"
echo ""
echo "📊 Summary:"
echo "   Files moved: $MOVED"
echo ""
echo "📁 New structure:"
echo "   docs/"
echo "   ├── setup/          (setup guides)"
echo "   ├── security/       (security docs)"
echo "   ├── features/       (feature docs)"
echo "   ├── markdown/       (markdown guides)"
echo "   └── README.md       (documentation index)"
echo ""
echo "   migrations/         (SQL migration files)"
echo ""
echo "📄 Root directory now contains only:"
ls -1 *.md 2>/dev/null | while read file; do
    echo "   ✓ $file"
done
echo ""
echo "💡 Consider keeping only these in root:"
echo "   - README.md"
echo "   - CONTRIBUTING.md"
echo "   - LICENSE"
echo "   - DEPLOYMENT.md"
echo "   - TROUBLESHOOTING.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
