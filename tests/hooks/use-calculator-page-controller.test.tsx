import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import {
  useCalculatorPageController,
  type UseCalculatorPageControllerArgs,
} from "@/hooks/use-calculator-page-controller"
import { exportVlsmPdf } from "@/lib/calculator/export-pdf"
import { calculateVlsm } from "@/lib/vlsm"

vi.mock("@/lib/calculator/export-pdf", () => ({ exportVlsmPdf: vi.fn() }))

describe("useCalculatorPageController", () => {
  it("clears stale results and skips persistence after an invalid submission", async () => {
    const saveCalculation = vi.fn().mockResolvedValue(undefined)
    const calculate = vi.fn(calculateVlsm)
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })
    const props: UseCalculatorPageControllerArgs = {
      formValues: {
        baseNetwork: "192.168.1.0",
        baseCidr: "24",
        subnets: [{ id: 1, name: "LAN", hosts: 10 }],
        sourceType: "manual",
        aiPrompt: null,
        aiRationale: null,
      },
      isAiPlan: false,
      isCloudLinkedPlan: false,
      shouldSaveToCloud: true,
      isAuthenticated: true,
      signInToSaveMessage: "Sign in.",
      planName: "Test",
      activeCloudPlanId: null,
      updateSuccessMessage: "Updated.",
      saveSuccessMessage: "Saved.",
      saveCalculation,
      calculateVlsm: calculate,
      resetPlanForm: vi.fn(),
      setPlanName: vi.fn(),
      setShouldSaveToCloud: vi.fn(),
      setActiveCloudPlanId: vi.fn(),
      emailConfirmedFromQuery: false,
      buildAppUrl: () => "/app",
      resolveViewFromQuery: () => "table",
      replaceToCurrentView: vi.fn(),
    }
    const { result, rerender } = renderHook(
      (nextProps: UseCalculatorPageControllerArgs) =>
        useCalculatorPageController(nextProps),
      { initialProps: props }
    )

    act(() => result.current.calculateVLSM())
    expect(result.current.calculation?.ok).toBe(true)
    expect(saveCalculation).toHaveBeenCalledTimes(1)
    saveCalculation.mockClear()

    rerender({
      ...props,
      formValues: { ...props.formValues, baseCidr: "30" },
    })
    act(() => result.current.calculateVLSM())

    expect(result.current.calculation).toBeNull()
    expect(result.current.submittedIssues).toContainEqual(
      expect.objectContaining({ code: "INSUFFICIENT_ADDRESS_SPACE" })
    )
    expect(saveCalculation).not.toHaveBeenCalled()
    expect(calculate).toHaveBeenCalledTimes(2)
    act(() => result.current.onCopyResults())
    expect(writeText).not.toHaveBeenCalled()
    await act(() => result.current.exportPdf())
    expect(exportVlsmPdf).not.toHaveBeenCalled()
  })

  it("passes the successful calculation object to persistence", () => {
    const saveCalculation = vi.fn().mockResolvedValue(undefined)
    const props = {
      formValues: {
        baseNetwork: "10.0.0.0",
        baseCidr: "24",
        subnets: [{ id: 1, name: "LAN", hosts: 30 }],
        sourceType: "manual" as const,
        aiPrompt: null,
        aiRationale: null,
      },
      isAiPlan: false,
      isCloudLinkedPlan: false,
      shouldSaveToCloud: true,
      isAuthenticated: true,
      signInToSaveMessage: "Sign in.",
      planName: "Test",
      activeCloudPlanId: null,
      updateSuccessMessage: "Updated.",
      saveSuccessMessage: "Saved.",
      saveCalculation,
      calculateVlsm,
      resetPlanForm: vi.fn(),
      setPlanName: vi.fn(),
      setShouldSaveToCloud: vi.fn(),
      setActiveCloudPlanId: vi.fn(),
      emailConfirmedFromQuery: false,
      buildAppUrl: () => "/app",
      resolveViewFromQuery: () => "table" as const,
      replaceToCurrentView: vi.fn(),
    } satisfies UseCalculatorPageControllerArgs
    const { result } = renderHook(() => useCalculatorPageController(props))

    act(() => result.current.calculateVLSM())

    expect(saveCalculation).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, allocatedAddresses: 32 }),
      expect.objectContaining({ baseNetwork: "10.0.0.0", baseCidr: "24" }),
      expect.any(Object)
    )
  })
})
