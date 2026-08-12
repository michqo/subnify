import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  CalculatorInputSection,
  type CalculatorInputSectionProps,
} from "@/components/app/calculator-input-section"

function buildProps(
  overrides: Partial<CalculatorInputSectionProps> = {}
): CalculatorInputSectionProps {
  return {
    baseNetwork: "192.168.1.5",
    baseCidr: "24",
    onBaseNetworkChange: vi.fn(),
    onBaseCidrChange: vi.fn(),
    isAuthenticated: false,
    planName: "",
    onPlanNameChange: vi.fn(),
    isAiPlan: false,
    isCloudLinkedPlan: false,
    isEditingAiCloudPlan: false,
    shouldSaveToCloud: false,
    onShouldSaveToCloudChange: vi.fn(),
    subnets: [{ id: 1, name: "LAN", hosts: 50 }],
    onAddSubnet: vi.fn(),
    onUpdateSubnet: vi.fn(),
    onRemoveSubnet: vi.fn(),
    onSubmit: vi.fn(),
    onReset: vi.fn(),
    submittedIssues: [],
    ...overrides,
  }
}

describe("CalculatorInputSection", () => {
  it("associates errors and focuses the plan alert", async () => {
    const onBaseNetworkChange = vi.fn()
    render(
      <CalculatorInputSection
        {...buildProps({
          onBaseNetworkChange,
          submittedIssues: [
            {
              code: "NON_CANONICAL_BASE_NETWORK",
              field: "baseNetwork",
              message: "Use the canonical network.",
              suggestion: "192.168.1.0",
            },
            {
              code: "INSUFFICIENT_ADDRESS_SPACE",
              field: "subnets",
              message: "Requirements do not fit.",
            },
          ],
        })}
      />
    )

    expect(screen.getByLabelText("Base Network")).toHaveAttribute(
      "aria-invalid",
      "true"
    )
    expect(screen.getByLabelText("Base Network")).toHaveAccessibleDescription(
      /canonical network/i
    )
    expect(await screen.findByRole("alert")).toHaveFocus()
    const suggestion = screen.getByRole("button", {
      name: /use 192\.168\.1\.0/i,
    })
    expect(suggestion).toBeEnabled()

    await userEvent.click(suggestion)
    expect(onBaseNetworkChange).toHaveBeenCalledWith("192.168.1.0")
  })

  it("associates row issues with subnet inputs", () => {
    render(
      <CalculatorInputSection
        {...buildProps({
          submittedIssues: [
            {
              code: "INVALID_SUBNET_NAME",
              field: "subnets.0.name",
              message: "Subnet name must contain 1 to 80 characters.",
            },
            {
              code: "INVALID_HOST_COUNT",
              field: "subnets.0.hosts",
              message: "Required hosts must be a whole number.",
            },
          ],
        })}
      />
    )

    expect(screen.getByLabelText("Subnet 1 name")).toHaveAccessibleDescription(
      /1 to 80 characters/i
    )
    expect(screen.getByLabelText("Subnet 1 required hosts")).toHaveAttribute(
      "aria-invalid",
      "true"
    )
  })

  it("keeps submit available and enforces subnet input limits", () => {
    const subnets = Array.from({ length: 100 }, (_, index) => ({
      id: index + 1,
      name: `LAN ${index + 1}`,
      hosts: 1,
    }))
    render(<CalculatorInputSection {...buildProps({ subnets })} />)

    expect(screen.getByRole("button", { name: /calculate vlsm/i })).toBeEnabled()
    expect(screen.getByRole("button", { name: /add subnet/i })).toBeDisabled()
    expect(screen.getByLabelText("Subnet 1 name")).toHaveAttribute(
      "maxlength",
      "80"
    )
    expect(screen.getByLabelText("Subnet 1 required hosts")).toHaveAttribute(
      "min",
      "1"
    )
    expect(screen.getByLabelText("Subnet 1 required hosts")).toHaveAttribute(
      "max",
      "4294967294"
    )
    expect(screen.getByRole("button", { name: "Remove LAN 1" })).toBeEnabled()
  })
})
