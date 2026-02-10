# VPS Backend Issues Fix

## Issues Found
1. ✅ Fixed: Missing `email_verification_token` import in VerifyEmailView
2. ✅ Fixed: Indentation issue in ReviewSerializer.validate_rating
3. ⚠️ Need to check: Signup and listings endpoints

## Quick Fixes Applied

### 1. Fixed Import Issue
- Added `from accounts.tokens import email_verification_token` to marketplace/views.py

### 2. Fixed Serializer Indentation
- Fixed `validate_rating` method indentation in ReviewSerializer

## Diagnostic Steps

Run this on your VPS to check what's wrong:

```bash
cd /home/Sharikly/Sharikly-main/backend
source venv/bin/activate
python check_backend_issues.py
```

## Common Issues & Solutions

### Issue 1: Signup Failing
**Possible causes:**
- Email sending error breaking the response
- User creation failing
- Serialization error

**Check:**
```bash
# Check backend logs for errors
tail -f /path/to/your/logs

# Or check Django logs in terminal where server is running
```

**Fix:** The code already handles email errors gracefully, but check if user creation is actually succeeding.

### Issue 2: Listings Not Showing
**Possible causes:**
- Foreign key constraint issues
- Serialization errors in ListingSerializer
- Database query errors

**Check:**
```bash
python manage.py shell
```

Then in shell:
```python
from marketplace.models import Listing
from marketplace.serializers import ListingSerializer
from rest_framework.test import APIRequestFactory

# Test if listings can be queried
listings = Listing.objects.all()
print(f"Found {listings.count()} listings")

# Test serialization
if listings.exists():
    factory = APIRequestFactory()
    request = factory.get('/')
    listing = listings.first()
    serializer = ListingSerializer(listing, context={'request': request})
    print(serializer.data)
```

### Issue 3: Database Foreign Key Issues
If listings have foreign keys pointing to old `marketplace_user`:

```bash
python manage.py shell
```

```python
from django.db import connection

# Check foreign key constraints
with connection.cursor() as cursor:
    cursor.execute("PRAGMA foreign_key_check")
    errors = cursor.fetchall()
    if errors:
        print("Foreign key errors:", errors)
    else:
        print("No foreign key errors")
```

## Quick Test Endpoints

Test these endpoints directly:

```bash
# Test categories (should work)
curl http://your-domain/api/categories/

# Test listings (check for errors)
curl http://your-domain/api/listings/

# Test signup
curl -X POST http://your-domain/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"test123"}'
```

## If Issues Persist

1. **Check server logs** for actual error messages
2. **Run diagnostic script**: `python check_backend_issues.py`
3. **Test in Django shell** to isolate the problem
4. **Check database** for foreign key constraint violations

