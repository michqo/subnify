import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { TemplateDialog } from "@/components/app/template-dialog"

describe("TemplateDialog", () => {
  it("asks before replacing a meaningful current plan", async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(
      <TemplateDialog open onOpenChange={vi.fn()} hasMeaningfulEdits onApply={onApply} />
    )

    await user.click(screen.getByRole("button", { name: /small office/i }))
    expect(onApply).not.toHaveBeenCalled()
    expect(screen.getByText(/replace your current inputs/i)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /replace current plan/i }))
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({
      suggestedTitle: "Small office",
      sourceType: "manual",
    }))
  })

  it("applies directly when the current plan has no meaningful edits", async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(
      <TemplateDialog open onOpenChange={vi.fn()} hasMeaningfulEdits={false} onApply={onApply} />
    )

    await user.click(screen.getByRole("button", { name: /home lab/i }))
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ suggestedTitle: "Home lab" }))
  })
})
