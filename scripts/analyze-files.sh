#!/bin/bash

# Quick file analysis - shows what you have

echo "📊 WiredLiving Repository Analysis"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📝 Markdown Files in Root:"
md_count=$(ls -1 *.md 2>/dev/null | wc -l)
echo "   Total: $md_count files"
ls -1 *.md 2>/dev/null | while read f; do
    size=$(du -h "$f" | cut -f1)
    echo "   - $f ($size)"
done

echo ""
echo "🗄️  SQL Files in Root:"
sql_count=$(ls -1 *.sql 2>/dev/null | wc -l)
echo "   Total: $sql_count files"
ls -1 *.sql 2>/dev/null | while read f; do
    size=$(du -h "$f" | cut -f1)
    echo "   - $f ($size)"
done

echo ""
echo "🔧 Script Files:"
sh_count=$(ls -1 *.sh 2>/dev/null | wc -l)
echo "   Total: $sh_count files"
ls -1 *.sh 2>/dev/null | while read f; do
    echo "   - $f"
done

echo ""
echo "📦 Other Files in Root:"
other=$(ls -1 *.txt *.js 2>/dev/null | wc -l)
if [ $other -gt 0 ]; then
    ls -1 *.txt *.js 2>/dev/null | while read f; do
        size=$(du -h "$f" | cut -f1)
        echo "   - $f ($size)"
    done
else
    echo "   None"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary:"
echo "   Markdown docs: $md_count"
echo "   SQL files: $sql_count"
echo "   Shell scripts: $sh_count"
echo "   Other files: $other"
total=$((md_count + sql_count + sh_count + other))
echo "   ─────────────────"
echo "   Total files: $total"
echo ""
echo "💡 Recommendations:"
if [ $md_count -gt 5 ]; then
    echo "   ⚠️  You have $md_count markdown files in root"
    echo "      Consider running: ./organize-docs.sh"
fi
if [ $sql_count -gt 0 ]; then
    echo "   ⚠️  You have $sql_count SQL files in root"
    echo "      Consider moving to: migrations/"
fi
if [ $sh_count -gt 3 ]; then
    echo "   ℹ️  You have $sh_count shell scripts"
    echo "      Consider moving to: scripts/"
fi
echo ""
echo "🎯 Quick Actions:"
echo "   • Organize docs:  ./organize-docs.sh"
echo "   • Remove redundant: ./cleanup-docs-auto.sh"
echo "   • Manual cleanup: ./cleanup-docs.sh"
echo "   • Build cleanup: ./cleanup.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
