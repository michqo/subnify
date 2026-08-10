import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
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

describe("PlannerWorkspace", () => {
  beforeEach(() => localStorage.clear())

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
        hasMeaningfulEdits={false}
        onApplyTemplate={vi.fn()}
        editor={<div>Editor remains visible</div>}
        resultsContent={<div>Results</div>}
      />
    )

    expect(screen.getByText("Editor remains visible")).toBeInTheDocument()
    expect(screen.getByText("Enter a valid IPv4 address.")).toBeInTheDocument()
    expect(screen.getByText("0% used")).toBeInTheDocument()
  })

  it("marks committed results as outdated after inputs change", () => {
    render(
      <PlannerWorkspace
        diagnostics={validDiagnostics}
        resultsAreStale
        planName="Branch office"
        onPlanNameChange={vi.fn()}
        hasMeaningfulEdits
        onApplyTemplate={vi.fn()}
        editor={<div>Editor</div>}
        resultsContent={<div>Results</div>}
      />
    )

    expect(screen.getByText(/results outdated/i)).toBeInTheDocument()
  })

  it("remembers collapsed contextual guidance", async () => {
    const user = userEvent.setup()
    render(
      <PlannerWorkspace
        diagnostics={validDiagnostics}
        resultsAreStale={false}
        planName=""
        onPlanNameChange={vi.fn()}
        hasMeaningfulEdits={false}
        onApplyTemplate={vi.fn()}
        editor={<div>Editor</div>}
        resultsContent={<div>Results</div>}
      />
    )

    expect(screen.getByText(/62 hosts plus network/i)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /hide explanations/i }))
    expect(screen.queryByText(/62 hosts plus network/i)).not.toBeInTheDocument()
    expect(localStorage.getItem("subnify-guidance")).toBe("collapsed")
  })
})
