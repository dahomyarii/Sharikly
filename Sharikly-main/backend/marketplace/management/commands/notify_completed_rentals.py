from django.core.management.base import BaseCommand
from django.utils import timezone

from marketplace.models import Booking, Notification
from marketplace.views import _create_notification
from django.conf import settings


class Command(BaseCommand):
    help = (
        "Notify listing owners that a paid rental has completed (end_date has passed). "
        "Intended to run daily via cron. Idempotent: each booking is notified at most once."
    )

    def handle(self, *args, **options):
        today = timezone.now().date()
        bookings = (
            Booking.objects.filter(
                status=Booking.Status.CONFIRMED,
                payment_status=Booking.PaymentStatus.PAID,
                end_date__lt=today,
                owner_completion_notified=False,
            )
            .select_related("listing", "listing__owner", "renter")
        )

        app_url = getattr(settings, "FRONTEND_APP_URL", "").rstrip("/") or ""
        link = f"{app_url}/earnings" if app_url else "/earnings"

        count = 0
        for booking in bookings:
            owner = booking.listing.owner
            renter_name = booking.renter.first_name or booking.renter.username or "A renter"
            _create_notification(
                owner,
                Notification.NotificationType.RENTAL_COMPLETED,
                "Rental completed",
                body=(
                    f'{renter_name} completed their booking of "{booking.listing.title}". '
                    f"You earned SAR {booking.total_price}."
                ),
                link=link,
            )
            booking.owner_completion_notified = True
            booking.save(update_fields=["owner_completion_notified"])
            count += 1

        self.stdout.write(self.style.SUCCESS(f"Notified {count} completed rental(s)."))
