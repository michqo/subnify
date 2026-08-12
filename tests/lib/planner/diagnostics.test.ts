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

  it("uses the domain engine for live diagnostics", () => {
    const result = diagnosePlan({
      baseNetwork: "192.168.1.0",
      baseCidr: "30",
      subnets: [{ id: 1, name: "LAN", hosts: 50 }],
    })

    expect(result.isValid).toBe(false)
    expect(result.issues).toContainEqual(expect.objectContaining({
      code: "INSUFFICIENT_ADDRESS_SPACE",
      field: "subnets",
    }))
    expect(result.allocations).toEqual([])
  })

  it("returns the canonical suggestion unchanged", () => {
    const result = diagnosePlan({
      baseNetwork: "192.168.1.5",
      baseCidr: "24",
      subnets: [{ id: 1, name: "LAN", hosts: 10 }],
    })

    expect(result.issues).toContainEqual(expect.objectContaining({
      code: "NON_CANONICAL_BASE_NETWORK",
      suggestion: "192.168.1.0",
    }))
  })

  it("forwards malformed field diagnostics from the domain engine", () => {
    const result = diagnosePlan({
      baseNetwork: "192.168.10.0",
      baseCidr: "x",
      subnets: [{ id: 7, name: "", hosts: 0 }],
    })

    expect(result.issues).toContainEqual(expect.objectContaining({
      code: "INVALID_BASE_CIDR",
      field: "baseCidr",
    }))
    expect(result.issues).toContainEqual(expect.objectContaining({
      code: "INVALID_SUBNET_NAME",
      field: "subnets.0.name",
    }))
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
