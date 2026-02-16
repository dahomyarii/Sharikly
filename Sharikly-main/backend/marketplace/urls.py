# marketplace/urls.py
from django.urls import path, include
from rest_framework import routers  # ✅ Correct
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

router = routers.DefaultRouter()
router.register(r"reviews", views.ReviewViewSet, basename="review")

urlpatterns = [
    # Auth
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/me/", views.MeView.as_view(), name="me"),
    path("auth/verify-email/", views.VerifyEmailView.as_view(), name="verify_email"),
    path("users/<int:pk>/", views.PublicUserView.as_view(), name="public_user"),
    path(
        "auth/token/",
        views.CustomTokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/change-password/", views.ChangePasswordView.as_view(), name="change_password"),
    path("auth/delete-account/", views.DeleteAccountView.as_view(), name="delete_account"),
    # Chat
    path("chat/rooms/", views.ChatRoomListCreateView.as_view(), name="chat_rooms"),
    path("chat/messages/", views.SendMessageView.as_view(), name="chat_messages"),
    path(
        "chat/messages/<int:room_id>/",
        views.MessageListView.as_view(),
        name="chat_messages_list",
    ),
    # Listings & Categories
    path("categories/", views.CategoryListView.as_view(), name="categories"),
    path("listings/", views.ListingListCreateView.as_view(), name="listings"),
    path(
        "listings/<int:pk>/",
        views.ListingRetrieveUpdateView.as_view(),
        name="listing_detail",
    ),
    # Bookings
    path("bookings/", views.BookingListCreateView.as_view(), name="bookings"),
    # Favorites
    path("favorites/", views.UserFavoritesListView.as_view(), name="user_favorites"),
    path(
        "listings/<int:listing_id>/favorite/",
        views.AddFavoriteView.as_view(),
        name="add_favorite",
    ),
    path(
        "listings/<int:listing_id>/unfavorite/",
        views.RemoveFavoriteView.as_view(),
        name="remove_favorite",
    ),
    # Submit review
    path(
        "listings/<int:listing_id>/reviews/",
        views.SubmitReviewView.as_view(),
        name="submit_review",
    ),
    # Review Votes (Helpful / Not Helpful)
    path(
        "reviews/<int:review_id>/vote/",
        views.ReviewVoteView.as_view(),
        name="review_vote",
    ),
    # Contact Messages
    path(
        "contact-messages/",
        views.ContactMessageListCreateView.as_view(),
        name="contact_messages",
    ),
    path(
        "contact-messages/<int:pk>/",
        views.ContactMessageDetailView.as_view(),
        name="contact_message_detail",
    ),
    # User to Admin Messages
    path(
        "user-admin-messages/",
        views.UserAdminMessageListCreateView.as_view(),
        name="user_admin_messages",
    ),
    path(
        "user-admin-messages/<int:pk>/",
        views.UserAdminMessageDetailView.as_view(),
        name="user_admin_message_detail",
    ),
    # Blog Posts
    path(
        "blog/",
        views.BlogPostListCreateView.as_view(),
        name="blog_list",
    ),
    path(
        "blog/<int:pk>/",
        views.BlogPostDetailView.as_view(),
        name="blog_detail",
    ),
    # Include router URLs
    path("", include(router.urls)),
]
