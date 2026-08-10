import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { MiqalHeader } from "@/components/core/miqal-header"

vi.mock("next/navigation", () => ({
  usePathname: () => "/app",
}))

vi.mock("@/components/core/auth-provider", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isAuthLoading: false,
    openAuthDialog: vi.fn(),
    signOut: vi.fn(),
    user: null,
  }),
}))

describe("MiqalHeader", () => {
  it("exposes Miqal identity and core application routes", () => {
    render(<MiqalHeader variant="app" />)

    expect(screen.getByRole("link", { name: "Miqal home" })).toHaveAttribute("href", "https://miqal.xyz")
    expect(screen.getByRole("link", { name: "Subnify home" })).toHaveAttribute("href", "/")
    expect(screen.getByRole("link", { name: "Planner" })).toHaveAttribute("href", "/app")
    expect(screen.getByRole("link", { name: "History" })).toHaveAttribute("href", "/app/history")
    expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute("href", "/app/help")
    expect(screen.queryByText("AI Network Designer")).not.toBeInTheDocument()
  })
})
