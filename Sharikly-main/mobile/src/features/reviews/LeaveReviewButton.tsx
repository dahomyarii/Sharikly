import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { StarRating } from "@/components/ui/StarRating";
import { useCurrentUserId } from "@/features/auth/hooks/useCurrentUserId";
import { findMyReview, type MyReview } from "@/features/reviews/myReview";
import { showToast } from "@/core/events/appEvents";
import { colors, radii, spacing } from "@/core/theme/tokens";
import { submitReview } from "@/services/api/endpoints/listings";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  /** The listing's reviews (as embedded on the booking/listing payload); used to
   *  detect the current user's own review so the reviewed state survives remounts. */
  reviews?: any[];
  /** Show the review comment under the stars in the reviewed state (receipt view). */
  showComment?: boolean;
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
  reviews,
  showComment = false,
  size = "md",
  fullWidth = false,
  style,
  onReviewed,
}: LeaveReviewButtonProps): React.ReactElement {
  const queryClient = useQueryClient();
  const myId = useCurrentUserId();
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  // Optimistic fallback for the same session before the booking refetch lands.
  const [justReviewed, setJustReviewed] = useState<MyReview | null>(null);

  // Server truth (survives remounts) wins; the local optimistic value is a fallback.
  const done: MyReview | null = findMyReview(reviews, myId) ?? justReviewed;

  const refreshReviewData = () => {
    void queryClient.invalidateQueries({ queryKey: ["listing", listingId] });
    void queryClient.invalidateQueries({ queryKey: ["reviews"] });
    void queryClient.invalidateQueries({ queryKey: ["bookings"] });
    void queryClient.invalidateQueries({ queryKey: ["booking"] });
  };

  const mutation = useMutation({
    // "always" so an offline submit fails visibly instead of silently pausing.
    networkMode: "always",
    mutationFn: () => submitReview(listingId, { rating, comment: comment.trim() }),
    onSuccess: () => {
      setJustReviewed({ rating, comment: comment.trim() });
      setVisible(false);
      refreshReviewData();
      showToast("Thanks for your review!", "success");
      onReviewed?.();
    },
    onError: (err: any) => {
      const msg = errorMessage(err);
      // Already reviewed (e.g. from another device): reflect the reviewed state and
      // refetch so the real review shows.
      if (err?.response?.status === 400 && /already reviewed/i.test(msg)) {
        setJustReviewed({ rating, comment: comment.trim() });
        setVisible(false);
        refreshReviewData();
        showToast("You've already reviewed this item.", "info");
        return;
      }
      showToast(String(msg), "error");
    },
  });

  if (done) {
    return (
      <View style={[styles.doneWrap, style]}>
        <Text style={styles.doneLabel}>Your review</Text>
        <StarRating value={done.rating} size={showComment ? 22 : 16} />
        {showComment && done.comment ? (
          <Text style={styles.doneComment} numberOfLines={5}>
            “{done.comment}”
          </Text>
        ) : null}
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
  doneWrap: { gap: 6, alignItems: "flex-start" },
  doneLabel: { fontSize: 13, fontWeight: "700", color: colors.foreground },
  doneComment: { fontSize: 14, color: colors.mutedForeground, fontStyle: "italic", lineHeight: 20 },
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
    paddingBottom: spacing.xl,
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
