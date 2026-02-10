#!/bin/bash
# Check if Django server is running and accessible

echo "=== Server Status Check ==="

# Check if process is running
echo "1. Checking if Django process is running..."
if pgrep -f "manage.py runserver" > /dev/null || pgrep -f "gunicorn" > /dev/null || pgrep -f "uwsgi" > /dev/null; then
    echo "   ✓ Django server process found"
    ps aux | grep -E "manage.py|gunicorn|uwsgi" | grep -v grep
else
    echo "   ✗ No Django server process found"
    echo "   You need to start the server"
fi

# Check if port is listening
echo -e "\n2. Checking if port 8000 is listening..."
if netstat -tuln | grep -q ":8000" || ss -tuln | grep -q ":8000"; then
    echo "   ✓ Port 8000 is listening"
else
    echo "   ✗ Port 8000 is not listening"
fi

# Check local connection
echo -e "\n3. Testing local connection..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/categories/ | grep -q "200\|404"; then
    echo "   ✓ Server responds locally"
else
    echo "   ✗ Server does not respond locally"
fi

# Check if behind reverse proxy
echo -e "\n4. Checking reverse proxy configuration..."
if [ -f /etc/nginx/sites-available/default ] || [ -f /etc/nginx/conf.d/default.conf ]; then
    echo "   ✓ Nginx configuration found"
    echo "   Check nginx status: systemctl status nginx"
else
    echo "   ⚠ No nginx config found (might be using different setup)"
fi

echo -e "\n=== Check Complete ==="

