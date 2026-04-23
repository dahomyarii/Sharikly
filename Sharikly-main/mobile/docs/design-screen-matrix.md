# Mobile Screen-to-Design Matrix

Design source: `C:\Users\hp\Downloads\WhatsApp Unknown 2026-04-14 at 9.04.12 PM`

Status keys:
- `Exact Match`
- `Minor Visual Drift`
- `Functional Gap`
- `Major Mismatch`

## Global Shell

| Surface | Route/File | Status | Notes |
|---|---|---|---|
| Bottom Tab + FAB | `src/navigation/MainTabNavigator.tsx` | Minor Visual Drift | Glass tab and FAB are in place; spacing and cross-stack handoffs must be validated on all stacks. |
| Auth Modal Flow | `src/navigation/AuthStackNavigator.tsx` | Exact Match | Flow complete and routes reachable. |

## Home / Explore / Listings

| Screen | Route | File | Status | Notes |
|---|---|---|---|---|
| Home | `HomeTab > Home` | `src/features/home/screens/HomeScreen.tsx` | Minor Visual Drift | Layout close; final typography and card spacing tuning may be needed per references. |
| Explore | `ExploreTab > ListingsExplore` | `src/features/listings/screens/ListingsExploreScreen.tsx` | Minor Visual Drift | Sticky glass header and chips implemented; final collapse timing and density under review. |
| Listing Detail | `ExploreTab > ListingDetail` | `src/features/listings/screens/ListingDetailScreen.tsx` | Functional Gap | Visual structure close; must finalize real action behavior and copy consistency. |
| Create Listing | `ExploreTab > CreateListing` | `src/features/listings/screens/CreateListingScreen.tsx` | Minor Visual Drift | Form and CTAs present; verify exact spacing and iconography. |
| Edit Listing | `ExploreTab > EditListing` | `src/features/listings/screens/EditListingScreen.tsx` | Minor Visual Drift | Needs final visual parity pass. |
| Request Booking | `ExploreTab > RequestBooking` | `src/features/listings/screens/RequestBookingScreen.tsx` | Minor Visual Drift | Flow is functional; requires polish vs reference hierarchy. |
| Availability | `ExploreTab > ListingAvailability` | `src/features/listings/screens/ListingAvailabilityScreen.tsx` | Exact Match | Functional and visually aligned for current scope. |
| Availability Blocks | `ExploreTab > ListingAvailabilityBlocks` | `src/features/listings/screens/ListingAvailabilityBlocksScreen.tsx` | Exact Match | Functional and visually aligned for current scope. |

## Bookings

| Screen | Route | File | Status | Notes |
|---|---|---|---|---|
| My Bookings (Renter) | `BookingsTab > BookingsRenter` | `src/features/bookings/screens/BookingsRenterScreen.tsx` | Minor Visual Drift | Hero empty state and skeletons added; verify final badge/date style parity. |
| Booking Receipt | `BookingsTab > BookingReceipt` | `src/features/bookings/screens/BookingReceiptScreen.tsx` | Minor Visual Drift | Actions functional; check final spacing and content lock to references. |
| Host Bookings | `BookingsTab > HostBookings` | `src/features/bookings/screens/HostBookingsScreen.tsx` | Minor Visual Drift | Flow functional; ensure final card polish and notifications shortcut. |

## Inbox / Chat / Notifications

| Screen | Route | File | Status | Notes |
|---|---|---|---|---|
| Chat Inbox | `InboxTab > ChatInbox` | `src/features/chat/screens/ChatInboxScreen.tsx` | Functional Gap | Needs final real behavior alignment (search/filter and no placeholder-only behavior). |
| Chat Room | `InboxTab > ChatRoom` | `src/features/chat/screens/ChatRoomScreen.tsx` | Minor Visual Drift | Functional; verify exact header and bubble styling parity. |
| Admin Support Thread | `InboxTab > AdminSupportThread` | `src/features/chat/screens/AdminSupportThreadScreen.tsx` | Minor Visual Drift | Functional; verify final typography and state screens. |
| Notifications | `InboxTab > Notifications` | `src/features/notifications/screens/NotificationsScreen.tsx` | Exact Match | Filter/actions wired and stable. |

## Profile / Favorites / Support / Host

| Screen | Route | File | Status | Notes |
|---|---|---|---|---|
| Profile | `ProfileTab > Profile` | `src/features/profile/screens/ProfileScreen.tsx` | Minor Visual Drift | Actions wired; final visual pass pending. |
| Favorites | `ProfileTab > Favorites` | `src/features/profile/screens/FavoritesScreen.tsx` | Minor Visual Drift | Hero empty state implemented; verify card overlay and spacing. |
| Settings | `ProfileTab > Settings` | `src/features/profile/screens/SettingsScreen.tsx` | Exact Match | Stable and functional. |
| Contact | `ProfileTab > Contact` | `src/features/support/screens/ContactScreen.tsx` | Minor Visual Drift | Functional; final typographic parity pass needed. |
| My Reports | `ProfileTab > MyReports` | `src/features/support/screens/MyReportsScreen.tsx` | Minor Visual Drift | Functional; ensure exact empty/list state matching. |
| Host Overview | `ProfileTab > HostArea > HostOverview` | `src/features/host/screens/HostOverviewScreen.tsx` | Minor Visual Drift | Functional with corrected icons; final spacing polish. |
| Host Earnings | `ProfileTab > HostArea > HostEarnings` | `src/features/host/screens/HostEarningsScreen.tsx` | Minor Visual Drift | Charts functional; final visual polish pass. |
| Host Listings | `ProfileTab > HostArea > HostListings` | `src/features/host/screens/HostListingsManageScreen.tsx` | Minor Visual Drift | Functional; check card/action parity. |
| Host Opportunities | `ProfileTab > HostArea > HostOpportunities` | `src/features/host/screens/HostOpportunitiesScreen.tsx` | Minor Visual Drift | Functional; final style matching needed. |

