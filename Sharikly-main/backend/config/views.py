from django.http import JsonResponse, HttpResponse
from django.shortcuts import render

from django.contrib.auth import get_user_model
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from accounts.tokens import email_verification_token


def health(request):
    """GET /api/health/ — returns 200 with status for load balancers and monitoring."""
    return JsonResponse({"status": "ok"})


def privacy_policy(request):
    """GET /privacy-policy/ — human-readable privacy policy for Ekra website users."""
    return render(request, "privacy_policy.html")


def verify_email_page(request):
    """
    GET /verify-email/?uid=...&token=...
    Handles email verification link clicks.
    Works without the Next.js frontend being online — Django serves the result page directly.
    """
    User = get_user_model()
    uid = request.GET.get("uid")
    token = request.GET.get("token")

    # --- Validate params ---
    if not uid or not token:
        return _render_verify_result(
            success=False, message="Invalid verification link — missing uid or token."
        )

    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except Exception:
        return _render_verify_result(
            success=False, message="Invalid or expired verification link."
        )

    if user.is_email_verified:
        return _render_verify_result(
            success=True, message="Your email is already verified. You can log in on the app."
        )

    if not email_verification_token.check_token(user, token):
        return _render_verify_result(
            success=False,
            message="This verification link has expired or already been used. Please request a new one from the app.",
        )

    user.is_email_verified = True
    user.save()
    return _render_verify_result(
        success=True,
        message="Your email has been verified! You can now log in on the Ekra app.",
    )


def _render_verify_result(success: bool, message: str) -> HttpResponse:
    color = "#22c55e" if success else "#ef4444"
    icon = "✓" if success else "✕"
    title = "Email Verified!" if success else "Verification Failed"
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} — Ekra</title>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
      min-height: 100vh;
      background: #0a0a0a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 24px;
    }}
    .card {{
      background: #111;
      border: 1px solid #222;
      border-radius: 20px;
      padding: 48px 40px;
      max-width: 420px;
      width: 100%;
      text-align: center;
    }}
    .icon {{
      width: 72px; height: 72px;
      border-radius: 50%;
      background: {color}22;
      border: 2px solid {color};
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 24px;
      font-size: 32px;
      color: {color};
      line-height: 1;
    }}
    .brand {{
      font-size: 13px; font-weight: 700;
      letter-spacing: 3px; text-transform: uppercase;
      color: #555; margin-bottom: 32px;
    }}
    h1 {{
      font-size: 26px; font-weight: 700;
      color: #fff; margin-bottom: 12px;
      letter-spacing: -0.5px;
    }}
    p {{
      font-size: 15px; color: #888;
      line-height: 1.6;
    }}
    .footer {{
      margin-top: 36px;
      font-size: 12px; color: #333;
      letter-spacing: 0.5px;
    }}
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">EKRA</div>
    <div class="icon">{icon}</div>
    <h1>{title}</h1>
    <p>{message}</p>
    <div class="footer">You can close this tab and return to the app.</div>
  </div>
</body>
</html>"""
    status_code = 200 if success else 400
    return HttpResponse(html, status=status_code)
