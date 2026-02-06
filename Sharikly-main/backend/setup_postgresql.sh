#!/bin/bash

# PostgreSQL Setup Script for EKRA Project
# Run this script on your VPS as root or with sudo

echo "=========================================="
echo "PostgreSQL Setup for EKRA Project"
echo "=========================================="

# Step 1: Install PostgreSQL
echo "Step 1: Installing PostgreSQL..."
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Step 2: Start and enable PostgreSQL
echo "Step 2: Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Step 3: Create database and user
echo "Step 3: Creating database and user..."
echo "Please enter a strong password for the database user:"
read -s DB_PASSWORD

sudo -u postgres psql <<EOF
CREATE DATABASE ekra_db;
CREATE USER ekra_user WITH PASSWORD '$DB_PASSWORD';
ALTER ROLE ekra_user SET client_encoding TO 'utf8';
ALTER ROLE ekra_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE ekra_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE ekra_db TO ekra_user;
\q
EOF

# Step 4: Configure PostgreSQL
echo "Step 4: Configuring PostgreSQL..."
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses =
 'localhost'/" /etc/postgresql/*/main/postgresql.conf

# Step 5: Restart PostgreSQL
echo "Step 5: Restarting PostgreSQL..."
sudo systemctl restart postgresql

# Step 6: Verify installation
echo "Step 6: Verifying installation..."
sudo systemctl status postgresql --no-pager

echo ""
echo "=========================================="
echo "PostgreSQL setup complete!"
echo "=========================================="
echo ""
echo "Database Name: ekra_db"
echo "Database User: ekra_user"
echo "Database Password: [The password you entered]"
echo ""
echo "Add these to your .env file:"
echo "DB_ENGINE=postgresql"
echo "DB_NAME=ekra_db"
echo "DB_USER=ekra_user"
echo "DB_PASSWORD=$DB_PASSWORD"
echo "DB_HOST=localhost"
echo "DB_PORT=5432"
echo ""
echo "Next steps:"
echo "1. Add the above variables to your backend/.env file"
echo "2. Run: python manage.py migrate"
echo "3. Run: python manage.py createsuperuser (optional)"
echo ""




