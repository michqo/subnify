import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { GenerateRequirementsDialog } from "@/components/app/generate-requirements-dialog"
import { calculateVlsm } from "@/lib/vlsm"

const { generate } = vi.hoisted(() => ({ generate: vi.fn() }))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, reject, resolve }
}

vi.mock("@/components/core/auth-provider", () => ({
  useAuth: () => ({ user: { id: "user-1" }, isAuthenticated: true }),
}))

vi.mock("@/lib/queries/ai-designer", () => ({
  AiDesignerApiError: class AiDesignerApiError extends Error {},
  useAiDesignerQuotaQuery: () => ({ data: { limit: 3, used: 0, remaining: 3, windowHours: 24 }, isLoading: false }),
  useGenerateAiDesignMutation: () => ({ mutateAsync: generate, isPending: false }),
}))

describe("GenerateRequirementsDialog", () => {
  beforeEach(() => {
    generate.mockReset()
  })

  it("shows and enforces the 4000 character prompt limit", () => {
    render(<GenerateRequirementsDialog open onOpenChange={vi.fn()} onApply={vi.fn()} />)

    const prompt = screen.getByLabelText("Environment requirements")
    expect(prompt).toHaveAttribute("maxLength", "4000")
    expect(screen.getByText("0 / 4000 characters")).toBeInTheDocument()
  })

  it("applies the normalized prompt bound to the successful plan", async () => {
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
    await user.type(screen.getByLabelText("Environment requirements"), "  three-floor office  ")
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

  it("previews and applies the same effective defaults without changing one host", async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    generate.mockResolvedValueOnce({
      plan: {
        title: "Small default network",
        rationale: "Use the deterministic defaults.",
        baseNetwork: null,
        baseCidr: null,
        subnets: [{ name: "Printer", hosts: 1 }],
      },
    })

    render(
      <GenerateRequirementsDialog
        open
        onOpenChange={vi.fn()}
        onApply={onApply}
      />
    )
    await user.type(
      screen.getByLabelText("Environment requirements"),
      "one printer"
    )
    await user.click(
      screen.getByRole("button", { name: "Generate requirements" })
    )

    expect(await screen.findByText("192.168.0.0/24")).toBeInTheDocument()
    expect(screen.getByText("1 hosts")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Apply to planner" }))

    const appliedPlan = onApply.mock.calls[0]?.[0]
    expect(appliedPlan).toMatchObject({
      baseNetwork: "192.168.0.0",
      baseCidr: "24",
      subnets: [{ id: 1, name: "Printer", hosts: 1 }],
    })
    expect(
      calculateVlsm({
        baseNetwork: appliedPlan.baseNetwork,
        baseCidr: Number(appliedPlan.baseCidr),
        subnets: appliedPlan.subnets,
      }).ok
    ).toBe(true)
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
    expect(screen.getByRole("button", { name: "Generate requirements" })).toBeEnabled()
  })

  it("offers generation again after a retryable failure", async () => {
    const user = userEvent.setup()
    generate
      .mockRejectedValueOnce(new Error("Generation failed. Reference: request-1"))
      .mockResolvedValueOnce({
        plan: {
          title: "Branch office",
          rationale: "Separate voice and guest traffic.",
          baseNetwork: "10.20.0.0",
          baseCidr: 24,
          subnets: [{ name: "Voice", hosts: 30 }],
        },
      })

    render(<GenerateRequirementsDialog open onOpenChange={vi.fn()} onApply={vi.fn()} />)
    await user.type(screen.getByLabelText("Environment requirements"), "branch office")
    await user.click(screen.getByRole("button", { name: "Generate requirements" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Reference: request-1")
    await user.click(screen.getByRole("button", { name: "Generate requirements" }))

    expect(await screen.findByText("Separate voice and guest traffic.")).toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(screen.getByLabelText("Environment requirements")).toHaveValue("branch office")
  })

  it("cannot apply an earlier plan after a later prompt fails", async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    generate
      .mockResolvedValueOnce({
        plan: {
          title: "Office A",
          rationale: "Plan for office A.",
          baseNetwork: "10.10.0.0",
          baseCidr: 24,
          subnets: [{ name: "Staff A", hosts: 20 }],
        },
      })
      .mockRejectedValueOnce(new Error("Generation failed. Reference: request-2"))

    render(<GenerateRequirementsDialog open onOpenChange={vi.fn()} onApply={onApply} />)
    const prompt = screen.getByLabelText("Environment requirements")
    await user.type(prompt, "office A")
    await user.click(screen.getByRole("button", { name: "Generate requirements" }))
    expect(await screen.findByText("Plan for office A.")).toBeInTheDocument()

    await user.clear(prompt)
    await user.type(prompt, "office B")
    await user.click(screen.getByRole("button", { name: "Generate requirements" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Reference: request-2")
    expect(screen.queryByText("Plan for office A.")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Apply to planner" })).not.toBeInTheDocument()
    expect(onApply).not.toHaveBeenCalled()
    expect(prompt).toHaveValue("office B")
  })

  it("invalidates a successful preview as soon as the prompt changes", async () => {
    const user = userEvent.setup()
    generate.mockResolvedValueOnce({
      plan: {
        title: "Office A",
        rationale: "Plan for office A.",
        baseNetwork: "10.10.0.0",
        baseCidr: 24,
        subnets: [{ name: "Staff A", hosts: 20 }],
      },
    })

    render(<GenerateRequirementsDialog open onOpenChange={vi.fn()} onApply={vi.fn()} />)
    const prompt = screen.getByLabelText("Environment requirements")
    await user.type(prompt, "office A")
    await user.click(screen.getByRole("button", { name: "Generate requirements" }))
    expect(await screen.findByText("Plan for office A.")).toBeInTheDocument()

    await user.type(prompt, " changed")

    expect(screen.queryByText("Plan for office A.")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Apply to planner" })).not.toBeInTheDocument()
  })

  it("ignores an in-flight result after the prompt changes", async () => {
    const user = userEvent.setup()
    const request = deferred<{
      plan: {
        title: string
        rationale: string
        baseNetwork: string
        baseCidr: number
        subnets: Array<{ name: string; hosts: number }>
      }
    }>()
    generate.mockReturnValueOnce(request.promise)

    render(<GenerateRequirementsDialog open onOpenChange={vi.fn()} onApply={vi.fn()} />)
    const prompt = screen.getByLabelText("Environment requirements")
    await user.type(prompt, "office A")
    await user.click(screen.getByRole("button", { name: "Generate requirements" }))
    await user.clear(prompt)
    await user.type(prompt, "office B")

    await act(async () => {
      request.resolve({
        plan: {
          title: "Office A",
          rationale: "Late plan for office A.",
          baseNetwork: "10.10.0.0",
          baseCidr: 24,
          subnets: [{ name: "Staff A", hosts: 20 }],
        },
      })
      await request.promise
    })

    expect(screen.queryByText("Late plan for office A.")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Apply to planner" })).not.toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(prompt).toHaveValue("office B")
  })

  it("ignores an in-flight error after the prompt changes", async () => {
    const user = userEvent.setup()
    const request = deferred<never>()
    generate.mockReturnValueOnce(request.promise)

    render(<GenerateRequirementsDialog open onOpenChange={vi.fn()} onApply={vi.fn()} />)
    const prompt = screen.getByLabelText("Environment requirements")
    await user.type(prompt, "office A")
    await user.click(screen.getByRole("button", { name: "Generate requirements" }))
    await user.clear(prompt)
    await user.type(prompt, "office B")

    await act(async () => {
      request.reject(new Error("Late failure for office A"))
      await request.promise.catch(() => undefined)
    })

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Apply to planner" })).not.toBeInTheDocument()
    expect(prompt).toHaveValue("office B")
  })
})
