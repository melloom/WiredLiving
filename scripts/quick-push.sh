#!/bin/bash

# Interactive git add, commit, and push script
# Usage: ./scripts/quick-push.sh

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}   Quick Git Push Script${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Show current status
echo -e "${YELLOW}📊 Current status:${NC}"
git status --short
echo ""

# Ask for commit message
echo -e "${BLUE}📝 Enter your commit message:${NC}"
read COMMIT_MESSAGE

if [ -z "$COMMIT_MESSAGE" ]; then
    echo -e "${RED}❌ No commit message provided. Aborting.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📦 Staging all changes...${NC}"
git add -A

echo -e "${BLUE}💾 Committing with message: \"$COMMIT_MESSAGE\"${NC}"
git commit -m "$COMMIT_MESSAGE"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Commit failed${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 Pushing to origin main...${NC}"
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Successfully pushed to git!${NC}"
    echo ""
else
    echo -e "${RED}❌ Push failed${NC}"
    exit 1
fi
