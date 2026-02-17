# Ekra / Sharikly — Feature Roadmap

Work through these in order. Each item is one "phase"; complete it before moving to the next.

---

## Phase 1: Forgot password ✅

**Goal:** User can request a password reset email and set a new password.

**Backend**
- [x] Add `PasswordResetRequestView` — POST email, generate token (Django `PasswordResetTokenGenerator`), send email with link.
- [x] Add `PasswordResetConfirmView` — POST uid, token, new_password; validate token, set password.
- [x] Add URLs: `/api/auth/password-reset/`, `/api/auth/password-reset/confirm/`.
- [x] Use same email backend as verification (Ekra HTML email in `accounts/views.send_password_reset_email`).

**Frontend**
- [x] Page `/auth/forgot-password`: enter email → "If an account exists…" success message.
- [x] Page `/auth/reset-password?uid=...&token=...`: new password + confirm, submit to confirm endpoint.
- [x] Link "Forgot password?" on login page and LoginModal.

**Done when:** User can reset password via email link and then log in with new password.

---

## Phase 2: Resend verification email ✅

**Goal:** If user didn’t get the verification email, they can request it again.

**Backend**
- [x] Add `ResendVerificationView` — POST email, find user with `is_email_verified=False`, resend same verification email; always return same success message (avoid enumeration).

**Frontend**
- [x] When login fails with "verify your email", show error + button "Resend verification email" (login page + LoginModal).
- [x] Dedicated page `/auth/resend-verification` to request a new link by email.

**Done when:** User can trigger a new verification email and complete verification.

---

## Phase 3: Booking list and status (post–Send Request) ✅

**Goal:** After "Send Request", user sees their bookings; owner can accept/decline; status is clear.

**Backend**
- [x] `Booking` model already has status (PENDING, CONFIRMED, DECLINED) and dates.
- [x] `GET /api/bookings/` — filtered to current user as renter or listing owner.
- [x] `POST /api/bookings/` — create booking (listing, start_date, end_date, total_price); renter set to request user.
- [x] `POST /api/bookings/<id>/accept/` and `.../decline/` (owner only, pending only).

**Frontend**
- [x] Page `/bookings` ("My Bookings"): list of bookings with status; owner sees "Request from {renter}"; requester sees "Owner".
- [x] Accept/Decline buttons for owner when status is Pending.
- [x] Request booking page creates booking via API then redirects to `/bookings`.
- [x] Nav link "My Bookings" in header (desktop + mobile).

**Done when:** Requester sees status; owner can accept/decline; list is visible and up to date.

---

## Phase 4: Search and filters for listings ✅

**Goal:** Users can search and filter listings (category, location, price).

**Backend**
- [x] Listings list API: query params `search` (title/description/city), `category`, `city`, `min_price`, `max_price`, `order` (newest, price_asc, price_desc).
- [x] get_queryset filters and ordering applied server-side.

**Frontend**
- [x] Search bar (server-side), sort dropdown (Newest / Price low–high / Price high–low).
- [x] "Filters" toggle: category, city, min price, max price; wired to API params via useSWR key.
- [x] List refreshes when filters change.

**Done when:** Users can find listings by keyword and filters without scrolling everything.

---

## Phase 5: Settings page ✅

**Goal:** Real `/settings` page linked from nav; no dead link.

**Backend**
- [x] `/api/auth/me/` PATCH for profile (avatar, username, bio); `/api/auth/change-password/` and `/api/auth/delete-account/` already exist.

**Frontend**
- [x] `/settings` page with sections: Profile (avatar, username, bio), Account (email read-only, change password), Preferences (language en/ar), Danger zone (delete account with password confirmation).
- [x] Desktop nav and mobile menu both link to Settings.

**Done when:** Settings page exists and at least change-password works.

---

## Phase 6: Report user / Report listing ✅

**Goal:** Users can report inappropriate listings or users; you get a simple queue to review.

**Backend**
- [x] Model `Report`: reporter, listing (nullable), reported_user (nullable), reason (SPAM, INAPPROPRIATE, SCAM, HARASSMENT, OTHER), details, created_at.
- [x] POST `/api/reports/` — create report (authenticated); exactly one of listing or reported_user required.
- [x] Report admin list/filter in Django admin.

**Frontend**
- [x] "Report" button on listing detail page; "Report user" on public user profile (hidden when viewing own profile).
- [x] `ReportModal`: reason dropdown + optional details, submit; success toast and close.

**Done when:** Report is saved and visible in admin or simple admin view.

---

## Phase 7: Block user ✅

**Goal:** User A can block user B; B no longer appears in chat/list and can’t message A.

**Backend**
- [x] Model `BlockedUser` (blocker, blocked); POST/DELETE block/unblock; GET users/blocked/.
- [x] Chat list/create/messages filtered so blocked users don't appear / can't send.
- [ ] Filter chat rooms and messaging so blocked users don’t appear / can’t send.

**Frontend**
- [x] Block/Unblock on user profile; Block in chat header; "Blocked users" in Settings to unblock.

**Done when:** Blocking a user hides them from chat and prevents new conversations.

---

## Phase 8: 404 and error page ✅

**Goal:** Friendly 404 and a generic error page instead of default Next.js.

**Frontend**
- [x] Custom `app/not-found.tsx` (404) with "Page not found", Go home, Browse listings.
- [x] `app/error.tsx` for runtime errors with "Something went wrong", Try again, Go home.

**Done when:** Visiting unknown URLs and errors show your branding and clear actions.

---

## Phase 9: Meta / OG tags per listing ✅

**Goal:** Sharing a listing link shows correct title, image, description in social/messaging apps.

**Frontend**
- [x] `app/listings/[id]/layout.tsx` with `generateMetadata`: fetches listing server-side, sets title, description, openGraph (title, description, image, url), twitter card (summary_large_image).

**Done when:** Shared listing links show rich previews.

---

## Phase 10: Loading and empty states ✅

**Goal:** No raw "Loading..." or blank lists; skeletons and friendly empty copy.

**Frontend**
- [x] Listings: skeleton grid already; empty state with "List an item" + "Browse" CTAs.
- [x] Bookings: skeleton list (4 cards) when loading; empty state with "Browse listings".
- [x] Chat list: skeleton conversation rows when loading; empty state with "Browse listings to message owners".
- [x] Favorites: skeleton grid when loading; empty state with "Browse" CTA.
- [x] Chat room: empty state copy "Send a message below to start the conversation."

**Done when:** Main flows feel polished and guided.

---

## Summary order

| Phase | Feature                    | Priority |
|-------|----------------------------|----------|
| 1     | Forgot password            | High     |
| 2     | Resend verification email  | High     |
| 3     | Booking list + status      | High     |
| 4     | Search and filters         | High     |
| 5     | Settings page               | High     |
| 6     | Report user/listing         | Medium   |
| 7     | Block user                  | Medium   |
| 8     | 404 / error page            | Polish   |
| 9     | Meta/OG per listing         | Polish   |
| 10    | Loading & empty states      | Polish   |

Start with **Phase 1 (Forgot password)** and implement it fully before moving to Phase 2. Use this file to tick off tasks and track progress.
