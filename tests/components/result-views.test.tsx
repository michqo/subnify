import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AllocationMap } from "@/components/app/allocation-map"
import { CalculatorResultsSection } from "@/components/app/calculator-results-section"
import { SubnetHierarchy } from "@/components/app/subnet-hierarchy"
import { diagnosePlan } from "@/lib/planner/diagnostics"

const subnets = [
  { id: 1, name: "Engineering", hosts: 62 },
  { id: 2, name: "Guest Wi-Fi", hosts: 40 },
]
const diagnostics = diagnosePlan({ baseNetwork: "192.168.10.0", baseCidr: "24", subnets })

describe("synchronized result views", () => {
  it("offers table, allocation map, and hierarchy without duplicate cards", () => {
    render(
      <CalculatorResultsSection
        results={diagnostics.allocations}
        activeView="table"
        onViewChange={vi.fn()}
        copied={false}
        exporting={false}
        onCopyResults={vi.fn()}
        onExportPdf={vi.fn()}
        selectedSubnet={null}
        onToggleSubnet={vi.fn()}
        subnets={subnets}
        baseNetwork="192.168.10.0"
        baseCidr="24"
        totalAddresses={256}
        allocatedAddresses={128}
        totalRequired={102}
        totalUsable={124}
      />
    )

    expect(screen.getByRole("tab", { name: "Table" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Allocation map" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Hierarchy" })).toBeInTheDocument()
    expect(screen.queryByRole("tab", { name: /card/i })).not.toBeInTheDocument()
  })

  it("exposes allocation-map selection through a real button", async () => {
    const user = userEvent.setup()
    const onToggleSubnet = vi.fn()
    render(
      <AllocationMap
        results={diagnostics.allocations}
        totalAddresses={256}
        selectedSubnet={1}
        onToggleSubnet={onToggleSubnet}
        subnets={subnets}
      />
    )

    const engineering = screen.getByRole("button", { name: /engineering.*\/26.*64 addresses/i })
    expect(engineering).toHaveAttribute("aria-pressed", "true")
    await user.click(engineering)
    expect(onToggleSubnet).toHaveBeenCalledWith(1)
    expect(screen.getAllByText(/128 addresses free/i)).toHaveLength(2)
  })

  it("uses the same subnet identity in hierarchy", () => {
    render(
      <SubnetHierarchy
        baseNetwork="192.168.10.0"
        baseCidr="24"
        results={diagnostics.allocations}
        totalAddresses={256}
        selectedSubnet={2}
        onToggleSubnet={vi.fn()}
        subnets={subnets}
      />
    )

    expect(screen.getByRole("button", { name: /guest wi-fi.*selected/i })).toHaveAttribute("aria-pressed", "true")
  })
})
