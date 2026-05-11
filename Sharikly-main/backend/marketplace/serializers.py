from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Avg
from django.utils import timezone
from datetime import timedelta
from .models import *

User = get_user_model()


def _compute_user_response_stats(user: User):
    """
    Compute simple chat-based response statistics for a lender.

    We look at each chat room the user participates in and measure how often
    they reply to the first inbound message from the other participant, and
    how long that first reply typically takes.
    """
    from .models import ChatRoom, Message  # Local import to avoid circulars

    rooms = (
        ChatRoom.objects.filter(participants=user)
        .prefetch_related("participants", "messages__sender")
        .all()
    )

    total_threads = 0
    responded_threads = 0
    response_minutes: list[float] = []

    for room in rooms:
        messages = list(room.messages.all().order_by("created_at"))
        if not messages:
            continue

        # Find the first message from someone other than the user
        first_inbound = None
        for idx, msg in enumerate(messages):
            if msg.sender_id != user.id:
                first_inbound = (idx, msg)
                break

        if not first_inbound:
            continue

        total_threads += 1
        start_idx, inbound_msg = first_inbound

        # Find the user's first reply after that inbound message
        reply = None
        for msg in messages[start_idx + 1 :]:
            if msg.sender_id == user.id:
                reply = msg
                break

        if reply:
            responded_threads += 1
            delta = reply.created_at - inbound_msg.created_at
            minutes = max(0.0, delta.total_seconds() / 60.0)
            response_minutes.append(minutes)

    if not total_threads:
        return {"response_rate": None, "typical_minutes": None}

    rate = round((responded_threads / total_threads) * 100)

    if not response_minutes:
        return {"response_rate": rate, "typical_minutes": None}

    response_minutes.sort()
    mid = len(response_minutes) // 2
    if len(response_minutes) % 2 == 1:
        typical = response_minutes[mid]
    else:
        typical = (response_minutes[mid - 1] + response_minutes[mid]) / 2.0

    return {"response_rate": rate, "typical_minutes": round(typical)}


def _compute_is_super_host(user: User) -> bool:
    cached = getattr(user, "_cached_is_super_host", None)
    if cached is not None:
        return cached

    rating = (
        Review.objects.filter(listing__owner=user).aggregate(avg=Avg("rating")).get("avg") or 0
    )
    successful_rentals = Booking.objects.filter(
        listing__owner=user,
        payment_status=Booking.PaymentStatus.PAID,
    ).count()
    response_stats = _compute_user_response_stats(user)
    response_rate = response_stats.get("response_rate")

    is_super_host = bool(
        rating >= 4.8
        and successful_rentals > 20
        and response_rate is not None
        and response_rate >= 80
    )
    setattr(user, "_cached_is_super_host", is_super_host)
    return is_super_host


# ==========================
# USER SERIALIZER
# ==========================
class UserSerializer(serializers.ModelSerializer):
    response_rate = serializers.SerializerMethodField()
    typical_response_minutes = serializers.SerializerMethodField()
    is_super_host = serializers.SerializerMethodField()
    listings_count = serializers.SerializerMethodField()
    bookings_count = serializers.SerializerMethodField()
    total_earnings = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "avatar",
            "bio",
            "is_email_verified",
            "phone_number",
            "language",
            "payout_bank",
            "payout_schedule",
            "response_rate",
            "typical_response_minutes",
            "is_super_host",
            "listings_count",
            "bookings_count",
            "total_earnings",
        ]

    def _get_cached_response_stats(self, obj: User):
        cached = getattr(obj, "_cached_response_stats", None)
        if cached is not None:
            return cached
        stats = _compute_user_response_stats(obj)
        setattr(obj, "_cached_response_stats", stats)
        return stats

    def get_response_rate(self, obj):
        stats = self._get_cached_response_stats(obj)
        return stats.get("response_rate")

    def get_typical_response_minutes(self, obj):
        stats = self._get_cached_response_stats(obj)
        return stats.get("typical_minutes")

    def get_is_super_host(self, obj):
        return _compute_is_super_host(obj)

    def get_listings_count(self, obj):
        return obj.listings.count()

    def get_bookings_count(self, obj):
        from .models import Booking
        return Booking.objects.filter(renter=obj, payment_status=Booking.PaymentStatus.PAID).count()

    def get_total_earnings(self, obj):
        from django.db.models import Sum
        from django.db.models.functions import Coalesce
        from decimal import Decimal
        from .models import Booking
        result = Booking.objects.filter(
            listing__owner=obj,
            payment_status=Booking.PaymentStatus.PAID
        ).aggregate(total=Coalesce(Sum('total_price'), Decimal('0.00')))
        return float(result['total'])


class PublicUserSerializer(serializers.ModelSerializer):
    """Public profile — no email exposed."""
    listings_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    response_rate = serializers.SerializerMethodField()
    typical_response_minutes = serializers.SerializerMethodField()
    is_super_host = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "avatar",
            "bio",
            "is_email_verified",
            "date_joined",
            "listings_count",
            "average_rating",
            "response_rate",
            "typical_response_minutes",
            "is_super_host",
        ]

    def get_listings_count(self, obj):
        return obj.listings.count() if hasattr(obj, "listings") else 0

    def get_average_rating(self, obj):
        from django.db.models import Avg
        if not hasattr(obj, "listings"):
            return 0
        result = obj.listings.aggregate(avg=Avg("reviews__rating"))
        return round(result["avg"] or 0, 1)

    def _get_cached_response_stats(self, obj: User):
        cached = getattr(obj, "_cached_response_stats", None)
        if cached is not None:
            return cached
        stats = _compute_user_response_stats(obj)
        setattr(obj, "_cached_response_stats", stats)
        return stats

    def get_response_rate(self, obj):
        stats = self._get_cached_response_stats(obj)
        return stats.get("response_rate")

    def get_typical_response_minutes(self, obj):
        stats = self._get_cached_response_stats(obj)
        return stats.get("typical_minutes")

    def get_is_super_host(self, obj):
        return _compute_is_super_host(obj)


# ==========================
# LISTING IMAGES
# ==========================
class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingImage
        fields = ["id", "image", "position"]


# ==========================
# CATEGORY SERIALIZER
# ==========================
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "description", "icon"]


# ==========================
# REVIEW SERIALIZER (rating + comment)
# ==========================
class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    listing = serializers.PrimaryKeyRelatedField(read_only=True)
    helpful = serializers.SerializerMethodField()
    not_helpful = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id",
            "user",
            "listing",
            "rating",
            "comment",
            "created_at",
            "helpful",
            "not_helpful",
            "user_vote",
        ]

    def get_helpful(self, obj):
        try:
            return obj.votes.filter(vote_type="HELPFUL").count()
        except Exception:
            return 0

    def get_not_helpful(self, obj):
        try:
            return obj.votes.filter(vote_type="NOT_HELPFUL").count()
        except Exception:
            return 0

    def get_user_vote(self, obj):
        """Get the current user's vote type if they've voted"""
        try:
            request = self.context.get("request")
            if not request or not request.user or not request.user.is_authenticated:
                return None

            vote = obj.votes.filter(user=request.user).first()
            return vote.vote_type if vote else None
        except Exception:
            return None

    def validate_rating(self, value):
        """Validate that rating is between 0 and 5"""
        if value < 0 or value > 5:
            raise serializers.ValidationError("Rating must be between 0 and 5.")
        return value


# ==========================
# LISTING SERIALIZER (MAIN)
# ==========================
class ListingSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True, required=False)
    images = ListingImageSerializer(many=True, read_only=True)

    # ⭐ Extra fields
    average_rating = serializers.FloatField(read_only=True)
    reviews = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()
    favorites_count = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            "id",
            "owner",
            "title",
            "description",
            "price_per_day",
            "city",
            "is_active",
            "latitude",
            "longitude",
            "pickup_radius_m",
            "created_at",
            "category",
            "category_id",
            "images",
            # ⭐ NEW:
            "average_rating",
            "reviews",
            "is_favorited",
            "favorites_count",
        ]

    def create(self, validated_data):
        category_id = validated_data.pop("category_id", None)
        # Allow the client to explicitly create a hidden/draft listing by sending is_active=False.
        # Default remains True so existing flows keep publishing immediately.
        is_active = validated_data.pop("is_active", True)
        validated_data["is_active"] = bool(is_active)
        listing = Listing.objects.create(**validated_data)
        if category_id:
            try:
                category = Category.objects.get(id=category_id)
                listing.category = category
                listing.save()
            except Category.DoesNotExist:
                pass
        return listing

    def get_is_favorited(self, obj):
        """Check if the current authenticated user has favorited this listing"""
        request = self.context.get("request")
        if not request:
            return False

        user = request.user
        if not user or not user.is_authenticated:
            return False

        try:
            is_fav = Favorite.objects.filter(user=user, listing=obj).exists()
            return is_fav
        except Exception as e:
            print(f"Error checking favorite status: {e}")
            return False

    def get_favorites_count(self, obj):
        return obj.favorited_by.count()

    def get_reviews(self, obj):
        """Serialize reviews with proper context"""
        try:
            reviews = obj.reviews.all()
            serializer = ReviewSerializer(reviews, many=True, context=self.context)
            return serializer.data
        except Exception as e:
            # Log error but return empty list to prevent 500 errors
            print(f"Error serializing reviews for listing {obj.id}: {e}")
            return []


# ==========================
# FAVORITES SERIALIZER
# ==========================
class FavoriteSerializer(serializers.ModelSerializer):
    listing = ListingSerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ["id", "listing", "created_at"]


# ==========================
# BOOKING SERIALIZER
# ==========================
class BookingSerializer(serializers.ModelSerializer):
    renter = UserSerializer(read_only=True)
    listing = ListingSerializer(read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "listing",
            "renter",
            "start_date",
            "end_date",
            "total_price",
            "status",
            "payment_status",
            "created_at",
        ]


class EarningsListingSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    total_earnings = serializers.DecimalField(max_digits=12, decimal_places=2)
    rentals_count = serializers.IntegerField()


class EarningsSummarySerializer(serializers.Serializer):
    total_earnings = serializers.DecimalField(max_digits=12, decimal_places=2)
    this_month_earnings = serializers.DecimalField(max_digits=12, decimal_places=2)
    rentals_count = serializers.IntegerField()
    rating = serializers.FloatField()
    highest_earning_item = EarningsListingSerializer(allow_null=True)


class EarningsPointSerializer(serializers.Serializer):
    daily = serializers.DateField(required=False)
    month = serializers.DateField(required=False)
    label = serializers.CharField()
    earnings = serializers.DecimalField(max_digits=12, decimal_places=2)


class EarningsChartSerializer(serializers.Serializer):
    daily = EarningsPointSerializer(many=True)
    monthly = EarningsPointSerializer(many=True)


class TopLessorEntrySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    avatar = serializers.CharField(allow_null=True)
    monthly_earnings = serializers.DecimalField(max_digits=12, decimal_places=2)
    rentals_count = serializers.IntegerField()
    rating = serializers.FloatField()


class TopRenterEntrySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    avatar = serializers.CharField(allow_null=True)
    rentals_count = serializers.IntegerField()
    total_spent = serializers.DecimalField(max_digits=12, decimal_places=2)
    rating = serializers.FloatField(allow_null=True)


class EarningsLeaderboardsSerializer(serializers.Serializer):
    top_lessors_this_month = TopLessorEntrySerializer(many=True)
    top_renters_this_month = TopRenterEntrySerializer(many=True)


class LandlordRankingSerializer(serializers.Serializer):
    position = serializers.IntegerField()
    total_lessors = serializers.IntegerField()
    suggested_additional_products = serializers.IntegerField()
    hint = serializers.CharField()


class SuperHostRequirementSerializer(serializers.Serializer):
    label = serializers.CharField()
    met = serializers.BooleanField()
    detail = serializers.CharField()


class SuperHostStatusSerializer(serializers.Serializer):
    qualified = serializers.BooleanField()
    title = serializers.CharField()
    requirements = SuperHostRequirementSerializer(many=True)
    benefits = serializers.ListField(child=serializers.CharField())


class LandlordEarningsDashboardSerializer(serializers.Serializer):
    summary = EarningsSummarySerializer()
    chart = EarningsChartSerializer()
    leaderboards = EarningsLeaderboardsSerializer()
    ranking = LandlordRankingSerializer()
    super_host = SuperHostStatusSerializer()


class PublicCommunityEarningsSerializer(serializers.Serializer):
    total_lessor_earnings = serializers.DecimalField(max_digits=14, decimal_places=2)
    average_lessor_income_per_month = serializers.DecimalField(max_digits=12, decimal_places=2)
    highest_earning_lessors_per_month = TopLessorEntrySerializer(many=True)
    homepage = serializers.DictField()
    attraction = serializers.DictField()


class EarningsCalculatorInputSerializer(serializers.Serializer):
    products_count = serializers.IntegerField(min_value=1, max_value=1000)
    daily_rental_price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)


class EarningsCalculatorResponseSerializer(serializers.Serializer):
    products_count = serializers.IntegerField()
    daily_rental_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    monthly_earnings = serializers.DecimalField(max_digits=12, decimal_places=2)
    annual_earnings = serializers.DecimalField(max_digits=12, decimal_places=2)


class AvailabilityBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvailabilityBlock
        fields = [
            "id",
            "start_date",
            "end_date",
            "reason",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        start = attrs.get("start_date")
        end = attrs.get("end_date")
        if start and end and end < start:
            raise serializers.ValidationError(
                {"end_date": "end_date must be on or after start_date."}
            )
        return attrs


# ==========================
# MESSAGE SERIALIZER
# ==========================
class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    image_url = serializers.SerializerMethodField()
    audio_url = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id",
            "room",
            "sender",
            "text",
            "image",
            "image_url",
            "audio",
            "audio_url",
            "created_at",
        ]

    def get_image_url(self, obj):
        return obj.image.url if obj.image else None

    def get_audio_url(self, obj):
        return obj.audio.url if obj.audio else None


# ==========================
# CHAT ROOM SERIALIZER
# ==========================
class ChatRoomSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    listing = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ["id", "participants", "created_at", "last_message", "listing", "unread_count"]

    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        return MessageSerializer(last_msg).data if last_msg else None

    def get_listing(self, obj):
        """
        Lightweight listing context for chat room headers.
        Returns only the minimal fields needed for a small preview banner.
        """
        listing = getattr(obj, "listing", None)
        if not listing:
            return None

        first_image = None
        try:
            img = listing.images.first()
            if img and img.image:
                first_image = img.image.url
        except Exception:
            first_image = None

        return {
            "id": listing.id,
            "title": listing.title,
            "city": listing.city,
            "image": first_image,
        }

    def get_unread_count(self, obj):
        """
        Per-room unread count for the current user.
        Mirrors the logic used by ChatUnreadCountView but scoped to one room.
        """
        request = self.context.get("request")
        if not request or not getattr(request, "user", None) or not request.user.is_authenticated:
            return 0

        user = request.user

        try:
            last = ParticipantLastRead.objects.filter(user=user, room=obj).first()
        except Exception:
            return 0

        since = last.last_read_at if last else timezone.now() - timedelta(days=365 * 10)
        try:
            return (
                Message.objects.filter(room=obj)
                .exclude(sender=user)
                .filter(created_at__gt=since)
                .count()
            )
        except Exception:
            return 0


# ==========================
# REVIEWS SERIALIZER
# ==========================
# class ReviewSerializer(serializers.ModelSerializer):
#    user_name = serializers.CharField(source='user.username', read_only=True)
#    user_avatar = serializers.ImageField(source='user.avatar', read_only=True)

#    class Meta:
#        model = Review
#        fields = ['id', 'listing', 'user', 'user_name', 'user_avatar', 'rating', 'comment', 'created_at']
#        read_only_fields = ['user', 'created_at', 'user_name', 'user_avatar']




# ==========================
# HELPFUL / NOT HELPFUL SERIALIZER
# ==========================
# class HelpfulSerializer(serializers.ModelSerializer):
#     user = UserSerializer(read_only=True)
#     review = serializers.PrimaryKeyRelatedField(read_only=True)

#     class Meta:
#         model = ReviewHelpfulMark
#         fields = ['id', 'user', 'review', 'created_at']

# class NotHelpfulSerializer(serializers.ModelSerializer):
#     user = UserSerializer(read_only=True)
#     review = serializers.PrimaryKeyRelatedField(read_only=True)

#     class Meta:
#         model = ReviewNotHelpfulMark
#         fields = ['id', 'user', 'review', 'created_at']


# ==========================
# CONTACT MESSAGE SERIALIZER
# ==========================
class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "message",
            "created_at",
            "admin_response",
            "admin_response_date",
            "responded",
        ]
        read_only_fields = [
            "id",
            "name",
            "email",
            "created_at",
            "admin_response",
            "admin_response_date",
            "responded",
        ]


# ==========================
# USER TO ADMIN MESSAGE SERIALIZER
# ==========================
class UserAdminMessageSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = UserAdminMessage
        fields = [
            "id",
            "user",
            "user_id",
            "subject",
            "message",
            "created_at",
            "admin_response",
            "admin_response_date",
            "responded",
        ]
        read_only_fields = [
            "id",
            "user",
            "created_at",
            "admin_response",
            "admin_response_date",
            "responded",
        ]


# ==========================
# BLOG POST SERIALIZER
# ==========================
class BlogPostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    author_id = serializers.IntegerField(write_only=True, required=False)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    tags_list = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = [
            "id",
            "title",
            "slug",
            "excerpt",
            "content",
            "author",
            "author_id",
            "featured_image",
            "category",
            "category_display",
            "tags",
            "tags_list",
            "meta_title",
            "meta_description",
            "meta_keywords",
            "published",
            "featured",
            "views_count",
            "created_at",
            "updated_at",
            "published_date",
        ]
        read_only_fields = [
            "id",
            "author",
            "created_at",
            "updated_at",
            "published_date",
            "views_count",
            "slug",
        ]
    
    def get_tags_list(self, obj):
        """Convert comma-separated tags to list"""
        if obj.tags:
            return [tag.strip() for tag in obj.tags.split(',')]
        return []


# ==========================
# REPORT SERIALIZER
# ==========================
class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ["id", "listing", "reported_user", "reason", "details", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate(self, data):
        listing = data.get("listing")
        reported_user = data.get("reported_user")
        if listing and reported_user:
            raise serializers.ValidationError("Report either a listing or a user, not both.")
        if not listing and not reported_user:
            raise serializers.ValidationError("Provide either listing or reported_user.")
        return data


# ==========================
# NOTIFICATION SERIALIZER
# ==========================
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "notification_type", "title", "body", "link", "read", "created_at"]
        read_only_fields = ["id", "notification_type", "title", "body", "link", "created_at"]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            "inapp_booking_updates",
            "inapp_messages",
            "email_booking_updates",
            "email_messages",
            "earnings_updates",
            "promotions_updates",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]


class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = ["id", "card_last4", "brand", "is_default", "created_at"]
        read_only_fields = ["id", "created_at"]


class HostPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = HostPreference
        fields = [
            "smart_pricing",
            "instant_booking",
            "default_deposit",
            "availability_defaults",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]



class SavedSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedSearch
        fields = ["id", "query", "label", "created_at"]
        read_only_fields = ["id", "created_at"]
