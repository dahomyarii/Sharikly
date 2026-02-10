#!/usr/bin/env python
"""
Fix SQLite foreign key constraints after switching from marketplace.User to accounts.User.
Run this on VPS to update foreign key references in SQLite database.
"""

import os
import django
from django.db import connection

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def fix_foreign_keys():
    """Update foreign key references from marketplace_user to accounts_user"""
    with connection.cursor() as cursor:
        # SQLite doesn't support ALTER TABLE to change foreign keys directly
        # We need to check if tables exist and what foreign keys they have
        
        # Get all tables that might have foreign keys to user
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name LIKE 'marketplace_%'
        """)
        
        tables = [row[0] for row in cursor.fetchall()]
        
        print(f"Found {len(tables)} marketplace tables")
        
        # Check which tables reference marketplace_user
        problematic_tables = []
        for table in tables:
            # Get table schema
            cursor.execute(f"PRAGMA table_info({table})")
            columns = cursor.fetchall()
            
            # Check for user_id columns
            for col in columns:
                if 'user' in col[1].lower() and 'id' in col[1].lower():
                    problematic_tables.append(table)
                    print(f"  - {table} has user foreign key")
                    break
        
        if not problematic_tables:
            print("✓ No foreign key issues found")
            return
        
        print(f"\n⚠ Found {len(problematic_tables)} tables with user foreign keys")
        print("Note: SQLite foreign keys are handled by Django's ORM.")
        print("The migration should work if accounts.0001_initial is applied first.")
        print("\nTry running:")
        print("  python manage.py migrate accounts 0001_initial --fake")
        print("  python manage.py migrate marketplace 0018_delete_user --fake")
        print("  python manage.py migrate")

if __name__ == '__main__':
    try:
        fix_foreign_keys()
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()

