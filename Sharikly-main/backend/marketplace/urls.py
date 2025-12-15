# marketplace/urls.py
from django.urls import path, include
from rest_framework import routers   # ✅ Correct
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

router = routers.DefaultRouter()
router.register(r'reviews', views.ReviewViewSet, basename='review')

urlpatterns = [
    # Auth
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/me/', views.MeView.as_view(), name='me'),
    path('auth/token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Chat
    path('chat/rooms/', views.ChatRoomListCreateView.as_view(), name='chat_rooms'),
    path('chat/messages/', views.SendMessageView.as_view(), name='chat_messages'),
    path('chat/messages/<int:room_id>/', views.MessageListView.as_view(), name='chat_messages_list'),

    # ListingsListingListCreateView
    path('listings/', views.ListingListCreateView.as_view(), name='listings'),
    path('listings/<int:pk>/', views.ListingRetrieveUpdateView.as_view(), name='listing_detail'),

    # Bookings
    path('bookings/', views.BookingListCreateView.as_view(), name='bookings'),

    # Favorites
    path('favorites/', views.UserFavoritesListView.as_view(), name='user_favorites'),
    path('listings/<int:listing_id>/favorite/', views.AddFavoriteView.as_view(), name='add_favorite'),
    path('listings/<int:listing_id>/unfavorite/', views.RemoveFavoriteView.as_view(), name='remove_favorite'),

    # Submit review
    path('listings/<int:listing_id>/reviews/', views.SubmitReviewView.as_view(), name='submit_review'),

    # Helpful / Not Helpful
    # path('reviews/<int:review_id>/helpful/', views.MarkReviewHelpfulView.as_view(), name='mark_review_helpful'),
    # path('reviews/<int:review_id>/not_helpful/', views.MarkReviewNotHelpfulView.as_view(), name='mark_review_not_helpful'),
    
    # Include router URLs
    path('', include(router.urls)),
]
