#!/bin/bash

# Quick git add, commit, and push script
# Usage: ./scripts/git-push.sh "Your commit message"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if commit message is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: No commit message provided${NC}"
    echo "Usage: ./scripts/git-push.sh \"Your commit message\""
    exit 1
fi

COMMIT_MESSAGE="$1"

echo -e "${BLUE}📦 Staging all changes...${NC}"
git add -A

echo -e "${BLUE}📝 Committing changes...${NC}"
git commit -m "$COMMIT_MESSAGE"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Commit failed${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 Pushing to origin main...${NC}"
git push origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully pushed to git!${NC}"
else
    echo -e "${RED}❌ Push failed${NC}"
    exit 1
fi
