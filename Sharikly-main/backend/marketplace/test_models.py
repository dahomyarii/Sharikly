"""
Tests for marketplace models.
Run: python manage.py test marketplace.tests marketplace.test_models
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from decimal import Decimal
from datetime import date, timedelta

from .models import (
    Category,
    Listing,
    ListingImage,
    Booking,
    Review,
    Favorite,
    Notification,
    ContactMessage,
)

User = get_user_model()


class CategoryModelTests(TestCase):
    def test_str(self):
        cat = Category.objects.create(name="Cameras", description="Camera gear")
        self.assertEqual(str(cat), "Cameras")

    def test_verbose_name_plural(self):
        self.assertEqual(Category._meta.verbose_name_plural, "Categories")


class ListingModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="owner@example.com", username="owner", password="testpass"
        )

    def test_str(self):
        listing = Listing.objects.create(
            owner=self.user,
            title="Canon Lens",
            description="Great lens",
            price_per_day=Decimal("25.00"),
        )
        self.assertEqual(str(listing), "Canon Lens")

    def test_average_rating_empty(self):
        listing = Listing.objects.create(
            owner=self.user,
            title="Lens",
            description="Desc",
            price_per_day=Decimal("20.00"),
        )
        self.assertEqual(listing.average_rating, 0)

    def test_average_rating_with_reviews(self):
        listing = Listing.objects.create(
            owner=self.user,
            title="Lens",
            description="Desc",
            price_per_day=Decimal("20.00"),
        )
        reviewer = User.objects.create_user(
            email="r@example.com", username="reviewer", password="testpass"
        )
        Review.objects.create(
            user=reviewer, listing=listing, rating=4, comment="Good"
        )
        Review.objects.create(
            user=self.user, listing=listing, rating=2, comment="Ok"
        )
        self.assertEqual(listing.average_rating, 3.0)


class BookingModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="u@example.com", username="user", password="testpass"
        )
        self.owner = User.objects.create_user(
            email="o@example.com", username="owner", password="testpass"
        )
        self.listing = Listing.objects.create(
            owner=self.owner,
            title="Lens",
            description="Desc",
            price_per_day=Decimal("30.00"),
        )

    def test_str(self):
        booking = Booking.objects.create(
            listing=self.listing,
            renter=self.user,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=2),
            total_price=Decimal("60.00"),
        )
        self.assertIn("Lens", str(booking))
        self.assertIn(self.user.email, str(booking))

    def test_status_default(self):
        booking = Booking.objects.create(
            listing=self.listing,
            renter=self.user,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=1),
            total_price=Decimal("30.00"),
        )
        self.assertEqual(booking.status, Booking.Status.PENDING)


class ReviewModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="u@example.com", username="user", password="testpass"
        )
        self.listing = Listing.objects.create(
            owner=self.user,
            title="Lens",
            description="Desc",
            price_per_day=Decimal("20.00"),
        )

    def test_str(self):
        review = Review.objects.create(
            user=self.user, listing=self.listing, rating=5, comment="Great"
        )
        self.assertIn("5", str(review))
        self.assertIn(self.user.email, str(review))


class FavoriteModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="u@example.com", username="user", password="testpass"
        )
        self.listing = Listing.objects.create(
            owner=self.user,
            title="Lens",
            description="Desc",
            price_per_day=Decimal("20.00"),
        )

    def test_str(self):
        fav = Favorite.objects.create(user=self.user, listing=self.listing)
        self.assertIn(self.user.email, str(fav))
        self.assertIn("Lens", str(fav))


class NotificationModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="u@example.com", username="user", password="testpass"
        )

    def test_str(self):
        n = Notification.objects.create(
            user=self.user,
            notification_type=Notification.NotificationType.BOOKING_ACCEPTED,
            title="Booking accepted",
            body="Your booking was accepted.",
        )
        self.assertIn("Booking accepted", str(n))


class ContactMessageModelTests(TestCase):
    def test_str(self):
        msg = ContactMessage.objects.create(
            name="Jane",
            email="jane@example.com",
            message="Hello",
        )
        self.assertIn("Jane", str(msg))
        self.assertIn("jane@example.com", str(msg))
