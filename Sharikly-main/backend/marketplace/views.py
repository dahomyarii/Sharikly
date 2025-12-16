from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from .models import *
from .serializers import *
from rest_framework import viewsets

User = get_user_model()


# --- Auth Views ---
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        password = data.pop('password', None)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.create_user(
            username=serializer.validated_data.get('username') or serializer.validated_data['email'],
            email=serializer.validated_data['email'],
            password=password
        )
        return Response(UserSerializer(user).data)


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# --- JWT Login View ---
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        return token


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# --- Listings Views ---
class ListingListCreateView(generics.ListCreateAPIView):
    queryset = Listing.objects.all().order_by('-created_at')
    serializer_class = ListingSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_serializer_context(self):
        """Ensure the request is passed to the serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        images = self.request.FILES.getlist('images')
        if not images:
            raise ValidationError({"images": "At least one image is required"})
        listing = serializer.save(owner=self.request.user)
        for img in images:
            ListingImage.objects.create(listing=listing, image=img)


class ListingRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Listing.objects.all()
    serializer_class = ListingSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_serializer_context(self):
        """Ensure the request is passed to the serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class BookingListCreateView(generics.ListCreateAPIView):
    queryset = Booking.objects.all().order_by('-created_at')
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]


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
        # Return only rooms the user participates in
        return ChatRoom.objects.filter(participants=self.request.user)

    def create(self, request, *args, **kwargs):
        participants_ids = request.data.get('participants', [])
        if not participants_ids:
            raise ValidationError("Participants are required")

        # Prevent creating room with self only
        if len(participants_ids) == 1 and participants_ids[0] == request.user.id:
            raise ValidationError("You cannot create a chat room with only yourself")

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
        room_id = self.kwargs['room_id']
        room = get_object_or_404(ChatRoom, id=room_id)
        if self.request.user not in room.participants.all():
            raise ValidationError("You are not a participant of this chat room")
        return room.messages.all()


class SendMessageView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser] 
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        room_id = request.data.get('room')
        room = get_object_or_404(ChatRoom, id=room_id)

        if request.user not in room.participants.all():
            raise ValidationError("You cannot send messages in a room you are not part of")

        # Prevent sending message to yourself if alone
        if room.participants.count() == 1 and room.participants.first() == request.user:
            raise ValidationError("You cannot message yourself")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(room=room, sender=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        listing_id = self.request.query_params.get('listing')
        if listing_id:
            return Review.objects.filter(listing_id=listing_id)
        return Review.objects.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SubmitReviewView(generics.CreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        listing_id = self.kwargs['listing_id']
        listing = get_object_or_404(Listing, id=listing_id)

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
        listing_id = self.kwargs['listing_id']
        listing = get_object_or_404(Listing, id=listing_id)
        
        favorite, created = Favorite.objects.get_or_create(
            user=request.user,
            listing=listing
        )
        
        serializer = self.get_serializer(favorite)
        # Return 201 if newly created, 200 if already existed
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)


class RemoveFavoriteView(generics.DestroyAPIView):
    """Remove a listing from the user's favorites"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        listing_id = self.kwargs['listing_id']
        listing = get_object_or_404(Listing, id=listing_id)
        
        favorite = get_object_or_404(
            Favorite,
            user=request.user,
            listing=listing
        )
        
        favorite.delete()
        return Response(
            {"detail": "Listing removed from favorites"},
            status=status.HTTP_204_NO_CONTENT
        )


class UserFavoritesListView(generics.ListAPIView):
    """Get all favorite listings for the authenticated user"""
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).order_by('-created_at')

# class MarkReviewHelpfulView(generics.UpdateAPIView):
#     serializer_class = HelpfulSerializer
#     permission_classes = [permissions.IsAuthenticated]
#     def update(self, request, *args, **kwargs):
#         review_id = self.kwargs['review_id']
#         review = get_object_or_404(Review, id=review_id)

#         return Response({"detail": "Review marked as helpful"}, status=status.HTTP_200_OK)

# class MarkReviewNotHelpfulView(generics.UpdateAPIView):
#     serializer_class = NotHelpfulSerializer
#     permission_classes = [permissions.IsAuthenticated]
#     def update(self, request, *args, **kwargs):
#         review_id = self.kwargs['review_id']
#         review = get_object_or_404(Review, id=review_id)

#         return Response({"detail": "Review marked as not helpful"}, status=status.HTTP_200_OK)
