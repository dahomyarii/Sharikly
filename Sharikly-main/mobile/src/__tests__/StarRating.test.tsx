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
