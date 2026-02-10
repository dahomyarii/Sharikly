#!/bin/bash
# Fix migration history on VPS after switching from marketplace.User to accounts.User

cd /home/Sharikly/Sharikly-main/backend

# Activate virtual environment if needed
source venv/bin/activate

# Fake the accounts.0001_initial migration since User table already exists
python manage.py migrate accounts 0001_initial --fake

# Now run normal migrations
python manage.py migrate

echo "Migration fix complete!"

