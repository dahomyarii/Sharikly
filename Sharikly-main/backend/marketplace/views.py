from rest_framework import generics, permissions, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import ValidationError, AuthenticationFailed, PermissionDenied
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.core.mail import send_mail
from datetime import datetime as dt
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from .models import *
from .serializers import *
from accounts.views import send_verification_email, send_password_reset_email
from accounts.tokens import email_verification_token, password_reset_token
from rest_framework import viewsets
import requests

User = get_user_model()


# --- Auth Views ---
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        password = data.pop("password", None)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.create_user(
            username=serializer.validated_data.get("username")
            or serializer.validated_data["email"],
            email=serializer.validated_data["email"],
            password=password,
            is_email_verified=False,
        )
        # Send verification email
        try:
            send_verification_email(user)
        except Exception as e:
            # Log error but don't fail registration
            print(f"Error sending verification email: {e}")
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_object(self):
        return self.request.user


class PublicUserView(generics.RetrieveAPIView):
    """Public user profile — anyone can view."""
    from .serializers import PublicUserSerializer
    queryset = User.objects.all()
    serializer_class = PublicUserSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "pk"


def _blocked_user_ids(user):
    """User IDs that cannot interact in chat with `user` (either direction)."""
    from .models import BlockedUser
    blocked_by_me = set(
        BlockedUser.objects.filter(blocker=user).values_list("blocked_id", flat=True)
    )
    blocked_me = set(
        BlockedUser.objects.filter(blocked=user).values_list("blocker_id", flat=True)
    )
    return blocked_by_me | blocked_me


def _create_notification(user, notification_type, title, body: str = "", link: str = ""):
    """
    Small helper to create an in-app notification.
    Safe to call even if notifications are not critical to the main flow.
    """
    if not user:
        return
    try:
        Notification.objects.create(
            user=user,
            notification_type=notification_type,
            title=title,
            body=body,
            link=link,
        )
    except Exception as e:
        # Do not break main request flow if notification fails
        print(f"[notifications] Failed to create notification: {e}")


def _send_notification_email(to_email: str, subject: str, plain_message: str):
    """Send a simple transactional email. Failures are logged, not raised."""
    try:
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@sharikly.com")
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=from_email,
            recipient_list=[to_email],
            fail_silently=True,
        )
    except Exception as e:
        print(f"[email] Failed to send notification email: {e}")


class BlockUserView(APIView):
    """POST: block a user (they won't appear in your chat list; you can't message each other)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if request.user.id == pk:
            return Response(
                {"detail": "You cannot block yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        target = get_object_or_404(User, pk=pk)
        BlockedUser.objects.get_or_create(blocker=request.user, blocked=target)
        return Response(
            {"detail": "User blocked."},
            status=status.HTTP_200_OK,
        )


class UnblockUserView(APIView):
    """DELETE: unblock a user."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        target = get_object_or_404(User, pk=pk)
        deleted, _ = BlockedUser.objects.filter(
            blocker=request.user, blocked=target
        ).delete()
        return Response(
            {"detail": "User unblocked."} if deleted else {"detail": "User was not blocked."},
            status=status.HTTP_200_OK,
        )


class BlockedUsersListView(generics.ListAPIView):
    """GET: list users I have blocked (for Settings unblock list)."""
    from .serializers import PublicUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PublicUserSerializer

    def get_queryset(self):
        return User.objects.filter(
            id__in=BlockedUser.objects.filter(blocker=self.request.user).values_list("blocked_id", flat=True)
        )


class NotificationListPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 50


class NotificationListView(generics.ListAPIView):
    """List current user's notifications (newest first)."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer
    pagination_class = NotificationListPagination

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by("-created_at")


class NotificationMarkReadView(APIView):
    """
    Mark notifications as read.
    PATCH body:
      { "id": 123 }   -> mark single notification read
      { "all": true } -> mark all as read
    """

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        nid = request.data.get("id")
        mark_all = bool(request.data.get("all"))

        if mark_all:
            updated = Notification.objects.filter(user=request.user, read=False).update(read=True)
            return Response({"marked": updated}, status=status.HTTP_200_OK)

        if nid is not None:
            notif = Notification.objects.filter(user=request.user, id=nid).first()
            if not notif:
                return Response({"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)
            notif.read = True
            notif.save()
            return Response(NotificationSerializer(notif).data, status=status.HTTP_200_OK)

        return Response(
            {"detail": "Provide 'id' or 'all' in request body."},
            status=status.HTTP_400_BAD_REQUEST,
        )


class VerifyEmailView(generics.GenericAPIView):
    """Verify user email using token from URL"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        uid = request.query_params.get("uid")
        token = request.query_params.get("token")

        if not uid or not token:
            return Response(
                {"error": "Missing uid or token parameter"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Decode user ID
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"error": "Invalid verification link"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if token is valid
        if not email_verification_token.check_token(user, token):
            return Response(
                {"error": "Invalid or expired verification token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify email
        if user.is_email_verified:
            return Response(
                {"message": "Email already verified"},
                status=status.HTTP_200_OK,
            )

        user.is_email_verified = True
        user.save()

        return Response(
            {"message": "Email verified successfully"},
            status=status.HTTP_200_OK,
        )


# --- Password Reset (Forgot Password) ---
class PasswordResetRequestView(APIView):
    """POST email -> send reset link. Always return 200 to avoid email enumeration."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        if not email:
            return Response(
                {"detail": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = User.objects.filter(email__iexact=email).first()
        if user:
            try:
                send_password_reset_email(user)
            except Exception as e:
                print(f"Error sending password reset email: {e}")
        return Response(
            {"detail": "If an account exists with this email, you will receive a password reset link."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    """POST uid, token, new_password -> set new password."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")

        if not uid or not token or not new_password:
            return Response(
                {"detail": "uid, token, and new_password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(new_password) < 8:
            return Response(
                {"detail": "Password must be at least 8 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"detail": "Invalid or expired reset link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not password_reset_token.check_token(user, token):
            return Response(
                {"detail": "Invalid or expired reset link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()
        return Response(
            {"detail": "Password has been reset. You can now log in."},
            status=status.HTTP_200_OK,
        )


# --- Change Password View ---
class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not old_password or not new_password:
            return Response(
                {"detail": "Both old_password and new_password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.check_password(old_password):
            return Response(
                {"detail": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8:
            return Response(
                {"detail": "New password must be at least 8 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()
        return Response(
            {"detail": "Password changed successfully."},
            status=status.HTTP_200_OK,
        )


# --- Delete Account View ---
class DeleteAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        user = request.user
        password = request.data.get("password")

        if not password:
            return Response(
                {"detail": "Password is required to delete your account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.check_password(password):
            return Response(
                {"detail": "Incorrect password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# --- JWT Login View ---
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        return token


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        # Check email verification BEFORE issuing a token
        email = request.data.get("email")
        if email:
            try:
                user = User.objects.get(email=email)
                if not user.is_email_verified:
                    return Response(
                        {"detail": "Please verify your email address before logging in. Check your inbox for the verification email."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except User.DoesNotExist:
                pass  # Let the parent handle "no active account" error
        
        return super().post(request, *args, **kwargs)


class ResendVerificationView(APIView):
    """POST email -> resend verification email if user exists and is not verified."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        if not email:
            return Response(
                {"detail": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = User.objects.filter(email__iexact=email).first()
        if user and not user.is_email_verified:
            try:
                send_verification_email(user)
            except Exception as e:
                print(f"Error resending verification email: {e}")
        # Same message whether we sent or not (avoid email enumeration)
        return Response(
            {"detail": "If your email is not verified, we've sent a new verification link. Please check your inbox."},
            status=status.HTTP_200_OK,
        )


# --- Listings Views ---
class ListingListPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 48


class ListingListCreateView(generics.ListCreateAPIView):
    serializer_class = ListingSerializer
    parser_classes = [MultiPartParser, FormParser]
    pagination_class = ListingListPagination

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        from django.db.models import Q

        qs = Listing.objects.all()
        if self.request.method != "GET":
            return qs.order_by("-created_at")
        # "My listings" for profile: only owner's listings (include inactive)
        if self.request.user.is_authenticated and self.request.query_params.get("mine") == "1":
            qs = qs.filter(owner=self.request.user).order_by("-created_at")
            return qs
        # Public list: only active
        qs = qs.filter(is_active=True)
        # Filters (GET only)
        search = (self.request.query_params.get("search") or "").strip()
        if search:
            qs = qs.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(city__icontains=search)
            )
        category_id = self.request.query_params.get("category")
        if category_id:
            try:
                qs = qs.filter(category_id=int(category_id))
            except ValueError:
                pass
        city = (self.request.query_params.get("city") or "").strip()
        if city:
            qs = qs.filter(city__icontains=city)
        min_price = self.request.query_params.get("min_price")
        if min_price is not None and min_price != "":
            try:
                qs = qs.filter(price_per_day__gte=float(min_price))
            except ValueError:
                pass
        max_price = self.request.query_params.get("max_price")
        if max_price is not None and max_price != "":
            try:
                qs = qs.filter(price_per_day__lte=float(max_price))
            except ValueError:
                pass
        # Ordering
        order = self.request.query_params.get("order") or "newest"
        if order == "price_asc":
            qs = qs.order_by("price_per_day")
        elif order == "price_desc":
            qs = qs.order_by("-price_per_day")
        else:
            qs = qs.order_by("-created_at")
        return qs

    def paginate_queryset(self, queryset):
        # Don't paginate "my listings" (profile needs all)
        if self.request.query_params.get("mine") == "1":
            return None
        return super().paginate_queryset(queryset)

    def get_serializer_context(self):
        """Ensure the request is passed to the serializer context"""
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_create(self, serializer):
        images = self.request.FILES.getlist("images")
        if not images:
            raise ValidationError({"images": "At least one image is required"})
        listing = serializer.save(owner=self.request.user)
        for img in images:
            ListingImage.objects.create(listing=listing, image=img)


class ListingRetrieveUpdateView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ListingSerializer

    def get_queryset(self):
        from django.db.models import Q

        # Public: only active; owner: can see their own (active or inactive)
        qs = Listing.objects.filter(Q(is_active=True))
        if self.request.user.is_authenticated:
            qs = (qs | Listing.objects.filter(owner=self.request.user)).distinct()
        return qs

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_serializer_context(self):
        """Ensure the request is passed to the serializer context"""
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_update(self, serializer):
        listing = self.get_object()
        if listing.owner_id != self.request.user.id:
            raise PermissionDenied("Only the owner can edit this listing.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.owner_id != self.request.user.id:
            raise PermissionDenied("Only the owner can delete this listing.")
        instance.delete()


class ListingAvailabilityView(APIView):
    """Return booked date ranges for a listing (PENDING + CONFIRMED) so calendar can disable them."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        listing = get_object_or_404(Listing, pk=pk)
        booked = (
            Booking.objects.filter(listing=listing)
            .filter(status__in=[Booking.Status.PENDING, Booking.Status.CONFIRMED])
            .values_list("start_date", "end_date")
        )
        booked_ranges = [
            {"start": str(s), "end": str(e)}
            for s, e in booked
        ]
        return Response({"booked_ranges": booked_ranges})


class SimilarListingsView(APIView):
    """Return listings similar to the given one: same category, then by price similarity, then newest. No auth required."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        from django.db.models import F, Value, DecimalField
        from django.db.models.functions import Abs

        current = get_object_or_404(Listing, pk=pk)
        qs = Listing.objects.filter(is_active=True).exclude(pk=pk)
        if current.category_id:
            qs = qs.filter(category_id=current.category_id)
        qs = qs.annotate(
            price_diff=Abs(F("price_per_day") - Value(current.price_per_day, output_field=DecimalField(max_digits=10, decimal_places=2)))
        ).order_by("price_diff", "-created_at")[:8]
        serializer = ListingSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)


def _booking_overlaps(listing, start, end):
    """True if [start, end] overlaps any PENDING or CONFIRMED booking for listing."""
    from django.db.models import Q
    return Booking.objects.filter(
        listing=listing,
        status__in=[Booking.Status.PENDING, Booking.Status.CONFIRMED],
    ).filter(
        Q(start_date__lte=end, end_date__gte=start)
    ).exists()


class BookingListPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50


class BookingListCreateView(generics.ListCreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = BookingListPagination

    def get_queryset(self):
        user = self.request.user
        return (
            Booking.objects.filter(renter=user)
            | Booking.objects.filter(listing__owner=user)
        ).order_by("-created_at").distinct()

    def create(self, request, *args, **kwargs):
        listing_id = request.data.get("listing")
        start_date = request.data.get("start_date")
        end_date = request.data.get("end_date")
        total_price = request.data.get("total_price")
        if not all([listing_id, start_date, end_date, total_price is not None]):
            return Response(
                {"detail": "listing, start_date, end_date and total_price are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        listing = get_object_or_404(Listing, pk=listing_id)
        if listing.owner_id == request.user.id:
            return Response(
                {"detail": "You cannot book your own listing."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            start = dt.strptime(start_date, "%Y-%m-%d").date()
            end = dt.strptime(end_date, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return Response(
                {"detail": "Invalid date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if end < start:
            return Response(
                {"detail": "end_date must be on or after start_date."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if _booking_overlaps(listing, start, end):
            return Response(
                {"detail": "These dates overlap an existing booking. Please check availability."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        booking = Booking.objects.create(
            listing=listing,
            renter=request.user,
            start_date=start,
            end_date=end,
            total_price=total_price,
            status=Booking.Status.PENDING,
        )
        return Response(
            BookingSerializer(booking).data,
            status=status.HTTP_201_CREATED,
        )


class BookingRetrieveView(generics.RetrieveAPIView):
    """Get a single booking (renter or listing owner only). Used for receipt / confirmation view."""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return (
            Booking.objects.filter(renter=user)
            | Booking.objects.filter(listing__owner=user)
        ).distinct()


class BookingAcceptView(APIView):
    """Owner of the listing can accept a pending booking."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        if booking.listing.owner_id != request.user.id:
            return Response(
                {"detail": "Only the listing owner can accept this booking."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if booking.status != Booking.Status.PENDING:
            return Response(
                {"detail": "Only pending bookings can be accepted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        booking.status = Booking.Status.CONFIRMED
        booking.save()
        app_url = getattr(settings, "FRONTEND_APP_URL", "").rstrip("/") or ""
        link = f"{app_url}/bookings" if app_url else "/bookings"
        _create_notification(
            booking.renter,
            Notification.NotificationType.BOOKING_ACCEPTED,
            "Booking accepted",
            body=f"Your request for \"{booking.listing.title}\" was accepted. Dates: {booking.start_date} to {booking.end_date}.",
            link=link,
        )
        _send_notification_email(
            booking.renter.email,
            f"Booking accepted: {booking.listing.title}",
            f"Hi,\n\nYour booking request for \"{booking.listing.title}\" was accepted.\nDates: {booking.start_date} to {booking.end_date}.\n\nView your bookings: {link}\n\n— Sharikly",
        )
        return Response(BookingSerializer(booking).data, status=status.HTTP_200_OK)


class BookingDeclineView(APIView):
    """Owner of the listing can decline a pending booking."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        if booking.listing.owner_id != request.user.id:
            return Response(
                {"detail": "Only the listing owner can decline this booking."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if booking.status != Booking.Status.PENDING:
            return Response(
                {"detail": "Only pending bookings can be declined."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        booking.status = Booking.Status.DECLINED
        booking.save()
        app_url = getattr(settings, "FRONTEND_APP_URL", "").rstrip("/") or ""
        link = f"{app_url}/bookings" if app_url else "/bookings"
        _create_notification(
            booking.renter,
            Notification.NotificationType.BOOKING_DECLINED,
            "Booking declined",
            body=f"Your request for \"{booking.listing.title}\" was declined by the owner.",
            link=link,
        )
        _send_notification_email(
            booking.renter.email,
            f"Booking declined: {booking.listing.title}",
            f"Hi,\n\nYour booking request for \"{booking.listing.title}\" was declined by the owner.\n\nView your bookings: {link}\n\n— Sharikly",
        )
        return Response(BookingSerializer(booking).data, status=status.HTTP_200_OK)


class BookingCancelView(APIView):
    """Renter can cancel PENDING or CONFIRMED (if not paid). Owner can cancel CONFIRMED."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        is_owner = booking.listing.owner_id == request.user.id
        is_renter = booking.renter_id == request.user.id
        if not is_owner and not is_renter:
            return Response(
                {"detail": "Only the renter or listing owner can cancel this booking."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if booking.status == Booking.Status.CANCELLED:
            return Response(
                {"detail": "This booking is already cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if booking.status == Booking.Status.DECLINED:
            return Response(
                {"detail": "Cannot cancel a declined booking."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Renter: can cancel PENDING or CONFIRMED only if not paid
        if is_renter:
            if booking.status == Booking.Status.CONFIRMED and booking.payment_status == Booking.PaymentStatus.PAID:
                return Response(
                    {"detail": "Paid bookings cannot be cancelled here. Contact support for refunds."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        # Owner: can cancel PENDING or CONFIRMED (e.g. force majeure)
        booking.status = Booking.Status.CANCELLED
        booking.save(update_fields=["status"])
        app_url = getattr(settings, "FRONTEND_APP_URL", "").rstrip("/") or ""
        link = f"{app_url}/bookings" if app_url else "/bookings"
        # Notify the other party
        other = booking.renter if is_owner else booking.listing.owner
        _create_notification(
            other,
            Notification.NotificationType.BOOKING_CANCELLED,
            "Booking cancelled",
            body=f'Booking for "{booking.listing.title}" ({booking.start_date} to {booking.end_date}) was cancelled.'
            if is_owner
            else f'Your booking for "{booking.listing.title}" was cancelled by the owner.',
            link=link,
        )
        _send_notification_email(
            other.email,
            f"Booking cancelled: {booking.listing.title}",
            f"Hi,\n\nA booking for \"{booking.listing.title}\" was cancelled.\n\nView bookings: {link}\n\n— Sharikly",
        )
        return Response(BookingSerializer(booking).data, status=status.HTTP_200_OK)


class BookingRefundView(APIView):
    """Listing owner can mark a PAID booking as refunded (e.g. after processing refund in Moyasar dashboard)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        if booking.listing.owner_id != request.user.id:
            return Response(
                {"detail": "Only the listing owner can mark this booking as refunded."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if booking.payment_status != Booking.PaymentStatus.PAID:
            return Response(
                {"detail": "Only paid bookings can be marked as refunded."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        booking.payment_status = Booking.PaymentStatus.REFUNDED
        booking.save(update_fields=["payment_status"])
        return Response(BookingSerializer(booking).data, status=status.HTTP_200_OK)


class BookingCreateCheckoutSessionView(APIView):
    """Create a Moyasar invoice for a confirmed booking (Saudi-friendly). Renter only."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        if booking.renter_id != request.user.id:
            return Response(
                {"detail": "Only the renter can pay for this booking."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if booking.status != Booking.Status.CONFIRMED:
            return Response(
                {"detail": "Only confirmed bookings can be paid."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if booking.payment_status == Booking.PaymentStatus.PAID:
            return Response(
                {"detail": "This booking is already paid."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        secret = getattr(settings, "MOYASAR_SECRET_KEY", None)
        if not secret:
            return Response(
                {"detail": "Payments are not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        app_url = getattr(settings, "FRONTEND_APP_URL", request.build_absolute_uri("/")[:-1]).rstrip("/")
        backend_url = request.build_absolute_uri("/").rstrip("/")
        amount_halals = max(100, int(round(float(booking.total_price) * 100)))
        payload = {
            "amount": amount_halals,
            "currency": "SAR",
            "description": f"Rental: {booking.listing.title} ({booking.start_date} to {booking.end_date})",
            "success_url": f"{app_url}/bookings?paid=1&booking_id={booking.id}",
            "back_url": f"{app_url}/bookings?cancelled=1",
            "callback_url": f"{backend_url}/api/moyasar/callback/",
        }
        try:
            resp = requests.post(
                "https://api.moyasar.com/v1/invoices",
                json=payload,
                auth=(secret, ""),
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
            invoice_url = data.get("url")
            invoice_id = data.get("id")
            if not invoice_url:
                return Response(
                    {"detail": "Payment gateway did not return a checkout URL."},
                    status=status.HTTP_502_BAD_GATEWAY,
                )
            booking.stripe_payment_id = invoice_id
            booking.save(update_fields=["stripe_payment_id"])
            return Response({"url": invoice_url}, status=status.HTTP_200_OK)
        except requests.RequestException as e:
            msg = getattr(e, "response", None)
            if msg is not None and hasattr(msg, "json"):
                try:
                    err = msg.json()
                    detail = err.get("message") or err.get("detail") or str(e)
                except Exception:
                    detail = str(e)
            else:
                detail = str(e)
            return Response(
                {"detail": detail or "Payment setup failed."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class MoyasarPaymentCallbackView(APIView):
    """Moyasar invoice callback: when invoice is paid, mark booking as PAID."""
    permission_classes = []
    authentication_classes = []

    @method_decorator(csrf_exempt)
    @method_decorator(require_http_methods(["POST"]))
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        try:
            data = request.data
            invoice_id = data.get("id")
            invoice_status = data.get("status")
            if invoice_status != "paid" or not invoice_id:
                return Response(status=status.HTTP_200_OK)
            booking = Booking.objects.filter(stripe_payment_id=invoice_id).first()
            if booking:
                booking.payment_status = Booking.PaymentStatus.PAID
                booking.save(update_fields=["payment_status"])
        except Exception:
            pass
        return Response(status=status.HTTP_200_OK)


# --- Category Views ---
class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


# --- Chat Views ---
class ChatRoomListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Rooms I'm in, excluding rooms where another participant is blocked (either direction)
        blocked_ids = _blocked_user_ids(self.request.user)
        if not blocked_ids:
            return ChatRoom.objects.filter(participants=self.request.user).distinct()
        room_ids_with_blocked = ChatRoom.objects.filter(
            participants=self.request.user
        ).filter(
            participants__id__in=blocked_ids
        ).values_list("id", flat=True)
        return ChatRoom.objects.filter(participants=self.request.user).exclude(
            id__in=room_ids_with_blocked
        ).distinct()

    def create(self, request, *args, **kwargs):
        participants_ids = request.data.get("participants", [])
        if not participants_ids:
            raise ValidationError("Participants are required")

        # Prevent creating room with self only
        if len(participants_ids) == 1 and participants_ids[0] == request.user.id:
            raise ValidationError("You cannot create a chat room with only yourself")

        blocked_ids = _blocked_user_ids(request.user)
        if any(pid in blocked_ids for pid in participants_ids):
            raise ValidationError("You cannot start a conversation with this user.")

        participants = list(User.objects.filter(id__in=participants_ids))
        if request.user not in participants:
            participants.append(request.user)

        room = ChatRoom.objects.create()
        room.participants.set(participants)
        room.save()

        serializer = self.get_serializer(room)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_id = self.kwargs["room_id"]
        room = get_object_or_404(ChatRoom, id=room_id)
        if self.request.user not in room.participants.all():
            raise ValidationError("You are not a participant of this chat room")
        blocked_ids = _blocked_user_ids(self.request.user)
        others = room.participants.exclude(pk=self.request.user.pk).values_list("id", flat=True)
        if any(pid in blocked_ids for pid in others):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You cannot view this conversation.")
        return room.messages.all()

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        # Mark this room as read for the current user
        room_id = self.kwargs.get("room_id")
        if room_id:
            room = get_object_or_404(ChatRoom, id=room_id)
            if request.user in room.participants.all():
                ParticipantLastRead.objects.update_or_create(
                    user=request.user,
                    room=room,
                    defaults={"last_read_at": timezone.now()},
                )
        return response


class ChatUnreadCountView(APIView):
    """GET: return { count: N } of unread chat messages for the current user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from datetime import timedelta

        user = request.user
        blocked_ids = _blocked_user_ids(user)
        rooms = ChatRoom.objects.filter(participants=user).distinct()
        if blocked_ids:
            room_ids_with_blocked = ChatRoom.objects.filter(
                participants=user
            ).filter(
                participants__id__in=blocked_ids
            ).values_list("id", flat=True)
            rooms = rooms.exclude(id__in=room_ids_with_blocked)
        total = 0
        old_cutoff = timezone.now() - timedelta(days=365 * 10)
        for room in rooms:
            last = ParticipantLastRead.objects.filter(user=user, room=room).first()
            since = last.last_read_at if last else old_cutoff
            total += Message.objects.filter(room=room).exclude(sender=user).filter(
                created_at__gt=since
            ).count()
        return Response({"count": total})


class SendMessageView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        room_id = request.data.get("room")
        room = get_object_or_404(ChatRoom, id=room_id)

        if request.user not in room.participants.all():
            raise ValidationError(
                "You cannot send messages in a room you are not part of"
            )

        blocked_ids = _blocked_user_ids(request.user)
        others_in_room = room.participants.exclude(pk=request.user.pk).values_list("id", flat=True)
        if any(pid in blocked_ids for pid in others_in_room):
            return Response(
                {"detail": "You cannot send messages in this conversation."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Prevent sending message to yourself if alone
        if room.participants.count() == 1 and room.participants.first() == request.user:
            raise ValidationError("You cannot message yourself")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        msg = serializer.save(room=room, sender=request.user)
        app_url = getattr(settings, "FRONTEND_APP_URL", "").rstrip("/") or ""
        chat_link = f"{app_url}/chat/{room.id}" if app_url else f"/chat/{room.id}"
        snippet = (msg.text or "")[:100] + ("..." if len(msg.text or "") > 100 else "")
        for other in room.participants.exclude(pk=request.user.pk):
            _create_notification(
                other,
                Notification.NotificationType.NEW_MESSAGE,
                "New message",
                body=snippet,
                link=chat_link,
            )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        listing_id = self.request.query_params.get("listing")
        if listing_id:
            return Review.objects.filter(listing_id=listing_id)
        return Review.objects.all()

    def get_serializer_context(self):
        """Ensure the request is passed to the serializer context"""
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SubmitReviewView(generics.CreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        listing_id = self.kwargs["listing_id"]
        listing = get_object_or_404(Listing, id=listing_id)

        # Only allow review after a completed booking (renter, CONFIRMED, end_date in the past)
        today = timezone.now().date()
        has_completed_booking = Booking.objects.filter(
            listing=listing,
            renter=request.user,
            status=Booking.Status.CONFIRMED,
            end_date__lt=today,
        ).exists()
        if not has_completed_booking:
            return Response(
                {"error": "You can only review a listing after a completed booking."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if user has already reviewed this listing
        existing_review = Review.objects.filter(
            user=request.user, listing=listing
        ).first()
        if existing_review:
            return Response(
                {"error": "You have already reviewed this listing. You can only review once."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, listing=listing)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# --- Favorites Views ---
class AddFavoriteView(generics.CreateAPIView):
    """Add a listing to the user's favorites"""

    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        listing_id = self.kwargs["listing_id"]
        listing = get_object_or_404(Listing, id=listing_id)

        favorite, created = Favorite.objects.get_or_create(
            user=request.user, listing=listing
        )

        serializer = self.get_serializer(favorite)
        # Return 201 if newly created, 200 if already existed
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)


class RemoveFavoriteView(generics.DestroyAPIView):
    """Remove a listing from the user's favorites"""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        listing_id = self.kwargs["listing_id"]
        listing = get_object_or_404(Listing, id=listing_id)

        favorite = get_object_or_404(Favorite, user=request.user, listing=listing)

        favorite.delete()
        return Response(
            {"detail": "Listing removed from favorites"},
            status=status.HTTP_204_NO_CONTENT,
        )


class FavoritesListPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 48


class UserFavoritesListView(generics.ListAPIView):
    """Get all favorite listings for the authenticated user"""

    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = FavoritesListPagination

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).order_by("-created_at")


# --- Review Vote Views ---
class ReviewVoteView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        review_id = self.kwargs["review_id"]
        review = get_object_or_404(Review, id=review_id)
        vote_type = request.data.get("vote_type", "").upper()

        if vote_type not in ["HELPFUL", "NOT_HELPFUL"]:
            return Response(
                {"error": "vote_type must be 'HELPFUL' or 'NOT_HELPFUL'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if user already voted
        existing_vote = ReviewVote.objects.filter(
            review=review, user=request.user
        ).first()

        if existing_vote:
            # If voting the same type, remove the vote (toggle off)
            if existing_vote.vote_type == vote_type:
                existing_vote.delete()
                return Response(
                    {
                        "detail": f"Vote removed",
                        "helpful": review.votes.filter(vote_type="HELPFUL").count(),
                        "not_helpful": review.votes.filter(
                            vote_type="NOT_HELPFUL"
                        ).count(),
                        "user_vote": None,
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                # If voting different type, update the vote (switch)
                existing_vote.vote_type = vote_type
                existing_vote.save()
                return Response(
                    {
                        "detail": f"Vote updated to {vote_type}",
                        "helpful": review.votes.filter(vote_type="HELPFUL").count(),
                        "not_helpful": review.votes.filter(
                            vote_type="NOT_HELPFUL"
                        ).count(),
                        "user_vote": vote_type,
                    },
                    status=status.HTTP_200_OK,
                )
        else:
            # Create new vote
            ReviewVote.objects.create(
                review=review, user=request.user, vote_type=vote_type
            )
            return Response(
                {
                    "detail": f"Vote added as {vote_type}",
                    "helpful": review.votes.filter(vote_type="HELPFUL").count(),
                    "not_helpful": review.votes.filter(vote_type="NOT_HELPFUL").count(),
                    "user_vote": vote_type,
                },
                status=status.HTTP_201_CREATED,
            )


# --- REPORT VIEWS ---
class ReportCreateView(generics.CreateAPIView):
    """Authenticated users can report a listing or a user."""
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)


# --- CONTACT MESSAGE VIEWS ---
class ContactMessageListCreateView(generics.ListCreateAPIView):
    """Create contact messages (login required; name/email from user). List is admin only."""
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        """Only admins can see all messages"""
        if self.request.user and self.request.user.is_staff:
            return ContactMessage.objects.all()
        return ContactMessage.objects.none()

    def get_permissions(self):
        """POST requires login; only admins can list"""
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    def create(self, request, *args, **kwargs):
        """Create a new contact message; name and email are set from the logged-in user."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        user = self.request.user
        name = getattr(user, "username", None) or getattr(user, "get_full_name", lambda: "")() or user.email or "User"
        email = user.email
        serializer.save(name=name, email=email)


class ContactMessageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin only: retrieve, update (add response), or delete a message"""
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.IsAdminUser]

    def update(self, request, *args, **kwargs):
        """Allow admin to add a response to the message"""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        # Only allow updating admin_response field
        if "admin_response" in request.data:
            instance.admin_response = request.data["admin_response"]
            instance.admin_response_date = timezone.now()
            instance.responded = True
            instance.save()

        serializer = self.get_serializer(instance, partial=partial)
        return Response(serializer.data)


# --- USER TO ADMIN MESSAGE VIEWS ---
class UserAdminMessageListCreateView(generics.ListCreateAPIView):
    """Authenticated users can create and view their own messages"""
    serializer_class = UserAdminMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Users see only their own messages, admins see all"""
        if self.request.user.is_staff:
            return UserAdminMessage.objects.all()
        return UserAdminMessage.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Create message with current user"""
        serializer.save(user=self.request.user)


class UserAdminMessageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Users can view/delete their messages, admins can respond"""
    serializer_class = UserAdminMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Users see only their own, admins see all"""
        if self.request.user.is_staff:
            return UserAdminMessage.objects.all()
        return UserAdminMessage.objects.filter(user=self.request.user)

    def update(self, request, *args, **kwargs):
        """Only admins can add responses"""
        if not request.user.is_staff:
            return Response(
                {"detail": "Only admins can respond to messages"},
                status=status.HTTP_403_FORBIDDEN
            )

        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        if "admin_response" in request.data:
            instance.admin_response = request.data["admin_response"]
            instance.admin_response_date = timezone.now()
            instance.responded = True
            instance.save()

        serializer = self.get_serializer(instance, partial=partial)
        return Response(serializer.data)


# ==========================
# BLOG POST VIEWS
# ==========================
class BlogPostListCreateView(generics.ListCreateAPIView):
    """
    GET: Anyone can view published blogs + admins see all
    POST: Only admins can create blogs
    """
    serializer_class = BlogPostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        """Users see published, admins see all"""
        if self.request.user and self.request.user.is_staff:
            return BlogPost.objects.all()
        return BlogPost.objects.filter(published=True)

    def create(self, request, *args, **kwargs):
        """Only admins can create"""
        if not request.user.is_staff:
            return Response(
                {"detail": "Only admins can create blog posts"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(author=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BlogPostDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: Anyone can view published blogs
    PATCH/PUT: Only admins (or author) can edit
    DELETE: Only admins (or author) can delete
    """
    serializer_class = BlogPostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        """Users see published, admins see all"""
        if self.request.user and self.request.user.is_staff:
            return BlogPost.objects.all()
        return BlogPost.objects.filter(published=True)

    def update(self, request, *args, **kwargs):
        """Only admins or author can update"""
        instance = self.get_object()
        if not (request.user.is_staff or request.user == instance.author):
            return Response(
                {"detail": "You can only edit your own blog posts"},
                status=status.HTTP_403_FORBIDDEN
            )

        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Only admins or author can delete"""
        instance = self.get_object()
        if not (request.user.is_staff or request.user == instance.author):
            return Response(
                {"detail": "You can only delete your own blog posts"},
                status=status.HTTP_403_FORBIDDEN
            )
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
