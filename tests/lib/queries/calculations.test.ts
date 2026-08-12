import { describe, expect, it } from "vitest"

import { buildCalculationPayload } from "@/lib/queries/calculations"
import type { CalculationRecord } from "@/lib/history"
import type { VlsmAllocation } from "@/lib/vlsm"

describe("buildCalculationPayload", () => {
  it("rejects an invalid snapshot before a payload exists", () => {
    expect(() =>
      buildCalculationPayload(
        {
          baseNetwork: "192.168.1.0",
          baseCidr: "30",
          subnets: [{ id: 1, name: "LAN", hosts: 50 }],
        },
        { sourceType: "manual", title: "Invalid" }
      )
    ).toThrow("Plan validation failed: INSUFFICIENT_ADDRESS_SPACE")
  })

  it("recalculates duplicate payloads without reading stored result JSON", () => {
    const record: CalculationRecord = {
      id: "legacy",
      title: "Legacy",
      source_type: "manual",
      ai_prompt: null,
      ai_rationale: null,
      base_network: "192.168.1.0",
      base_cidr: 24,
      input_subnets: [{ name: "  LAN  ", hosts: 10 }],
      result_subnets: [{ networkAddress: "203.0.113.9" } as VlsmAllocation],
      total_required_hosts: 10,
      total_usable_hosts: 14,
      created_at: "2026-01-01T00:00:00Z",
    }

    const payload = buildCalculationPayload(
      {
        baseNetwork: record.base_network,
        baseCidr: String(record.base_cidr),
        subnets: record.input_subnets.map((row, index) => ({
          id: index + 1,
          ...row,
        })),
      },
      { sourceType: record.source_type, title: `${record.title} copy` }
    )

    expect(payload.input_subnets).toEqual([{ name: "LAN", hosts: 10 }])
    expect(payload.result_subnets).toEqual([
      expect.objectContaining({ networkAddress: "192.168.1.0" }),
    ])
  })
})
