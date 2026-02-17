from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from django.http import JsonResponse
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
import os

from .tokens import email_verification_token, password_reset_token

User = get_user_model()


def _build_verification_html(username, verify_url):
    """Build a modern black & white HTML verification email."""
    display_name = username or "there"
    return f"""\
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;min-height:100vh;">
    <tr>
      <td align="center" valign="top" style="padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          <!-- Spacer -->
          <tr><td style="height:80px;"></td></tr>

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:0 40px 48px;">
              <h2 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">
                EKRA
              </h2>
            </td>
          </tr>

          <!-- Thin line -->
          <tr>
            <td style="padding:0 60px;">
              <div style="height:1px;background-color:#222222;"></div>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding:48px 40px 0;">
              <h1 style="margin:0 0 12px;color:#ffffff;font-size:32px;font-weight:700;letter-spacing:-0.5px;text-align:center;">
                Verify your email
              </h1>
              <p style="margin:0 0 36px;color:#888888;font-size:15px;line-height:24px;text-align:center;">
                One quick step to get started
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:0 40px;">
              <p style="margin:0 0 16px;color:#cccccc;font-size:15px;line-height:26px;">
                Hi <strong style="color:#ffffff;">{display_name}</strong>,
              </p>
              <p style="margin:0 0 36px;color:#888888;font-size:15px;line-height:26px;">
                Thanks for joining <strong style="color:#cccccc;">Ekra</strong>. Tap the button below to confirm your email address and activate your account.
              </p>
            </td>
          </tr>

          <!-- Button -->
          <tr>
            <td align="center" style="padding:0 40px 40px;">
              <a href="{verify_url}"
                 style="display:inline-block;background-color:#ffffff;color:#000000;text-decoration:none;font-size:14px;font-weight:700;padding:16px 48px;border-radius:8px;letter-spacing:0.5px;text-transform:uppercase;">
                Verify Email
              </a>
            </td>
          </tr>

          <!-- Fallback link -->
          <tr>
            <td style="padding:0 40px;">
              <p style="margin:0 0 8px;color:#555555;font-size:12px;line-height:18px;text-align:center;">
                Or copy this link into your browser:
              </p>
              <p style="margin:0 0 48px;word-break:break-all;font-size:12px;line-height:20px;text-align:center;">
                <a href="{verify_url}" style="color:#888888;text-decoration:underline;">{verify_url}</a>
              </p>
            </td>
          </tr>

          <!-- Thin line -->
          <tr>
            <td style="padding:0 60px;">
              <div style="height:1px;background-color:#222222;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px 80px;text-align:center;">
              <p style="margin:0 0 8px;color:#444444;font-size:12px;line-height:18px;">
                Didn't create an account? Just ignore this email.
              </p>
              <p style="margin:0;color:#333333;font-size:11px;line-height:18px;letter-spacing:1px;text-transform:uppercase;">
                &copy; Ekra &middot; ekra.app
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_verification_email(user):
    """Send a verification email with a beautiful HTML template."""
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = email_verification_token.make_token(user)

    frontend_url = os.getenv("FRONTEND_URL", "https://ekra.app")
    verify_url = f"{frontend_url}/verify-email?uid={uid}&token={token}"

    subject = "Verify your email — Ekra"
    plain_text = (
        f"Hi {user.username or user.email},\n\n"
        f"Thanks for joining Ekra! "
        f"Please verify your email by visiting:\n\n{verify_url}\n\n"
        f"If you didn't create an account, ignore this email.\n\n"
        f"— Ekra Team"
    )
    html_body = _build_verification_html(user.username or user.email, verify_url)

    # Use "Ekra <address>" as the display name
    from_email = f"Ekra <{settings.DEFAULT_FROM_EMAIL}>"

    email = EmailMultiAlternatives(
        subject=subject,
        body=plain_text,
        from_email=from_email,
        to=[user.email],
    )
    email.attach_alternative(html_body, "text/html")
    email.send()


def verify_email(request):
    uid = request.GET.get("uid")
    token = request.GET.get("token")

    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except Exception:
        return JsonResponse({"error": "Invalid link"}, status=400)

    if email_verification_token.check_token(user, token):
        user.is_email_verified = True
        user.save()
        return JsonResponse({"success": True})

    return JsonResponse({"error": "Token expired or invalid"}, status=400)


def _build_reset_html(username, reset_url):
    """Build Ekra-style HTML for password reset email."""
    display_name = username or "there"
    return f"""\
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;min-height:100vh;">
    <tr>
      <td align="center" valign="top" style="padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
          <tr><td style="height:80px;"></td></tr>
          <tr>
            <td align="center" style="padding:0 40px 48px;">
              <h2 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">EKRA</h2>
            </td>
          </tr>
          <tr><td style="padding:0 60px;"><div style="height:1px;background-color:#222222;"></div></td></tr>
          <tr>
            <td style="padding:48px 40px 0;">
              <h1 style="margin:0 0 12px;color:#ffffff;font-size:32px;font-weight:700;letter-spacing:-0.5px;text-align:center;">Reset your password</h1>
              <p style="margin:0 0 36px;color:#888888;font-size:15px;line-height:24px;text-align:center;">Use the link below to set a new password.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;">
              <p style="margin:0 0 16px;color:#cccccc;font-size:15px;line-height:26px;">Hi <strong style="color:#ffffff;">{display_name}</strong>,</p>
              <p style="margin:0 0 36px;color:#888888;font-size:15px;line-height:26px;">You asked to reset your password on <strong style="color:#cccccc;">Ekra</strong>. Tap the button below to choose a new password.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 40px 40px;">
              <a href="{reset_url}" style="display:inline-block;background-color:#ffffff;color:#000000;text-decoration:none;font-size:14px;font-weight:700;padding:16px 48px;border-radius:8px;letter-spacing:0.5px;text-transform:uppercase;">Reset Password</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;">
              <p style="margin:0 0 8px;color:#555555;font-size:12px;line-height:18px;text-align:center;">Or copy this link:</p>
              <p style="margin:0 0 48px;word-break:break-all;font-size:12px;line-height:20px;text-align:center;">
                <a href="{reset_url}" style="color:#888888;text-decoration:underline;">{reset_url}</a>
              </p>
            </td>
          </tr>
          <tr><td style="padding:0 60px;"><div style="height:1px;background-color:#222222;"></div></td></tr>
          <tr>
            <td style="padding:32px 40px 80px;text-align:center;">
              <p style="margin:0 0 8px;color:#444444;font-size:12px;">If you didn't request this, you can ignore this email.</p>
              <p style="margin:0;color:#333333;font-size:11px;">&copy; Ekra &middot; ekra.app</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_password_reset_email(user):
    """Send password reset email with uid and token link."""
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = password_reset_token.make_token(user)
    frontend_url = os.getenv("FRONTEND_URL", "https://ekra.app")
    reset_url = f"{frontend_url}/auth/reset-password?uid={uid}&token={token}"
    subject = "Reset your password — Ekra"
    plain_text = (
        f"Hi {user.username or user.email},\n\n"
        f"Reset your password by visiting:\n\n{reset_url}\n\n"
        f"If you didn't request this, ignore this email.\n\n— Ekra Team"
    )
    html_body = _build_reset_html(user.username or user.email, reset_url)
    from_email = f"Ekra <{settings.DEFAULT_FROM_EMAIL}>"
    email = EmailMultiAlternatives(
        subject=subject,
        body=plain_text,
        from_email=from_email,
        to=[user.email],
    )
    email.attach_alternative(html_body, "text/html")
    email.send()

