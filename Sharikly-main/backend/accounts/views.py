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

