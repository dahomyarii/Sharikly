import type { ReactElement } from "react";
import { LeaveReviewButton } from "@/features/reviews/LeaveReviewButton";
import { submitReview } from "@/services/api/endpoints/listings";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

jest.mock("@/services/api/endpoints/listings", () => ({ submitReview: jest.fn() }));

// Current user is id 12 for these tests.
jest.mock("@/features/auth/hooks/useCurrentUserId", () => ({ useCurrentUserId: () => 12 }));

// Render lucide icons as plain Views (no SVG in the test env).
jest.mock("lucide-react-native", () => {
  const { View } = require("react-native");
  return { Star: (p: any) => <View {...p} /> };
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

function harness(props: Partial<React.ComponentProps<typeof LeaveReviewButton>> = {}): ReactElement {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <LeaveReviewButton listingId={42} {...props} />
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
    await waitFor(() => expect(screen.getByText("Your review")).toBeTruthy());
  });

  it("flips to the reviewed state on an 'already reviewed' 400", async () => {
    mockedSubmit.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { error: "You have already reviewed this listing. You can only review once." },
      },
    });
    render(harness());
    fireEvent.press(screen.getByText("Leave a review"));
    fireEvent.press(screen.getByTestId("star-rating-star-3"));
    fireEvent.press(screen.getByText("Submit review"));
    await waitFor(() => expect(screen.getByText("Your review")).toBeTruthy());
  });

  it("shows the reviewed state on mount when the user already reviewed", () => {
    render(harness({ reviews: [{ id: 9, user: { id: 12 }, rating: 4, comment: "solid" }] }));
    expect(screen.getByText("Your review")).toBeTruthy();
    expect(screen.queryByText("Leave a review")).toBeNull();
  });

  it("shows the button when only other users have reviewed", () => {
    render(harness({ reviews: [{ id: 9, user: { id: 7 }, rating: 4 }] }));
    expect(screen.getByText("Leave a review")).toBeTruthy();
    expect(screen.queryByText("Your review")).toBeNull();
  });
});
