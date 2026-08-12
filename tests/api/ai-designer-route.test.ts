import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { completion, from, openAiConstructor, quotaQuery, rpc } = vi.hoisted(() => {
  const quotaQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    gte: vi.fn(),
    or: vi.fn(),
  }

  quotaQuery.select.mockReturnValue(quotaQuery)
  quotaQuery.eq.mockReturnValue(quotaQuery)
  quotaQuery.gte.mockReturnValue(quotaQuery)
  quotaQuery.or.mockResolvedValue({ count: 0, error: null })

  return {
    completion: vi.fn(),
    from: vi.fn(() => quotaQuery),
    openAiConstructor: vi.fn(),
    quotaQuery,
    rpc: vi.fn(),
  }
})

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
      }),
    },
    from,
    rpc,
  }),
}))

vi.mock("openai", () => ({
  default: class {
    constructor(options: unknown) {
      openAiConstructor(options)
    }

    chat = { completions: { create: completion } }
  },
}))

import { GET, POST } from "@/app/api/ai-designer/route"

function requestWithPrompt(prompt: string): Request {
  return new Request("http://localhost/api/ai-designer", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt }),
  })
}

function modelJson(plan: object) {
  return {
    choices: [
      {
        message: {
          content: JSON.stringify({
            title: "Generated",
            rationale: "Generated requirements.",
            ...plan,
          }),
        },
      },
    ],
  }
}

function validModelJson() {
  return modelJson({
    baseNetwork: "192.168.1.0",
    baseCidr: 24,
    subnets: [{ name: "LAN", hosts: 50 }],
  })
}

function rpcSuccess(name: string) {
  if (name === "reserve_ai_design_request") {
    return Promise.resolve({
      data: [{ request_id: "request-1", used: 1, remaining: 2 }],
      error: null,
    })
  }

  return Promise.resolve({ data: null, error: null })
}

describe("ai designer route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("OPENROUTER_API_KEY", "test-key")
    vi.stubEnv("OPENROUTER_MODEL", "test-model")
    vi.stubEnv("AI_DESIGN_DAILY_LIMIT", "3")
    rpc.mockImplementation(rpcSuccess)
    quotaQuery.select.mockReturnValue(quotaQuery)
    quotaQuery.eq.mockReturnValue(quotaQuery)
    quotaQuery.gte.mockReturnValue(quotaQuery)
    quotaQuery.or.mockResolvedValue({ count: 2, error: null })
    completion.mockResolvedValue(validModelJson())
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it("rejects prompts over 4000 characters before quota reservation", async () => {
    const response = await POST(requestWithPrompt("x".repeat(4001)))

    expect(response.status).toBe(400)
    expect(rpc).not.toHaveBeenCalled()
    expect(completion).not.toHaveBeenCalled()
  })

  it("rejects blank prompts before quota reservation", async () => {
    const response = await POST(requestWithPrompt("   "))

    expect(response.status).toBe(400)
    expect(rpc).not.toHaveBeenCalled()
  })

  it("checks provider configuration before quota reservation", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "")

    const response = await POST(requestWithPrompt("office"))

    expect(response.status).toBe(500)
    expect(rpc).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toMatchObject({
      error: "AI generation is not configured.",
      retryable: false,
      correlationId: expect.any(String),
    })
  })

  it("reserves quota before calling the provider and completes only an engine-valid plan", async () => {
    const response = await POST(requestWithPrompt("  office  "))

    expect(response.status).toBe(200)
    expect(rpc).toHaveBeenNthCalledWith(1, "reserve_ai_design_request", {
      p_limit: 3,
      p_window_hours: 24,
      p_model: "test-model",
    })
    expect(rpc).toHaveBeenNthCalledWith(2, "complete_ai_design_request", {
      p_request_id: "request-1",
      p_status: "success",
      p_latency_ms: expect.any(Number),
    })
    expect(rpc.mock.invocationCallOrder[0]).toBeLessThan(
      completion.mock.invocationCallOrder[0]
    )
    await expect(response.json()).resolves.toMatchObject({
      plan: {
        baseNetwork: "192.168.1.0",
        baseCidr: 24,
        subnets: [{ name: "LAN", hosts: 50 }],
      },
      quota: { limit: 3, used: 1, remaining: 2, windowHours: 24 },
    })
  })

  it("sets an explicit 120 second SDK timeout", async () => {
    await POST(requestWithPrompt("office"))

    expect(openAiConstructor).toHaveBeenCalledWith(
      expect.objectContaining({ timeout: 120_000 })
    )
  })

  it("preserves a nullable base so deterministic defaults are validated", async () => {
    completion.mockResolvedValue(
      modelJson({
        baseNetwork: null,
        baseCidr: null,
        subnets: [{ name: "LAN", hosts: 50 }],
      })
    )

    const response = await POST(requestWithPrompt("use a sensible default"))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      plan: { baseNetwork: null, baseCidr: null },
    })
    expect(rpc).toHaveBeenLastCalledWith(
      "complete_ai_design_request",
      expect.objectContaining({ p_status: "success" })
    )
  })

  it("does not call the provider when the atomic reservation reports exhausted quota", async () => {
    rpc.mockResolvedValueOnce({
      data: [{ request_id: null, used: 3, remaining: 0 }],
      error: null,
    })

    const response = await POST(requestWithPrompt("office"))

    expect(response.status).toBe(429)
    expect(completion).not.toHaveBeenCalled()
    expect(rpc).toHaveBeenCalledTimes(1)
    await expect(response.json()).resolves.toMatchObject({
      error: "Daily limit reached. You can generate up to 3 designs per 24 hours.",
      quota: { limit: 3, used: 3, remaining: 0, windowHours: 24 },
      retryable: false,
      correlationId: expect.any(String),
    })
  })

  it("returns a stable retryable error when quota reservation fails", async () => {
    rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "private database detail" },
    })

    const response = await POST(requestWithPrompt("office"))
    const payload = await response.json()

    expect(response.status).toBe(503)
    expect(payload).toMatchObject({
      error: "AI generation is temporarily unavailable. Try again.",
      retryable: true,
      correlationId: expect.any(String),
    })
    expect(JSON.stringify(payload)).not.toContain("private database detail")
    expect(completion).not.toHaveBeenCalled()
  })

  it("marks invalid model output failed and returns a retryable stable error", async () => {
    completion.mockResolvedValue(
      modelJson({
        baseNetwork: "192.168.1.0",
        baseCidr: 30,
        subnets: [{ name: "LAN", hosts: 50 }],
      })
    )

    const response = await POST(requestWithPrompt("small parent"))

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toMatchObject({
      error: "Generated requirements did not fit a valid IPv4 plan. Try again.",
      retryable: true,
      correlationId: expect.any(String),
      quota: { limit: 3, used: 0, remaining: 3, windowHours: 24 },
    })
    expect(rpc).toHaveBeenLastCalledWith(
      "complete_ai_design_request",
      expect.objectContaining({ p_status: "failed" })
    )
  })

  it.each([
    ["empty", { choices: [{ message: { content: "" } }] }],
    ["malformed", { choices: [{ message: { content: "not json" } }] }],
  ])("marks %s model output failed", async (_label, modelResponse) => {
    completion.mockResolvedValue(modelResponse)

    const response = await POST(requestWithPrompt("office"))

    expect(response.status).toBe(422)
    expect(rpc).toHaveBeenLastCalledWith(
      "complete_ai_design_request",
      expect.objectContaining({ p_status: "failed" })
    )
    await expect(response.json()).resolves.toMatchObject({
      error: "Generated requirements could not be validated. Try again.",
      retryable: true,
      correlationId: expect.any(String),
    })
  })

  it("never returns provider error text and logs only safe metadata", async () => {
    const providerError = Object.assign(new Error("secret upstream detail"), {
      status: 529,
    })
    completion.mockRejectedValue(providerError)
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)

    const response = await POST(requestWithPrompt("office"))
    const payload = await response.json()

    expect(response.status).toBe(502)
    expect(JSON.stringify(payload)).not.toContain("secret upstream detail")
    expect(payload).toMatchObject({
      error: "AI provider request failed. Try again.",
      retryable: true,
      correlationId: expect.any(String),
      quota: { limit: 3, used: 0, remaining: 3, windowHours: 24 },
    })
    expect(rpc).toHaveBeenLastCalledWith(
      "complete_ai_design_request",
      expect.objectContaining({ p_status: "failed" })
    )
    expect(consoleError).toHaveBeenCalledWith({
      correlationId: payload.correlationId,
      event: "ai_provider_failure",
      errorName: "Error",
      providerStatus: 529,
    })
  })

  it("counts rolling successes and only recent pending reservations in GET quota", async () => {
    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      quota: { limit: 3, used: 2, remaining: 1, windowHours: 24 },
    })
    expect(quotaQuery.gte).toHaveBeenCalledWith(
      "created_at",
      expect.any(String)
    )
    expect(quotaQuery.or).toHaveBeenCalledWith(
      expect.stringMatching(
        /^status\.eq\.success,and\(status\.eq\.pending,created_at\.gte\..+\)$/
      )
    )
  })
})
