# Restart Django Server on VPS

## Quick Restart

Run this script to restart the server:

```bash
cd /home/Sharikly/Sharikly-main/backend
chmod +x restart_server.sh
./restart_server.sh
```

## Manual Restart

If the script doesn't work, do it manually:

```bash
cd /home/Sharikly/Sharikly-main/backend
source venv/bin/activate

# 1. Kill existing gunicorn processes
pkill -f "gunicorn.*config.wsgi"

# 2. Wait a moment
sleep 2

# 3. Start gunicorn
nohup gunicorn --workers 3 --bind 127.0.0.1:8000 config.wsgi:application > /dev/null 2>&1 &

# 4. Verify it's running
ps aux | grep gunicorn
```

## Using PM2 (If you have it)

```bash
pm2 restart all
# or
pm2 restart your-app-name
```

## Using Systemd (If configured)

```bash
systemctl restart your-django-service
```

## Test After Restart

```bash
# Test locally
curl http://localhost:8000/api/categories/

# Test signup
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"test123"}'
```

## What Was Fixed

1. ✅ Fixed `IndentationError` in `marketplace/serializers.py` - `validate_rating` method
2. ✅ Server should now start without errors

After restarting, the server should work properly!

