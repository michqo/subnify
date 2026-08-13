import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PlannerWorkspace } from "@/components/app/planner-workspace"
import { diagnosePlan } from "@/lib/planner/diagnostics"

vi.mock("next/navigation", () => ({
  usePathname: () => "/app",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@/components/core/auth-provider", () => ({
  useAuth: () => ({ isAuthenticated: false, openAuthDialog: vi.fn(), user: null }),
}))

const validDiagnostics = diagnosePlan({
  baseNetwork: "192.168.10.0",
  baseCidr: "24",
  subnets: [{ id: 1, name: "Engineering", hosts: 62 }],
})

function RenameHarness({ initialName = "" }: { initialName?: string }) {
  const [planName, setPlanName] = useState(initialName)

  return (
    <PlannerWorkspace
      diagnostics={validDiagnostics}
      resultsAreStale={false}
      planName={planName}
      onPlanNameChange={setPlanName}
      planBaseNetwork="192.168.10.0"
      planBaseCidr="24"
      requirementCount={1}
      hasMeaningfulEdits={false}
      onApplyTemplate={vi.fn()}
      editor={<div>Editor</div>}
      resultsContent={<div>Results</div>}
    />
  )
}

function ControlledRenameHarness({
  planName,
  onPlanNameChange,
}: {
  planName: string
  onPlanNameChange: (name: string) => void
}) {
  return (
    <PlannerWorkspace
      diagnostics={validDiagnostics}
      resultsAreStale={false}
      planName={planName}
      onPlanNameChange={onPlanNameChange}
      planBaseNetwork="192.168.10.0"
      planBaseCidr="24"
      requirementCount={1}
      hasMeaningfulEdits={false}
      onApplyTemplate={vi.fn()}
      editor={<div>Editor</div>}
      resultsContent={<div>Results</div>}
    />
  )
}

describe("PlannerWorkspace", () => {
  beforeEach(() => localStorage.clear())

  it("leads with plan name and current network metadata", () => {
    render(
      <PlannerWorkspace
        diagnostics={validDiagnostics}
        resultsAreStale={false}
        planName="Branch office"
        onPlanNameChange={vi.fn()}
        planBaseNetwork="192.168.10.0"
        planBaseCidr="24"
        requirementCount={1}
        hasMeaningfulEdits={false}
        onApplyTemplate={vi.fn()}
        editor={<div>Editor</div>}
        resultsContent={<div>Results</div>}
      />
    )

    expect(
      screen.getByRole("heading", { level: 1, name: "Branch office" })
    ).toBeInTheDocument()
    expect(screen.getByText("192.168.10.0/24 · 1 requirements")).toBeInTheDocument()
    expect(screen.queryByText("IPv4 plan")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Draft requirements" })).toBeInTheDocument()
  })

  it("renames an untitled plan inline with the keyboard", async () => {
    const user = userEvent.setup()
    render(<RenameHarness />)

    await user.click(
      screen.getByRole("button", { name: "Rename plan: Untitled plan" })
    )

    const input = screen.getByRole("textbox", { name: "Plan name" })
    expect(input).toHaveFocus()
    expect(input).toHaveAttribute("maxlength", "80")

    await user.type(input, "Branch office{Enter}")

    expect(
      screen.getByRole("button", { name: "Rename plan: Branch office" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Rename plan: Branch office" })
    ).toHaveFocus()
  })

  it("commits a blank name on blur as Untitled plan", async () => {
    const user = userEvent.setup()
    render(<RenameHarness initialName="Branch office" />)

    await user.click(
      screen.getByRole("button", { name: "Rename plan: Branch office" })
    )
    const input = screen.getByRole("textbox", { name: "Plan name" })
    await user.clear(input)
    await user.type(input, "   ")
    await user.tab()

    expect(
      screen.getByRole("button", { name: "Rename plan: Untitled plan" })
    ).toBeInTheDocument()
  })

  it("keeps Tab focus on the next control after a blur commit", async () => {
    const user = userEvent.setup()
    render(<RenameHarness initialName="Branch office" />)

    await user.click(
      screen.getByRole("button", { name: "Rename plan: Branch office" })
    )
    await user.tab()

    expect(screen.getByRole("button", { name: "Templates" })).toHaveFocus()
  })

  it("restores the original name when Escape cancels editing", async () => {
    const user = userEvent.setup()
    const onPlanNameChange = vi.fn()

    render(
      <PlannerWorkspace
        diagnostics={validDiagnostics}
        resultsAreStale={false}
        planName="Branch office"
        onPlanNameChange={onPlanNameChange}
        planBaseNetwork="192.168.10.0"
        planBaseCidr="24"
        requirementCount={1}
        hasMeaningfulEdits={false}
        onApplyTemplate={vi.fn()}
        editor={<div>Editor</div>}
        resultsContent={<div>Results</div>}
      />
    )

    await user.click(
      screen.getByRole("button", { name: "Rename plan: Branch office" })
    )
    const input = screen.getByRole("textbox", { name: "Plan name" })
    await user.clear(input)
    await user.type(input, "Temporary{Escape}")

    expect(
      screen.getByRole("button", { name: "Rename plan: Branch office" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Rename plan: Branch office" })
    ).toHaveFocus()
    expect(onPlanNameChange).not.toHaveBeenCalled()
  })

  it("commits one rename callback when Enter triggers blur", async () => {
    const user = userEvent.setup()
    const onPlanNameChange = vi.fn()

    render(
      <PlannerWorkspace
        diagnostics={validDiagnostics}
        resultsAreStale={false}
        planName="Branch office"
        onPlanNameChange={onPlanNameChange}
        planBaseNetwork="192.168.10.0"
        planBaseCidr="24"
        requirementCount={1}
        hasMeaningfulEdits={false}
        onApplyTemplate={vi.fn()}
        editor={<div>Editor</div>}
        resultsContent={<div>Results</div>}
      />
    )

    await user.click(
      screen.getByRole("button", { name: "Rename plan: Branch office" })
    )
    const input = screen.getByRole("textbox", { name: "Plan name" })
    await user.clear(input)
    await user.type(input, "Datacenter{Enter}")

    expect(onPlanNameChange).toHaveBeenCalledTimes(1)
    expect(onPlanNameChange).toHaveBeenCalledWith("Datacenter")
  })

  it("cancels an active edit when the controlled name changes externally", async () => {
    const user = userEvent.setup()
    const onPlanNameChange = vi.fn()
    const { rerender } = render(
      <ControlledRenameHarness
        planName="Branch office"
        onPlanNameChange={onPlanNameChange}
      />
    )

    await user.click(
      screen.getByRole("button", { name: "Rename plan: Branch office" })
    )
    await user.clear(screen.getByRole("textbox", { name: "Plan name" }))
    await user.type(screen.getByRole("textbox", { name: "Plan name" }), "Stale draft")

    rerender(
      <ControlledRenameHarness
        planName="Restored history plan"
        onPlanNameChange={onPlanNameChange}
      />
    )

    expect(
      screen.getByRole("button", { name: "Rename plan: Restored history plan" })
    ).toBeInTheDocument()
    expect(onPlanNameChange).not.toHaveBeenCalled()
  })

  it("shows blocking diagnostics and capacity without hiding the editor", () => {
    const diagnostics = diagnosePlan({
      baseNetwork: "999.168.10.0",
      baseCidr: "24",
      subnets: [{ id: 1, name: "Engineering", hosts: 62 }],
    })

    render(
      <PlannerWorkspace
        diagnostics={diagnostics}
        resultsAreStale={false}
        planName=""
        onPlanNameChange={vi.fn()}
        planBaseNetwork="192.168.10.0"
        planBaseCidr="24"
        requirementCount={1}
        hasMeaningfulEdits={false}
        onApplyTemplate={vi.fn()}
        editor={<div>Editor remains visible</div>}
        resultsContent={<div>Results</div>}
      />
    )

    expect(screen.getByText("Editor remains visible")).toBeInTheDocument()
    const failureIssue = screen.getByText("Enter an IPv4 address using four decimal octets from 0 to 255.")
    expect(failureIssue).toHaveClass("text-destructive")
    expect(screen.getByText("0% used")).toBeInTheDocument()
  })

  it("marks committed results as outdated after inputs change", () => {
    render(
      <PlannerWorkspace
        diagnostics={validDiagnostics}
        resultsAreStale
        planName="Branch office"
        onPlanNameChange={vi.fn()}
        planBaseNetwork="192.168.10.0"
        planBaseCidr="24"
        requirementCount={1}
        hasMeaningfulEdits
        onApplyTemplate={vi.fn()}
        editor={<div>Editor</div>}
        resultsContent={<div>Results</div>}
      />
    )

    expect(screen.getByText(/results outdated/i)).toBeInTheDocument()
  })

  it("presents capacity as a direct fit status", () => {
    render(
      <PlannerWorkspace
        diagnostics={validDiagnostics}
        resultsAreStale={false}
        planName="Branch office"
        onPlanNameChange={vi.fn()}
        planBaseNetwork="192.168.10.0"
        planBaseCidr="24"
        requirementCount={1}
        hasMeaningfulEdits={false}
        onApplyTemplate={vi.fn()}
        editor={<div>Editor</div>}
        resultsContent={<div>Results</div>}
      />
    )

    expect(screen.getByRole("heading", { name: "Capacity" })).not.toHaveClass(
      "font-mono"
    )
    expect(screen.getByText("Fits · 192 addresses free")).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "Plan summary" })).toBeInTheDocument()
    expect(screen.getByText("Used")).toBeInTheDocument()
    expect(screen.queryByText("Address summary")).not.toBeInTheDocument()
  })

  it("remembers collapsed contextual guidance", async () => {
    const user = userEvent.setup()
    render(
      <PlannerWorkspace
        diagnostics={validDiagnostics}
        resultsAreStale={false}
        planName=""
        onPlanNameChange={vi.fn()}
        planBaseNetwork="192.168.10.0"
        planBaseCidr="24"
        requirementCount={1}
        hasMeaningfulEdits={false}
        onApplyTemplate={vi.fn()}
        editor={<div>Editor</div>}
        resultsContent={<div>Results</div>}
      />
    )

    expect(screen.getByText(/62 hosts plus network/i)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /hide allocation notes/i }))
    expect(screen.queryByText(/62 hosts plus network/i)).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /allocation notes/i })).toHaveAttribute(
      "aria-expanded",
      "false"
    )
    expect(localStorage.getItem("subnify-guidance")).toBe("collapsed")
  })
})
