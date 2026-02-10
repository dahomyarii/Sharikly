#!/usr/bin/env python
"""
Fix migration history on VPS by directly inserting the accounts.0001_initial migration record.
Run this script on your VPS to fix the inconsistent migration history.
"""

import os
import django
from django.db import connection
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def fix_migration():
    """Insert accounts.0001_initial migration record directly into database"""
    with connection.cursor() as cursor:
        # Check if migration already exists
        cursor.execute("""
            SELECT * FROM django_migrations 
            WHERE app = 'accounts' AND name = '0001_initial'
        """)
        
        if cursor.fetchone():
            print("✓ accounts.0001_initial migration already exists")
            return
        
        # Get current timestamp
        now = timezone.now()
        
        # Insert the migration record
        # For PostgreSQL
        if 'postgresql' in connection.settings_dict['ENGINE']:
            cursor.execute("""
                INSERT INTO django_migrations (app, name, applied)
                VALUES (%s, %s, %s)
            """, ['accounts', '0001_initial', now])
        # For SQLite
        else:
            cursor.execute("""
                INSERT INTO django_migrations (app, name, applied)
                VALUES (?, ?, ?)
            """, ['accounts', '0001_initial', now])
        
        print("✓ Successfully inserted accounts.0001_initial migration record")
        print("✓ You can now run: python manage.py migrate")

if __name__ == '__main__':
    try:
        fix_migration()
    except Exception as e:
        print(f"✗ Error: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure you're in the backend directory")
        print("2. Make sure virtual environment is activated")
        print("3. Check your database connection settings")

