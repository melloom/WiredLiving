#!/bin/bash

echo "Moving SQL files to migrations folder..."
mv supabase-*.sql migrations/
echo "✓ Done! SQL files organized in migrations/"
ls -1 migrations/*.sql
