# Fix Missing accounts_user Table on VPS

## Problem
The `accounts_user` table doesn't exist in the database, causing all User-related operations to fail.

## Solution

### Option 1: Use the Fix Script (Recommended)

Run this on your VPS:

```bash
cd /home/Sharikly/Sharikly-main/backend
source venv/bin/activate
python create_accounts_user_table.py
python manage.py migrate
```

This script will:
1. Check for existing user tables
2. Create `accounts_user` table by copying structure from `marketplace_user`
3. Copy all user data
4. Copy indexes

### Option 2: Manual SQLite Fix

If the script doesn't work, manually create the table:

```bash
cd /home/Sharikly/Sharikly-main/backend
source venv/bin/activate
python manage.py dbshell
```

Then in SQLite shell:

```sql
-- Create accounts_user table by copying structure
CREATE TABLE accounts_user AS SELECT * FROM marketplace_user WHERE 1=0;

-- Copy all data
INSERT INTO accounts_user SELECT * FROM marketplace_user;

-- Verify
SELECT COUNT(*) FROM accounts_user;
.exit
```

Then run:
```bash
python manage.py migrate accounts 0001_initial --fake
python manage.py migrate
```

### Option 3: Fresh Migration (If you can lose data)

```bash
cd /home/Sharikly/Sharikly-main/backend
source venv/bin/activate

# Delete database
rm db.sqlite3

# Create fresh
python manage.py migrate
```

## After Fixing

Test that it works:

```bash
python manage.py shell
```

```python
from django.contrib.auth import get_user_model
User = get_user_model()
print(f"Users: {User.objects.count()}")
```

## Why This Happened

The accounts migration wasn't applied because:
1. The database already had `marketplace_user` table
2. Django saw a conflict and didn't create `accounts_user`
3. We need to manually create it or copy from existing table

