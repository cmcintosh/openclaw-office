#!/bin/bash
# OpenClaw Office — launch script
# Starts the Vite dev server and opens the browser

DIR="/Volumes/Extreme Pro/Documents/openclaw-office"
PORT=8843

cd "$DIR" || { echo "Cannot find $DIR"; exit 1; }

# Check if already running
if lsof -ti:$PORT >/dev/null 2>&1; then
  echo "Office already running on port $PORT"
  open "http://localhost:$PORT/"
  exit 0
fi

# Install deps if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the server
echo "Starting OpenClaw Office on port $PORT..."
npx vite --host 0.0.0.0 --port $PORT &
SERVER_PID=$!

# Wait for it to be ready
sleep 3

# Open browser
open "http://localhost:$PORT/"

echo ""
echo "  Local:   http://localhost:$PORT/"
echo "  Network: http://$(ipconfig getifaddr en1 2>/dev/null || ipconfig getifaddr en0 2>/dev/null || echo 'localhost'):$PORT/"
echo ""
echo "  Press Ctrl+C to stop."
echo "  PID: $SERVER_PID"

wait $SERVER_PID