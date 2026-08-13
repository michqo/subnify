import { afterEach, describe, expect, it, vi } from "vitest"

import { recordCalculationEvent } from "@/lib/calculation-events"

describe("recordCalculationEvent", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("sends the exact success classification payload", () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal("fetch", fetchMock)

    recordCalculationEvent({ event: "success", issueCodes: [] })

    expect(fetchMock).toHaveBeenCalledWith("/api/calculation-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: '{"event":"success","issueCodes":[]}',
      keepalive: true,
    })
  })

  it("sends the exact failure payload with duplicate issue codes removed", () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal("fetch", fetchMock)

    recordCalculationEvent({
      event: "validation_failure",
      issueCodes: [
        "INVALID_BASE_NETWORK",
        "INVALID_HOST_COUNT",
        "INVALID_BASE_NETWORK",
      ],
    })

    expect(fetchMock).toHaveBeenCalledWith("/api/calculation-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: '{"event":"validation_failure","issueCodes":["INVALID_BASE_NETWORK","INVALID_HOST_COUNT"]}',
      keepalive: true,
    })
  })

  it("returns immediately and swallows rejected telemetry transport", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"))
    vi.stubGlobal("fetch", fetchMock)

    expect(
      recordCalculationEvent({ event: "success", issueCodes: [] })
    ).toBeUndefined()

    await Promise.resolve()
  })
})
