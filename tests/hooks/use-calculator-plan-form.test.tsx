import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useCalculatorPlanForm } from "@/hooks/use-calculator-plan-form"

describe("useCalculatorPlanForm", () => {
  it("preserves fractional host input for domain validation", () => {
    const { result } = renderHook(() => useCalculatorPlanForm())

    act(() => result.current.updateSubnet(1, "hosts", "10.5"))

    expect(result.current.formValues.subnets[0].hosts).toBe(10.5)
  })

  it("maps an empty host input to zero", () => {
    const { result } = renderHook(() => useCalculatorPlanForm())

    act(() => result.current.updateSubnet(1, "hosts", ""))

    expect(result.current.formValues.subnets[0].hosts).toBe(0)
  })
})
