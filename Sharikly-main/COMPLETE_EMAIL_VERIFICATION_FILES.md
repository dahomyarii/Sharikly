# Complete MVP Email Verification Implementation

All required files have been created. Here's the complete file structure:

## Backend Files Created

### 1. `backend/accounts/__init__.py`
```python
# accounts app
```

### 2. `backend/accounts/apps.py`
```python
from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'
```

### 3. `backend/accounts/models.py`
```python
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    email = models.EmailField(unique=True)
    is_email_verified = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]
```

### 4. `backend/accounts/tokens.py`
```python
from django.contrib.auth.tokens import PasswordResetTokenGenerator


class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        return f"{user.pk}{timestamp}{user.is_email_verified}"


email_verification_token = EmailVerificationTokenGenerator()
```

### 5. `backend/accounts/views.py`
```python
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.http import JsonResponse
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
import os

from .tokens import email_verification_token

User = get_user_model()


def send_verification_email(user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = email_verification_token.make_token(user)

    frontend_url = os.getenv("FRONTEND_URL", "https://ekra.app")
    verify_url = f"{frontend_url}/verify-email?uid={uid}&token={token}"

    send_mail(
        subject="Verify your email",
        message=f"Click this link to verify your email:\n{verify_url}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
    )


def verify_email(request):
    uid = request.GET.get("uid")
    token = request.GET.get("token")

    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except:
        return JsonResponse({"error": "Invalid link"}, status=400)

    if email_verification_token.check_token(user, token):
        user.is_email_verified = True
        user.save()
        return JsonResponse({"success": True})

    return JsonResponse({"error": "Token expired or invalid"}, status=400)
```

### 6. `backend/accounts/urls.py`
```python
from django.urls import path
from .views import verify_email

urlpatterns = [
    path("verify-email/", verify_email, name="verify-email"),
]
```

### 7. `backend/accounts/admin.py`
```python
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class UserAdmin(UserAdmin):
    list_display = ('email', 'username', 'is_email_verified', 'is_staff', 'is_active')
    list_filter = ('is_email_verified', 'is_staff', 'is_active')
```

### 8. `backend/config/settings.py` (Updated sections)
```python
# Installed apps
INSTALLED_APPS = [
    # ... other apps ...
    "anymail",
    "accounts",  # Added
    "marketplace",
]

# User model
AUTH_USER_MODEL = "accounts.User"

# Email Configuration (Amazon SES)
EMAIL_BACKEND = "anymail.backends.amazon_ses.EmailBackend"

ANYMAIL = {
    "AMAZON_SES_CLIENT_PARAMS": {
        "region_name": os.getenv("AWS_SES_REGION", "eu-west-1"),
    },
}

DEFAULT_FROM_EMAIL = "Ekra <noreply@ekra.app>"
SERVER_EMAIL = DEFAULT_FROM_EMAIL
```

### 9. `backend/config/urls.py` (Updated)
```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),  # Added
    path('api/', include('marketplace.urls')),
]
```

### 10. `backend/accounts/signup_example.py`
Shows how to integrate `send_verification_email` in your signup flow.

## Frontend Files

### 11. `frontend_v2/app/verify-email/page.tsx`
Complete TypeScript/Next.js page for email verification.

## Setup Instructions

1. **Install dependencies:**
   ```bash
   cd backend
   pip install django-anymail
   ```

2. **Create migrations:**
   ```bash
   python manage.py makemigrations accounts
   python manage.py migrate
   ```

3. **Environment variables (.env):**
   ```env
   AWS_SES_REGION=eu-west-1
   FRONTEND_URL=https://ekra.app
   ```

4. **Verify email in Amazon SES:**
   - Go to AWS Console → Amazon SES
   - Verify `noreply@ekra.app` email address

## Usage in Signup Flow

```python
from django.contrib.auth import get_user_model
from accounts.views import send_verification_email

User = get_user_model()

# In your registration view:
user = User.objects.create_user(
    username=username,
    email=email,
    password=password,
    is_email_verified=False,
)

send_verification_email(user)
```

## API Endpoint

**GET** `/api/verify-email/?uid=XXX&token=YYY`

- Success: `{"success": True}`
- Error: `{"error": "Invalid link"}` or `{"error": "Token expired or invalid"}`

## All Files Summary

✅ `backend/accounts/__init__.py`
✅ `backend/accounts/apps.py`
✅ `backend/accounts/models.py`
✅ `backend/accounts/tokens.py`
✅ `backend/accounts/views.py`
✅ `backend/accounts/urls.py`
✅ `backend/accounts/admin.py`
✅ `backend/config/settings.py` (updated)
✅ `backend/config/urls.py` (updated)
✅ `backend/accounts/signup_example.py`
✅ `frontend_v2/app/verify-email/page.tsx`

All files are complete and ready to use!

