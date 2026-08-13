import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { HistoryList } from "@/components/app/history-list"

const { rename, duplicate, remove } = vi.hoisted(() => ({
  rename: vi.fn().mockResolvedValue("manual-1"),
  duplicate: vi.fn().mockResolvedValue("copy-1"),
  remove: vi.fn().mockResolvedValue(undefined),
}))

const records = [
  {
    id: "manual-1", title: "Branch office", source_type: "manual", ai_prompt: null, ai_rationale: null,
    base_network: "192.168.10.0", base_cidr: 24, input_subnets: [{ name: "Staff", hosts: 62 }], result_subnets: [],
    total_required_hosts: 62, total_usable_hosts: 62, created_at: "2026-08-10T10:00:00.000Z",
  },
  {
    id: "ai-1", title: "Campus draft", source_type: "ai_design", ai_prompt: "campus", ai_rationale: "zones",
    base_network: "10.20.0.0", base_cidr: 20, input_subnets: [{ name: "Students", hosts: 500 }], result_subnets: [],
    total_required_hosts: 500, total_usable_hosts: 510, created_at: "2026-08-09T10:00:00.000Z",
  },
]

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock("@/components/core/auth-provider", () => ({
  useAuth: () => ({ user: { id: "user-1" }, openAuthDialog: vi.fn() }),
}))
vi.mock("@/lib/queries/calculations", () => ({
  useCalculationsQuery: () => ({ data: records, isLoading: false, isError: false, error: null, refetch: vi.fn() }),
  useDeleteCalculationMutation: () => ({ mutateAsync: remove, isPending: false, variables: null }),
  useRenameCalculationMutation: () => ({ mutateAsync: rename, isPending: false }),
  useDuplicateCalculationMutation: () => ({ mutateAsync: duplicate, isPending: false }),
}))

describe("HistoryList", () => {
  it("searches by title or base network and filters source", async () => {
    const user = userEvent.setup()
    render(<HistoryList />)

    expect(screen.getByRole("heading", { level: 1, name: "Saved plans" })).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Search name or network")).toBeInTheDocument()
    expect(screen.queryByText("Cloud workspace")).not.toBeInTheDocument()

    await user.type(screen.getByLabelText("Search plans"), "10.20")
    expect(screen.getByText("Campus draft")).toBeInTheDocument()
    expect(screen.queryByText("Branch office")).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText("Search plans"))
    await user.selectOptions(screen.getByLabelText("Plan source"), "manual")
    expect(screen.getByText("Branch office")).toBeInTheDocument()
    expect(screen.queryByText("Campus draft")).not.toBeInTheDocument()
  })

  it("renames and duplicates through explicit actions", async () => {
    const user = userEvent.setup()
    render(<HistoryList />)

    await user.click(screen.getByRole("button", { name: "Rename Branch office" }))
    const title = screen.getByRole("textbox", { name: "Name" })
    expect(screen.queryByText(/short name you can recognize/i)).not.toBeInTheDocument()
    await user.clear(title)
    await user.type(title, "Bratislava branch")
    await user.click(screen.getByRole("button", { name: "Save" }))
    expect(rename).toHaveBeenCalledWith({ calculationId: "manual-1", title: "Bratislava branch" })

    await user.click(screen.getByRole("button", { name: "Duplicate Branch office" }))
    expect(duplicate).toHaveBeenCalledWith(records[0])
  })

  it("requires confirmation before deletion", async () => {
    const user = userEvent.setup()
    render(<HistoryList />)
    await user.click(screen.getByRole("button", { name: "Delete Branch office" }))
    expect(remove).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "Confirm delete" }))
    expect(remove).toHaveBeenCalledWith("manual-1")
  })
})
