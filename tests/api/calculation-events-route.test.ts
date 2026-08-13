import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { POST } from "@/app/api/calculation-events/route"

function jsonRequest(
  body: object,
  contentLength?: string,
  contentType = "application/json"
): Request {
  return new Request("http://localhost/api/calculation-events", {
    method: "POST",
    headers: {
      "content-type": contentType,
      ...(contentLength ? { "content-length": contentLength } : {}),
    },
    body: JSON.stringify(body),
  })
}

function rawRequest(body?: BodyInit, contentType?: string): Request {
  return new Request("http://localhost/api/calculation-events", {
    method: "POST",
    headers: contentType ? { "content-type": contentType } : undefined,
    body,
  })
}

async function expectPrivateRejection(request: Request) {
  const response = await POST(request)

  expect(response.status).toBe(400)
  expect(await response.text()).toBe("")
  expect(console.info).not.toHaveBeenCalled()
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
    expect(await response.text()).toBe("")
  })

  it("accepts a normalized JSON media type", async () => {
    const response = await POST(
      jsonRequest(
        { event: "success", issueCodes: [] },
        undefined,
        " Application/JSON ; charset=utf-8 "
      )
    )

    expect(response.status).toBe(204)
    expect(console.info).toHaveBeenCalledWith("subnify.calculation", {
      event: "success",
      issueCodes: [],
    })
  })

  it("rejects missing or non-JSON content types", async () => {
    await expectPrivateRejection(
      rawRequest(
        new TextEncoder().encode(
          JSON.stringify({ event: "success", issueCodes: [] })
        )
      )
    )
    await expectPrivateRejection(
      rawRequest(
        JSON.stringify({ event: "success", issueCodes: [] }),
        "text/plain"
      )
    )
  })

  it("rejects extra plan fields before they can enter logs", async () => {
    await expectPrivateRejection(
      jsonRequest({
        event: "validation_failure",
        issueCodes: [],
        baseNetwork: "10.0.0.0",
      })
    )
  })

  it("rejects an unknown issue code", async () => {
    await expectPrivateRejection(
      jsonRequest({
        event: "validation_failure",
        issueCodes: ["PRIVATE_PLAN_DATA"],
      })
    )
  })

  it("rejects duplicate issue codes", async () => {
    await expectPrivateRejection(
      jsonRequest({
        event: "validation_failure",
        issueCodes: ["INVALID_BASE_NETWORK", "INVALID_BASE_NETWORK"],
      })
    )
  })

  it("rejects more than nine issue codes", async () => {
    await expectPrivateRejection(
      jsonRequest({
        event: "validation_failure",
        issueCodes: Array.from({ length: 10 }, (_, index) => `CODE_${index}`),
      })
    )
  })

  it("rejects an empty body", async () => {
    await expectPrivateRejection(rawRequest(undefined, "application/json"))
  })

  it("rejects an invalid event classification", async () => {
    await expectPrivateRejection(
      jsonRequest({ event: "calculation_failed", issueCodes: [] })
    )
  })

  it("rejects declared bodies over the privacy boundary", async () => {
    await expectPrivateRejection(
      jsonRequest({ event: "success", issueCodes: [] }, "2049")
    )
  })

  it("rejects an actual oversized body without Content-Length", async () => {
    const validJson = JSON.stringify({ event: "success", issueCodes: [] })
    const request = rawRequest(
      `${validJson}${" ".repeat(2049)}`,
      "application/json"
    )

    expect(request.headers.has("content-length")).toBe(false)
    await expectPrivateRejection(request)
  })

  it("cancels a chunked body as soon as it crosses the byte limit", async () => {
    const encoder = new TextEncoder()
    const validJson = JSON.stringify({ event: "success", issueCodes: [] })
    const chunks = [
      encoder.encode(
        `${validJson}${" ".repeat(2028 - encoder.encode(validJson).byteLength)}`
      ),
      encoder.encode(" ".repeat(20)),
      encoder.encode(" "),
      encoder.encode("private-plan-data-that-must-not-be-read"),
    ]
    let reads = 0
    let cancelled = false
    const stream = new ReadableStream<Uint8Array>(
      {
        pull(controller) {
          const chunk = chunks[reads]
          reads += 1
          if (chunk === undefined) {
            controller.close()
            return
          }
          controller.enqueue(chunk)
        },
        cancel() {
          cancelled = true
        },
      },
      { highWaterMark: 0 }
    )
    const request = new Request("http://localhost/api/calculation-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: stream,
      duplex: "half",
    } as RequestInit & { duplex: "half" })

    await expectPrivateRejection(request)
    expect(cancelled).toBe(true)
    expect(reads).toBe(3)
  })
})
