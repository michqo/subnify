import { describe, expect, it } from "vitest"

import { diagnosePlan, explainAllocation } from "@/lib/planner/diagnostics"

describe("diagnosePlan", () => {
  it("reports capacity for a valid plan", () => {
    const result = diagnosePlan({
      baseNetwork: "192.168.10.0",
      baseCidr: "24",
      subnets: [{ id: 1, name: "Engineering", hosts: 62 }],
    })

    expect(result).toMatchObject({
      isValid: true,
      totalAddresses: 256,
      allocatedAddresses: 64,
      remainingAddresses: 192,
      utilizationPercent: 25,
    })
    expect(result.allocations).toHaveLength(1)
  })

  it.each(["192.168.1", "192.168.1.999", "192.168.one.1", "  "])(
    "rejects malformed IPv4 address %j",
    (baseNetwork) => {
      const result = diagnosePlan({
        baseNetwork,
        baseCidr: "24",
        subnets: [{ id: 1, name: "LAN", hosts: 10 }],
      })

      expect(result.isValid).toBe(false)
      expect(result.issues).toContainEqual(expect.objectContaining({ code: "invalid_ipv4", severity: "error" }))
    }
  )

  it("rejects a base address that is not aligned to its CIDR", () => {
    const result = diagnosePlan({
      baseNetwork: "192.168.10.10",
      baseCidr: "24",
      subnets: [{ id: 1, name: "LAN", hosts: 10 }],
    })

    expect(result.issues).toContainEqual(expect.objectContaining({ code: "base_not_aligned", severity: "error" }))
  })

  it.each(["-1", "33", "24.5", "x"])("rejects invalid CIDR %j", (baseCidr) => {
    const result = diagnosePlan({
      baseNetwork: "192.168.10.0",
      baseCidr,
      subnets: [{ id: 1, name: "LAN", hosts: 10 }],
    })

    expect(result.issues).toContainEqual(expect.objectContaining({ code: "invalid_cidr", severity: "error" }))
  })

  it("rejects non-positive host requirements", () => {
    const result = diagnosePlan({
      baseNetwork: "192.168.10.0",
      baseCidr: "24",
      subnets: [{ id: 7, name: "LAN", hosts: 0 }],
    })

    expect(result.issues).toContainEqual(expect.objectContaining({
      code: "invalid_hosts",
      severity: "error",
      subnetId: 7,
    }))
  })

  it("warns about blank and duplicate names without blocking calculation", () => {
    const result = diagnosePlan({
      baseNetwork: "192.168.10.0",
      baseCidr: "24",
      subnets: [
        { id: 1, name: "Staff", hosts: 10 },
        { id: 2, name: " staff ", hosts: 10 },
        { id: 3, name: "", hosts: 10 },
      ],
    })

    expect(result.isValid).toBe(true)
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(["duplicate_name", "blank_name"]))
  })

  it("reports overflow when allocated blocks exceed the parent network", () => {
    const result = diagnosePlan({
      baseNetwork: "192.168.10.0",
      baseCidr: "24",
      subnets: [
        { id: 1, name: "A", hosts: 126 },
        { id: 2, name: "B", hosts: 126 },
        { id: 3, name: "C", hosts: 126 },
      ],
    })

    expect(result.isValid).toBe(false)
    expect(result.allocatedAddresses).toBe(384)
    expect(result.remainingAddresses).toBe(-128)
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "capacity_overflow", severity: "error" }))
  })
})

describe("explainAllocation", () => {
  it("explains reserved addresses and selected CIDR", () => {
    const allocation = diagnosePlan({
      baseNetwork: "192.168.10.0",
      baseCidr: "24",
      subnets: [{ id: 1, name: "Engineering", hosts: 62 }],
    }).allocations[0]

    expect(explainAllocation(allocation)).toBe(
      "62 hosts plus network and broadcast require 64 addresses, so this subnet uses /26."
    )
  })
})
