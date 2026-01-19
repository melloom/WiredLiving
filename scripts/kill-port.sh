#!/bin/bash

# Kill any process running on port 3000
PORT=3000

echo "Checking for processes on port $PORT..."

# Find and kill processes on the port
PID=$(lsof -ti:$PORT 2>/dev/null)

if [ -z "$PID" ]; then
  echo "No process found on port $PORT"
else
  echo "Killing process $PID on port $PORT..."
  kill -9 $PID 2>/dev/null
  sleep 1
  echo "Port $PORT is now free"
fi


