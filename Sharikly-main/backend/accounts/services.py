"""Account lifecycle services (GDPR / PDPL compliant account deletion)."""
from django.db import transaction
from django.utils import timezone


def anonymize_and_close_account(user) -> None:
    """
    Anonymize-and-retain account deletion.

    The User row is kept as an anonymized "tombstone" so that records other
    users or accounting rely on (bookings, reviews, chat, reports) stay intact
    and referentially valid, while all of this user's personal data is erased
    and the account is permanently disabled.

    - Purely personal, non-shared records are hard-deleted.
    - The user's listings are deactivated (not deleted) so counterparties'
      bookings/reviews survive; listing queries already filter is_active=True.
    - Uploaded personal files (avatar) are removed from storage (Cloudflare R2)
      only after the DB transaction commits.
    """
    # Imported lazily to avoid any app-loading/circular-import concerns.
    from marketplace.models import (
        BlockedUser,
        ContactMessage,
        Favorite,
        HostPreference,
        Listing,
        Notification,
        NotificationPreference,
        ParticipantLastRead,
        PaymentMethod,
        SavedSearch,
        UserAdminMessage,
    )

    original_email = user.email
    avatar_field = user.avatar if user.avatar else None

    with transaction.atomic():
        # (c) Hard-delete purely personal, non-shared records.
        PaymentMethod.objects.filter(user=user).delete()
        SavedSearch.objects.filter(user=user).delete()
        NotificationPreference.objects.filter(user=user).delete()
        HostPreference.objects.filter(user=user).delete()
        Favorite.objects.filter(user=user).delete()
        Notification.objects.filter(user=user).delete()
        ParticipantLastRead.objects.filter(user=user).delete()
        BlockedUser.objects.filter(blocker=user).delete()
        UserAdminMessage.objects.filter(user=user).delete()

        # (d) Deactivate (do not delete) the user's listings so bookings/reviews
        # made by other users survive; is_active=False hides them everywhere.
        Listing.objects.filter(owner=user).update(is_active=False)

        # (e) Anonymize orphan PII in ContactMessage (matched by email, no FK).
        if original_email:
            ContactMessage.objects.filter(email__iexact=original_email).update(
                name="Deleted User", email="", phone=""
            )

        # (a) Scrub the User's own PII in place.
        user.email = f"deleted-{user.id}@deleted.invalid"
        user.username = f"deleted_user_{user.id}"
        user.first_name = "Deleted"
        user.last_name = "User"
        user.bio = ""
        user.phone_number = None
        user.payout_bank = None
        user.tap_destination_id = None
        user.is_email_verified = False
        user.avatar = None
        user.set_unusable_password()
        user.is_active = False
        user.deleted_at = timezone.now()
        user.save()

        # (b) Delete the avatar file from storage only after commit succeeds.
        if avatar_field:
            transaction.on_commit(lambda: _safe_delete_file(avatar_field))


def _safe_delete_file(file_field) -> None:
    """Delete a stored file (Cloudflare R2) without raising if it's already gone."""
    try:
        file_field.delete(save=False)
    except Exception:
        # File cleanup is best-effort; never fail the (already-committed) deletion.
        pass
