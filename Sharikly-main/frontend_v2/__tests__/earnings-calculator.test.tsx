import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import axiosInstance from "@/lib/axios"
import { EarningsCalculator } from "@/components/earnings/EarningsCalculator"

vi.mock("@/lib/axios", () => ({
  default: {
    post: vi.fn(),
  },
}))

describe("EarningsCalculator", () => {
  it("submits values and renders the projected result", async () => {
    process.env.NEXT_PUBLIC_API_BASE = "http://example.com/api"
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: {
        products_count: 3,
        daily_rental_price: "200.00",
        monthly_earnings: "1500.00",
        annual_earnings: "18000.00",
      },
    })

    render(
      <EarningsCalculator
        title="Calculator"
        description="Estimate your income"
        productsLabel="Products"
        priceLabel="Daily price"
        submitLabel="Calculate"
        resultTitle="You can earn"
        annualLabel="Annual earnings"
        monthlyLabel="Monthly earnings"
      />,
    )

    fireEvent.change(screen.getByLabelText("Products"), { target: { value: "3" } })
    fireEvent.change(screen.getByLabelText("Daily price"), { target: { value: "200" } })
    fireEvent.click(screen.getByRole("button", { name: "Calculate" }))

    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalled()
    })

    expect(await screen.findByText(/annual earnings/i)).toBeDefined()
    expect(screen.getAllByText(/SAR/).length).toBeGreaterThan(0)
  })
})
