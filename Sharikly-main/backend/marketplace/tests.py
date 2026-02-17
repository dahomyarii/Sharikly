"""
Basic API tests for auth, listings, and bookings.
Run: python manage.py test marketplace
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()


class ListingsAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_listings_list_returns_200(self):
        response = self.client.get("/api/listings/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

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
            "password": "SecurePass123!",
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
            password="SecurePass123!",
            is_email_verified=True,
        )
        response = self.client.post(
            "/api/auth/token/",
            {"email": "tokenuser@example.com", "password": "SecurePass123!"},
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
            password="SecurePass123!",
            is_email_verified=True,
        )
        self.client.force_authenticate(user=user)
        response = self.client.get("/api/bookings/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
