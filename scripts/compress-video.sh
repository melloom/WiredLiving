#!/bin/bash
# Video Compression Script for WiredLiving Blog
# Automatically compresses videos to web-optimized size (saves 80-90% storage)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   WiredLiving Video Compressor${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}Error: ffmpeg is not installed${NC}"
    echo ""
    echo "Install ffmpeg:"
    echo "  Ubuntu/Debian: sudo apt-get install ffmpeg"
    echo "  Mac: brew install ffmpeg"
    echo "  Windows: Download from https://ffmpeg.org"
    exit 1
fi

# Check if input file is provided
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}Usage: ./compress-video.sh <input-video> [quality]${NC}"
    echo ""
    echo "Examples:"
    echo "  ./compress-video.sh my-video.mp4"
    echo "  ./compress-video.sh my-video.mp4 high"
    echo "  ./compress-video.sh my-video.mov medium"
    echo "  ./compress-video.sh my-video.avi small"
    echo ""
    echo "Quality options:"
    echo "  high   - Best quality (CRF 20, 1080p) - Larger file"
    echo "  medium - Balanced (CRF 23, 1080p) - Recommended (default)"
    echo "  small  - Smaller file (CRF 28, 720p) - Good quality"
    echo "  tiny   - Smallest file (CRF 30, 720p) - Lower quality"
    exit 1
fi

INPUT="$1"
QUALITY="${2:-medium}"

# Check if input file exists
if [ ! -f "$INPUT" ]; then
    echo -e "${RED}Error: File '$INPUT' not found${NC}"
    exit 1
fi

# Get filename without extension
FILENAME=$(basename "$INPUT")
NAME="${FILENAME%.*}"
DIR=$(dirname "$INPUT")

# Output filename
OUTPUT_MP4="$DIR/${NAME}-compressed.mp4"
OUTPUT_WEBM="$DIR/${NAME}-compressed.webm"

# Get original file size
ORIGINAL_SIZE=$(du -h "$INPUT" | cut -f1)

echo -e "${GREEN}Input file:${NC} $INPUT"
echo -e "${GREEN}Original size:${NC} $ORIGINAL_SIZE"
echo -e "${GREEN}Quality preset:${NC} $QUALITY"
echo ""

# Set quality parameters based on preset
case $QUALITY in
    high)
        CRF=20
        SCALE="1920:-2"
        BITRATE="5M"
        AUDIO_BITRATE="192k"
        echo -e "${BLUE}→ Using HIGH quality (1080p, CRF 20)${NC}"
        ;;
    medium)
        CRF=23
        SCALE="1920:-2"
        BITRATE="3M"
        AUDIO_BITRATE="128k"
        echo -e "${BLUE}→ Using MEDIUM quality (1080p, CRF 23) [Recommended]${NC}"
        ;;
    small)
        CRF=28
        SCALE="1280:-2"
        BITRATE="1.5M"
        AUDIO_BITRATE="96k"
        echo -e "${BLUE}→ Using SMALL quality (720p, CRF 28)${NC}"
        ;;
    tiny)
        CRF=30
        SCALE="1280:-2"
        BITRATE="1M"
        AUDIO_BITRATE="96k"
        echo -e "${BLUE}→ Using TINY quality (720p, CRF 30)${NC}"
        ;;
    *)
        echo -e "${RED}Invalid quality preset: $QUALITY${NC}"
        echo "Use: high, medium, small, or tiny"
        exit 1
        ;;
esac

echo ""
echo -e "${YELLOW}Compressing to MP4...${NC}"

# Compress to MP4 (H.264)
ffmpeg -i "$INPUT" \
    -c:v libx264 \
    -crf $CRF \
    -preset medium \
    -vf "scale=$SCALE" \
    -c:a aac \
    -b:a $AUDIO_BITRATE \
    -movflags +faststart \
    -y \
    "$OUTPUT_MP4" \
    -hide_banner \
    -loglevel error \
    -stats

if [ -f "$OUTPUT_MP4" ]; then
    MP4_SIZE=$(du -h "$OUTPUT_MP4" | cut -f1)
    echo -e "${GREEN}✓ MP4 created:${NC} $OUTPUT_MP4 (${MP4_SIZE})"
else
    echo -e "${RED}✗ Failed to create MP4${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Compressing to WebM (optional, better compression)...${NC}"

# Compress to WebM (VP9) - even smaller file size
ffmpeg -i "$INPUT" \
    -c:v libvpx-vp9 \
    -crf $CRF \
    -b:v 0 \
    -vf "scale=$SCALE" \
    -c:a libopus \
    -b:a 96k \
    -y \
    "$OUTPUT_WEBM" \
    -hide_banner \
    -loglevel error \
    -stats 2>/dev/null || echo -e "${YELLOW}  (WebM encoding skipped - VP9 codec not available)${NC}"

if [ -f "$OUTPUT_WEBM" ]; then
    WEBM_SIZE=$(du -h "$OUTPUT_WEBM" | cut -f1)
    echo -e "${GREEN}✓ WebM created:${NC} $OUTPUT_WEBM (${WEBM_SIZE})"
fi

# Calculate compression ratio
ORIGINAL_BYTES=$(stat -f%z "$INPUT" 2>/dev/null || stat -c%s "$INPUT" 2>/dev/null)
COMPRESSED_BYTES=$(stat -f%z "$OUTPUT_MP4" 2>/dev/null || stat -c%s "$OUTPUT_MP4" 2>/dev/null)
RATIO=$(echo "scale=1; (1 - $COMPRESSED_BYTES / $ORIGINAL_BYTES) * 100" | bc 2>/dev/null || echo "?")

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Compression complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Original:   $ORIGINAL_SIZE"
echo -e "Compressed: $MP4_SIZE (MP4)"
if [ -f "$OUTPUT_WEBM" ]; then
    echo -e "            $WEBM_SIZE (WebM)"
fi
if [ "$RATIO" != "?" ]; then
    echo -e "Savings:    ${GREEN}${RATIO}%${NC}"
fi
echo ""
echo -e "${YELLOW}Usage in blog post:${NC}"
echo ""
echo '<video controls width="100%" class="rounded-lg my-4">'
echo "  <source src=\"/videos/${NAME}-compressed.mp4\" type=\"video/mp4\" />"
if [ -f "$OUTPUT_WEBM" ]; then
    echo "  <source src=\"/videos/${NAME}-compressed.webm\" type=\"video/webm\" />"
fi
echo '  Your browser does not support the video tag.'
echo '</video>'
echo ""
