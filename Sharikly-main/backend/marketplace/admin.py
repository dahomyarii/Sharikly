
from django.contrib import admin
from .models import Listing, Booking, ListingImage, Category, Review, ReviewVote, ContactMessage, UserAdminMessage, BlogPost, Report, BlockedUser, Notification

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

@admin.register(BlockedUser)
class BlockedUserAdmin(admin.ModelAdmin):
    list_display = ("blocker", "blocked", "created_at")
    list_filter = ("created_at",)
    search_fields = ("blocker__email", "blocked__email")
    readonly_fields = ("created_at",)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "notification_type", "title", "read", "created_at")
    list_filter = ("notification_type", "read", "created_at")
    search_fields = ("user__email", "title", "body")
    readonly_fields = ("created_at",)


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("reporter", "listing", "reported_user", "reason", "created_at")
    list_filter = ("reason", "created_at")
    search_fields = ("reporter__email", "details")
    readonly_fields = ("created_at",)
    date_hierarchy = "created_at"

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'created_at', 'responded')
    list_filter = ('responded', 'created_at')
    search_fields = ('name', 'email', 'phone', 'message')
    readonly_fields = ('created_at', 'admin_response_date')
    date_hierarchy = 'created_at'
    fieldsets = (
        ('Contact Information', {
            'fields': ('name', 'email', 'phone')
        }),
        ('Message', {
            'fields': ('message', 'created_at')
        }),
        ('Admin Response', {
            'fields': ('admin_response', 'admin_response_date', 'responded')
        }),
    )

@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'category', 'published', 'featured', 'views_count', 'published_date')
    list_filter = ('published', 'featured', 'category', 'created_at', 'updated_at')
    search_fields = ('title', 'excerpt', 'content', 'author__email', 'author__username', 'tags')
    readonly_fields = ('created_at', 'updated_at', 'views_count', 'published_date', 'slug')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Post Information', {
            'fields': ('title', 'slug', 'excerpt', 'content', 'featured_image')
        }),
        ('Publishing', {
            'fields': ('author', 'published', 'featured', 'published_date')
        }),
        ('Categorization', {
            'fields': ('category', 'tags')
        }),
        ('SEO & Meta', {
            'fields': ('meta_title', 'meta_description', 'meta_keywords'),
            'classes': ('collapse',),
            'description': 'Fields for search engine optimization'
        }),
        ('Statistics', {
            'fields': ('views_count',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(UserAdminMessage)
class UserAdminMessageAdmin(admin.ModelAdmin):
    list_display = ('user', 'subject', 'created_at', 'responded')
    list_filter = ('responded', 'created_at')
    search_fields = ('user__email', 'user__username', 'subject', 'message')
    readonly_fields = ('created_at', 'admin_response_date')
    date_hierarchy = 'created_at'
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Message', {
            'fields': ('subject', 'message', 'created_at')
        }),
        ('Admin Response', {
            'fields': ('admin_response', 'admin_response_date', 'responded')
        }),
    )