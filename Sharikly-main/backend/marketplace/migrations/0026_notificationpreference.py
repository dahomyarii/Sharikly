from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0025_alter_notification_notification_type"),
    ]

    operations = [
        migrations.CreateModel(
            name="NotificationPreference",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("inapp_booking_updates", models.BooleanField(default=True)),
                ("inapp_messages", models.BooleanField(default=True)),
                ("email_booking_updates", models.BooleanField(default=True)),
                ("email_messages", models.BooleanField(default=False)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="notification_preferences", to="accounts.user")),
            ],
        ),
    ]

