"""
Migration fix script for switching from marketplace.User to accounts.User

Run this script to fix the inconsistent migration history.
This will mark the accounts.0001_initial migration as applied without running it,
since the User table already exists in the database.
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

def fix_migrations():
    with connection.cursor() as cursor:
        # Check if accounts_migration table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='django_migrations'
        """)
        
        if cursor.fetchone():
            # Check if accounts.0001_initial is already recorded
            cursor.execute("""
                SELECT * FROM django_migrations 
                WHERE app='accounts' AND name='0001_initial'
            """)
            
            if not cursor.fetchone():
                # Insert the accounts.0001_initial migration as applied
                cursor.execute("""
                    INSERT INTO django_migrations (app, name, applied)
                    VALUES ('accounts', '0001_initial', datetime('now'))
                """)
                print("✓ Marked accounts.0001_initial as applied")
            else:
                print("✓ accounts.0001_initial already recorded")
        else:
            print("✗ django_migrations table not found")

if __name__ == '__main__':
    fix_migrations()
    print("\nNow you can run: python manage.py migrate")

