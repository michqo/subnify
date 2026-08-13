import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import HelpPage from "@/app/app/help/page"
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

describe("Subnify help", () => {
  it("explains calculation rules, examples, and retained plan data", () => {
    render(<HelpPage />)

    expect(screen.getByText(/largest required block first/i)).toBeInTheDocument()
    expect(screen.getByText(/stable tie ordering/i)).toBeInTheDocument()
    expect(screen.getAllByText(/network and broadcast addresses/i)).toHaveLength(2)
    expect(screen.getByText("/31")).toBeInTheDocument()
    expect(screen.getByText("/32")).toBeInTheDocument()
    expect(screen.getByText(/canonical network address/i)).toBeInTheDocument()
    expect(screen.getByText(/Parent capacity/i)).toBeInTheDocument()
    expect(screen.getByText(/Allocated addresses are the sum/i)).toBeInTheDocument()
    expect(screen.getByText(/Efficiency/i)).toBeInTheDocument()
    expect(screen.getByText(/192\.168\.1\.0\/24/i)).toBeInTheDocument()
    expect(screen.getByText("/30")).toBeInTheDocument()
    expect(screen.getByText(/parent cannot fit a requirement for 3 usable hosts/i)).toBeInTheDocument()
    expect(screen.getByText(/deterministic calculation engine/i)).toBeInTheDocument()
    expect(screen.getByText(/Stored history includes/i)).toBeInTheDocument()
    expect(screen.getByText(/confirmed deletion/i)).toBeInTheDocument()
  })
})
