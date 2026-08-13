import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const {
  adminRpc,
  authGetUser,
  authRpc,
  completion,
  createAdminClient,
  openAiConstructor,
} = vi.hoisted(() => ({
  adminRpc: vi.fn(),
  authGetUser: vi.fn(),
  authRpc: vi.fn(),
  completion: vi.fn(),
  createAdminClient: vi.fn(),
  openAiConstructor: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser: authGetUser },
    rpc: authRpc,
  }),
}))

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => createAdminClient(),
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

const USER_ID = "00000000-0000-4000-8000-000000000001"
const REQUEST_ID = "00000000-0000-4000-8000-000000000002"

const reservation = {
  request_id: REQUEST_ID,
  limit: 3,
  used: 1,
  remaining: 2,
  window_hours: 24,
}

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

function adminRpcSuccess(name: string) {
  if (name === "reserve_ai_design_request") {
    return Promise.resolve({ data: [reservation], error: null })
  }

  if (name === "get_ai_design_quota") {
    return Promise.resolve({
      data: [{ limit: 3, used: 2, remaining: 1, window_hours: 24 }],
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
    authGetUser.mockResolvedValue({ data: { user: { id: USER_ID } } })
    createAdminClient.mockReturnValue({ rpc: adminRpc })
    adminRpc.mockImplementation(adminRpcSuccess)
    completion.mockResolvedValue(validModelJson())
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it("rejects prompts over 4000 characters before quota reservation", async () => {
    const response = await POST(requestWithPrompt("x".repeat(4001)))

    expect(response.status).toBe(400)
    expect(adminRpc).not.toHaveBeenCalled()
    expect(completion).not.toHaveBeenCalled()
  })

  it("rejects blank prompts before quota reservation", async () => {
    const response = await POST(requestWithPrompt("   "))

    expect(response.status).toBe(400)
    expect(adminRpc).not.toHaveBeenCalled()
  })

  it("checks provider configuration before quota reservation", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "")

    const response = await POST(requestWithPrompt("office"))

    expect(response.status).toBe(500)
    expect(adminRpc).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toMatchObject({
      error: "AI generation is not configured.",
      retryable: false,
      correlationId: expect.any(String),
    })
  })

  it("uses cookie auth only to verify identity and admin RPCs for quota state", async () => {
    const response = await POST(requestWithPrompt("office"))

    expect(response.status).toBe(200)
    expect(authGetUser).toHaveBeenCalledOnce()
    expect(authRpc).not.toHaveBeenCalled()
    expect(adminRpc).toHaveBeenNthCalledWith(1, "reserve_ai_design_request", {
      p_user_id: USER_ID,
      p_model: "test-model",
    })
    expect(adminRpc).toHaveBeenNthCalledWith(2, "complete_ai_design_request", {
      p_user_id: USER_ID,
      p_request_id: REQUEST_ID,
      p_status: "success",
      p_latency_ms: expect.any(Number),
    })
    expect(adminRpc.mock.invocationCallOrder[0]).toBeLessThan(
      completion.mock.invocationCallOrder[0]
    )
  })

  it("returns only a plan accepted by the shared engine", async () => {
    const response = await POST(requestWithPrompt("  office  "))

    expect(response.status).toBe(200)
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
  })

  it("does not call the provider when the atomic reservation reports exhausted quota", async () => {
    adminRpc.mockResolvedValueOnce({
      data: [
        {
          request_id: null,
          limit: 3,
          used: 3,
          remaining: 0,
          window_hours: 24,
        },
      ],
      error: null,
    })

    const response = await POST(requestWithPrompt("office"))

    expect(response.status).toBe(429)
    expect(completion).not.toHaveBeenCalled()
    expect(adminRpc).toHaveBeenCalledTimes(1)
    await expect(response.json()).resolves.toMatchObject({
      error: "Daily limit reached. You can generate up to 3 designs per 24 hours.",
      quota: { limit: 3, used: 3, remaining: 0, windowHours: 24 },
      retryable: false,
      correlationId: expect.any(String),
    })
  })

  it("returns a stable retryable error when admin client configuration fails", async () => {
    createAdminClient.mockImplementationOnce(() => {
      throw new Error("secret service role configuration detail")
    })

    const response = await POST(requestWithPrompt("office"))
    const payload = await response.json()

    expect(response.status).toBe(503)
    expect(payload).toMatchObject({
      error: "AI generation is temporarily unavailable. Try again.",
      retryable: true,
      correlationId: expect.any(String),
    })
    expect(JSON.stringify(payload)).not.toContain("service role")
    expect(completion).not.toHaveBeenCalled()
  })

  it("returns a stable retryable error when quota reservation fails", async () => {
    adminRpc.mockResolvedValueOnce({
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

  it.each([
    ["missing row", []],
    [
      "invalid request UUID",
      [{ ...reservation, request_id: "attacker-controlled-id" }],
    ],
    ["fractional usage", [{ ...reservation, used: 1.5 }]],
    ["negative remaining", [{ ...reservation, remaining: -1 }]],
    ["inconsistent totals", [{ ...reservation, used: 2, remaining: 2 }]],
    ["hostile policy limit", [{ ...reservation, limit: 999_999 }]],
    ["hostile policy window", [{ ...reservation, window_hours: 876_000 }]],
  ])("rejects a malformed reservation: %s", async (_label, data) => {
    adminRpc.mockResolvedValueOnce({ data, error: null })

    const response = await POST(requestWithPrompt("office"))

    expect(response.status).toBe(503)
    expect(completion).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toMatchObject({
      error: "AI generation is temporarily unavailable. Try again.",
      retryable: true,
      correlationId: expect.any(String),
    })
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
    expect(adminRpc).toHaveBeenLastCalledWith(
      "complete_ai_design_request",
      expect.objectContaining({ p_user_id: USER_ID, p_status: "failed" })
    )
  })

  it.each([
    ["empty", { choices: [{ message: { content: "" } }] }],
    ["malformed", { choices: [{ message: { content: "not json" } }] }],
  ])("marks %s model output failed", async (_label, modelResponse) => {
    completion.mockResolvedValue(modelResponse)

    const response = await POST(requestWithPrompt("office"))

    expect(response.status).toBe(422)
    expect(adminRpc).toHaveBeenLastCalledWith(
      "complete_ai_design_request",
      expect.objectContaining({ p_user_id: USER_ID, p_status: "failed" })
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
    expect(adminRpc).toHaveBeenLastCalledWith(
      "complete_ai_design_request",
      expect.objectContaining({ p_user_id: USER_ID, p_status: "failed" })
    )
    expect(consoleError).toHaveBeenCalledWith({
      correlationId: payload.correlationId,
      event: "ai_provider_failure",
      errorName: "Error",
      providerStatus: 529,
    })
  })

  it("keeps a failed completion reservation pending and returns stable quota", async () => {
    const providerError = new Error("secret upstream detail")
    completion.mockRejectedValue(providerError)
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    adminRpc
      .mockResolvedValueOnce({ data: [reservation], error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { message: "secret completion detail" },
      })

    const response = await POST(requestWithPrompt("office"))
    const payload = await response.json()

    expect(response.status).toBe(502)
    expect(payload).toMatchObject({
      error: "AI provider request failed. Try again.",
      quota: { limit: 3, used: 1, remaining: 2, windowHours: 24 },
    })
    expect(JSON.stringify(payload)).not.toContain("secret")
  })

  it("gets quota through the same DB-owned policy RPC", async () => {
    const response = await GET()

    expect(response.status).toBe(200)
    expect(authRpc).not.toHaveBeenCalled()
    expect(adminRpc).toHaveBeenCalledWith("get_ai_design_quota", {
      p_user_id: USER_ID,
    })
    await expect(response.json()).resolves.toEqual({
      quota: { limit: 3, used: 2, remaining: 1, windowHours: 24 },
    })
  })

  it("accepts a DB-clamped quota snapshot after policy reduction", async () => {
    adminRpc.mockResolvedValueOnce({
      data: [{ limit: 3, used: 3, remaining: 0, window_hours: 24 }],
      error: null,
    })

    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      quota: { limit: 3, used: 3, remaining: 0, windowHours: 24 },
    })
  })

  it("returns 429 for a DB-clamped reservation after policy reduction", async () => {
    adminRpc.mockResolvedValueOnce({
      data: [
        {
          request_id: null,
          limit: 3,
          used: 3,
          remaining: 0,
          window_hours: 24,
        },
      ],
      error: null,
    })

    const response = await POST(requestWithPrompt("office"))

    expect(response.status).toBe(429)
    expect(completion).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toMatchObject({
      quota: { limit: 3, used: 3, remaining: 0, windowHours: 24 },
    })
  })

  it("rejects a malformed quota snapshot without returning raw detail", async () => {
    adminRpc.mockResolvedValueOnce({
      data: [{ limit: 3, used: 4, remaining: -1, window_hours: 24 }],
      error: null,
    })

    const response = await GET()

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: "Quota is temporarily unavailable.",
    })
  })
})
