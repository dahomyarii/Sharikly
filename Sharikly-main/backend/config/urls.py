from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from config.views import health, privacy_policy, verify_email_page

urlpatterns = [
    path("admin/", admin.site.urls),
    # Public website pages
    path("privacy-policy/", privacy_policy, name="privacy_policy"),
    # Email verification — served directly by Django (no Next.js needed)
    path("verify-email", verify_email_page, name="verify_email_page"),
    path("verify-email/", verify_email_page, name="verify_email_page_slash"),
    # API endpoints
    path("api/", include("accounts.urls")),
    path("api/", include("marketplace.urls")),
    path("api/health/", health),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
