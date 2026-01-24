from typing import Any
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
import random


# ==========================
# USER
# ==========================
class User(AbstractUser):
    email = models.EmailField(_("email address"), unique=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    bio = models.TextField(blank=True, null=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email or self.username


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
    
    # Location picker fields
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    pickup_radius_m = models.IntegerField(default=300, validators=[MinValueValidator(100), MaxValueValidator(2000)])
    
    created_at = models.DateTimeField(auto_now_add=True)

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
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Booking for {self.listing.title} by {self.renter.email}"


# ==========================
# CHAT SYSTEM
# ==========================
class ChatRoom(models.Model):
    participants = models.ManyToManyField(User, related_name="chat_rooms")
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
