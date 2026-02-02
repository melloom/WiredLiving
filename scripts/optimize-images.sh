#!/bin/bash
# Image Optimization Script for WiredLiving Blog
# Compresses images and converts to WebP for maximum savings

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   WiredLiving Image Optimizer${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $# -eq 0 ]; then
    echo -e "${YELLOW}Usage: ./optimize-images.sh <input-image> [quality]${NC}"
    echo ""
    echo "Examples:"
    echo "  ./optimize-images.sh photo.jpg"
    echo "  ./optimize-images.sh photo.png 80"
    echo ""
    echo "Quality: 1-100 (default: 85)"
    exit 1
fi

INPUT="$1"
QUALITY="${2:-85}"

if [ ! -f "$INPUT" ]; then
    echo -e "${RED}Error: File '$INPUT' not found${NC}"
    exit 1
fi

FILENAME=$(basename "$INPUT")
NAME="${FILENAME%.*}"
EXT="${FILENAME##*.}"
DIR=$(dirname "$INPUT")

OUTPUT_WEBP="$DIR/${NAME}.webp"
OUTPUT_OPTIMIZED="$DIR/${NAME}-optimized.${EXT}"

ORIGINAL_SIZE=$(du -h "$INPUT" | cut -f1)

echo -e "${GREEN}Input:${NC} $INPUT"
echo -e "${GREEN}Original size:${NC} $ORIGINAL_SIZE"
echo ""

# Check for image optimization tools
if command -v cwebp &> /dev/null; then
    echo -e "${YELLOW}Converting to WebP...${NC}"
    cwebp -q $QUALITY "$INPUT" -o "$OUTPUT_WEBP" 2>/dev/null
    if [ -f "$OUTPUT_WEBP" ]; then
        WEBP_SIZE=$(du -h "$OUTPUT_WEBP" | cut -f1)
        echo -e "${GREEN}✓ WebP created:${NC} $OUTPUT_WEBP (${WEBP_SIZE})"
    fi
else
    echo -e "${YELLOW}cwebp not installed - skipping WebP conversion${NC}"
    echo -e "Install: ${BLUE}sudo apt-get install webp${NC} or ${BLUE}brew install webp${NC}"
fi

# Optimize original format
if command -v ffmpeg &> /dev/null; then
    echo -e "${YELLOW}Optimizing ${EXT}...${NC}"
    if [[ "$EXT" == "jpg" || "$EXT" == "jpeg" ]]; then
        ffmpeg -i "$INPUT" -q:v 3 -y "$OUTPUT_OPTIMIZED" -hide_banner -loglevel error
    elif [[ "$EXT" == "png" ]]; then
        ffmpeg -i "$INPUT" -compression_level 9 -y "$OUTPUT_OPTIMIZED" -hide_banner -loglevel error
    fi
    
    if [ -f "$OUTPUT_OPTIMIZED" ]; then
        OPT_SIZE=$(du -h "$OUTPUT_OPTIMIZED" | cut -f1)
        echo -e "${GREEN}✓ Optimized:${NC} $OUTPUT_OPTIMIZED (${OPT_SIZE})"
    fi
fi

echo ""
echo -e "${GREEN}✓ Optimization complete!${NC}"
echo ""
