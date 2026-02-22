from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class UserAdmin(UserAdmin):
    list_display = ('email', 'username', 'is_email_verified', 'tap_destination_id', 'is_staff', 'is_active')
    list_filter = ('is_email_verified', 'is_staff', 'is_active')
    fieldsets = list(UserAdmin.fieldsets) + [
        ("Tap Payments (marketplace)", {"fields": ("tap_destination_id",)}),
    ]

