from __future__ import annotations

from datetime import date
from decimal import Decimal
from math import ceil

from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Sum
from django.db.models.functions import Coalesce, TruncDay, TruncMonth
from django.utils import timezone

from .models import Booking, Listing, Review
from .serializers import _compute_user_response_stats

User = get_user_model()

ZERO_DECIMAL = Decimal("0.00")


def _decimal(value) -> Decimal:
    if value is None:
        return ZERO_DECIMAL
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def _avatar_url(user, request=None):
    avatar = getattr(user, "avatar", None)
    if not avatar:
        return None

    try:
        url = avatar.url
    except Exception:
        return None

    if request is not None:
        try:
            return request.build_absolute_uri(url)
        except Exception:
            return url
    return url


def _format_chart_label(value: date, granularity: str) -> str:
    if granularity == "daily":
        return value.strftime("%d %b")
    return value.strftime("%b %Y")


def _owner_paid_bookings(user):
    return Booking.objects.filter(
        listing__owner=user,
        payment_status=Booking.PaymentStatus.PAID,
    ).select_related("listing", "renter")


def _month_bounds():
    today = timezone.localdate()
    month_start = today.replace(day=1)
    return today, month_start


def _build_chart_points(queryset, granularity: str):
    trunc_function = TruncDay("created_at") if granularity == "daily" else TruncMonth("created_at")
    bucket_key = "day" if granularity == "daily" else "month"
    raw_points = (
        queryset.annotate(bucket=trunc_function)
        .values("bucket")
        .annotate(earnings=Coalesce(Sum("total_price"), ZERO_DECIMAL))
        .order_by("bucket")
    )

    points = []
    for point in raw_points:
        bucket = point.get("bucket")
        if bucket is None:
            continue
        bucket_date = bucket.date() if hasattr(bucket, "date") else bucket
        points.append(
            {
                bucket_key: bucket_date,
                "label": _format_chart_label(bucket_date, granularity),
                "earnings": _decimal(point.get("earnings")),
            }
        )
    return points


def _build_highest_earning_item(user):
    listings = list(Listing.objects.filter(owner=user).prefetch_related("bookings"))
    if not listings:
        return None

    ranking = []
    for listing in listings:
        paid_bookings = [
            booking
            for booking in listing.bookings.all()
            if booking.payment_status == Booking.PaymentStatus.PAID
        ]
        total_earnings = sum((_decimal(booking.total_price) for booking in paid_bookings), ZERO_DECIMAL)
        ranking.append(
            {
                "id": listing.id,
                "title": listing.title,
                "total_earnings": total_earnings,
                "rentals_count": len(paid_bookings),
            }
        )

    listing_data = sorted(
        ranking,
        key=lambda item: (-item["total_earnings"], -item["rentals_count"], item["title"].lower()),
    )[0]

    return {
        "id": listing_data["id"],
        "title": listing_data["title"],
        "total_earnings": _decimal(listing_data["total_earnings"]),
        "rentals_count": int(listing_data["rentals_count"]),
    }


def _owner_monthly_earnings_map(month_start):
    monthly_rows = (
        Booking.objects.filter(payment_status=Booking.PaymentStatus.PAID, created_at__date__gte=month_start)
        .values("listing__owner")
        .annotate(monthly_earnings=Coalesce(Sum("total_price"), ZERO_DECIMAL))
    )
    return {row["listing__owner"]: _decimal(row["monthly_earnings"]) for row in monthly_rows}


def _owners_with_listings():
    return list(
        User.objects.filter(listings__isnull=False)
        .distinct()
        .order_by("id")
    )


def _owner_average_rating(owner):
    rating = (
        Review.objects.filter(listing__owner=owner)
        .aggregate(avg=Avg("rating"))
        .get("avg")
    )
    return round(float(rating or 0), 1)


def _current_month_booking_count_for_owner(owner, month_start):
    return Booking.objects.filter(
        listing__owner=owner,
        payment_status=Booking.PaymentStatus.PAID,
        created_at__date__gte=month_start,
    ).count()


def _leaderboard_entry(owner, monthly_earnings, month_start, request=None):
    return {
        "id": owner.id,
        "username": owner.username,
        "avatar": _avatar_url(owner, request),
        "monthly_earnings": _decimal(monthly_earnings),
        "rentals_count": _current_month_booking_count_for_owner(owner, month_start),
        "rating": _owner_average_rating(owner),
    }


def _top_lessors_this_month(month_start, request=None, limit=3):
    owner_map = {owner.id: owner for owner in _owners_with_listings()}
    monthly_earnings = _owner_monthly_earnings_map(month_start)
    ranked_owner_ids = sorted(
        owner_map.keys(),
        key=lambda owner_id: (
            -monthly_earnings.get(owner_id, ZERO_DECIMAL),
            owner_map[owner_id].username.lower(),
            owner_id,
        ),
    )

    results = []
    for owner_id in ranked_owner_ids[:limit]:
        owner = owner_map[owner_id]
        results.append(_leaderboard_entry(owner, monthly_earnings.get(owner_id, ZERO_DECIMAL), month_start, request))
    return results


def _top_renters_this_month(month_start, request=None, limit=3):
    renters = (
        Booking.objects.filter(payment_status=Booking.PaymentStatus.PAID, created_at__date__gte=month_start)
        .values("renter")
        .annotate(
            rentals_count=Count("id"),
            total_spent=Coalesce(Sum("total_price"), ZERO_DECIMAL),
        )
        .order_by("-rentals_count", "-total_spent", "renter")
    )

    renter_ids = [row["renter"] for row in renters[:limit]]
    users = {user.id: user for user in User.objects.filter(id__in=renter_ids)}

    results = []
    for row in renters[:limit]:
        user = users.get(row["renter"])
        if not user:
            continue
        results.append(
            {
                "id": user.id,
                "username": user.username,
                "avatar": _avatar_url(user, request),
                "rentals_count": int(row["rentals_count"] or 0),
                "total_spent": _decimal(row["total_spent"]),
                "rating": _owner_average_rating(user) or None,
            }
        )
    return results


def _ranking_for_owner(owner, month_start):
    owners = _owners_with_listings()
    monthly_earnings = _owner_monthly_earnings_map(month_start)
    sorted_owners = sorted(
        owners,
        key=lambda candidate: (
            -monthly_earnings.get(candidate.id, ZERO_DECIMAL),
            candidate.username.lower(),
            candidate.id,
        ),
    )

    position = next((index + 1 for index, candidate in enumerate(sorted_owners) if candidate.id == owner.id), len(sorted_owners) + 1)
    current_earnings = monthly_earnings.get(owner.id, ZERO_DECIMAL)
    total_lessors = len(sorted_owners)

    top_ten_threshold = monthly_earnings.get(sorted_owners[9].id, ZERO_DECIMAL) if len(sorted_owners) >= 10 else current_earnings
    user_listing_count = owner.listings.count()
    average_per_listing = (current_earnings / user_listing_count) if user_listing_count and current_earnings > 0 else ZERO_DECIMAL
    if average_per_listing <= 0:
        all_listing_count = sum(candidate.listings.count() for candidate in sorted_owners) or 1
        total_monthly = sum(monthly_earnings.get(candidate.id, ZERO_DECIMAL) for candidate in sorted_owners)
        average_per_listing = total_monthly / Decimal(all_listing_count)
        if average_per_listing <= 0:
            average_per_listing = Decimal("1000")

    additional_products = 0
    hint = "You are already in the Top 10 this month."
    if position > 10 and current_earnings < top_ten_threshold:
        earnings_gap = max(ZERO_DECIMAL, top_ten_threshold - current_earnings)
        additional_products = max(1, ceil(earnings_gap / average_per_listing))
        hint = f"If you add {additional_products} more products, you could reach the Top 10."

    return {
        "position": position,
        "total_lessors": total_lessors,
        "suggested_additional_products": additional_products,
        "hint": hint,
    }


def _super_host_status(owner, rentals_count, rating):
    response_stats = _compute_user_response_stats(owner)
    response_rate = response_stats.get("response_rate")
    excellent_engagement = response_rate is not None and response_rate >= 80

    requirements = [
        {
            "label": "Rating 4.8+",
            "met": rating >= 4.8,
            "detail": f"Current rating: {rating:.1f}/5",
        },
        {
            "label": "More than 20 successful rentals",
            "met": rentals_count > 20,
            "detail": f"Successful rentals: {rentals_count}",
        },
        {
            "label": "Excellent customer engagement",
            "met": excellent_engagement,
            "detail": (
                f"Response rate: {response_rate}%"
                if response_rate is not None
                else "Need more conversations to measure response quality."
            ),
        },
    ]

    return {
        "qualified": all(requirement["met"] for requirement in requirements),
        "title": "Super Host",
        "requirements": requirements,
        "benefits": [
            "A gold badge next to your name",
            "Higher visibility in search results",
            "More trust from renters on your public profile",
        ],
    }


def build_landlord_dashboard(owner, request=None):
    _, month_start = _month_bounds()
    paid_bookings = _owner_paid_bookings(owner)
    month_paid_bookings = paid_bookings.filter(created_at__date__gte=month_start)

    total_earnings = _decimal(paid_bookings.aggregate(total=Coalesce(Sum("total_price"), ZERO_DECIMAL))["total"])
    month_earnings = _decimal(month_paid_bookings.aggregate(total=Coalesce(Sum("total_price"), ZERO_DECIMAL))["total"])
    rentals_count = paid_bookings.count()
    rating = _owner_average_rating(owner)

    return {
        "summary": {
            "total_earnings": total_earnings,
            "this_month_earnings": month_earnings,
            "rentals_count": rentals_count,
            "rating": rating,
            "highest_earning_item": _build_highest_earning_item(owner),
        },
        "chart": {
            "daily": _build_chart_points(month_paid_bookings, "daily"),
            "monthly": _build_chart_points(paid_bookings, "monthly"),
        },
        "leaderboards": {
            "top_lessors_this_month": _top_lessors_this_month(month_start, request=request),
            "top_renters_this_month": _top_renters_this_month(month_start, request=request),
        },
        "ranking": _ranking_for_owner(owner, month_start),
        "super_host": _super_host_status(owner, rentals_count, rating),
    }


def build_public_community_earnings(request=None):
    _, month_start = _month_bounds()
    paid_bookings = Booking.objects.filter(payment_status=Booking.PaymentStatus.PAID)
    owners = _owners_with_listings()
    monthly_earnings = _owner_monthly_earnings_map(month_start)

    total_lessor_earnings = _decimal(paid_bookings.aggregate(total=Coalesce(Sum("total_price"), ZERO_DECIMAL))["total"])
    owner_count = len(owners) or 1
    average_monthly_income = sum(monthly_earnings.get(owner.id, ZERO_DECIMAL) for owner in owners) / Decimal(owner_count)
    top_hosts = _top_lessors_this_month(month_start, request=request)

    return {
        "total_lessor_earnings": total_lessor_earnings,
        "average_lessor_income_per_month": average_monthly_income.quantize(Decimal("0.01")),
        "highest_earning_lessors_per_month": top_hosts,
        "homepage": {
            "headline": "How much does the platform community earn?",
            "total_landlord_earnings": total_lessor_earnings,
        },
        "attraction": {
            "average_landlord_income_per_month": average_monthly_income.quantize(Decimal("0.01")),
            "highest_earning_landlords_per_month": top_hosts,
        },
    }


def calculate_projected_earnings(products_count: int, daily_rental_price) -> dict:
    daily_price = _decimal(daily_rental_price)
    annual_earnings = daily_price * Decimal(products_count) * Decimal(30)
    monthly_earnings = annual_earnings / Decimal(12)
    return {
        "products_count": products_count,
        "daily_rental_price": daily_price,
        "monthly_earnings": monthly_earnings.quantize(Decimal("0.01")),
        "annual_earnings": annual_earnings.quantize(Decimal("0.01")),
    }
