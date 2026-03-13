"""
Integration tests for marketplace views (imports views module for coverage).
Run: python manage.py test marketplace.test_views
"""
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from datetime import timedelta

# Import views so the module is covered by tests
from . import views  # noqa: F401
from .models import Booking, Category, Listing, Review
from django.contrib.auth import get_user_model

User = get_user_model()


class ViewIntegrationTests(TestCase):
    """Tests that exercise views via URL config."""

    def setUp(self):
        self.client = APIClient()

    def test_categories_list_returns_200(self):
        response = self.client.get("/api/categories/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_listings_list_returns_200(self):
        response = self.client.get("/api/listings/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_listing_detail_returns_404_when_missing(self):
        response = self.client.get("/api/listings/99999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class EarningsViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name="Cameras")

        self.owner = User.objects.create_user(
            email="owner@example.com",
            username="owner",
            password="testpass",
            is_email_verified=True,
        )
        self.owner_two = User.objects.create_user(
            email="owner2@example.com",
            username="owner2",
            password="testpass",
            is_email_verified=True,
        )
        self.renter = User.objects.create_user(
            email="renter@example.com",
            username="renter",
            password="testpass",
            is_email_verified=True,
        )
        self.renter_two = User.objects.create_user(
            email="renter2@example.com",
            username="renter2",
            password="testpass",
            is_email_verified=True,
        )

        self.listing = Listing.objects.create(
            owner=self.owner,
            category=self.category,
            title="Sony A7 Camera",
            description="Mirrorless camera",
            price_per_day=Decimal("200.00"),
        )
        self.second_listing = Listing.objects.create(
            owner=self.owner,
            category=self.category,
            title="Tripod Kit",
            description="Tripod",
            price_per_day=Decimal("40.00"),
        )
        self.competitor_listing = Listing.objects.create(
            owner=self.owner_two,
            category=self.category,
            title="Lighting Set",
            description="Studio lights",
            price_per_day=Decimal("250.00"),
        )

        self.current_booking = Booking.objects.create(
            listing=self.listing,
            renter=self.renter,
            start_date=timezone.localdate(),
            end_date=timezone.localdate() + timedelta(days=2),
            total_price=Decimal("1200.00"),
            status=Booking.Status.CONFIRMED,
            payment_status=Booking.PaymentStatus.PAID,
        )
        self.old_booking = Booking.objects.create(
            listing=self.second_listing,
            renter=self.renter_two,
            start_date=timezone.localdate() - timedelta(days=60),
            end_date=timezone.localdate() - timedelta(days=57),
            total_price=Decimal("300.00"),
            status=Booking.Status.CONFIRMED,
            payment_status=Booking.PaymentStatus.PAID,
        )
        self.competitor_booking = Booking.objects.create(
            listing=self.competitor_listing,
            renter=self.renter,
            start_date=timezone.localdate(),
            end_date=timezone.localdate() + timedelta(days=1),
            total_price=Decimal("1800.00"),
            status=Booking.Status.CONFIRMED,
            payment_status=Booking.PaymentStatus.PAID,
        )
        self.unpaid_booking = Booking.objects.create(
            listing=self.listing,
            renter=self.renter_two,
            start_date=timezone.localdate(),
            end_date=timezone.localdate() + timedelta(days=1),
            total_price=Decimal("999.00"),
            status=Booking.Status.CONFIRMED,
            payment_status=Booking.PaymentStatus.PENDING,
        )

        current_month = timezone.now().replace(day=5, hour=12, minute=0, second=0, microsecond=0)
        older_month = (current_month - timedelta(days=45)).replace(hour=12, minute=0, second=0, microsecond=0)
        Booking.objects.filter(pk=self.current_booking.pk).update(created_at=current_month)
        Booking.objects.filter(pk=self.competitor_booking.pk).update(created_at=current_month)
        Booking.objects.filter(pk=self.unpaid_booking.pk).update(created_at=current_month)
        Booking.objects.filter(pk=self.old_booking.pk).update(created_at=older_month)

        Review.objects.create(user=self.renter, listing=self.listing, rating=5, comment="Amazing")
        Review.objects.create(user=self.renter_two, listing=self.second_listing, rating=4, comment="Good")
        Review.objects.create(user=self.owner, listing=self.competitor_listing, rating=5, comment="Excellent")

    def test_earnings_dashboard_requires_auth(self):
        response = self.client.get("/api/earnings/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_earnings_dashboard_returns_aggregated_data(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.get("/api/earnings/dashboard/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["summary"]["total_earnings"], "1500.00")
        self.assertEqual(response.data["summary"]["this_month_earnings"], "1200.00")
        self.assertEqual(response.data["summary"]["rentals_count"], 2)
        self.assertEqual(response.data["summary"]["rating"], 4.5)
        self.assertEqual(response.data["summary"]["highest_earning_item"]["title"], "Sony A7 Camera")
        self.assertEqual(response.data["leaderboards"]["top_lessors_this_month"][0]["username"], "owner2")
        self.assertEqual(response.data["leaderboards"]["top_renters_this_month"][0]["username"], "renter")

    def test_public_community_earnings_returns_social_proof_stats(self):
        response = self.client.get("/api/earnings/public/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_lessor_earnings"], "3300.00")
        self.assertEqual(len(response.data["highest_earning_lessors_per_month"]), 2)
        self.assertEqual(
            response.data["homepage"]["headline"],
            "How much does the platform community earn?",
        )

    def test_earnings_calculator_projects_annual_revenue(self):
        response = self.client.post(
            "/api/earnings/calculator/",
            {"products_count": 3, "daily_rental_price": "200.00"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["monthly_earnings"], "1500.00")
        self.assertEqual(response.data["annual_earnings"], "18000.00")
