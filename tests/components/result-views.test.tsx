import { act, render, renderHook, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AllocationMap } from "@/components/app/allocation-map"
import { CalculatorResultsSection } from "@/components/app/calculator-results-section"
import { SubnetHierarchy } from "@/components/app/subnet-hierarchy"
import { useCopyResults } from "@/hooks/use-copy-results"
import { calculateVlsm, type VlsmCalculationSuccess } from "@/lib/vlsm"

function validCalculation(): VlsmCalculationSuccess {
  const calculation = calculateVlsm({
    baseNetwork: "192.168.10.0",
    baseCidr: 24,
    subnets: [
      { id: 1, name: "Engineering", hosts: 62 },
      { id: 2, name: "Guest Wi-Fi", hosts: 40 },
    ],
  })
  if (!calculation.ok) throw new Error("fixture must be valid")
  return calculation
}

describe("synchronized result views", () => {
  it("offers table, allocation map, and hierarchy from one successful calculation", () => {
    render(
      <CalculatorResultsSection
        calculation={validCalculation()}
        resultsAreStale={false}
        activeView="table"
        onViewChange={vi.fn()}
        copied={false}
        exporting={false}
        onCopyResults={vi.fn()}
        onExportPdf={vi.fn()}
        selectedSubnet={null}
        onToggleSubnet={vi.fn()}
      />
    )

    expect(screen.getByRole("tab", { name: "Table" })).toBeInTheDocument()
    expect(
      screen.getByRole("tab", { name: "Allocation map" })
    ).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Hierarchy" })).toBeInTheDocument()
    expect(
      screen.getByText("128 allocated · 128 addresses free")
    ).toBeInTheDocument()
    expect(screen.queryByRole("tab", { name: /card/i })).not.toBeInTheDocument()
  })

  it("disables output actions without current committed results", () => {
    const { rerender } = render(
      <CalculatorResultsSection
        calculation={null}
        resultsAreStale={false}
        activeView="table"
        onViewChange={vi.fn()}
        copied={false}
        exporting={false}
        onCopyResults={vi.fn()}
        onExportPdf={vi.fn()}
        selectedSubnet={null}
        onToggleSubnet={vi.fn()}
      />
    )

    expect(screen.getByRole("heading", { name: "Results" })).not.toHaveClass(
      "font-mono"
    )
    expect(screen.getByRole("button", { name: "Copy all" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Export PDF" })).toBeDisabled()
    expect(screen.getByText("No results")).toBeInTheDocument()
    expect(screen.getByText("Calculate a valid plan to see results.")).toBeInTheDocument()
    expect(screen.queryByText(/committed/i)).not.toBeInTheDocument()

    rerender(
      <CalculatorResultsSection
        calculation={validCalculation()}
        resultsAreStale
        activeView="table"
        onViewChange={vi.fn()}
        copied={false}
        exporting={false}
        onCopyResults={vi.fn()}
        onExportPdf={vi.fn()}
        selectedSubnet={null}
        onToggleSubnet={vi.fn()}
      />
    )

    expect(screen.getByRole("button", { name: "Copy all" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Export PDF" })).toBeDisabled()
  })

  it("uses returned requirement IDs after largest-first reordering", async () => {
    const calculation = calculateVlsm({
      baseNetwork: "192.168.1.0",
      baseCidr: 24,
      subnets: [
        { id: 41, name: "Small", hosts: 10 },
        { id: 87, name: "Large", hosts: 50 },
      ],
    })
    if (!calculation.ok) throw new Error("fixture must be valid")
    const user = userEvent.setup()
    const onToggle = vi.fn()

    render(
      <AllocationMap
        calculation={calculation}
        selectedSubnet={87}
        onToggleSubnet={onToggle}
      />
    )

    const large = screen.getByRole("button", {
      name: "Large /26, 64 addresses",
    })
    expect(large).toHaveAttribute("aria-pressed", "true")
    expect(large).toHaveClass("border-primary")
    await user.click(large)
    expect(onToggle).toHaveBeenCalledWith(87)
  })

  it("keeps dense segments proportional and exposes distinct touch controls", async () => {
    const calculation = calculateVlsm({
      baseNetwork: "192.168.1.0",
      baseCidr: 24,
      subnets: Array.from({ length: 16 }, (_, index) => ({
        id: index + 1,
        name: `Dense ${index + 1}`,
        hosts: 1,
      })),
    })
    if (!calculation.ok) throw new Error("fixture must be valid")
    const user = userEvent.setup()
    const onToggle = vi.fn()

    const { container } = render(
      <AllocationMap
        calculation={calculation}
        selectedSubnet={null}
        onToggleSubnet={onToggle}
      />
    )

    const segments = Array.from(
      container.querySelectorAll<HTMLElement>(
        '[data-slot="allocation-segment"]'
      )
    )
    expect(segments).toHaveLength(16)
    expect(segments[0]).toHaveStyle({ left: "0%", width: "1.5625%" })
    expect(segments[1]).toHaveStyle({
      left: "1.5625%",
      width: "1.5625%",
    })

    expect(
      screen.getByRole("group", {
        name: "Select a subnet from allocation map",
      })
    ).toBeInTheDocument()
    const controls = screen.getAllByRole("button", {
      name: /Dense \d+ \/30, 4 addresses/,
    })
    expect(controls).toHaveLength(16)
    expect(new Set(controls)).toHaveLength(16)
    for (const control of controls) {
      expect(control).toHaveClass("min-h-11", "min-w-11")
    }

    await user.click(controls[0])
    await user.click(controls[15])
    expect(onToggle).toHaveBeenNthCalledWith(1, 1)
    expect(onToggle).toHaveBeenNthCalledWith(2, 16)
  })

  it("uses returned parent and utilization counts in map and hierarchy", () => {
    const calculation = {
      ...validCalculation(),
      allocatedAddresses: 111,
      remainingAddresses: 145,
    }
    const { rerender } = render(
      <AllocationMap
        calculation={calculation}
        selectedSubnet={null}
        onToggleSubnet={vi.fn()}
      />
    )

    expect(
      screen.getAllByText(/111 allocated · 145 addresses free/i)
    ).toHaveLength(1)

    rerender(
      <SubnetHierarchy
        calculation={calculation}
        selectedSubnet={2}
        onToggleSubnet={vi.fn()}
      />
    )

    expect(screen.getByText("Parent · 256 addresses")).toBeInTheDocument()
    expect(screen.getByText("Unallocated · 145 addresses")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /guest wi-fi.*selected/i })
    ).toHaveAttribute("aria-pressed", "true")
  })

  it("keeps result actions touch-sized and exposes selection without color alone", () => {
    render(
      <CalculatorResultsSection
        calculation={validCalculation()}
        resultsAreStale={false}
        activeView="table"
        onViewChange={vi.fn()}
        copied={false}
        exporting={false}
        onCopyResults={vi.fn()}
        onExportPdf={vi.fn()}
        selectedSubnet={1}
        onToggleSubnet={vi.fn()}
      />
    )

    expect(screen.getByRole("button", { name: "Copy all" })).toHaveClass("min-h-11")
    expect(screen.getByRole("button", { name: "Export PDF" })).toHaveClass("min-h-11")
    expect(screen.getByRole("tab", { name: "Table" })).toHaveClass("min-h-11")
    expect(screen.getByRole("button", { name: "Engineering" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByRole("button", { name: "Engineering" })).toHaveClass(
      "border-primary"
    )
    expect(
      screen.getByRole("button", { name: "Copy 192.168.10.0" })
    ).toHaveClass("min-h-11", "min-w-11")
  })
})

describe("useCopyResults", () => {
  it("copies allocations from a successful calculation", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })
    const { result } = renderHook(() => useCopyResults())

    await act(() => result.current.copyResults(validCalculation()))

    expect(writeText).toHaveBeenCalledWith(
      "Engineering: 192.168.10.0/26 (Mask: 255.255.255.192, Range: 192.168.10.1 - 192.168.10.62)\n" +
        "Guest Wi-Fi: 192.168.10.64/26 (Mask: 255.255.255.192, Range: 192.168.10.65 - 192.168.10.126)"
    )
  })
})
