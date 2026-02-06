# PostgreSQL Setup Guide for VPS

This guide will help you set up PostgreSQL on your VPS and configure Django to use it.

## Step 1: Install PostgreSQL on VPS

```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check PostgreSQL status
sudo systemctl status postgresql
```

## Step 2: Create PostgreSQL Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside PostgreSQL prompt, run these commands:
CREATE DATABASE ekra_db;
CREATE USER ekra_user WITH PASSWORD 'YOUR_STRONG_PASSWORD_HERE';
ALTER ROLE ekra_user SET client_encoding TO 'utf8';
ALTER ROLE ekra_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE ekra_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE ekra_db TO ekra_user;
\q
```

**Important:** Replace `YOUR_STRONG_PASSWORD_HERE` with a strong password. Save this password securely!

## Step 3: Configure PostgreSQL for Remote Access (Optional)

If you need to access PostgreSQL from outside the VPS:

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/*/main/postgresql.conf

# Find and uncomment/modify:
listen_addresses = 'localhost'  # or '*' for all interfaces (less secure)

# Edit pg_hba.conf for authentication
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Add this line (adjust IP range as needed):
host    ekra_db    ekra_user    0.0.0.0/0    md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

## Step 4: Update Environment Variables

Add these to your `.env` file in the backend directory:

```bash
# Database Configuration
DB_ENGINE=postgresql
DB_NAME=ekra_db
DB_USER=ekra_user
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE
DB_HOST=localhost
DB_PORT=5432
```

## Step 5: Run Django Migrations

```bash
# Navigate to backend directory
cd /path/to/your/backend

# Activate virtual environment (if using one)
source venv/bin/activate  # or your venv path

# Install/update requirements
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser
```

## Step 6: Verify Database Connection

```bash
# Test database connection
python manage.py dbshell

# You should see PostgreSQL prompt. Type \q to exit
```

## Troubleshooting

### If you get "peer authentication failed":
```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Change this line:
local   all             all                                     peer
# To:
local   all             all                                     md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### If you get "permission denied":
```bash
# Make sure the user has proper permissions
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE ekra_db TO ekra_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ekra_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ekra_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ekra_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ekra_user;
\q
```

### Check PostgreSQL logs:
```bash
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

## Security Notes

1. **Use strong passwords** for database users
2. **Limit access** - Only allow connections from trusted IPs
3. **Use SSL** for remote connections in production
4. **Regular backups** - Set up automated backups
5. **Firewall** - Only open PostgreSQL port (5432) if necessary

## Backup and Restore

### Create Backup:
```bash
sudo -u postgres pg_dump ekra_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Backup:
```bash
sudo -u postgres psql ekra_db < backup_file.sql
```

## Quick Commands Reference

```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Stop PostgreSQL
sudo systemctl stop postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check PostgreSQL version
sudo -u postgres psql -c "SELECT version();"

# List all databases
sudo -u postgres psql -l

# Connect to database
sudo -u postgres psql -d ekra_db

# List all users
sudo -u postgres psql -c "\du"
```




