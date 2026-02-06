# Quick VPS PostgreSQL Setup Commands

Copy and paste these commands on your VPS to set up PostgreSQL.

## Complete Setup (Copy All at Once)

```bash
# 1. Install PostgreSQL
sudo apt update && sudo apt install postgresql postgresql-contrib -y

# 2. Start PostgreSQL
sudo systemctl start postgresql && sudo systemctl enable postgresql

# 3. Create database and user (replace YOUR_PASSWORD with a strong password)
sudo -u postgres psql <<EOF
CREATE DATABASE ekra_db;
CREATE USER ekra_user WITH PASSWORD 'YOUR_PASSWORD_HERE';
ALTER ROLE ekra_user SET client_encoding TO 'utf8';
ALTER ROLE ekra_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE ekra_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE ekra_db TO ekra_user;
\q
EOF

# 4. Configure PostgreSQL for local connections
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/*/main/postgresql.conf

# 5. Restart PostgreSQL
sudo systemctl restart postgresql

# 6. Verify it's running
sudo systemctl status postgresql
```

## After Setup - Update Your .env File

Add these lines to your `backend/.env` file:

```env
DB_ENGINE=postgresql
DB_NAME=ekra_db
DB_USER=ekra_user
DB_PASSWORD=YOUR_PASSWORD_HERE
DB_HOST=localhost
DB_PORT=5432
```

## Run Django Migrations

```bash
cd /path/to/your/backend
source venv/bin/activate  # if using virtual environment
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # optional
```

## Verify Database Connection

```bash
python manage.py dbshell
# Should connect to PostgreSQL. Type \q to exit
```

## Useful PostgreSQL Commands

```bash
# Connect to database
sudo -u postgres psql -d ekra_db

# List all databases
sudo -u postgres psql -l

# List all users
sudo -u postgres psql -c "\du"

# Backup database
sudo -u postgres pg_dump ekra_db > backup_$(date +%Y%m%d).sql

# Restore database
sudo -u postgres psql ekra_db < backup_file.sql

# Check PostgreSQL version
sudo -u postgres psql -c "SELECT version();"
```

## Troubleshooting

### Fix permission issues:
```bash
sudo -u postgres psql -d ekra_db <<EOF
GRANT ALL PRIVILEGES ON DATABASE ekra_db TO ekra_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ekra_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ekra_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ekra_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ekra_user;
\q
EOF
```

### Check PostgreSQL logs:
```bash
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

### Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```




