from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import *

User = get_user_model()


# ==========================
# USER SERIALIZER
# ==========================
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "avatar", "bio", "is_email_verified"]


class PublicUserSerializer(serializers.ModelSerializer):
    """Public profile — no email exposed."""
    listings_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "avatar", "bio", "is_email_verified", "date_joined", "listings_count", "average_rating"]

    def get_listings_count(self, obj):
        return obj.listings.count() if hasattr(obj, "listings") else 0

    def get_average_rating(self, obj):
        from django.db.models import Avg
        if not hasattr(obj, "listings"):
            return 0
        result = obj.listings.aggregate(avg=Avg("reviews__rating"))
        return round(result["avg"] or 0, 1)


# ==========================
# LISTING IMAGES
# ==========================
class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingImage
        fields = ["id", "image"]


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
        validated_data["is_active"] = True  # New listings appear in search by default
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

    class Meta:
        model = ChatRoom
        fields = ["id", "participants", "created_at", "last_message"]

    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        return MessageSerializer(last_msg).data if last_msg else None


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
