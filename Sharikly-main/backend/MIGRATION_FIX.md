# Fixing Migration History After Switching to accounts.User

## Problem
The database was migrated with `marketplace.User`, but now we're using `accounts.User`. This causes an inconsistent migration history error.

## Solution Options

### Option 1: Fake the Migration (Recommended for Development)
Since the User table already exists, we can mark the accounts migration as applied without running it:

```bash
cd backend
python manage.py migrate accounts 0001_initial --fake
```

Then continue with normal migrations:
```bash
python manage.py migrate
```

### Option 2: Reset Database (If you can lose data)
If this is a development environment and you don't need the existing data:

```bash
cd backend
# Delete the database file
rm db.sqlite3  # On Windows: del db.sqlite3

# Remove migration files (optional, to start fresh)
# rm -r accounts/migrations
# rm -r marketplace/migrations

# Create fresh migrations
python manage.py makemigrations
python manage.py migrate
```

### Option 3: Use the Fix Script
Run the provided fix script:

```bash
cd backend
python fix_migrations.py
python manage.py migrate
```

## After Fixing

Once migrations are fixed, you should be able to:
1. Run the server: `python manage.py runserver`
2. Create new users with email verification
3. Use the accounts.User model throughout the application

## Important Notes

- If you have production data, use Option 1 (fake migration)
- If you're in development, Option 2 (reset) is simplest
- The User table structure should be compatible since we kept the same fields

