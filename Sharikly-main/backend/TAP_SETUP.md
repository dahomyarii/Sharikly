# Tap Payments Setup (Sharikly)

This guide explains how to set up **Tap Payments** with **15% platform fee** and **85% to the listing owner**.

---

## 1. Create a Tap account and get API keys

1. Go to [Tap Payments](https://www.tap.company/) and sign up.
2. For **marketplace split payments**, contact Tap to enable the **Marketplace** product and get:
   - **Merchant keys** (for creating charges)
   - **Marketplace keys** (for onboarding listing owners as “Businesses” so they get a `destination_id`)
3. In the Tap Dashboard: **goSell → API Credentials** (or similar) and copy:
   - **Secret key** (starts with `sk_test_` for test, `sk_live_` for live)

---

## 2. Backend environment variables

In your backend `.env` (or environment):

```env
# Required for checkout
TAP_SECRET_KEY=your_tap_secret_key_from_dashboard

# Where customers are redirected after payment (your frontend URL)
FRONTEND_APP_URL=https://your-frontend-domain.com
```

- **Test mode:** use `sk_test_...` so no real money is charged.
- **Live mode:** use `sk_live_...` and your production frontend URL.

---

## 3. Webhook URL (for marking bookings as PAID)

Tap will send charge events to your backend. Use this URL when asked (or configure in dashboard if available):

```text
https://your-backend-domain.com/api/tap/callback/
```

- Must be **HTTPS** in production.
- The app already implements this route: it receives Tap’s POST, and when `status == CAPTURED`, it sets the booking’s `payment_status` to **PAID**.

No need to set the webhook URL in the charge request if you already pass `post.url` in the create-charge payload (the code does that automatically using `FRONTEND_APP_URL`’s backend base).

---

## 4. How the 15% / 85% split works

- **15%** of each payment stays in your **marketplace (Sharikly) account**.
- **85%** is sent to the **listing owner** – but only if that owner has a Tap **destination_id**.

To get a **destination_id** for an owner:

1. They must be **onboarded as a Business** with Tap (using Tap’s **Marketplace / Business API** and your **Marketplace keys**).
2. Tap returns a **destination_id** for that business.
3. You store that **destination_id** on the owner’s user record in your database (`User.tap_destination_id`).  
   For now you can set it in **Django Admin**: edit the listing owner’s User and set **Tap destination id**.

When creating a charge:

- If **listing owner has `tap_destination_id`**: the charge is created with **destinations** so that **85%** goes to that destination (owner) and **15%** stays with you.
- If **listing owner has no `tap_destination_id`**: the charge is still created, but **100%** goes to your marketplace account. You can later pay out owners manually or add onboarding so they get a destination_id.

---

## 5. Onboarding listing owners (to get the 85% split)

To actually split 85% to owners:

1. **Use Tap’s Marketplace keys** (from step 1).
2. For each listing owner who should receive payouts:
   - Call Tap’s **Business API** to create a Business (with KYC details they require).
   - Tap returns a **destination_id**.
   - Save it in your database on the corresponding user:  
     `User.tap_destination_id = "<destination_id>"`  
     (e.g. via Django admin or a “Payout setup” flow in your app).
3. After that, any charge for a booking whose listing owner has `tap_destination_id` will automatically use the 15% / 85% split.

Detailed steps and request formats: [Tap – Onboarding Businesses](https://developers.tap.company/docs/onboarding) and [Split Payments](https://developers.tap.company/docs/marketplace-split-payments).

---

## 6. Run migrations

Ensure the new field for storing Tap destination is applied:

```bash
cd backend
python manage.py migrate
```

This includes the `accounts` migration that adds `User.tap_destination_id`.

---

## 7. Quick test (test mode)

1. Set `TAP_SECRET_KEY=sk_test_...` and `FRONTEND_APP_URL` to your frontend URL.
2. Create a confirmed booking and click **Pay now**.
3. You should be redirected to Tap’s hosted payment page.
4. Use Tap’s [test cards](https://developers.tap.company/reference/testing-cards) to complete payment.
5. After success, you should be redirected back and the booking should show as **Paid** (and the webhook will set `payment_status` to PAID).

---

## 8. Summary

| Item | Value |
|------|--------|
| **Platform share** | 15% |
| **Owner share** | 85% (when owner has `tap_destination_id`) |
| **Env vars** | `TAP_SECRET_KEY`, `FRONTEND_APP_URL` |
| **Webhook** | `POST /api/tap/callback/` (already implemented) |
| **Owner payout** | Set `User.tap_destination_id` after onboarding owner with Tap Business API |

For more: [Tap Developers](https://developers.tap.company/), [Marketplace overview](https://developers.tap.company/docs/marketplace-overview), [Split payments](https://developers.tap.company/docs/marketplace-split-payments).
