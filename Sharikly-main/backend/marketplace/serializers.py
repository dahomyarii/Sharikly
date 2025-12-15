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
        fields = ['id', 'username', 'email', 'avatar', 'bio']


# ==========================
# LISTING IMAGES
# ==========================
class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingImage
        fields = ['id', 'image']


# ==========================
# REVIEW SERIALIZER (rating + comment)
# ==========================
class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    listing = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'user', 'listing', 'rating', 'comment', 'created_at']

# ==========================
# LISTING SERIALIZER (MAIN)
# ==========================
class ListingSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    images = ListingImageSerializer(many=True, read_only=True)

    # ⭐ Extra fields
    average_rating = serializers.FloatField(read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    is_favorited = serializers.SerializerMethodField()
    favorites_count = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            'id', 'owner', 'title', 'description',
            'price_per_day', 'city', 'created_at',
            'images',            
            # ⭐ NEW:
            'average_rating',
            'reviews',
            'is_favorited',
            'favorites_count'
        ]

    def get_is_favorited(self, obj):
        """Check if the current authenticated user has favorited this listing"""
        request = self.context.get("request")
        print(request)
        if not request:
            return False
        
        user = request.user
        print(user)
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


# ==========================
# FAVORITES SERIALIZER
# ==========================
class FavoriteSerializer(serializers.ModelSerializer):
    listing = ListingSerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'listing', 'created_at']


# ==========================
# BOOKING SERIALIZER
# ==========================
class BookingSerializer(serializers.ModelSerializer):
    renter = UserSerializer(read_only=True)
    listing = ListingSerializer(read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'listing', 'renter',
            'start_date', 'end_date',
            'total_price', 'status',
            'created_at'
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
            'id', 'room', 'sender',
            'text', 'image', 'image_url',
            'audio', 'audio_url',
            'created_at'
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
        fields = ['id', 'participants', 'created_at', 'last_message']

    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        return MessageSerializer(last_msg).data if last_msg else None

# ==========================
# REVIEWS SERIALIZER
# ==========================
#class ReviewSerializer(serializers.ModelSerializer):
#    user_name = serializers.CharField(source='user.username', read_only=True)
#    user_avatar = serializers.ImageField(source='user.avatar', read_only=True)

#    class Meta:
#        model = Review
#        fields = ['id', 'listing', 'user', 'user_name', 'user_avatar', 'rating', 'comment', 'created_at']
#        read_only_fields = ['user', 'created_at', 'user_name', 'user_avatar']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = category
        fields = ['id', 'name']

        

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