import { renderHook, waitFor } from "@testing-library/react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { describe, expect, it, vi } from "vitest"

import { useHistoryRestoration } from "@/hooks/use-history-restoration"
import { calculateVlsm, type VlsmCalculationSuccess } from "@/lib/vlsm"

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
    const calculateVlsmFallback = vi.fn(calculateVlsm)
    const setCalculation = vi.fn()
    const args = {
      historyId: "restored-plan",
      isAuthenticated: true,
      supabase,
      replacePlan: vi.fn(),
      replaceToCurrentView: vi.fn(),
      calculateVlsmFallback,
      setCalculation,
      setPlanName: vi.fn(),
      setActiveCloudPlanId: vi.fn(),
    } satisfies Parameters<typeof useHistoryRestoration>[0]

    renderHook(() => useHistoryRestoration(args))

    await waitFor(() => expect(setCalculation).toHaveBeenCalledTimes(1))
    expect(calculateVlsmFallback).toHaveBeenCalledWith({
      baseNetwork: "10.20.0.0",
      baseCidr: 24,
      subnets: [{ id: 1, name: "Restored LAN", hosts: 30 }],
    })
    expect(setCalculation).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        parent: expect.objectContaining({ networkAddress: "10.20.0.0" }),
      }) satisfies Partial<VlsmCalculationSuccess>
    )
  })
})
