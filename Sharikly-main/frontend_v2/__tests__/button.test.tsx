import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button (smoke)", () => {
  it("renders children", () => {
    render(<Button>Sign in</Button>);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeDefined();
  });

  it("renders as link when asChild and child is anchor", () => {
    render(
      <Button asChild>
        <a href="/login">Login</a>
      </Button>
    );
    const link = screen.getByRole("link", { name: /login/i });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/login");
  });
});
