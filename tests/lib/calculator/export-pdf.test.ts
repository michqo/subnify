import { beforeEach, describe, expect, it, vi } from "vitest"

import { buildPdfFilename, exportVlsmPdf } from "@/lib/calculator/export-pdf"
import { calculateVlsm } from "@/lib/vlsm"

const { mockText } = vi.hoisted(() => ({ mockText: vi.fn() }))

vi.mock("jspdf", () => ({
  jsPDF: class {
    text = mockText
    setTextColor = vi.fn()
    setFont = vi.fn()
    setFontSize = vi.fn()
    setDrawColor = vi.fn()
    setFillColor = vi.fn()
    rect = vi.fn()
    addPage = vi.fn()
    save = vi.fn()
    internal = { pageSize: { getHeight: () => 842 } }
  },
}))
vi.mock("jspdf-autotable", () => ({ default: vi.fn() }))

beforeEach(() => {
  mockText.mockClear()
})

describe("buildPdfFilename", () => {
  it("normalizes a plan name and uses a stable calendar date", () => {
    expect(
      buildPdfFilename("Branch Office", new Date("2026-08-10T12:00:00Z"))
    ).toBe("subnify-branch-office-20260810.pdf")
  })

  it("falls back for blank or punctuation-only names", () => {
    expect(buildPdfFilename("---", new Date("2026-01-02T12:00:00Z"))).toBe(
      "subnify-plan-20260102.pdf"
    )
  })
})

describe("exportVlsmPdf", () => {
  it("uses returned parent counts for PDF utilization", async () => {
    const calculation = calculateVlsm({
      baseNetwork: "192.168.1.0",
      baseCidr: 24,
      subnets: [
        { id: 1, name: "A", hosts: 50 },
        { id: 2, name: "B", hosts: 25 },
        { id: 3, name: "C", hosts: 10 },
      ],
    })
    if (!calculation.ok) throw new Error("fixture must be valid")

    await exportVlsmPdf({
      calculation,
      planName: "Branch",
      createdAt: new Date("2026-08-12T12:00:00Z"),
    })

    expect(mockText).toHaveBeenCalledWith(
      "Allocated: 112 / 256 addresses",
      40,
      expect.any(Number)
    )
  })
})
