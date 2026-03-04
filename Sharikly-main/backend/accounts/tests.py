"""
Tests for accounts app: tokens and email verification flow.
Run: python manage.py test accounts
"""
from django.test import TestCase
from django.contrib.auth import get_user_model

from .tokens import email_verification_token, password_reset_token

User = get_user_model()

# Test-only auth string (not a production secret)
TEST_AUTH_STRING = "testpass"


class EmailVerificationTokenTests(TestCase):
    """Test EmailVerificationTokenGenerator make_token and check_token."""

    def test_make_and_check_token_success(self):
        user = User.objects.create_user(
            email="verify@example.com",
            username="verifyuser",
            password=TEST_AUTH_STRING,
            is_email_verified=False,
        )
        token = email_verification_token.make_token(user)
        self.assertTrue(email_verification_token.check_token(user, token))

    def test_check_token_fails_for_different_user(self):
        user1 = User.objects.create_user(
            email="u1@example.com", username="u1", password="testpass"
        )
        user2 = User.objects.create_user(
            email="u2@example.com", username="u2", password="testpass"
        )
        token = email_verification_token.make_token(user1)
        self.assertFalse(email_verification_token.check_token(user2, token))

    def test_check_token_fails_for_invalid_token(self):
        user = User.objects.create_user(
            email="u@example.com", username="u", password="testpass"
        )
        self.assertFalse(email_verification_token.check_token(user, "invalid-token"))


class PasswordResetTokenTests(TestCase):
    """Test PasswordResetTokenGenerator make_token and check_token."""

    def test_make_and_check_token_success(self):
        user = User.objects.create_user(
            email="reset@example.com",
            username="resetuser",
            password=TEST_AUTH_STRING,
        )
        token = password_reset_token.make_token(user)
        self.assertTrue(password_reset_token.check_token(user, token))

    def test_check_token_fails_for_invalid_token(self):
        user = User.objects.create_user(
            email="u@example.com", username="u", password="testpass"
        )
        self.assertFalse(password_reset_token.check_token(user, "bad"))
