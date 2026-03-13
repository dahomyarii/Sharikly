import { describe, expect, it } from "vitest"

import { formatSar, getBestChartPoint, toNumber } from "@/lib/earnings"

describe("earnings helpers", () => {
  it("parses numeric strings safely", () => {
    expect(toNumber("12.5")).toBe(12.5)
    expect(toNumber("oops")).toBe(0)
  })

  it("formats SAR values", () => {
    expect(formatSar("2300")).toContain("SAR")
  })

  it("finds the highest chart point", () => {
    expect(
      getBestChartPoint([
        { label: "Jan", earnings: "10.00", month: "2026-01-01" },
        { label: "Feb", earnings: "40.00", month: "2026-02-01" },
      ]),
    ).toEqual({ label: "Feb", earnings: "40.00", month: "2026-02-01" })
  })
})
