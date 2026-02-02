#!/bin/bash

# Clean Next.js build and cache
echo "Cleaning Next.js build and cache..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .next/cache

# Kill any running Next.js dev servers
echo "Stopping any running dev servers..."
pkill -f "next dev" || true

echo "✅ Clean complete! Run 'npm run dev' to start fresh."


