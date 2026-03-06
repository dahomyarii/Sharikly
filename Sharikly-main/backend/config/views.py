from django.http import JsonResponse
from django.shortcuts import render


def health(request):
    """GET /api/health/ — returns 200 with status for load balancers and monitoring."""
    return JsonResponse({"status": "ok"})


def privacy_policy(request):
    """GET /privacy-policy/ — human-readable privacy policy for Ekra website users."""
    return render(request, "privacy_policy.html")
