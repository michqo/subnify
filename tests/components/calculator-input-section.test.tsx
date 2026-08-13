import { useState } from "react"
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

function StatefulSubnetName({
  onUpdateSubnet,
}: {
  onUpdateSubnet: CalculatorInputSectionProps["onUpdateSubnet"]
}) {
  const [subnets, setSubnets] = useState([{ id: 1, name: "", hosts: 50 }])

  return (
    <CalculatorInputSection
      {...buildProps({
        subnets,
        onUpdateSubnet: (id, field, value) => {
          onUpdateSubnet(id, field, value)
          setSubnets((current) =>
            current.map((subnet) =>
              subnet.id === id ? { ...subnet, [field]: value } : subnet
            )
          )
        },
      })}
    />
  )
}

describe("CalculatorInputSection", () => {
  it("uses concise planner labels and state copy", () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    )
    render(
      <CalculatorInputSection
        {...buildProps({
          isAuthenticated: true,
          shouldSaveToCloud: false,
        })}
      />
    )

    expect(screen.getByRole("heading", { name: "Plan" })).not.toHaveClass(
      "font-mono"
    )
    expect(screen.getByLabelText("Parent network")).toBeInTheDocument()
    expect(screen.getByLabelText("Prefix")).toBeInTheDocument()
    expect(screen.getByText("Requirements")).toBeInTheDocument()
    expect(screen.getByLabelText("Save to history")).toBeInTheDocument()
    expect(screen.queryByText(/Each entry defines/i)).not.toBeInTheDocument()
  })

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

    expect(screen.getByLabelText("Parent network")).toHaveAttribute(
      "aria-invalid",
      "true"
    )
    expect(screen.getByLabelText("Parent network")).toHaveAccessibleDescription(
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

  it("announces and focuses a noncanonical-only submitted failure", async () => {
    render(
      <CalculatorInputSection
        {...buildProps({
          submittedIssues: [
            {
              code: "NON_CANONICAL_BASE_NETWORK",
              field: "baseNetwork",
              message: "Use the canonical network.",
              suggestion: "192.168.1.0",
            },
          ],
        })}
      />
    )

    expect(screen.getAllByRole("alert")).toHaveLength(1)
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Use the canonical network."
    )
    expect(await screen.findByLabelText("Parent network")).toHaveFocus()
  })

  it("announces and focuses an invalid-host-only submitted failure", async () => {
    render(
      <CalculatorInputSection
        {...buildProps({
          submittedIssues: [
            {
              code: "INVALID_HOST_COUNT",
              field: "subnets.0.hosts",
              message: "Required hosts must be a whole number.",
            },
          ],
        })}
      />
    )

    expect(screen.getAllByRole("alert")).toHaveLength(1)
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Required hosts must be a whole number."
    )
    expect(
      await screen.findByLabelText("Subnet 1 required hosts")
    ).toHaveFocus()
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

  it("gives plan controls 44px mobile targets", () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    )
    render(
      <CalculatorInputSection
        {...buildProps({ isAuthenticated: true, shouldSaveToCloud: true })}
      />
    )

    expect(screen.getByLabelText("Plan name")).toHaveClass(
      "min-h-11",
      "md:min-h-9"
    )
    expect(
      screen.getByRole("checkbox", {
        name: /save to history/i,
      })
    ).toHaveClass("after:-inset-3.5")
    expect(
      screen.getByText(/save to history/i)
    ).toHaveClass("min-h-11")
  })

  it("accepts 80 astral characters and blocks the 81st subnet-name character", async () => {
    const user = userEvent.setup()
    const onUpdateSubnet = vi.fn()
    render(<StatefulSubnetName onUpdateSubnet={onUpdateSubnet} />)
    const input = screen.getByLabelText("Subnet 1 name")
    const eightyCharacters = "😀".repeat(80)

    await user.type(input, eightyCharacters)

    expect(input).toHaveValue(eightyCharacters)
    expect(Array.from((input as HTMLInputElement).value)).toHaveLength(80)

    await user.type(input, "😀")

    expect(input).toHaveValue(eightyCharacters)
    expect(onUpdateSubnet).toHaveBeenLastCalledWith(1, "name", eightyCharacters)
  })
})
