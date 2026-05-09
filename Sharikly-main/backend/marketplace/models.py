from typing import Any
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
import random

User = get_user_model()


# ==========================
# CATEGORY
# ==========================
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(
        max_length=50, blank=True, null=True
    )  # For storing icon name or emoji

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


# ==========================
# LISTINGS
# ==========================
class Listing(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="listings")
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, related_name="listings"
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    price_per_day = models.DecimalField(max_digits=8, decimal_places=2)
    city = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True, help_text="Inactive listings are hidden from search and public detail; owner can still see and reactivate.")
    
    # Location picker fields
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    pickup_radius_m = models.IntegerField(default=300, validators=[MinValueValidator(100), MaxValueValidator(2000)])
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["owner", "created_at"]),
            models.Index(fields=["is_active", "created_at"]),
            models.Index(fields=["is_active", "price_per_day"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        """Slightly randomize coordinates for privacy (±~150m)"""
        if self.latitude is not None and self.longitude is not None:
            # ~150m randomization in degrees (~0.00135 degrees ≈ 150m at equator)
            self.latitude += random.uniform(-0.00135, 0.00135)
            self.longitude += random.uniform(-0.00135, 0.00135)
        super().save(*args, **kwargs)

    # Average rating helper (optional)
    @property
    def average_rating(self):
        reviews = self.reviews.all()
        if not reviews.exists():
            return 0
        return round(sum(r.rating for r in reviews) / reviews.count(), 1)


class ListingImage(models.Model):
    listing = models.ForeignKey(
        Listing, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="listing_images/")
    position = models.PositiveIntegerField(
        default=0,
        help_text="Display order (0 = cover). Smaller numbers appear first.",
    )

    class Meta:
        ordering = ["position", "id"]

    def __str__(self):
        return f"Image for {self.listing.title}"


# ==========================
# BOOKINGS
# ==========================
class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", _("Pending")
        CONFIRMED = "CONFIRMED", _("Confirmed")
        DECLINED = "DECLINED", _("Declined")
        CANCELLED = "CANCELLED", _("Cancelled")

    class PaymentStatus(models.TextChoices):
        PENDING = "PENDING", _("Pending")
        PAID = "PAID", _("Paid")
        REFUNDED = "REFUNDED", _("Refunded")

    listing = models.ForeignKey(
        Listing, on_delete=models.CASCADE, related_name="bookings"
    )
    renter = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bookings")
    start_date = models.DateField()
    end_date = models.DateField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        blank=True,
    )
    stripe_payment_id = models.CharField(
        max_length=255, blank=True, null=True
    )  # Stripe PaymentIntent or Session id
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Booking for {self.listing.title} by {self.renter.email}"


class AvailabilityBlock(models.Model):
    """
    Owner-defined blackout window where the listing cannot be booked (e.g. maintenance, personal use).
    These windows are merged with bookings when computing availability.
    """

    listing = models.ForeignKey(
        Listing, on_delete=models.CASCADE, related_name="availability_blocks"
    )
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["start_date"]

    def __str__(self):
        return f"Block for {self.listing.title}: {self.start_date} → {self.end_date}"


# ==========================
# CHAT SYSTEM
# ==========================
class ChatRoom(models.Model):
    participants = models.ManyToManyField(User, related_name="chat_rooms")
    # Optional listing context – when a conversation is started from a listing.
    listing = models.ForeignKey(
        Listing,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="chat_rooms",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Room {self.id}"


class Message(models.Model):
    room = models.ForeignKey(
        ChatRoom, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_messages"
    )
    text = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to="chat_images/", blank=True, null=True)
    audio = models.FileField(upload_to="chat_audio/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Message from {self.sender.username} in Room {self.room.id}"


class ParticipantLastRead(models.Model):
    """Tracks when a user last read messages in a chat room (for unread count)."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chat_last_read")
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="last_read_by")
    last_read_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "room")

    def __str__(self):
        return f"{self.user_id} read room {self.room_id} at {self.last_read_at}"


# ==========================
# FAVORITES
# ==========================
class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorites")
    listing = models.ForeignKey(
        Listing, on_delete=models.CASCADE, related_name="favorited_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "listing")

    def __str__(self):
        return f"{self.user.email} {self.listing.title}"


# ==========================
# REVIEWS (Rating + Comments)
# ==========================
class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews")
    listing = models.ForeignKey(
        Listing, on_delete=models.CASCADE, related_name="reviews"
    )
    rating = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        help_text="Rating must be between 0 and 5"
    )  # 0–5 stars
    comment = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("user", "listing")

    def __str__(self):
        return f"{self.rating}★ by {self.user.email} on {self.listing.title}"


# ==========================
# REVIEW VOTES (Helpful/Not Helpful)
# ==========================
class ReviewVote(models.Model):
    class VoteType(models.TextChoices):
        HELPFUL = "HELPFUL", _("Helpful")
        NOT_HELPFUL = "NOT_HELPFUL", _("Not Helpful")

    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="votes")
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="review_votes"
    )
    vote_type = models.CharField(max_length=20, choices=VoteType.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("review", "user")  # one vote per user per review

    def __str__(self):
        return f"{self.vote_type} vote by {self.user.email} on Review {self.review.id}"


# ==========================
# REPORTS (Listing or User)
# ==========================
class Report(models.Model):
    class Reason(models.TextChoices):
        SPAM = "SPAM", _("Spam")
        INAPPROPRIATE = "INAPPROPRIATE", _("Inappropriate content")
        SCAM = "SCAM", _("Scam or fraud")
        HARASSMENT = "HARASSMENT", _("Harassment")
        OTHER = "OTHER", _("Other")

    reporter = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="reports_made"
    )
    listing = models.ForeignKey(
        Listing, on_delete=models.CASCADE, null=True, blank=True, related_name="reports"
    )
    reported_user = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, blank=True, related_name="reports_against"
    )
    reason = models.CharField(max_length=20, choices=Reason.choices)
    details = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        if self.listing_id:
            return f"Report on listing {self.listing_id} by {self.reporter.email}"
        return f"Report on user {self.reported_user_id} by {self.reporter.email}"


# ==========================
# BLOCKED USERS
# ==========================
class BlockedUser(models.Model):
    blocker = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="blocked_users"
    )
    blocked = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="blocked_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("blocker", "blocked")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.blocker.email} blocks {self.blocked.email}"


 
# ==========================
# USER TO ADMIN MESSAGES
# ==========================
class UserAdminMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="admin_messages")
    subject = models.CharField(max_length=200)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    admin_response = models.TextField(blank=True, null=True)
    admin_response_date = models.DateTimeField(blank=True, null=True)
    responded = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Message from {self.user.email}: {self.subject}"


# ==========================
# NOTIFICATIONS
# ==========================
class Notification(models.Model):
    class NotificationType(models.TextChoices):
        BOOKING_ACCEPTED = "BOOKING_ACCEPTED", _("Booking accepted")
        BOOKING_DECLINED = "BOOKING_DECLINED", _("Booking declined")
        BOOKING_CANCELLED = "BOOKING_CANCELLED", _("Booking cancelled")
        NEW_MESSAGE = "NEW_MESSAGE", _("New message")

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications"
    )
    notification_type = models.CharField(
        max_length=30, choices=NotificationType.choices
    )
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    link = models.CharField(max_length=500, blank=True)  # e.g. /bookings or /chat/123
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} for {self.user.email}"


class NotificationPreference(models.Model):
    """
    User notification preferences.
    - inapp_* controls whether we create in-app Notification rows.
    - email_* controls whether we send transactional emails (non-payment).
    """

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="notification_preferences")
    inapp_booking_updates = models.BooleanField(default=True)
    inapp_messages = models.BooleanField(default=True)
    email_booking_updates = models.BooleanField(default=True)
    email_messages = models.BooleanField(default=False)
    earnings_updates = models.BooleanField(default=True)
    promotions_updates = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Notification prefs for {self.user.email}"


# ==========================
# PAYMENT METHODS
# ==========================
class PaymentMethod(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payment_methods")
    card_last4 = models.CharField(max_length=4)
    brand = models.CharField(max_length=50) # e.g. Visa, MasterCard
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_default", "-created_at"]

    def __str__(self):
        return f"{self.brand} ending in {self.card_last4} for {self.user.email}"


# ==========================
# HOST PREFERENCES
# ==========================
class HostPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="host_preferences")
    smart_pricing = models.BooleanField(default=False)
    instant_booking = models.BooleanField(default=False)
    default_deposit = models.DecimalField(max_digits=8, decimal_places=2, default=500.00)
    availability_defaults = models.CharField(max_length=100, default="ALWAYS_AVAILABLE")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Host prefs for {self.user.email}"



# ==========================
# CONTACT MESSAGES
# ==========================
class ContactMessage(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    admin_response = models.TextField(blank=True, null=True)
    admin_response_date = models.DateTimeField(blank=True, null=True)
    responded = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Message from {self.name} ({self.email})"


# ==========================
# BLOG POSTS
# ==========================
class BlogPost(models.Model):
    CATEGORY_CHOICES = [
        ('tips', 'Tips & Guides'),
        ('news', 'News'),
        ('stories', 'Stories'),
        ('featured', 'Featured'),
        ('tutorial', 'Tutorial'),
    ]
    
    title = models.CharField(max_length=300)
    slug = models.SlugField(unique=True, blank=True)
    excerpt = models.TextField(max_length=500)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="blog_posts")
    featured_image = models.ImageField(upload_to="blog_images/", blank=True, null=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='tips')
    tags = models.CharField(max_length=500, blank=True, help_text="Comma-separated tags")
    
    # SEO & Meta
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.CharField(max_length=500, blank=True)
    meta_keywords = models.CharField(max_length=500, blank=True)
    
    # Status & Publishing
    published = models.BooleanField(default=False)
    featured = models.BooleanField(default=False)
    views_count = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_date = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ["-published_date", "-created_at"]
        verbose_name = "Blog Post"
        verbose_name_plural = "Blog Posts"
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        """Auto-generate slug from title"""
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.title)
        
        # Set published_date when publishing
        if self.published and not self.published_date:
            from django.utils import timezone
            self.published_date = timezone.now()
        
        super().save(*args, **kwargs)


# ==========================
# SAVED SEARCHES
# ==========================
class SavedSearch(models.Model):
    """
    A saved search stores the original query string the user used on the listings page.
    We keep it lightweight and reuse the existing listings filters on the frontend.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="saved_searches",
    )
    # Raw query string starting with "?" (e.g. "?search=bike&city=Riyadh")
    query = models.CharField(max_length=1000)
    # Optional human-friendly label; if empty the UI can derive it from filters.
    label = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.label or f"Search #{self.pk} for {self.user.email}"
