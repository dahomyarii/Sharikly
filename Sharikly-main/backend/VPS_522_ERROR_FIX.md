# Fix 522 Error (Cloudflare Origin Timeout)

## What is 522 Error?
522 means Cloudflare can't reach your origin server. The Django server is either:
- Not running
- Not accessible on the expected port
- Blocked by firewall
- Timing out

## Quick Checks

### 1. Check if Django Server is Running

```bash
# Check for running Django processes
ps aux | grep manage.py
ps aux | grep gunicorn
ps aux | grep uwsgi

# Or check what's listening on port 8000
netstat -tuln | grep 8000
# or
ss -tuln | grep 8000
```

### 2. Test Local Connection

```bash
# Test if server responds locally
curl http://localhost:8000/api/categories/

# Or if using different port
curl http://127.0.0.1:8000/api/categories/
```

### 3. Check Nginx/Reverse Proxy

If you're using Nginx as reverse proxy:

```bash
# Check nginx status
systemctl status nginx

# Check nginx config
cat /etc/nginx/sites-available/default
# or
cat /etc/nginx/conf.d/default.conf

# Test nginx config
nginx -t

# Restart nginx if needed
systemctl restart nginx
```

### 4. Check Firewall

```bash
# Check if port is open
ufw status
# or
iptables -L

# If needed, allow port 8000
ufw allow 8000
```

## Common Solutions

### Solution 1: Start Django Server

If server is not running:

```bash
cd /home/Sharikly/Sharikly-main/backend
source venv/bin/activate

# For development
python manage.py runserver 0.0.0.0:8000

# For production (using gunicorn)
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

### Solution 2: Check Nginx Configuration

Your Nginx should proxy to `http://127.0.0.1:8000` or `http://localhost:8000`:

```nginx
location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Solution 3: Check Process Manager

If using systemd, supervisor, or PM2:

```bash
# Systemd
systemctl status your-service-name

# Supervisor
supervisorctl status

# PM2
pm2 list
```

### Solution 4: Increase Timeout

If server is slow to respond, increase Cloudflare timeout or check server performance.

## Quick Diagnostic Script

Run this to check everything:

```bash
cd /home/Sharikly/Sharikly-main/backend
chmod +x check_server_status.sh
./check_server_status.sh
```

## Most Likely Issue

The Django server is probably **not running**. Start it with:

```bash
cd /home/Sharikly/Sharikly-main/backend
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

Or if using a production server:

```bash
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

