# Submit Listing Review (Mobile) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a renter submit a star rating + comment for a listing after a completed booking, from the Booking Receipt screen and the completed booking card.

**Architecture:** Pure mobile/UI work — the backend endpoint and the mobile API wrapper already exist. We add one reusable UI primitive (`StarRating`), one self-contained feature component (`LeaveReviewButton`) that owns the modal + submit mutation, and drop that component into two existing screens. No navigation routes, no backend changes, no new dependencies.

**Tech Stack:** Expo SDK 54, React Native 0.81, TypeScript, `@tanstack/react-query` (inline `useMutation`), `lucide-react-native` icons, Jest + `@testing-library/react-native`.

## Global Constraints

- Use the `@/` path alias for all internal imports (configured via babel-plugin-module-resolver + tsconfig).
- Submit reviews **only** through the existing `submitReview(listingId, { rating, comment })` in `src/services/api/endpoints/listings.ts` → `POST /api/listings/<id>/reviews/`. Never POST to the flat `/api/reviews/` route (its `listing` field is read-only and it skips all gating).
- User feedback uses `showToast(message, type)` from `@/core/events/appEvents` — never `Alert.alert` (it is a no-op on web).
- "Completed" booking status is **derived**, not stored. Always gate on `deriveStatus(booking) === "completed"` from `src/features/bookings/status.ts`, never on `booking.status === "completed"` (the backend only stores PENDING | CONFIRMED | DECLINED | CANCELLED).
- Only a **renter** on a completed booking may review (server-enforced; mirror it client-side so we never show the affordance to a host/browser).
- Rating scale is 1–5 for input (backend accepts 0–5, but the UI requires at least 1 star). Comment is optional; cap at 1000 chars.
- Follow existing form conventions: plain `useState` + inline `useMutation` (no `react-hook-form`). Keep files small and single-purpose.
- Tests live in `src/__tests__/`, mirroring `LoginScreen.test.tsx`.

---

## File Structure

- **Create** `src/components/ui/StarRating.tsx` — presentational star row; interactive when given `onChange`, read-only otherwise. One responsibility: render/collect a 1–5 rating.
- **Create** `src/features/reviews/LeaveReviewButton.tsx` — self-contained "Leave a review" trigger + modal form + submit mutation + success/error handling + local reviewed state. Encapsulates everything so host screens stay one-liners (no modal-state prop-drilling).
- **Create** `src/__tests__/StarRating.test.tsx` — unit tests for the rating primitive.
- **Create** `src/__tests__/LeaveReviewButton.test.tsx` — behavior tests for the submit flow (isolated from `PrimaryButton`/reanimated internals via mocks).
- **Modify** `src/features/bookings/screens/BookingReceiptScreen.tsx` — render `<LeaveReviewButton>` in a "Rate your experience" card when the current user is the renter on a completed booking.
- **Modify** `src/features/bookings/components/BookingCard.tsx` — render `<LeaveReviewButton>` in the completed-bucket actions for the renter role.

---

### Task 1: `StarRating` primitive

**Files:**
- Create: `src/components/ui/StarRating.tsx`
- Test: `src/__tests__/StarRating.test.tsx`

**Interfaces:**
- Produces: `StarRating` — `function StarRating(props: { value: number; onChange?: (value: number) => void; size?: number; testID?: string }): React.ReactElement`. When `onChange` is omitted it renders read-only. Each star is wrapped in a pressable/view with `testID` `${testID}-star-${n}` (default base `testID` = `"star-rating"`).

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/StarRating.test.tsx`:

```tsx
import { StarRating } from "@/components/ui/StarRating";
import { fireEvent, render, screen } from "@testing-library/react-native";

// Render lucide's Star as a plain View so the test is env-independent (no SVG).
jest.mock("lucide-react-native", () => {
  const { View } = require("react-native");
  return { Star: (props: any) => <View {...props} /> };
});

describe("StarRating", () => {
  it("renders five stars", () => {
    render(<StarRating value={0} onChange={() => {}} />);
    expect(screen.getByTestId("star-rating-star-1")).toBeTruthy();
    expect(screen.getByTestId("star-rating-star-5")).toBeTruthy();
  });

  it("calls onChange with the tapped star value", () => {
    const onChange = jest.fn();
    render(<StarRating value={0} onChange={onChange} />);
    fireEvent.press(screen.getByTestId("star-rating-star-4"));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("renders read-only when no onChange is given", () => {
    render(<StarRating value={3} />);
    expect(screen.getByTestId("star-rating-star-3")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd Sharikly-main/mobile && npx jest src/__tests__/StarRating.test.tsx`
Expected: FAIL — cannot resolve `@/components/ui/StarRating` (module not found).

- [ ] **Step 3: Write the minimal implementation**

Create `src/components/ui/StarRating.tsx`:

```tsx
import { Star } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

const ACTIVE = "#F59E0B";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  testID?: string;
}

export function StarRating({
  value,
  onChange,
  size = 32,
  testID = "star-rating",
}: StarRatingProps): React.ReactElement {
  const readOnly = !onChange;
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((s) => {
        const icon = (
          <Star size={size} color={ACTIVE} fill={s <= value ? ACTIVE : "transparent"} />
        );
        if (readOnly) {
          return (
            <View key={s} testID={`${testID}-star-${s}`}>
              {icon}
            </View>
          );
        }
        return (
          <Pressable
            key={s}
            testID={`${testID}-star-${s}`}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${s} star${s > 1 ? "s" : ""}`}
            hitSlop={6}
            onPress={() => onChange?.(s)}
          >
            {icon}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd Sharikly-main/mobile && npx jest src/__tests__/StarRating.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd Sharikly-main/mobile
git add src/components/ui/StarRating.tsx src/__tests__/StarRating.test.tsx
git commit -m "feat(mobile): add reusable StarRating component"
```

---

### Task 2: `LeaveReviewButton` (modal + submit mutation)

**Files:**
- Create: `src/features/reviews/LeaveReviewButton.tsx`
- Test: `src/__tests__/LeaveReviewButton.test.tsx`

**Interfaces:**
- Consumes: `StarRating` from Task 1; `submitReview(listingId, { rating, comment })` from `@/services/api/endpoints/listings`; `showToast` from `@/core/events/appEvents`; `PrimaryButton` from `@/components/ui/PrimaryButton`.
- Produces: `LeaveReviewButton` — `function LeaveReviewButton(props: { listingId: number | string; size?: "sm" | "md" | "lg"; fullWidth?: boolean; style?: StyleProp<ViewStyle>; onReviewed?: () => void }): React.ReactElement`. Renders a "Leave a review" outline button; opens a modal with `StarRating` + comment `TextInput` + "Submit review". After a successful submit (or an "already reviewed" 400) it renders a static "Review submitted" row.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/LeaveReviewButton.test.tsx`:

```tsx
import type { ReactElement } from "react";
import { LeaveReviewButton } from "@/features/reviews/LeaveReviewButton";
import { submitReview } from "@/services/api/endpoints/listings";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

jest.mock("@/services/api/endpoints/listings", () => ({ submitReview: jest.fn() }));

// Render lucide icons as plain Views (no SVG in the test env).
jest.mock("lucide-react-native", () => {
  const { View } = require("react-native");
  return { Star: (p: any) => <View {...p} />, CheckCircle2: (p: any) => <View {...p} /> };
});

// Isolate from PrimaryButton's reanimated/haptics internals: a plain pressable that
// honors the disabled prop, so press-by-text is deterministic.
jest.mock("@/components/ui/PrimaryButton", () => {
  const { Pressable, Text } = require("react-native");
  return {
    PrimaryButton: ({ label, onPress, disabled }: any) => (
      <Pressable accessibilityRole="button" disabled={!!disabled} onPress={disabled ? undefined : onPress}>
        <Text>{label}</Text>
      </Pressable>
    ),
  };
});

const mockedSubmit = submitReview as jest.MockedFunction<typeof submitReview>;

function harness(): ReactElement {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <LeaveReviewButton listingId={42} />
    </QueryClientProvider>
  );
}

describe("LeaveReviewButton", () => {
  beforeEach(() => mockedSubmit.mockReset());

  it("opens the review modal when tapped", () => {
    render(harness());
    fireEvent.press(screen.getByText("Leave a review"));
    expect(screen.getByText("Rate this item")).toBeTruthy();
  });

  it("does not submit when no stars are selected", () => {
    render(harness());
    fireEvent.press(screen.getByText("Leave a review"));
    fireEvent.press(screen.getByText("Submit review"));
    expect(mockedSubmit).not.toHaveBeenCalled();
  });

  it("submits rating + comment and shows the reviewed state", async () => {
    mockedSubmit.mockResolvedValueOnce({ id: 1 });
    render(harness());
    fireEvent.press(screen.getByText("Leave a review"));
    fireEvent.press(screen.getByTestId("star-rating-star-5"));
    fireEvent.changeText(screen.getByTestId("review-comment-input"), "Great gear");
    fireEvent.press(screen.getByText("Submit review"));
    await waitFor(() =>
      expect(mockedSubmit).toHaveBeenCalledWith(42, { rating: 5, comment: "Great gear" })
    );
    await waitFor(() => expect(screen.getByText("Review submitted")).toBeTruthy());
  });

  it("flips to reviewed state on an 'already reviewed' 400", async () => {
    mockedSubmit.mockRejectedValueOnce({
      response: { status: 400, data: { error: "You have already reviewed this listing. You can only review once." } },
    });
    render(harness());
    fireEvent.press(screen.getByText("Leave a review"));
    fireEvent.press(screen.getByTestId("star-rating-star-3"));
    fireEvent.press(screen.getByText("Submit review"));
    await waitFor(() => expect(screen.getByText("Review submitted")).toBeTruthy());
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd Sharikly-main/mobile && npx jest src/__tests__/LeaveReviewButton.test.tsx`
Expected: FAIL — cannot resolve `@/features/reviews/LeaveReviewButton`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/features/reviews/LeaveReviewButton.tsx`:

```tsx
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { StarRating } from "@/components/ui/StarRating";
import { showToast } from "@/core/events/appEvents";
import { colors, radii, spacing } from "@/core/theme/tokens";
import { submitReview } from "@/services/api/endpoints/listings";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react-native";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

interface LeaveReviewButtonProps {
  listingId: number | string;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  onReviewed?: () => void;
}

function errorMessage(err: any): string {
  return (
    err?.response?.data?.error ??
    err?.response?.data?.detail ??
    "Couldn't submit your review. Please try again."
  );
}

export function LeaveReviewButton({
  listingId,
  size = "md",
  fullWidth = false,
  style,
  onReviewed,
}: LeaveReviewButtonProps): React.ReactElement {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewed, setReviewed] = useState(false);

  const mutation = useMutation({
    // "always" so an offline submit fails visibly instead of silently pausing.
    networkMode: "always",
    mutationFn: () => submitReview(listingId, { rating, comment: comment.trim() }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["listing", listingId] });
      void queryClient.invalidateQueries({ queryKey: ["reviews"] });
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["booking"] });
      setReviewed(true);
      setVisible(false);
      showToast("Thanks for your review!", "success");
      onReviewed?.();
    },
    onError: (err: any) => {
      const msg = errorMessage(err);
      // Backend says we already reviewed → stop inviting another attempt.
      if (err?.response?.status === 400 && /already reviewed/i.test(msg)) {
        setReviewed(true);
        setVisible(false);
        showToast("You've already reviewed this item.", "info");
        return;
      }
      showToast(String(msg), "error");
    },
  });

  if (reviewed) {
    return (
      <View style={[styles.doneRow, style]}>
        <CheckCircle2 size={16} color={colors.success} />
        <Text style={styles.doneText}>Review submitted</Text>
      </View>
    );
  }

  return (
    <>
      <PrimaryButton
        label="Leave a review"
        variant="outline"
        size={size}
        fullWidth={fullWidth}
        style={style}
        onPress={() => setVisible(true)}
      />

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          {/* Swallow taps so pressing the sheet doesn't dismiss the modal. */}
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.title}>Rate this item</Text>
            <Text style={styles.subtitle}>How was your rental experience?</Text>

            <View style={styles.starsWrap}>
              <StarRating value={rating} onChange={setRating} size={36} />
            </View>

            <TextInput
              testID="review-comment-input"
              style={styles.input}
              value={comment}
              onChangeText={setComment}
              placeholder="Share a few words (optional)"
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              maxLength={1000}
              textAlignVertical="top"
            />

            <PrimaryButton
              label="Submit review"
              onPress={() => mutation.mutate()}
              loading={mutation.isPending}
              disabled={rating < 1}
              fullWidth
              style={{ marginTop: spacing.md }}
            />
            <Pressable style={styles.cancel} onPress={() => setVisible(false)} hitSlop={8}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  doneRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8 },
  doneText: { fontSize: 14, fontWeight: "700", color: colors.success },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl ?? 32,
  },
  title: { fontSize: 20, fontWeight: "800", color: colors.foreground },
  subtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 4, marginBottom: 16 },
  starsWrap: { alignItems: "center", marginBottom: 16 },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 96,
    color: colors.foreground,
  },
  cancel: { alignItems: "center", paddingVertical: 12, marginTop: 4 },
  cancelText: { fontSize: 15, fontWeight: "600", color: colors.mutedForeground },
});
```

> Note: `spacing.xl` may not exist in the tokens; the `?? 32` fallback keeps it safe. If `radii.xl`/`spacing.lg` differ, keep whatever the tokens file (`@/core/theme/tokens`) actually exports — do not invent new token keys.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd Sharikly-main/mobile && npx jest src/__tests__/LeaveReviewButton.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
cd Sharikly-main/mobile
git add src/features/reviews/LeaveReviewButton.tsx src/__tests__/LeaveReviewButton.test.tsx
git commit -m "feat(mobile): add LeaveReviewButton with submit-review modal"
```

---

### Task 3: Wire into `BookingReceiptScreen`

**Files:**
- Modify: `src/features/bookings/screens/BookingReceiptScreen.tsx`

**Interfaces:**
- Consumes: `LeaveReviewButton` from Task 2; `deriveStatus` from `@/features/bookings/status` (imported relatively as `../status`); existing `meQ` (current user) and `listing` locals already present in the screen.

- [ ] **Step 1: Add the imports**

At the top of `src/features/bookings/screens/BookingReceiptScreen.tsx`, add these imports alongside the existing ones:

```tsx
import { LeaveReviewButton } from "@/features/reviews/LeaveReviewButton";
import { deriveStatus } from "../status";
```

- [ ] **Step 2: Compute the reviewer/completed condition**

In the component body, immediately after `const listing = booking.listing;` (currently line ~163), add:

```tsx
  // Only the renter on a finished rental may review (server also enforces this).
  const canReview =
    deriveStatus(booking) === "completed" &&
    !!meQ.data?.id &&
    meQ.data.id === booking.renter?.id &&
    !!listing?.id;
```

- [ ] **Step 3: Render the review card in the details view**

In the "BOOKING DETAILS VIEW" return block, insert this card right after the closing tag of the booking-card `View` (the block that ends around line 410, just before the "Pickup Info" card):

```tsx
        {/* Leave a review — completed rentals only */}
        {canReview && (
          <View style={[styles.card, { marginHorizontal: spacing.md, marginTop: 10 }]}>
            <Text style={styles.pickupInfoTitle}>Rate your experience</Text>
            <Text style={[styles.metaText, { marginTop: 4, marginBottom: 12 }]}>
              Your rental is complete — let others know how it went.
            </Text>
            <LeaveReviewButton listingId={listing.id} fullWidth />
          </View>
        )}
```

(`styles.card`, `styles.pickupInfoTitle`, `styles.metaText`, and `spacing` are all already defined/imported in this file.)

- [ ] **Step 4: Verify types and lint**

Run: `cd Sharikly-main/mobile && npm run typecheck && npm run lint`
Expected: no new errors (pre-existing warnings unrelated to these files are acceptable).

- [ ] **Step 5: Commit**

```bash
cd Sharikly-main/mobile
git add src/features/bookings/screens/BookingReceiptScreen.tsx
git commit -m "feat(mobile): show Leave a review on completed booking receipt"
```

---

### Task 4: Wire into `BookingCard` (completed bucket)

**Files:**
- Modify: `src/features/bookings/components/BookingCard.tsx`

**Interfaces:**
- Consumes: `LeaveReviewButton` from Task 2; `deriveStatus` (already imported in this file); `role`, `booking`, `listing` locals already present.

- [ ] **Step 1: Add the import**

At the top of `src/features/bookings/components/BookingCard.tsx`, add:

```tsx
import { LeaveReviewButton } from "@/features/reviews/LeaveReviewButton";
```

- [ ] **Step 2: Replace the completed-bucket actions branch**

In `renderActions()`, replace the final "Completed / declined / cancelled — details only." branch (currently lines ~189-197):

```tsx
    // Completed / declined / cancelled — details only.
    return (
      <View style={styles.actionRow}>
        <Pressable style={[styles.detailsBtn, styles.fullBtn]} onPress={onPress}>
          <FileText size={15} color={colors.primary} />
          <Text style={styles.detailsText}>View Details</Text>
        </Pressable>
      </View>
    );
```

with:

```tsx
    // Completed / declined / cancelled. Renters can review a completed rental.
    const canReview = role === "renter" && deriveStatus(booking) === "completed" && !!listing?.id;
    return (
      <View style={styles.actionRow}>
        <Pressable style={[styles.detailsBtn, !canReview && styles.fullBtn]} onPress={onPress}>
          <FileText size={15} color={colors.primary} />
          <Text style={styles.detailsText}>View Details</Text>
        </Pressable>
        {canReview && (
          <View style={styles.fullBtn}>
            <LeaveReviewButton listingId={listing.id} size="sm" fullWidth />
          </View>
        )}
      </View>
    );
```

- [ ] **Step 3: Verify types and lint**

Run: `cd Sharikly-main/mobile && npm run typecheck && npm run lint`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
cd Sharikly-main/mobile
git add src/features/bookings/components/BookingCard.tsx
git commit -m "feat(mobile): add Leave a review action to completed booking cards"
```

---

### Task 5: Full verification + manual QA

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `cd Sharikly-main/mobile && npm test`
Expected: all suites pass, including the two new files (7 new tests total). If a pre-existing test env issue surfaces around reanimated for other suites (not ours), it is out of scope — ours mock `PrimaryButton`/`lucide` and must pass.

- [ ] **Step 2: Typecheck + lint the whole project**

Run: `cd Sharikly-main/mobile && npm run typecheck && npm run lint`
Expected: no new errors introduced by Tasks 1–4.

- [ ] **Step 3: Manual QA against a running backend**

Prerequisite: backend running with a test account that has a **CONFIRMED booking whose `end_date` is in the past** (seed one if needed). Then, in the app:

1. Bookings tab → Completed → the card shows **"Leave a review"** next to "View Details" (renter role only). A host viewing their own item's booking shows no review button.
2. Open the completed booking → the receipt shows the **"Rate your experience"** card with the button.
3. Tap **Leave a review** → modal opens. Submit is **disabled** until ≥1 star is selected.
4. Select stars + optional comment → **Submit review** → success toast, modal closes, button becomes **"Review submitted"**.
5. Reopen the same booking / card → tapping submit again returns the "already reviewed" toast and the reviewed state (one review per listing).
6. Open the listing detail for that item → the aggregate (`⭐ x.x · n reviews`) reflects the new review; the review appears on the host's public profile.
7. Airplane mode → submit shows an error toast (not a silent hang).

- [ ] **Step 4: Final commit (if any QA fixups were needed)**

```bash
cd Sharikly-main/mobile
git add -A
git commit -m "test(mobile): verify submit-review flow end-to-end"
```

---

## Notes / deliberate scope decisions

- **No backend changes.** `POST /api/listings/<id>/reviews/` and `submitReview()` already exist and enforce all rules.
- **Reviewed-state detection is local + 400-driven**, not a pre-fetch. We don't add an extra "have I reviewed?" round-trip: we show the button on completed rentals and, if the user already reviewed (this session or a prior one), the backend's `400 "already reviewed"` flips the button to "Review submitted". This keeps scope tight and avoids N-per-card fetches in the list. (A future enhancement could expose a `has_reviewed` flag on the booking serializer to hide the button pre-emptively across sessions.)
- **Out of scope (YAGNI):** editing/deleting a review (no safe gated backend path), rendering the individual review list on Listing Detail, per-booking reviews (backend keys on `(user, listing)`), and review helpful-voting.
