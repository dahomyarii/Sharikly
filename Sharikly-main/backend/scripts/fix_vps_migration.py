#!/usr/bin/env python
"""
Fix migration history on VPS by directly inserting the accounts.0001_initial migration record.
Run this script on your VPS to fix the inconsistent migration history.
"""

import os
import logging
import django
from django.db import connection
from django.utils import timezone

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)

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
            logger.info("✓ accounts.0001_initial migration already exists")
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
        
        logger.info("✓ Successfully inserted accounts.0001_initial migration record")
        logger.info("✓ You can now run: python manage.py migrate")

if __name__ == '__main__':
    try:
        fix_migration()
    except Exception:
        logger.exception("✗ Error")
        logger.info("Troubleshooting:")
        logger.info("1. Make sure you're in the backend directory")
        logger.info("2. Make sure virtual environment is activated")
        logger.info("3. Check your database connection settings")

