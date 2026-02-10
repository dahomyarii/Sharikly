#!/bin/bash
# Restart Django server on VPS

echo "=== Restarting Django Server ==="

# Find and kill existing gunicorn processes
echo "1. Stopping existing gunicorn processes..."
pkill -f "gunicorn.*config.wsgi"

# Wait a moment
sleep 2

# Check if processes are stopped
if pgrep -f "gunicorn.*config.wsgi" > /dev/null; then
    echo "   ⚠ Some processes still running, force killing..."
    pkill -9 -f "gunicorn.*config.wsgi"
    sleep 1
fi

# Start gunicorn
echo "2. Starting gunicorn..."
cd /home/Sharikly/Sharikly-main/backend
source venv/bin/activate

# Start in background with nohup
nohup gunicorn --workers 3 --bind 127.0.0.1:8000 config.wsgi:application > /dev/null 2>&1 &

# Wait a moment
sleep 2

# Check if it's running
if pgrep -f "gunicorn.*config.wsgi" > /dev/null; then
    echo "   ✓ Gunicorn started successfully"
    echo "   Process:"
    ps aux | grep gunicorn | grep -v grep
else
    echo "   ✗ Failed to start gunicorn"
    echo "   Check logs for errors"
fi

echo ""
echo "=== Server Restart Complete ==="
echo "Test with: curl http://localhost:8000/api/categories/"

