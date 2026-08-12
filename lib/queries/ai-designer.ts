"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/lib/query-keys"
import type {
  AiDesignerErrorResponse,
  DesignerPlan,
  QuotaSnapshot,
} from "@/lib/ai-designer-types"

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

export class AiDesignerApiError extends Error {
  quota?: QuotaSnapshot
  retryable: boolean
  correlationId?: string

  constructor(
    message: string,
    quota?: QuotaSnapshot,
    retryable = false,
    correlationId?: string
  ) {
    super(message)
    this.name = "AiDesignerApiError"
    this.quota = quota
    this.retryable = retryable
    this.correlationId = correlationId
  }
}

function apiErrorMessage(error: string, correlationId?: string) {
  return correlationId ? `${error} Reference: ${correlationId}` : error
}

async function fetchQuota(): Promise<QuotaSnapshot> {
  const response = await fetch("/api/ai-designer", { method: "GET" })
  const payload = (await response.json().catch(() => ({}))) as Partial<
    QuotaResponse & AiDesignerErrorResponse
  >

  if (!response.ok || !payload.quota) {
    throw new AiDesignerApiError(
      apiErrorMessage(
        payload.error ?? "Failed to load quota.",
        payload.correlationId
      ),
      payload.quota,
      payload.retryable,
      payload.correlationId
    )
  }

  return payload.quota
}

async function generateDesign({ prompt }: SaveAiDesignArgs): Promise<GenerateAiDesignResponse> {
  const response = await fetch("/api/ai-designer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  })

  const payload = (await response.json().catch(() => ({}))) as Partial<
    GenerateAiDesignResponse & AiDesignerErrorResponse
  >

  if (!response.ok || !payload.plan) {
    throw new AiDesignerApiError(
      apiErrorMessage(
        payload.error ?? "Failed to generate a design.",
        payload.correlationId
      ),
      payload.quota,
      payload.retryable,
      payload.correlationId
    )
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
