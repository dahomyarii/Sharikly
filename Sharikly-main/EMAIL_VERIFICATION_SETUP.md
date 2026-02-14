# Email Verification MVP Setup Guide

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
pip install django-anymail==11.0.0
```

Or install all requirements:
```bash
pip install -r requirements.txt
```

### 2. Create Migration
```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. Configure Environment Variables
Add these to your `backend/.env` file:

```env
# Amazon SES Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_SES_REGION=us-east-1

# Email Configuration
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
FRONTEND_URL=http://localhost:3000
```

**Important:** 
- Replace `your_aws_access_key_id` and `your_aws_secret_access_key` with your actual AWS credentials
- Replace `noreply@yourdomain.com` with a verified email address in Amazon SES
- Update `FRONTEND_URL` to your production domain when deploying

### 4. Verify Email in Amazon SES
Before sending emails, you must verify your sender email address in Amazon SES:
1. Go to AWS Console → Amazon SES
2. Verify your email address (or domain)
3. Move out of SES Sandbox mode if you want to send to unverified emails

## Frontend Setup

No additional setup required. The verify-email page is already created at:
- `frontend_v2/app/verify-email/page.tsx`

## How It Works

### Registration Flow
1. User registers → Account created with `is_email_verified=False`
2. Verification email sent automatically via Amazon SES
3. User receives email with verification link
4. User clicks link → Redirected to `/verify-email?uid=XXX&token=YYY`
5. Frontend calls `/api/auth/verify-email/` endpoint
6. Backend verifies token and sets `is_email_verified=True`
7. User can now log in

### Login Flow
1. User attempts to log in
2. Backend checks `is_email_verified` status
3. If `False` → Login blocked with error message
4. If `True` → Login succeeds

## API Endpoints

### POST `/api/auth/register/`
Creates user account and sends verification email.

**Response:** User object with `is_email_verified: false`

### GET `/api/auth/verify-email/?uid=XXX&token=YYY`
Verifies email address using token.

**Success Response:**
```json
{
  "message": "Email verified successfully"
}
```

**Error Response:**
```json
{
  "error": "Invalid or expired verification token"
}
```

### POST `/api/auth/token/`
Login endpoint. Blocks unverified users.

**Error Response (unverified user):**
```json
{
  "detail": "Please verify your email address before logging in. Check your inbox for the verification email."
}
```

## Files Modified/Created

### Backend
- `backend/requirements.txt` - Added django-anymail
- `backend/marketplace/models.py` - Added `is_email_verified` field
- `backend/marketplace/utils.py` - Token generator and email sending function
- `backend/marketplace/views.py` - Updated RegisterView, CustomTokenObtainPairView, added VerifyEmailView
- `backend/marketplace/serializers.py` - Added `is_email_verified` to UserSerializer
- `backend/marketplace/urls.py` - Added verify-email route
- `backend/config/settings.py` - Configured Amazon SES

### Frontend
- `frontend_v2/app/verify-email/page.tsx` - Verification page
- `frontend_v2/components/SignupModal.tsx` - Removed auto-login
- `frontend_v2/app/auth/signup/page.tsx` - Removed auto-login

## Testing

### Local testing (no real email)

When `DEBUG=1`, the backend uses Django’s **console** email backend. The verification link is not sent by email; it is printed in the terminal where the Django server is running.

1. **Start backend and frontend**
   - Backend: `cd backend && python manage.py runserver`
   - Frontend: `cd frontend_v2 && npm run dev`
2. **Register a new user** (e.g. on signup page).
3. **In the backend terminal**, find the log that looks like:
   ```
   Content-Type: text/plain; charset="utf-8"
   ...
   http://localhost:3000/verify-email?uid=...&token=...
   ```
4. **Copy that full URL** and open it in your browser (or click if your terminal supports links).
5. You should see “Email verified!” and then redirect to login.
6. **Login** with the same user → should succeed.

To use real email (SES) locally, set `USE_CONSOLE_EMAIL=0` in `backend/.env`.

### Production-style testing (real email)

1. Register a new user
2. Check email inbox for verification email
3. Click verification link
4. Should see success message and redirect to login
5. Try logging in before verification → Should be blocked
6. Try logging in after verification → Should succeed

## Notes

- Tokens expire after 7 days (Django default for PasswordResetTokenGenerator)
- Email sending is synchronous (no Celery/background tasks)
- Plain text emails only (no HTML templates)
- No resend functionality (MVP only)
- Frontend URL is configurable via `FRONTEND_URL` environment variable

