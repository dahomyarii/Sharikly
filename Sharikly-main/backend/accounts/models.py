from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    email = models.EmailField(_("email address"), unique=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)
    # Tap Payments marketplace: destination_id for receiving 85% of rental payments (15% platform fee)
    tap_destination_id = models.CharField(max_length=64, blank=True, null=True)

    # New preference fields
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    language = models.CharField(max_length=10, default="en")
    payout_bank = models.CharField(max_length=100, blank=True, null=True)
    payout_schedule = models.CharField(max_length=20, default="WEEKLY")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email or self.username

