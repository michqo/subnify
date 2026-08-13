import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { POST } from "@/app/api/calculation-events/route"

function jsonRequest(body: object, contentLength?: string): Request {
  return new Request("http://localhost/api/calculation-events", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(contentLength ? { "content-length": contentLength } : {}),
    },
    body: JSON.stringify(body),
  })
}

describe("calculation events route", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("logs only a valid failure classification and known issue code", async () => {
    const response = await POST(
      jsonRequest({
        event: "validation_failure",
        issueCodes: ["INVALID_BASE_NETWORK"],
      })
    )

    expect(response.status).toBe(204)
    expect(console.info).toHaveBeenCalledWith("subnify.calculation", {
      event: "validation_failure",
      issueCodes: ["INVALID_BASE_NETWORK"],
    })
  })

  it("rejects plan content before it can enter logs", async () => {
    const response = await POST(
      jsonRequest({
        event: "validation_failure",
        issueCodes: [],
        baseNetwork: "10.0.0.0",
      })
    )

    expect(response.status).toBe(400)
    expect(console.info).not.toHaveBeenCalled()
  })

  it("rejects unknown or duplicate issue codes", async () => {
    const response = await POST(
      jsonRequest({
        event: "validation_failure",
        issueCodes: ["INVALID_BASE_NETWORK", "INVALID_BASE_NETWORK"],
      })
    )

    expect(response.status).toBe(400)
    expect(console.info).not.toHaveBeenCalled()
  })

  it("rejects declared bodies over the privacy boundary", async () => {
    const response = await POST(
      jsonRequest({ event: "success", issueCodes: [] }, "2049")
    )

    expect(response.status).toBe(400)
    expect(console.info).not.toHaveBeenCalled()
  })
})
