import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { GenerateRequirementsDialog } from "@/components/app/generate-requirements-dialog"

const { generate } = vi.hoisted(() => ({ generate: vi.fn() }))

vi.mock("@/components/core/auth-provider", () => ({
  useAuth: () => ({ user: { id: "user-1" }, isAuthenticated: true }),
}))

vi.mock("@/lib/queries/ai-designer", () => ({
  AiDesignerApiError: class AiDesignerApiError extends Error {},
  useAiDesignerQuotaQuery: () => ({ data: { limit: 3, used: 0, remaining: 3, windowHours: 24 }, isLoading: false }),
  useGenerateAiDesignMutation: () => ({ mutateAsync: generate, isPending: false }),
}))

describe("GenerateRequirementsDialog", () => {
  it("previews and explicitly applies normalized requirements", async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    generate.mockResolvedValueOnce({
      plan: {
        title: "Three-floor office",
        rationale: "Separate trust zones.",
        baseNetwork: "10.20.0.0",
        baseCidr: 23,
        subnets: [{ name: "Staff", hosts: 120, purpose: "Employee devices" }],
      },
      timing: { latencyMs: 1200 },
    })

    render(<GenerateRequirementsDialog open onOpenChange={vi.fn()} onApply={onApply} />)
    await user.type(screen.getByLabelText("Environment requirements"), "three-floor office")
    await user.click(screen.getByRole("button", { name: "Generate requirements" }))

    expect(await screen.findByText("Separate trust zones.")).toBeInTheDocument()
    expect(onApply).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "Apply to planner" }))
    expect(onApply).toHaveBeenCalledWith({
      baseNetwork: "10.20.0.0",
      baseCidr: "23",
      subnets: [{ id: 1, name: "Staff", hosts: 120 }],
      sourceType: "ai_design",
      aiPrompt: "three-floor office",
      aiRationale: "Separate trust zones.",
      suggestedTitle: "Three-floor office",
    })
  })

  it("preserves the prompt after generation failure", async () => {
    const user = userEvent.setup()
    generate.mockRejectedValueOnce(new Error("Provider timed out"))
    render(<GenerateRequirementsDialog open onOpenChange={vi.fn()} onApply={vi.fn()} />)

    const prompt = screen.getByLabelText("Environment requirements")
    await user.type(prompt, "branch with voice and guest")
    await user.click(screen.getByRole("button", { name: "Generate requirements" }))

    expect(await screen.findByText("Provider timed out")).toBeInTheDocument()
    expect(prompt).toHaveValue("branch with voice and guest")
  })
})
