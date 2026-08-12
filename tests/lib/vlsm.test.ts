import { describe, expect, it } from "vitest"
import { calculateVlsm, type VlsmPlanInput } from "@/lib/vlsm"

const defaults: VlsmPlanInput = {
  baseNetwork: "192.168.1.0",
  baseCidr: 24,
  subnets: [
    { id: 1, name: "LAN A", hosts: 50 },
    { id: 2, name: "LAN B", hosts: 25 },
    { id: 3, name: "LAN C", hosts: 10 },
  ],
}

describe("calculateVlsm", () => {
  it("allocates the default plan exactly", () => {
    const result = calculateVlsm(defaults)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.parent).toEqual({
      networkAddress: "192.168.1.0",
      broadcast: "192.168.1.255",
      cidr: 24,
      totalAddresses: 256,
    })
    expect(
      result.allocations.map(
        ({ requirementId, networkAddress, cidr, broadcast }) => ({
          requirementId,
          networkAddress,
          cidr,
          broadcast,
        })
      )
    ).toEqual([
      {
        requirementId: 1,
        networkAddress: "192.168.1.0",
        cidr: 26,
        broadcast: "192.168.1.63",
      },
      {
        requirementId: 2,
        networkAddress: "192.168.1.64",
        cidr: 27,
        broadcast: "192.168.1.95",
      },
      {
        requirementId: 3,
        networkAddress: "192.168.1.96",
        cidr: 28,
        broadcast: "192.168.1.111",
      },
    ])
    expect(result.allocatedAddresses).toBe(112)
    expect(result.remainingAddresses).toBe(144)
  })

  it("rejects the default requirements inside a /30", () => {
    const result = calculateVlsm({ ...defaults, baseCidr: 30 })
    expect(result).toEqual({
      ok: false,
      issues: [
        expect.objectContaining({
          code: "INSUFFICIENT_ADDRESS_SPACE",
          field: "subnets",
        }),
      ],
    })
  })

  it.each([
    "192.168.1",
    "192.168.one.1",
    "-1.2.3.4",
    "256.1.1.1",
    " 192.168.1.0 ",
  ])("rejects invalid IPv4 %j", (baseNetwork) => {
    const result = calculateVlsm({ ...defaults, baseNetwork })
    expect(result).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        expect.objectContaining({
          code: "INVALID_BASE_NETWORK",
          field: "baseNetwork",
        }),
      ]),
    })
  })

  it.each([-1, 31, 24.5, Number.NaN, "", "x"])(
    "rejects invalid parent CIDR %j",
    (baseCidr) => {
      const result = calculateVlsm({
        ...defaults,
        baseCidr: baseCidr as number,
      })
      expect(result).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([
          expect.objectContaining({
            code: "INVALID_BASE_CIDR",
            field: "baseCidr",
          }),
        ]),
      })
    }
  )

  it("suggests the canonical base", () => {
    expect(
      calculateVlsm({ ...defaults, baseNetwork: "192.168.1.5" })
    ).toMatchObject({
      ok: false,
      issues: [
        expect.objectContaining({
          code: "NON_CANONICAL_BASE_NETWORK",
          suggestion: "192.168.1.0",
        }),
      ],
    })
  })

  it.each([0, -1, 1.5, Number.POSITIVE_INFINITY, 4_294_967_295])(
    "rejects host count %j",
    (hosts) => {
      const result = calculateVlsm({
        ...defaults,
        subnets: [{ id: 9, name: "LAN", hosts }],
      })
      expect(result).toMatchObject({
        ok: false,
        issues: [
          expect.objectContaining({
            code: "INVALID_HOST_COUNT",
            field: "subnets.0.hosts",
          }),
        ],
      })
    }
  )

  it("rejects a null subnet row without throwing", () => {
    const result = calculateVlsm({
      ...defaults,
      subnets: [null] as unknown as VlsmPlanInput["subnets"],
    })
    expect(result).toEqual({
      ok: false,
      issues: [
        expect.objectContaining({
          code: "INVALID_SUBNET_NAME",
          field: "subnets.0.name",
        }),
        expect.objectContaining({
          code: "INVALID_HOST_COUNT",
          field: "subnets.0.hosts",
        }),
      ],
    })
  })

  it("rejects a sparse subnet row without throwing", () => {
    const result = calculateVlsm({
      ...defaults,
      subnets: Array(1) as VlsmPlanInput["subnets"],
    })
    expect(result).toEqual({
      ok: false,
      issues: [
        expect.objectContaining({
          code: "INVALID_SUBNET_NAME",
          field: "subnets.0.name",
        }),
        expect.objectContaining({
          code: "INVALID_HOST_COUNT",
          field: "subnets.0.hosts",
        }),
      ],
    })
  })

  it("rejects blank, overlong, and case-insensitive duplicate names", () => {
    const result = calculateVlsm({
      ...defaults,
      subnets: [
        { id: 1, name: " ", hosts: 1 },
        { id: 2, name: "x".repeat(81), hosts: 1 },
        { id: 3, name: "Staff", hosts: 1 },
        { id: 4, name: " staff ", hosts: 1 },
      ],
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["INVALID_SUBNET_NAME", "DUPLICATE_SUBNET_NAME"])
    )
  })

  it("preserves input order for equal blocks", () => {
    const result = calculateVlsm({
      ...defaults,
      subnets: [
        { id: 7, name: "First", hosts: 10 },
        { id: 3, name: "Second", hosts: 10 },
      ],
    })
    expect(
      result.ok && result.allocations.map((row) => row.requirementId)
    ).toEqual([7, 3])
  })

  it("orders different requirements largest-first even when they use the same block size", () => {
    const result = calculateVlsm({
      ...defaults,
      subnets: [
        { id: 7, name: "Smaller", hosts: 9 },
        { id: 3, name: "Larger", hosts: 12 },
      ],
    })
    expect(
      result.ok && result.allocations.map((row) => row.requirementId)
    ).toEqual([3, 7])
  })

  it.each([0, 101])("rejects subnet count %i", (count) => {
    const result = calculateVlsm({
      ...defaults,
      subnets: Array.from({ length: count }, (_, index) => ({
        id: index,
        name: `LAN ${index}`,
        hosts: 1,
      })),
    })
    expect(result).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        expect.objectContaining({
          code: "INVALID_SUBNET_COUNT",
          field: "subnets",
        }),
      ]),
    })
  })

  it("accepts public IPv4 parents", () => {
    expect(
      calculateVlsm({
        baseNetwork: "203.0.113.0",
        baseCidr: 24,
        subnets: [{ id: 1, name: "Public", hosts: 10 }],
      }).ok
    ).toBe(true)
  })

  it("aligns allocations across octet and signed-32-bit boundaries", () => {
    const octet = calculateVlsm({
      baseNetwork: "10.0.0.0",
      baseCidr: 23,
      subnets: [
        { id: 1, name: "A", hosts: 126 },
        { id: 2, name: "B", hosts: 126 },
        { id: 3, name: "C", hosts: 62 },
      ],
    })
    expect(
      octet.ok && octet.allocations.map((row) => row.networkAddress)
    ).toEqual(["10.0.0.0", "10.0.0.128", "10.0.1.0"])
    const signed = calculateVlsm({
      baseNetwork: "128.0.0.0",
      baseCidr: 30,
      subnets: [{ id: 4, name: "Signed", hosts: 1 }],
    })
    expect(signed.ok && signed.allocations[0].networkAddress).toBe("128.0.0.0")
  })

  it("distinguishes exact fit, one-address excess, and IPv4-end overflow", () => {
    expect(
      calculateVlsm({
        baseNetwork: "192.168.1.0",
        baseCidr: 29,
        subnets: [{ id: 1, name: "Exact", hosts: 6 }],
      }).ok
    ).toBe(true)
    expect(
      calculateVlsm({
        baseNetwork: "192.168.1.0",
        baseCidr: 29,
        subnets: [{ id: 1, name: "One over", hosts: 7 }],
      })
    ).toMatchObject({
      ok: false,
      issues: [expect.objectContaining({ code: "INSUFFICIENT_ADDRESS_SPACE" })],
    })
    expect(
      calculateVlsm({
        baseNetwork: "255.255.255.252",
        baseCidr: 30,
        subnets: [{ id: 1, name: "Past IPv4", hosts: 3 }],
      })
    ).toMatchObject({
      ok: false,
      issues: [expect.objectContaining({ code: "IPV4_OVERFLOW" })],
    })
  })

  it.each([
    [
      {
        baseNetwork: "0.0.0.0",
        baseCidr: 0,
        subnets: [{ id: 1, name: "All", hosts: 4_294_967_294 }],
      },
      "0.0.0.0",
      0,
      "255.255.255.255",
    ],
    [
      {
        baseNetwork: "255.255.255.252",
        baseCidr: 30,
        subnets: [{ id: 1, name: "Pair", hosts: 2 }],
      },
      "255.255.255.252",
      30,
      "255.255.255.255",
    ],
  ])(
    "supports exact boundary plan",
    (input, networkAddress, cidr, broadcast) => {
      const result = calculateVlsm(input as VlsmPlanInput)
      expect(result.ok && result.allocations[0]).toMatchObject({
        networkAddress,
        cidr,
        broadcast,
      })
    }
  )
})
