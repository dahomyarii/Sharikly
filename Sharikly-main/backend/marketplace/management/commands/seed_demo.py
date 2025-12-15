
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from marketplace.models import Listing, ListingImage
from django.core.files.base import ContentFile

User = get_user_model()

HERO_PLACEHOLDER = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x10\x00\x00\x00\x10\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x06bKGD\x00\xff\x00\xff\x00\xff\xa0\xbd\xa7\x93\x00\x00\x00\x19tEXtSoftware\x00python generator\xdd\x9e\x1e\x17\x00\x00\x00CIDAT8\x8dcd``\xf8\xcf\xc0\xc0\xc0\xf0\x9f\x81\x81\x01\x88\x19\x18\x18\x00\x00\x1d\x1a\x03\x04\xfc\x93\x87\xb7\x00\x00\x00\x00IEND\xaeB`\x82'

class Command(BaseCommand):
    help = "Seed demo data (admin, demo user, a few listings)."

    def handle(self, *args, **kwargs):
        if not User.objects.filter(email='admin@example.com').exists():
            User.objects.create_superuser(username='admin', email='admin@example.com', password='admin123')
        if not User.objects.filter(email='demo@example.com').exists():
            User.objects.create_user(username='demo', email='demo@example.com', password='demo123')

        demo = User.objects.get(email='demo@example.com')

        if Listing.objects.count() == 0:
            for i in range(6):
                l = Listing.objects.create(
                    owner=demo,
                    title=f"Camera Lens {i+1}",
                    description="High-quality lens perfect for events and portraits.",
                    price_per_day=25 + i * 5,
                    city="Riyadh"
                )
                img = ListingImage(listing=l)
                img.image.save(f"placeholder_{i}.png", ContentFile(HERO_PLACEHOLDER), save=True)

        self.stdout.write(self.style.SUCCESS("Seeded demo data."))
