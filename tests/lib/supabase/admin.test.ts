import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }))

vi.mock("server-only", () => ({}))
vi.mock("@supabase/supabase-js", () => ({ createClient }))

import { createSupabaseAdminClient } from "@/lib/supabase/admin"

describe("createSupabaseAdminClient", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co")
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
    createClient.mockReturnValue({ rpc: vi.fn() })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it("creates a non-persistent service-role client", () => {
    createSupabaseAdminClient()

    expect(createClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "test-service-role-key",
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      }
    )
  })

  it("throws a stable error without exposing missing secret names", () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "")

    expect(() => createSupabaseAdminClient()).toThrow(
      "Supabase admin client is not configured."
    )
  })
})
