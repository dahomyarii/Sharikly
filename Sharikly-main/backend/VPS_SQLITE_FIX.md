# Fix SQLite Foreign Key Issue on VPS

## Problem
Migration `0018_delete_user` is trying to delete the User model, but foreign keys still reference `marketplace_user`. Since we're using SQLite, we need to handle this carefully.

## Solution: Fake the Migration

Since the User table is now in `accounts` (not `marketplace`), we should fake the delete migration:

```bash
cd /home/Sharikly/Sharikly-main/backend
source venv/bin/activate

# Fake the delete migration (we're not actually deleting, User is in accounts now)
python manage.py migrate marketplace 0018_delete_user --fake

# Then run remaining migrations
python manage.py migrate
```

## Alternative: If Fake Doesn't Work

If the fake command fails, you can manually update the migration record:

```bash
cd /home/Sharikly/Sharikly-main/backend
source venv/bin/activate
python manage.py shell
```

Then in Python shell:

```python
from django.db import connection
from django.utils import timezone

with connection.cursor() as cursor:
    # Mark 0018_delete_user as applied
    cursor.execute("""
        INSERT INTO django_migrations (app, name, applied)
        VALUES (?, ?, ?)
    """, ['marketplace', '0018_delete_user', timezone.now()])
    print("Migration marked as applied!")

exit()
```

Then run:
```bash
python manage.py migrate
```

## Why This Works

- The User table is already in `accounts_user` (from accounts.0001_initial)
- The `marketplace_user` table might still exist but isn't used
- Foreign keys in models use `get_user_model()` so they point to `accounts_user`
- We just need to mark the delete migration as applied without actually running it

