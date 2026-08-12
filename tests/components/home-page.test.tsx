import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import HomePage from "@/app/page"

describe("Subnify landing", () => {
  it("leads with a technical product promise and real network proof", () => {
    render(<HomePage />)

    expect(screen.getByRole("heading", { level: 1, name: "Address space, made legible." })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Open planner" })).toHaveAttribute("href", "/app")
    expect(screen.getByText("192.168.10.0/24")).toBeInTheDocument()
    expect(screen.getByText(/62 hosts plus network and broadcast/i)).toBeInTheDocument()
    expect(screen.getAllByText("128", { selector: "span" })).toHaveLength(2)
    expect(screen.getByText("224 free")).toBeInTheDocument()
    expect(screen.getByText("512 addresses")).toBeInTheDocument()
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument()
    expect(screen.queryByText(/in seconds/i)).not.toBeInTheDocument()
  })
})
