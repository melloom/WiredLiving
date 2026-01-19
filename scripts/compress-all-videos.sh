#!/bin/bash
# Batch compress all videos in a directory

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Batch Video Compressor${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $# -eq 0 ]; then
    echo -e "${YELLOW}Usage: ./compress-all-videos.sh <directory> [quality]${NC}"
    echo ""
    echo "Examples:"
    echo "  ./compress-all-videos.sh ./public/videos"
    echo "  ./compress-all-videos.sh ./videos medium"
    echo "  ./compress-all-videos.sh ./raw-footage small"
    echo ""
    echo "Quality: high, medium (default), small, tiny"
    exit 1
fi

DIR="$1"
QUALITY="${2:-medium}"

if [ ! -d "$DIR" ]; then
    echo -e "${RED}Error: Directory '$DIR' not found${NC}"
    exit 1
fi

# Find all video files
VIDEO_FILES=$(find "$DIR" -type f \( -iname "*.mp4" -o -iname "*.mov" -o -iname "*.avi" -o -iname "*.mkv" -o -iname "*.webm" -o -iname "*.m4v" \) ! -name "*-compressed*")

if [ -z "$VIDEO_FILES" ]; then
    echo -e "${YELLOW}No video files found in $DIR${NC}"
    exit 0
fi

COUNT=$(echo "$VIDEO_FILES" | wc -l)
echo -e "${GREEN}Found $COUNT video(s) to compress${NC}"
echo ""

CURRENT=0
while IFS= read -r video; do
    CURRENT=$((CURRENT + 1))
    echo -e "${BLUE}[$CURRENT/$COUNT] Processing: $(basename "$video")${NC}"
    ./scripts/compress-video.sh "$video" "$QUALITY"
    echo ""
done <<< "$VIDEO_FILES"

echo -e "${GREEN}✓ All videos compressed!${NC}"
