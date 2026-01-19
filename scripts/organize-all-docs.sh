#!/bin/bash

echo "📁 Organizing ALL WiredLiving Documentation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create folder structure
mkdir -p docs/{setup,security,features,markdown,guides}

echo ""
echo "📦 Moving Setup Guides → docs/setup/"
mv QUICKSTART.md docs/setup/ 2>/dev/null && echo "  ✓ QUICKSTART.md"
mv SUPABASE_SETUP.md docs/setup/ 2>/dev/null && echo "  ✓ SUPABASE_SETUP.md"
mv SETUP_NEWS_API.md docs/setup/ 2>/dev/null && echo "  ✓ SETUP_NEWS_API.md"

echo ""
echo "🔒 Moving Security Docs → docs/security/"
mv SECURITY_GUIDE.md docs/security/ 2>/dev/null && echo "  ✓ SECURITY_GUIDE.md"
mv SUPABASE_SECURITY.md docs/security/ 2>/dev/null && echo "  ✓ SUPABASE_SECURITY.md"

echo ""
echo "✨ Moving Feature Docs → docs/features/"
mv NEW_FEATURES.md docs/features/ 2>/dev/null && echo "  ✓ NEW_FEATURES.md"
mv RELATED_LINKS_FEATURE.md docs/features/ 2>/dev/null && echo "  ✓ RELATED_LINKS_FEATURE.md"
mv README_NEWS_API.md docs/features/ 2>/dev/null && echo "  ✓ README_NEWS_API.md"
mv AUTH_COMPARISON.md docs/features/ 2>/dev/null && echo "  ✓ AUTH_COMPARISON.md"

echo ""
echo "📝 Moving Markdown Docs → docs/markdown/"
mv MARKDOWN_GUIDE.md docs/markdown/ 2>/dev/null && echo "  ✓ MARKDOWN_GUIDE.md"
mv MARKDOWN_FEATURES_SUMMARY.md docs/markdown/ 2>/dev/null && echo "  ✓ MARKDOWN_FEATURES_SUMMARY.md"
mv MARKDOWN_TOOLBAR_REFERENCE.md docs/markdown/ 2>/dev/null && echo "  ✓ MARKDOWN_TOOLBAR_REFERENCE.md"
mv wiredliving_blogpost_ai_prompt.txt docs/markdown/ 2>/dev/null && echo "  ✓ wiredliving_blogpost_ai_prompt.txt"

echo ""
echo "📖 Moving General Guides → docs/guides/"
mv SEO_GUIDE.md docs/guides/ 2>/dev/null && echo "  ✓ SEO_GUIDE.md"
mv SEO_UPDATE_SUMMARY.md docs/guides/ 2>/dev/null && echo "  ✓ SEO_UPDATE_SUMMARY.md"
mv DEPLOYMENT.md docs/guides/ 2>/dev/null && echo "  ✓ DEPLOYMENT.md"
mv TROUBLESHOOTING.md docs/guides/ 2>/dev/null && echo "  ✓ TROUBLESHOOTING.md"
mv CLEANUP_GUIDE.md docs/guides/ 2>/dev/null && echo "  ✓ CLEANUP_GUIDE.md"
mv CLEANUP_README.md docs/guides/ 2>/dev/null && echo "  ✓ CLEANUP_README.md"

echo ""
echo "✅ Documentation organized!"
echo ""
echo "📂 Structure:"
echo "   docs/setup/        - Setup and installation guides"
echo "   docs/security/     - Security documentation"
echo "   docs/features/     - Feature documentation"
echo "   docs/markdown/     - Markdown editor guides"
echo "   docs/guides/       - General guides (SEO, deployment, etc.)"
echo "   migrations/        - SQL migration files"
