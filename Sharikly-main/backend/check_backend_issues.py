#!/usr/bin/env python
"""
Diagnostic script to check backend issues after switching to accounts.User
Run this on VPS to identify problems.
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
from django.contrib.auth import get_user_model
from marketplace.models import Listing, Category

User = get_user_model()

def check_backend():
    print("=== Backend Diagnostic Check ===\n")
    
    # Check User model
    print("1. Checking User model...")
    try:
        user_count = User.objects.count()
        print(f"   ✓ User model works: {user_count} users found")
    except Exception as e:
        print(f"   ✗ User model error: {e}")
        return
    
    # Check Listings
    print("\n2. Checking Listings...")
    try:
        listing_count = Listing.objects.count()
        print(f"   ✓ Listings model works: {listing_count} listings found")
        
        # Check if listings can access owner
        if listing_count > 0:
            first_listing = Listing.objects.first()
            try:
                owner = first_listing.owner
                print(f"   ✓ Listing owner access works: {owner.email}")
            except Exception as e:
                print(f"   ✗ Listing owner access error: {e}")
    except Exception as e:
        print(f"   ✗ Listings error: {e}")
    
    # Check Categories
    print("\n3. Checking Categories...")
    try:
        category_count = Category.objects.count()
        print(f"   ✓ Categories work: {category_count} categories found")
    except Exception as e:
        print(f"   ✗ Categories error: {e}")
    
    # Check database foreign keys
    print("\n4. Checking database foreign keys...")
    with connection.cursor() as cursor:
        # Check if marketplace_user table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='marketplace_user'
        """)
        if cursor.fetchone():
            print("   ⚠ marketplace_user table still exists (should be accounts_user)")
        
        # Check if accounts_user table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='accounts_user'
        """)
        if cursor.fetchone():
            print("   ✓ accounts_user table exists")
        else:
            print("   ✗ accounts_user table NOT found!")
    
    # Check serialization
    print("\n5. Testing serialization...")
    try:
        from marketplace.serializers import ListingSerializer, UserSerializer
        from rest_framework.test import APIRequestFactory
        
        factory = APIRequestFactory()
        request = factory.get('/')
        
        if Listing.objects.exists():
            listing = Listing.objects.first()
            serializer = ListingSerializer(listing, context={'request': request})
            data = serializer.data
            print(f"   ✓ Listing serialization works")
            print(f"   ✓ Owner in serialized data: {data.get('owner') is not None}")
        else:
            print("   ⚠ No listings to test serialization")
    except Exception as e:
        print(f"   ✗ Serialization error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n=== Diagnostic Complete ===")

if __name__ == '__main__':
    check_backend()

