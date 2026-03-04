"""
Integration tests for marketplace views (imports views module for coverage).
Run: python manage.py test marketplace.test_views
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

# Import views so the module is covered by tests
from . import views  # noqa: F401


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
