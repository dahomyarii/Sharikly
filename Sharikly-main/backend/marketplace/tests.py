"""
Basic API tests for auth, listings, and bookings.
Run: python manage.py test marketplace
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

# Test-only auth string for API tests (not a production secret)
TEST_AUTH_STRING = "SecurePass123!"


class ListingsAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_listings_list_returns_200(self):
        response = self.client.get("/api/listings/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # API may return list or paginated { count, next, previous, results }
        if isinstance(response.data, list):
            return
        self.assertIsInstance(response.data, dict)
        self.assertIn("results", response.data)
        self.assertIsInstance(response.data["results"], list)

    def test_listings_list_accepts_query_params(self):
        response = self.client.get(
            "/api/listings/",
            {"search": "camera", "category": "1", "order": "newest"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class AuthAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_returns_201(self):
        payload = {
            "email": "newuser@example.com",
            "username": "newuser",
            "password": TEST_AUTH_STRING,
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", response.data)
        self.assertEqual(response.data["email"], payload["email"])
        user = User.objects.get(email=payload["email"])
        self.assertFalse(user.is_email_verified)

    def test_token_returns_200_with_valid_credentials(self):
        user = User.objects.create_user(
            email="tokenuser@example.com",
            username="tokenuser",
            password=TEST_AUTH_STRING,
            is_email_verified=True,
        )
        response = self.client.post(
            "/api/auth/token/",
            {"email": "tokenuser@example.com", "password": TEST_AUTH_STRING},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)


class BookingsAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_bookings_list_requires_auth(self):
        response = self.client.get("/api/bookings/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_bookings_list_returns_200_when_authenticated(self):
        user = User.objects.create_user(
            email="booker@example.com",
            username="booker",
            password=TEST_AUTH_STRING,
            is_email_verified=True,
        )
        self.client.force_authenticate(user=user)
        response = self.client.get("/api/bookings/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # API may return list or paginated { count, next, previous, results }
        if isinstance(response.data, list):
            return
        self.assertIsInstance(response.data, dict)
        self.assertIn("results", response.data)
        self.assertIsInstance(response.data["results"], list)

    def test_bookings_list_role_renter_excludes_host_rows(self):
        from marketplace.models import Booking, Listing

        owner = User.objects.create_user(
            email="owner@example.com",
            username="owner",
            password=TEST_AUTH_STRING,
            is_email_verified=True,
        )
        renter = User.objects.create_user(
            email="renteronly@example.com",
            username="renteronly",
            password=TEST_AUTH_STRING,
            is_email_verified=True,
        )
        listing = Listing.objects.create(
            owner=owner,
            title="Host item",
            description="d",
            price_per_day="10.00",
            city="Riyadh",
        )
        Booking.objects.create(
            listing=listing,
            renter=renter,
            start_date="2026-04-01",
            end_date="2026-04-02",
            total_price="20.00",
        )
        self.client.force_authenticate(user=owner)
        r_all = self.client.get("/api/bookings/")
        self.assertEqual(r_all.status_code, status.HTTP_200_OK)
        results_all = (
            r_all.data
            if isinstance(r_all.data, list)
            else r_all.data.get("results", [])
        )
        self.assertEqual(len(results_all), 1)

        r_renter = self.client.get("/api/bookings/", {"role": "renter"})
        results_r = (
            r_renter.data
            if isinstance(r_renter.data, list)
            else r_renter.data.get("results", [])
        )
        self.assertEqual(len(results_r), 0)

        self.client.force_authenticate(user=renter)
        r_host = self.client.get("/api/bookings/", {"role": "host"})
        results_h = (
            r_host.data
            if isinstance(r_host.data, list)
            else r_host.data.get("results", [])
        )
        self.assertEqual(len(results_h), 0)

        r_renter2 = self.client.get("/api/bookings/", {"role": "renter"})
        results_r2 = (
            r_renter2.data
            if isinstance(r_renter2.data, list)
            else r_renter2.data.get("results", [])
        )
        self.assertEqual(len(results_r2), 1)
