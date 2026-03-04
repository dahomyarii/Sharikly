from django.http import JsonResponse


def health(request):
    """GET /api/health/ — returns 200 with status for load balancers and monitoring."""
    return JsonResponse({"status": "ok"})
