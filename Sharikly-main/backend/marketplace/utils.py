from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.conf import settings
from django.core.mail import EmailMessage
import os


class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    """Token generator for email verification"""
    pass


email_verification_token = EmailVerificationTokenGenerator()


def send_verification_email(user):
    """
    Send email verification email to user using Amazon SES.
    
    Args:
        user: User instance to send verification email to
    """
    # Generate token
    token = email_verification_token.make_token(user)
    
    # Encode user ID
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    # Get frontend URL from settings or use default
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    verify_url = f"{frontend_url}/verify-email?uid={uid}&token={token}"
    
    # Email subject and body (plain text)
    subject = "Verify your email address"
    message = f"""Hello {user.username or user.email},

Please verify your email address by clicking the link below:

{verify_url}

If you did not create an account, please ignore this email.

Thank you,
Sharikly Team
"""
    
    # Send email using Amazon SES via django-anymail
    email = EmailMessage(
        subject=subject,
        body=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    email.send()

