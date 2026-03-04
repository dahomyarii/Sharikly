#!/usr/bin/env python
"""
Diagnostic script to check backend issues after switching to accounts.User
Run this on VPS to identify problems.
"""

import os
import logging
import django

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
from django.contrib.auth import get_user_model
from marketplace.models import Listing, Category

User = get_user_model()

def check_backend():
    logger.info("=== Backend Diagnostic Check ===\n")
    
    # Check User model
    logger.info("1. Checking User model...")
    try:
        user_count = User.objects.count()
        logger.info("   ✓ User model works: %s users found", user_count)
    except Exception as e:
        logger.exception("   ✗ User model error")
        return
    
    # Check Listings
    logger.info("\n2. Checking Listings...")
    try:
        listing_count = Listing.objects.count()
        logger.info("   ✓ Listings model works: %s listings found", listing_count)
        
        # Check if listings can access owner
        if listing_count > 0:
            first_listing = Listing.objects.first()
            try:
                owner = first_listing.owner
                logger.info("   ✓ Listing owner access works: %s", owner.email)
            except Exception:
                logger.exception("   ✗ Listing owner access error")
    except Exception:
        logger.exception("   ✗ Listings error")
    
    # Check Categories
    logger.info("\n3. Checking Categories...")
    try:
        category_count = Category.objects.count()
        logger.info("   ✓ Categories work: %s categories found", category_count)
    except Exception:
        logger.exception("   ✗ Categories error")
    
    # Check database foreign keys
    logger.info("\n4. Checking database foreign keys...")
    with connection.cursor() as cursor:
        # Check if marketplace_user table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='marketplace_user'
        """)
        if cursor.fetchone():
            logger.warning("   ⚠ marketplace_user table still exists (should be accounts_user)")
        
        # Check if accounts_user table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='accounts_user'
        """)
        if cursor.fetchone():
            logger.info("   ✓ accounts_user table exists")
        else:
            logger.error("   ✗ accounts_user table NOT found!")
    
    # Check serialization
    logger.info("\n5. Testing serialization...")
    try:
        from marketplace.serializers import ListingSerializer, UserSerializer
        from rest_framework.test import APIRequestFactory
        
        factory = APIRequestFactory()
        request = factory.get('/')
        
        if Listing.objects.exists():
            listing = Listing.objects.first()
            serializer = ListingSerializer(listing, context={'request': request})
            data = serializer.data
            logger.info("   ✓ Listing serialization works")
            logger.info("   ✓ Owner in serialized data: %s", data.get('owner') is not None)
        else:
            logger.warning("   ⚠ No listings to test serialization")
    except Exception:
        logger.exception("   ✗ Serialization error")
    
    logger.info("\n=== Diagnostic Complete ===")

if __name__ == '__main__':
    check_backend()

