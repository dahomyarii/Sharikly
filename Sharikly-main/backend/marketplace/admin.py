
from django.contrib import admin
from .models import User, Listing, Booking, ListingImage, category

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'username', 'is_staff')

class ListingImageInline(admin.TabularInline):
    model = ListingImage
    extra = 0

@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'price_per_day', 'city', 'created_at')
    search_fields = ('title','description','city')
    inlines = [ListingImageInline]

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('listing', 'renter', 'start_date', 'end_date', 'status')
    list_filter = ('status',)

@admin.register(category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)