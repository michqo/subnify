import { renderHook, waitFor } from "@testing-library/react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { describe, expect, it, vi } from "vitest"

import { useHistoryRestoration } from "@/hooks/use-history-restoration"
import type { CalculationRecord } from "@/lib/history"
import { recalculateHistoryRecord } from "@/lib/history"
import {
  calculateVlsm,
  type VlsmAllocation,
  type VlsmCalculationSuccess,
} from "@/lib/vlsm"

describe("recalculateHistoryRecord", () => {
  it("blocks invalid legacy results without treating stored results as authoritative", () => {
    const record: CalculationRecord = {
      id: "legacy",
      title: "Too large",
      source_type: "manual",
      ai_prompt: null,
      ai_rationale: null,
      base_network: "192.168.1.0",
      base_cidr: 30,
      input_subnets: [{ name: "LAN", hosts: 50 }],
      result_subnets: [{ networkAddress: "192.168.1.0" } as VlsmAllocation],
      total_required_hosts: 50,
      total_usable_hosts: 62,
      created_at: "2026-01-01T00:00:00Z",
    }

    const restored = recalculateHistoryRecord(record)

    expect(restored.calculation).toBeNull()
    expect(restored.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "INSUFFICIENT_ADDRESS_SPACE" }),
      ])
    )
    expect(restored.inputs).toMatchObject({
      baseNetwork: "192.168.1.0",
      baseCidr: "30",
    })
  })
})

describe("useHistoryRestoration", () => {
  it("commits a success calculated from the explicit restored snapshot", async () => {
    const priorCalculation = calculateVlsm({
      baseNetwork: "192.168.1.0",
      baseCidr: 24,
      subnets: [{ id: 1, name: "Prior", hosts: 10 }],
    })
    if (!priorCalculation.ok) throw new Error("fixture must be valid")

    const single = vi.fn().mockResolvedValue({
      data: {
        id: "restored-plan",
        title: "Restored",
        source_type: "manual",
        ai_prompt: null,
        ai_rationale: null,
        base_network: "10.20.0.0",
        base_cidr: 24,
        input_subnets: [{ name: "Restored LAN", hosts: 30 }],
        result_subnets: priorCalculation.allocations,
      },
      error: null,
    })
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single })),
        })),
      })),
    } as unknown as SupabaseClient
    const setCalculation = vi.fn()
    const args = {
      historyId: "restored-plan",
      isAuthenticated: true,
      supabase,
      replacePlan: vi.fn(),
      replaceToCurrentView: vi.fn(),
      setCalculation,
      setPlanName: vi.fn(),
      setActiveCloudPlanId: vi.fn(),
    } satisfies Parameters<typeof useHistoryRestoration>[0]

    renderHook(() => useHistoryRestoration(args))

    await waitFor(() => expect(setCalculation).toHaveBeenCalledTimes(1))
    expect(setCalculation).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        parent: expect.objectContaining({ networkAddress: "10.20.0.0" }),
      }) satisfies Partial<VlsmCalculationSuccess>,
      [],
      expect.objectContaining({
        baseNetwork: "10.20.0.0",
        baseCidr: "24",
        subnets: [{ id: 1, name: "Restored LAN", hosts: 30 }],
      })
    )
  })

  it("loads invalid legacy inputs and exposes issues without writing history", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: "legacy",
        title: "Too large",
        source_type: "manual",
        ai_prompt: null,
        ai_rationale: null,
        base_network: "192.168.1.0",
        base_cidr: 30,
        input_subnets: [{ name: "LAN", hosts: 50 }],
        result_subnets: [{ networkAddress: "192.168.1.0" }],
        total_required_hosts: 50,
        total_usable_hosts: 62,
        created_at: "2026-01-01T00:00:00Z",
      },
      error: null,
    })
    const from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ single })),
      })),
    }))
    const supabase = { from } as unknown as SupabaseClient
    const replacePlan = vi.fn()
    const setCalculation = vi.fn()
    const setActiveCloudPlanId = vi.fn()

    renderHook(() =>
      useHistoryRestoration({
        historyId: "legacy",
        isAuthenticated: true,
        supabase,
        replacePlan,
        replaceToCurrentView: vi.fn(),
        setCalculation,
        setPlanName: vi.fn(),
        setActiveCloudPlanId,
      })
    )

    await waitFor(() => expect(setCalculation).toHaveBeenCalledTimes(1))
    expect(replacePlan).toHaveBeenCalledWith(
      expect.objectContaining({
        baseNetwork: "192.168.1.0",
        baseCidr: "30",
        subnets: [{ id: 1, name: "LAN", hosts: 50 }],
      })
    )
    expect(setCalculation).toHaveBeenCalledWith(
      null,
      expect.arrayContaining([
        expect.objectContaining({ code: "INSUFFICIENT_ADDRESS_SPACE" }),
      ])
    )
    expect(setActiveCloudPlanId).toHaveBeenCalledWith("legacy")
    expect(from).toHaveBeenCalledTimes(1)
  })
})
