
from django.contrib import admin
from .models import User, Listing, Booking, ListingImage, Category, Review, ReviewVote

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

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'listing', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('user__email', 'user__username', 'listing__title', 'comment')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'

@admin.register(ReviewVote)
class ReviewVoteAdmin(admin.ModelAdmin):
    list_display = ('review', 'user', 'vote_type', 'created_at')
    list_filter = ('vote_type', 'created_at')
    search_fields = ('user__email', 'user__username', 'review__comment')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'