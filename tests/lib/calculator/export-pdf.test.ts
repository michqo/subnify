import { describe, expect, it } from "vitest"

import { buildPdfFilename } from "@/lib/calculator/export-pdf"

describe("buildPdfFilename", () => {
  it("normalizes a plan name and uses a stable calendar date", () => {
    expect(buildPdfFilename("Branch Office", new Date("2026-08-10T12:00:00Z"))).toBe(
      "subnify-branch-office-20260810.pdf"
    )
  })

  it("falls back for blank or punctuation-only names", () => {
    expect(buildPdfFilename("---", new Date("2026-01-02T12:00:00Z"))).toBe("subnify-plan-20260102.pdf")
  })
})
