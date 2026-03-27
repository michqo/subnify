"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query-keys"
import type { DesignerPlan, QuotaSnapshot } from "@/lib/ai-designer-types"

type GenerateAiDesignResponse = {
  plan: DesignerPlan
  quota?: QuotaSnapshot
  timing?: {
    latencyMs?: number
  }
}

type SaveAiDesignArgs = {
  prompt: string
}

type QuotaResponse = {
  quota: QuotaSnapshot
}

type ApiErrorResponse = {
  error?: string
  quota?: QuotaSnapshot
}

export class AiDesignerApiError extends Error {
  quota?: QuotaSnapshot

  constructor(message: string, quota?: QuotaSnapshot) {
    super(message)
    this.name = "AiDesignerApiError"
    this.quota = quota
  }
}

async function fetchQuota(): Promise<QuotaSnapshot> {
  const response = await fetch("/api/ai-designer", { method: "GET" })
  const payload = (await response.json().catch(() => ({}))) as Partial<QuotaResponse & ApiErrorResponse>

  if (!response.ok || !payload.quota) {
    throw new AiDesignerApiError(payload.error ?? "Failed to load quota.", payload.quota)
  }

  return payload.quota
}

async function generateDesign({ prompt }: SaveAiDesignArgs): Promise<GenerateAiDesignResponse> {
  const response = await fetch("/api/ai-designer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  })

  const payload = (await response.json().catch(() => ({}))) as Partial<GenerateAiDesignResponse & ApiErrorResponse>

  if (!response.ok || !payload.plan) {
    throw new AiDesignerApiError(payload.error ?? "Failed to generate a design.", payload.quota)
  }

  return {
    plan: payload.plan,
    quota: payload.quota,
    timing: payload.timing,
  }
}

export function useAiDesignerQuotaQuery(userId: string | null) {
  return useQuery({
    queryKey: userId ? queryKeys.aiDesigner.quota(userId) : queryKeys.aiDesigner.quotaUnknown,
    queryFn: fetchQuota,
    enabled: Boolean(userId),
  })
}

export function useGenerateAiDesignMutation(userId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generateDesign,
    onSuccess: (payload) => {
      if (payload.quota) {
        const key = userId ? queryKeys.aiDesigner.quota(userId) : queryKeys.aiDesigner.quotaUnknown
        queryClient.setQueryData(key, payload.quota)
      }
    },
    onError: (error) => {
      if (!(error instanceof AiDesignerApiError) || !error.quota) {
        return
      }

      const key = userId ? queryKeys.aiDesigner.quota(userId) : queryKeys.aiDesigner.quotaUnknown
      queryClient.setQueryData(key, error.quota)
    },
  })
}
