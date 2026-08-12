import { describe, expect, it } from "vitest"
import { calculateVlsm } from "@/lib/vlsm"

function rng(seed: number) {
  let state = seed >>> 0
  return () => (state = (state * 1664525 + 1013904223) >>> 0) / 2 ** 32
}

describe("VLSM invariants", () => {
  const toInt = (ip: string) =>
    ip
      .split(".")
      .map(Number)
      .reduce((value, octet) => value * 256 + octet, 0)
  for (const seed of [1, 7, 42, 20260812]) {
    it(`keeps allocations aligned, bounded, disjoint, and balanced; seed=${seed}`, () => {
      const random = rng(seed)
      const count = 1 + Math.floor(random() * 12)
      const result = calculateVlsm({
        baseNetwork: "10.0.0.0",
        baseCidr: 8,
        subnets: Array.from({ length: count }, (_, index) => ({
          id: 100 + index,
          name: `LAN ${index}`,
          hosts: 1 + Math.floor(random() * 4094),
        })),
      })
      expect(result.ok).toBe(true)
      if (!result.ok) return
      for (const [index, row] of result.allocations.entries()) {
        expect(row.startOffset % row.blockSize, `seed=${seed}`).toBe(0)
        expect(row.usableHosts, `seed=${seed}`).toBeGreaterThanOrEqual(
          row.requiredHosts
        )
        expect(row.blockSize, `seed=${seed}`).toBe(row.usableHosts + 2)
        if (index > 0) {
          expect(row.startOffset, `seed=${seed}`).toBeGreaterThanOrEqual(
            result.allocations[index - 1].startOffset +
              result.allocations[index - 1].blockSize
          )
        }
        expect(
          row.startOffset + row.blockSize,
          `seed=${seed}`
        ).toBeLessThanOrEqual(result.parent.totalAddresses)
        expect(
          toInt(row.networkAddress),
          `seed=${seed}`
        ).toBeGreaterThanOrEqual(toInt(result.parent.networkAddress))
        expect(toInt(row.broadcast), `seed=${seed}`).toBeLessThanOrEqual(
          toInt(result.parent.broadcast)
        )
      }
      expect(
        result.allocatedAddresses + result.remainingAddresses,
        `seed=${seed}`
      ).toBe(result.parent.totalAddresses)
    })
  }
})
