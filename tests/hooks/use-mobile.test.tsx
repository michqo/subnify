import { act, renderHook } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useIsMobile } from "@/hooks/use-mobile"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("useIsMobile", () => {
  it("subscribes to the mobile media query and removes the same listener", () => {
    let matches = false
    let listener: (() => void) | undefined
    const addEventListener = vi.fn(
      (_event: string, nextListener: () => void) => {
        listener = nextListener
      }
    )
    const removeEventListener = vi.fn()
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        get matches() {
          return matches
        },
        media: "(max-width: 767px)",
        onchange: null,
        addEventListener,
        removeEventListener,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    )
    const { result, unmount } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
    expect(addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function)
    )

    act(() => {
      matches = true
      listener?.()
    })
    expect(result.current).toBe(true)

    const subscribedListener = addEventListener.mock.calls[0]?.[1]
    unmount()
    expect(removeEventListener).toHaveBeenCalledWith(
      "change",
      subscribedListener
    )
  })

  it("uses the desktop snapshot during server rendering", () => {
    const matchMedia = vi.fn(() => ({ matches: true }))
    vi.stubGlobal("matchMedia", matchMedia)

    function Probe() {
      return useIsMobile() ? "mobile" : "desktop"
    }

    expect(renderToString(<Probe />)).toContain("desktop")
    expect(matchMedia).not.toHaveBeenCalled()
  })
})
