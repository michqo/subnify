import { act, renderHook } from "@testing-library/react"
import type { ReadonlyURLSearchParams } from "next/navigation"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { usePlanViewState } from "@/hooks/use-plan-view-state"

const replace = vi.hoisted(() => vi.fn())

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}))

function searchParams(query = "") {
  return new URLSearchParams(query) as ReadonlyURLSearchParams
}

describe("usePlanViewState", () => {
  beforeEach(() => {
    replace.mockClear()
  })

  it("derives the active view again when search params change", () => {
    const { result, rerender } = renderHook(
      ({ params }: { params: ReadonlyURLSearchParams }) =>
        usePlanViewState(params),
      { initialProps: { params: searchParams() } }
    )

    expect(result.current.activeView).toBe("table")
    rerender({ params: searchParams("view=visualizer") })
    expect(result.current.activeView).toBe("visualizer")
    rerender({ params: searchParams("view=hierarchy") })
    expect(result.current.activeView).toBe("hierarchy")
  })

  it("navigates to canonical URLs for requested and current views", () => {
    const { result } = renderHook(() =>
      usePlanViewState(searchParams("view=visualizer"))
    )

    act(() => result.current.handleViewChange("hierarchy"))
    expect(replace).toHaveBeenLastCalledWith("/app?view=hierarchy", {
      scroll: false,
    })

    act(() => result.current.handleViewChange("unknown"))
    expect(replace).toHaveBeenLastCalledWith("/app", { scroll: false })

    act(() => result.current.replaceToCurrentView())
    expect(replace).toHaveBeenLastCalledWith("/app?view=visualizer", {
      scroll: false,
    })
  })
})
