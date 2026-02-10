# VPS Migration Fix - Direct Database Insert

## Problem
Django won't let you fake the migration because it checks history first. We need to directly insert the migration record into the database.

## Solution: Use Python Script

Run this on your VPS:

```bash
cd /home/Sharikly/Sharikly-main/backend
source venv/bin/activate
python fix_vps_migration.py
```

Then run migrations normally:

```bash
python manage.py migrate
```

## Alternative: Manual Database Insert

If the script doesn't work, you can manually insert the record using Django's shell:

```bash
cd /home/Sharikly/Sharikly-main/backend
source venv/bin/activate
python manage.py shell
```

Then in the Python shell:

```python
from django.db import connection
from django.utils import timezone
from django.core.management import call_command

# Insert migration record
with connection.cursor() as cursor:
    cursor.execute("""
        INSERT INTO django_migrations (app, name, applied)
        VALUES (%s, %s, %s)
    """, ['accounts', '0001_initial', timezone.now()])

print("Migration record inserted!")
exit()
```

Then run:
```bash
python manage.py migrate
```

## What This Does

- Directly inserts the `accounts.0001_initial` migration record into `django_migrations` table
- Bypasses Django's migration history check
- Safe because the User table already exists
- Allows Django to continue with normal migrations
