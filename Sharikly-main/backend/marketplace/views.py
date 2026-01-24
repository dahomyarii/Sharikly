from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
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
        password = data.pop("password", None)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.create_user(
            username=serializer.validated_data.get("username")
            or serializer.validated_data["email"],
            email=serializer.validated_data["email"],
            password=password,
        )
        return Response(UserSerializer(user).data)


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# --- JWT Login View ---
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        return token


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# --- Listings Views ---
class ListingListCreateView(generics.ListCreateAPIView):
    queryset = Listing.objects.all().order_by("-created_at")
    serializer_class = ListingSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

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


class ListingRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Listing.objects.all()
    serializer_class = ListingSerializer

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH"]:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_serializer_context(self):
        """Ensure the request is passed to the serializer context"""
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class BookingListCreateView(generics.ListCreateAPIView):
    queryset = Booking.objects.all().order_by("-created_at")
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
        participants_ids = request.data.get("participants", [])
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
        room_id = self.kwargs["room_id"]
        room = get_object_or_404(ChatRoom, id=room_id)
        if self.request.user not in room.participants.all():
            raise ValidationError("You are not a participant of this chat room")
        return room.messages.all()


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
        listing_id = self.request.query_params.get("listing")
        if listing_id:
            return Review.objects.filter(listing_id=listing_id)
        return Review.objects.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SubmitReviewView(generics.CreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        listing_id = self.kwargs["listing_id"]
        listing = get_object_or_404(Listing, id=listing_id)

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


class UserFavoritesListView(generics.ListAPIView):
    """Get all favorite listings for the authenticated user"""

    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

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


# --- CONTACT MESSAGE VIEWS ---
class ContactMessageListCreateView(generics.ListCreateAPIView):
    """Create contact messages (public) and list them (admin only)"""
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        """Only admins can see all messages"""
        if self.request.user and self.request.user.is_staff:
            return ContactMessage.objects.all()
        return ContactMessage.objects.none()

    def get_permissions(self):
        """Allow anyone to create, but only admins to list"""
        if self.request.method == "POST":
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def create(self, request, *args, **kwargs):
        """Create a new contact message"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


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
