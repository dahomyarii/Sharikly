import os
import django
from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from marketplace.models import Category, Listing, Booking, Review

User = get_user_model()

def seed_rich_data():
    print("Starting rich seeding...")

    # 1. Create standard categories
    categories_data = [
        {"name": "Cameras", "description": "DSLRs, Mirrorless, Cinema and Action Cameras", "icon": "📷"},
        {"name": "Lenses", "description": "Prime, Zoom, Macro and Cinema Lenses", "icon": "🔍"},
        {"name": "Drones", "description": "Professional and consumer aerial drones", "icon": "🚁"},
        {"name": "Audio", "description": "Microphones, recorders, mixers and headphones", "icon": "🎙️"},
        {"name": "Lighting", "description": "LED panels, softboxes, strobe lights and stands", "icon": "💡"},
        {"name": "Gaming", "description": "VR headsets, consoles and accessories", "icon": "🎮"},
        {"name": "Camping", "description": "Tents, sleeping bags, stoves and gear", "icon": "⛺"},
    ]

    categories = {}
    for cat_info in categories_data:
        cat, created = Category.objects.get_or_create(
            name=cat_info["name"],
            defaults={"description": cat_info["description"], "icon": cat_info["icon"]}
        )
        categories[cat_info["name"]] = cat
        if created:
            print(f"Created category: {cat.name}")

    # 2. Get existing users
    users = list(User.objects.all().order_by("id"))
    if not users:
        print("No users found in database! Please register a user first.")
        return

    print(f"Found {len(users)} users in database.")
    
    # Identify key users or use first few
    dahomy = User.objects.filter(username="dahomy").first()
    test_new_user = User.objects.filter(username="test_new_user").first()
    dahomyarii = User.objects.filter(username="dahomyarii@gmail.com").first()

    if not dahomy:
        dahomy = users[0]
    if not test_new_user:
        test_new_user = users[1] if len(users) > 1 else users[0]
    if not dahomyarii:
        dahomyarii = users[2] if len(users) > 2 else users[0]

    print(f"Selected primary host user: {dahomy.username} ({dahomy.email})")
    print(f"Selected secondary host user: {test_new_user.username} ({test_new_user.email})")

    # Clean up existing test bookings/reviews/listings to prevent duplicates (optional, let's keep it safe)
    # Booking.objects.all().delete()
    # Review.objects.all().delete()
    # Listing.objects.exclude(id=1).delete() # keep listing 1

    # 3. Create rich listings for dahomy (primary host)
    dahomy_listings_data = [
        {
            "title": "Sony A7 IV Mirrorless Camera",
            "description": "Powerful 33MP hybrid camera. Great for photography and 4K video. Includes 2 batteries and a charger.",
            "price_per_day": Decimal("150.00"),
            "city": "Riyadh",
            "category": categories["Cameras"],
            "latitude": 24.7136,
            "longitude": 46.6753,
        },
        {
            "title": "DJI Mavic 3 Pro Drone",
            "description": "Triple-camera system drone. Apple ProRes support, 43 min flight time, omnidirectional obstacle sensing.",
            "price_per_day": Decimal("250.00"),
            "city": "Riyadh",
            "category": categories["Drones"],
            "latitude": 24.7236,
            "longitude": 46.6853,
        },
        {
            "title": "Canon RF 70-200mm f/2.8L IS USM Lens",
            "description": "High-performance telephoto zoom lens. Extremely sharp, fast autofocus, 5-stop image stabilization.",
            "price_per_day": Decimal("90.00"),
            "city": "Riyadh",
            "category": categories["Lenses"],
            "latitude": 24.7036,
            "longitude": 46.6653,
        },
    ]

    dahomy_listings = []
    for l_data in dahomy_listings_data:
        listing, created = Listing.objects.get_or_create(
            owner=dahomy,
            title=l_data["title"],
            defaults={
                "description": l_data["description"],
                "price_per_day": l_data["price_per_day"],
                "city": l_data["city"],
                "category": l_data["category"],
                "latitude": l_data["latitude"],
                "longitude": l_data["longitude"],
                "is_active": True,
            }
        )
        dahomy_listings.append(listing)
        if created:
            print(f"Created listing '{listing.title}' for {dahomy.username}")

    # 4. Create rich listings for test_new_user (secondary host)
    test_user_listings_data = [
        {
            "title": "Shure SM7B Vocal Microphone Kit",
            "description": "Cardioid studio vocal microphone. Perfect for podcasting, recording, and broadcasting. Includes Cloudlifter CL-1.",
            "price_per_day": Decimal("60.00"),
            "city": "Jeddah",
            "category": categories["Audio"],
            "latitude": 21.4858,
            "longitude": 39.1925,
        },
        {
            "title": "Meta Quest 3 128GB VR Headset",
            "description": "Next-gen mixed reality VR headset. High-res display, spatial audio, and two Touch Plus controllers.",
            "price_per_day": Decimal("110.00"),
            "city": "Jeddah",
            "category": categories["Gaming"],
            "latitude": 21.4958,
            "longitude": 39.2025,
        },
    ]

    test_user_listings = []
    for l_data in test_user_listings_data:
        listing, created = Listing.objects.get_or_create(
            owner=test_new_user,
            title=l_data["title"],
            defaults={
                "description": l_data["description"],
                "price_per_day": l_data["price_per_day"],
                "city": l_data["city"],
                "category": l_data["category"],
                "latitude": l_data["latitude"],
                "longitude": l_data["longitude"],
                "is_active": True,
            }
        )
        test_user_listings.append(listing)
        if created:
            print(f"Created listing '{listing.title}' for {test_new_user.username}")

    # 5. Create bookings on dahomy's listings (renter is test_new_user or dahomyarii)
    today = timezone.localdate()
    
    bookings_data = [
        # Booking 1: Past Month (May 10 to May 13) - PAID
        {
            "listing": dahomy_listings[0],
            "renter": test_new_user,
            "start_date": today.replace(month=5, day=10),
            "end_date": today.replace(month=5, day=13),
            "total_price": Decimal("450.00"),
            "status": Booking.Status.CONFIRMED,
            "payment_status": Booking.PaymentStatus.PAID,
            "created_at": timezone.now().replace(month=5, day=8),
        },
        # Booking 2: Past Month (May 20 to May 24) - PAID
        {
            "listing": dahomy_listings[1],
            "renter": dahomyarii,
            "start_date": today.replace(month=5, day=20),
            "end_date": today.replace(month=5, day=24),
            "total_price": Decimal("1000.00"),
            "status": Booking.Status.CONFIRMED,
            "payment_status": Booking.PaymentStatus.PAID,
            "created_at": timezone.now().replace(month=5, day=19),
        },
        # Booking 3: This Month (June 5 to June 8) - PAID
        {
            "listing": dahomy_listings[0],
            "renter": dahomyarii,
            "start_date": today.replace(month=6, day=5),
            "end_date": today.replace(month=6, day=8),
            "total_price": Decimal("450.00"),
            "status": Booking.Status.CONFIRMED,
            "payment_status": Booking.PaymentStatus.PAID,
            "created_at": timezone.now().replace(month=6, day=4),
        },
        # Booking 4: This Month (June 12 to June 15) - PAID
        {
            "listing": dahomy_listings[2],
            "renter": test_new_user,
            "start_date": today.replace(month=6, day=12),
            "end_date": today.replace(month=6, day=15),
            "total_price": Decimal("270.00"),
            "status": Booking.Status.CONFIRMED,
            "payment_status": Booking.PaymentStatus.PAID,
            "created_at": timezone.now().replace(month=6, day=10),
        },
        # Booking 5: Active Booking right now! (June 24 to June 27) - PAID
        {
            "listing": dahomy_listings[1],
            "renter": test_new_user,
            "start_date": today.replace(month=6, day=24),
            "end_date": today.replace(month=6, day=27),
            "total_price": Decimal("750.00"),
            "status": Booking.Status.CONFIRMED,
            "payment_status": Booking.PaymentStatus.PAID,
            "created_at": timezone.now().replace(month=6, day=23),
        },
        # Booking 6: Pending request (June 28 to June 30) - PENDING
        {
            "listing": dahomy_listings[0],
            "renter": dahomyarii,
            "start_date": today.replace(month=6, day=28),
            "end_date": today.replace(month=6, day=30),
            "total_price": Decimal("300.00"),
            "status": Booking.Status.PENDING,
            "payment_status": Booking.PaymentStatus.PENDING,
            "created_at": timezone.now().replace(month=6, day=24),
        },
    ]

    for b_data in bookings_data:
        booking, created = Booking.objects.get_or_create(
            listing=b_data["listing"],
            renter=b_data["renter"],
            start_date=b_data["start_date"],
            end_date=b_data["end_date"],
            defaults={
                "total_price": b_data["total_price"],
                "status": b_data["status"],
                "payment_status": b_data["payment_status"],
            }
        )
        if created:
            # Override created_at auto_now_add using update() since Django doesn't let us set it directly on save
            Booking.objects.filter(id=booking.id).update(created_at=b_data["created_at"])
            print(f"Created booking for '{booking.listing.title}' (Renter: {booking.renter.username})")

    # 6. Create bookings on test_new_user's listings (renter is dahomy)
    test_bookings_data = [
        # Booking 1: Past Month (May 15 to May 18) - PAID
        {
            "listing": test_user_listings[0],
            "renter": dahomy,
            "start_date": today.replace(month=5, day=15),
            "end_date": today.replace(month=5, day=18),
            "total_price": Decimal("180.00"),
            "status": Booking.Status.CONFIRMED,
            "payment_status": Booking.PaymentStatus.PAID,
            "created_at": timezone.now().replace(month=5, day=14),
        },
        # Booking 2: This Month (June 10 to June 12) - PAID
        {
            "listing": test_user_listings[1],
            "renter": dahomy,
            "start_date": today.replace(month=6, day=10),
            "end_date": today.replace(month=6, day=12),
            "total_price": Decimal("220.00"),
            "status": Booking.Status.CONFIRMED,
            "payment_status": Booking.PaymentStatus.PAID,
            "created_at": timezone.now().replace(month=6, day=8),
        },
        # Booking 3: Active right now! (June 24 to June 26) - PAID
        {
            "listing": test_user_listings[0],
            "renter": dahomyarii,
            "start_date": today.replace(month=6, day=24),
            "end_date": today.replace(month=6, day=26),
            "total_price": Decimal("120.00"),
            "status": Booking.Status.CONFIRMED,
            "payment_status": Booking.PaymentStatus.PAID,
            "created_at": timezone.now().replace(month=6, day=23),
        },
    ]

    for b_data in test_bookings_data:
        booking, created = Booking.objects.get_or_create(
            listing=b_data["listing"],
            renter=b_data["renter"],
            start_date=b_data["start_date"],
            end_date=b_data["end_date"],
            defaults={
                "total_price": b_data["total_price"],
                "status": b_data["status"],
                "payment_status": b_data["payment_status"],
            }
        )
        if created:
            Booking.objects.filter(id=booking.id).update(created_at=b_data["created_at"])
            print(f"Created booking for '{booking.listing.title}' (Renter: {booking.renter.username})")

    # 7. Create reviews for listings to calculate average ratings
    reviews_data = [
        {"listing": dahomy_listings[0], "user": test_new_user, "rating": 5, "comment": "Excellent camera, clean sensor and great batteries!"},
        {"listing": dahomy_listings[0], "user": dahomyarii, "rating": 4, "comment": "Good hybrid camera, but no card reader included."},
        {"listing": dahomy_listings[1], "user": test_new_user, "rating": 5, "comment": "Amazing drone! Controller screen was very bright."},
        {"listing": test_user_listings[0], "user": dahomy, "rating": 5, "comment": "Best vocal mic, very clean sound!"},
        {"listing": test_user_listings[1], "user": dahomy, "rating": 5, "comment": "Incredible VR experience. Thank you!"},
    ]

    for r_data in reviews_data:
        review, created = Review.objects.get_or_create(
            listing=r_data["listing"],
            user=r_data["user"],
            defaults={"rating": r_data["rating"], "comment": r_data["comment"]}
        )
        if created:
            print(f"Created review for '{review.listing.title}' by {review.user.username}")

    print("Rich seeding finished successfully!")

if __name__ == "__main__":
    seed_rich_data()
