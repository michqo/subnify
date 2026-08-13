import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import HelpPage from "@/app/app/help/page"
import HomePage, { metadata as homeMetadata } from "@/app/page"

describe("Subnify landing", () => {
  it("leads with direct network language and real allocation data", () => {
    render(<HomePage />)

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Every address accounted for.",
      })
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Plan a network" })).toHaveAttribute(
      "href",
      "/app"
    )
    expect(screen.getByRole("link", { name: "See an example" })).toHaveAttribute(
      "href",
      "#how-it-works"
    )
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Host counts in. CIDR blocks out.",
      })
    ).toBeInTheDocument()
    expect(screen.getByText("192.168.10.0/24")).toBeInTheDocument()
    expect(screen.getByText("Parent range and required hosts.")).toBeInTheDocument()
    expect(screen.getByText("Smallest fitting blocks, largest first.")).toBeInTheDocument()
    expect(screen.getByText("Copy, export, or save.")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Start with 192.168.1.0/24." })).toBeInTheDocument()
    expect(screen.queryByText("IPv4 planning workspace")).not.toBeInTheDocument()
    expect(screen.queryByText("Address space, made legible.")).not.toBeInTheDocument()
    expect(screen.queryByText("One continuous workflow")).not.toBeInTheDocument()
  })

  it("uses concrete landing metadata", () => {
    expect(homeMetadata.description).toBe(
      "Plan IPv4 subnets with VLSM, live capacity checks, saved history, and export."
    )
  })
})

describe("Subnify help", () => {
  it("explains calculation rules, examples, and retained plan data", () => {
    render(<HelpPage />)

    expect(
      screen.getByRole("heading", { level: 1, name: "IPv4 reference" })
    ).toBeInTheDocument()
    for (const name of [
      "Start",
      "CIDR",
      "Validation",
      "Templates",
      "AI plans",
      "Results",
      "Examples",
      "History",
    ]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument()
    }
    expect(screen.queryByText("Using Subnify")).not.toBeInTheDocument()
    expect(
      screen.getByText(/Larger host requirements allocate first/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/equal host counts keep input order/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/network and broadcast addresses/i)).toBeInTheDocument()
    expect(screen.getByText("/31")).toBeInTheDocument()
    expect(screen.getByText("/32")).toBeInTheDocument()
    expect(screen.getByText(/canonical for their prefix/i)).toBeInTheDocument()
    expect(screen.getByText(/Parent capacity/i)).toBeInTheDocument()
    expect(screen.getByText(/Allocated addresses include/i)).toBeInTheDocument()
    expect(screen.getByText(/Efficiency/i)).toBeInTheDocument()
    expect(screen.getByText(/192\.168\.1\.0\/24/i)).toBeInTheDocument()
    expect(screen.getAllByText("/30")).toHaveLength(2)
    expect(screen.getByText(/parent cannot fit 3 usable hosts/i)).toBeInTheDocument()
    expect(screen.getByText(/deterministic calculation engine/i)).toBeInTheDocument()
    expect(screen.getByText(/Saved records retain/i)).toBeInTheDocument()
    expect(screen.getByText(/Confirmed deletion removes the cloud copy/i)).toBeInTheDocument()
  })
})
