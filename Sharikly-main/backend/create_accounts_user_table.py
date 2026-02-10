#!/usr/bin/env python
"""
Create accounts_user table on VPS by copying structure from existing user table.
Run this on VPS to fix the missing accounts_user table issue.
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
from django.core.management import call_command

def create_accounts_user_table():
    """Create accounts_user table by copying from existing user table"""
    with connection.cursor() as cursor:
        # Check what user tables exist
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND (name LIKE '%user%' OR name LIKE '%User%')
        """)
        tables = [row[0] for row in cursor.fetchall()]
        print(f"Found user-related tables: {tables}")
        
        # Check if accounts_user exists
        if 'accounts_user' in tables:
            print("✓ accounts_user table already exists")
            return
        
        # Check if marketplace_user exists
        if 'marketplace_user' in tables:
            print("⚠ Found marketplace_user table")
            print("Creating accounts_user table by copying structure...")
            
            # Get the structure of marketplace_user
            cursor.execute("PRAGMA table_info(marketplace_user)")
            columns = cursor.fetchall()
            
            # Create accounts_user table with same structure
            # SQLite CREATE TABLE statement
            column_defs = []
            for col in columns:
                col_name = col[1]
                col_type = col[2]
                not_null = "NOT NULL" if col[3] else ""
                default = f"DEFAULT {col[4]}" if col[4] is not None else ""
                pk = "PRIMARY KEY" if col[5] else ""
                
                col_def = f"{col_name} {col_type}"
                if pk:
                    col_def += " PRIMARY KEY AUTOINCREMENT"
                elif not_null:
                    col_def += " NOT NULL"
                if default and not pk:
                    col_def += f" {default}"
                
                column_defs.append(col_def)
            
            create_sql = f"""
                CREATE TABLE IF NOT EXISTS accounts_user (
                    {', '.join(column_defs)}
                )
            """
            
            cursor.execute(create_sql)
            
            # Copy data from marketplace_user to accounts_user
            cursor.execute("SELECT COUNT(*) FROM marketplace_user")
            count = cursor.fetchone()[0]
            
            if count > 0:
                print(f"Copying {count} users from marketplace_user to accounts_user...")
                cursor.execute("""
                    INSERT INTO accounts_user 
                    SELECT * FROM marketplace_user
                """)
                print(f"✓ Copied {count} users")
            
            # Copy indexes
            cursor.execute("""
                SELECT sql FROM sqlite_master 
                WHERE type='index' AND tbl_name='marketplace_user'
            """)
            indexes = cursor.fetchall()
            for idx in indexes:
                if idx[0]:
                    # Replace marketplace_user with accounts_user in index SQL
                    idx_sql = idx[0].replace('marketplace_user', 'accounts_user')
                    try:
                        cursor.execute(idx_sql)
                    except:
                        pass  # Index might already exist
            
            print("✓ accounts_user table created successfully")
        else:
            print("✗ No existing user table found")
            print("You need to run: python manage.py migrate accounts")

if __name__ == '__main__':
    try:
        create_accounts_user_table()
        print("\n✓ Table creation complete!")
        print("Now run: python manage.py migrate")
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()

