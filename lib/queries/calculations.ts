"use client"

import { useMemo } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { DesignerPlan } from "@/lib/ai-designer-types"
import type { CalculationInsert, CalculationRecord } from "@/lib/history"
import { parseSubnetInputArray, parseVlsmAllocations } from "@/lib/history"
import { queryKeys } from "@/lib/query-keys"
import type { PlanSource, SubnetInput } from "@/lib/state/subnet-plan-types"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { calculateVlsm } from "@/lib/vlsm"

export type CalculationSnapshot = {
  baseNetwork: string
  baseCidr: string
  subnets: SubnetInput[]
}

export type BuildCalculationPayloadOptions = {
  sourceType?: PlanSource
  aiPrompt?: string | null
  aiRationale?: string | null
  title?: string | null
}

export type SaveCalculationMutationInput = {
  userId: string
  snapshot: CalculationSnapshot
  options?: BuildCalculationPayloadOptions & {
    calculationId?: string | null
  }
}

export function buildCalculationPayload(
  snapshot: CalculationSnapshot,
  options: BuildCalculationPayloadOptions = {}
): CalculationInsert {
  const calculation = calculateVlsm({
    baseNetwork: snapshot.baseNetwork,
    baseCidr:
      snapshot.baseCidr.trim() === "" ? Number.NaN : Number(snapshot.baseCidr),
    subnets: snapshot.subnets,
  })
  if (!calculation.ok) {
    throw new Error(
      `Plan validation failed: ${calculation.issues[0]?.code ?? "UNKNOWN"}`
    )
  }

  const title = options.title?.trim()
  return {
    title:
      title ||
      `${snapshot.baseNetwork}/${snapshot.baseCidr} (${snapshot.subnets.length} subnets)`,
    source_type: options.sourceType === "ai_design" ? "ai_design" : "manual",
    ai_prompt: options.aiPrompt ?? null,
    ai_rationale: options.aiRationale ?? null,
    base_network: snapshot.baseNetwork,
    base_cidr: Number(snapshot.baseCidr),
    input_subnets: snapshot.subnets.map(({ name, hosts }) => ({
      name: name.trim(),
      hosts,
    })),
    result_subnets: calculation.allocations,
    total_required_hosts: calculation.allocations.reduce(
      (sum, subnet) => sum + subnet.requiredHosts,
      0
    ),
    total_usable_hosts: calculation.allocations.reduce(
      (sum, subnet) => sum + subnet.usableHosts,
      0
    ),
  }
}

function toCalculationRecords(
  raw: Partial<CalculationRecord>[]
): CalculationRecord[] {
  return raw.map(
    (item): CalculationRecord => ({
      id: item.id ?? "",
      title: item.title ?? null,
      source_type: item.source_type === "ai_design" ? "ai_design" : "manual",
      ai_prompt: item.ai_prompt ?? null,
      ai_rationale: item.ai_rationale ?? null,
      base_network: item.base_network ?? "",
      base_cidr: Number(item.base_cidr ?? 0),
      input_subnets: parseSubnetInputArray(item.input_subnets),
      result_subnets: parseVlsmAllocations(item.result_subnets),
      total_required_hosts: Number(item.total_required_hosts ?? 0),
      total_usable_hosts: Number(item.total_usable_hosts ?? 0),
      created_at: item.created_at ?? new Date().toISOString(),
    })
  )
}

async function fetchCalculations(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("calculations")
    .select(
      "id,title,source_type,ai_prompt,ai_rationale,base_network,base_cidr,input_subnets,result_subnets,total_required_hosts,total_usable_hosts,created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    throw new Error(error.message)
  }

  return toCalculationRecords((data ?? []) as Partial<CalculationRecord>[])
}

async function deleteCalculation(
  supabase: SupabaseClient,
  userId: string,
  calculationId: string
) {
  const { data: deletedRows, error } = await supabase
    .from("calculations")
    .delete()
    .eq("id", calculationId)
    .eq("user_id", userId)
    .select("id")

  if (error) {
    throw new Error(error.message)
  }

  if (!deletedRows || deletedRows.length === 0) {
    throw new Error(
      "Calculation was not removed (permission or record mismatch)."
    )
  }
}

async function renameCalculation(
  supabase: SupabaseClient,
  userId: string,
  input: { calculationId: string; title: string }
) {
  const title = input.title.trim()
  if (!title || title.length > 80) {
    throw new Error("Plan name must contain 1 to 80 characters.")
  }

  const { data, error } = await supabase
    .from("calculations")
    .update({ title })
    .eq("id", input.calculationId)
    .eq("user_id", userId)
    .select("id")

  if (error || !data || data.length === 0) {
    throw new Error(
      error?.message ?? "Plan was not found or could not be renamed."
    )
  }
  return data[0].id as string
}

async function duplicateCalculation(
  supabase: SupabaseClient,
  userId: string,
  record: CalculationRecord
) {
  const fallbackTitle = `${record.base_network}/${record.base_cidr}`
  const payload = buildCalculationPayload(
    {
      baseNetwork: record.base_network,
      baseCidr: String(record.base_cidr),
      subnets: record.input_subnets.map((subnet, index) => ({
        id: index + 1,
        ...subnet,
      })),
    },
    {
      title: `${record.title ?? fallbackTitle} copy`,
      sourceType: record.source_type,
      aiPrompt: record.ai_prompt,
      aiRationale: record.ai_rationale,
    }
  )
  const { data, error } = await supabase
    .from("calculations")
    .insert({
      ...payload,
      user_id: userId,
    })
    .select("id")

  if (error || !data || data.length === 0) {
    throw new Error(error?.message ?? "Plan could not be duplicated.")
  }
  return data[0].id as string
}

async function saveAiGeneratedCalculation(
  supabase: SupabaseClient,
  userId: string,
  generatedPlan: DesignerPlan,
  sourcePrompt: string
) {
  const baseNetwork = generatedPlan.baseNetwork ?? "192.168.0.0"
  const subnets = parseSubnetInputArray(
    generatedPlan.subnets.map((subnet) => ({
      name: subnet.name,
      hosts: subnet.hosts,
    }))
  )

  const payload = buildCalculationPayload(
    {
      baseNetwork,
      baseCidr: String(generatedPlan.baseCidr ?? 24),
      subnets: subnets.map((subnet, index) => ({ id: index + 1, ...subnet })),
    },
    {
      title: generatedPlan.title,
      sourceType: "ai_design",
      aiPrompt: sourcePrompt,
      aiRationale: generatedPlan.rationale,
    }
  )

  const { data, error } = await supabase
    .from("calculations")
    .insert({
      ...payload,
      user_id: userId,
    })
    .select("id")

  if (error || !data || data.length === 0) {
    throw new Error(
      "Design generated, but saving to history failed. You can still open and calculate manually."
    )
  }

  return data[0].id
}

async function saveOrUpdateCalculation(
  supabase: SupabaseClient,
  input: SaveCalculationMutationInput
) {
  const { userId, snapshot, options } = input
  const payload = buildCalculationPayload(snapshot, options)

  const updateId =
    typeof options?.calculationId === "string" &&
    options.calculationId.length > 0
      ? options.calculationId
      : null

  if (updateId) {
    const { count, error } = await supabase
      .from("calculations")
      .update(payload, { count: "exact" })
      .eq("id", updateId)
      .eq("user_id", userId)

    if (error) {
      throw new Error(`Update failed: ${error.message}`)
    }

    if (!count || count < 1) {
      throw new Error(
        "Update failed: Plan was not found or you do not have permission."
      )
    }

    return updateId
  }

  const { data, error } = await supabase
    .from("calculations")
    .insert({
      ...payload,
      user_id: userId,
    })
    .select("id")

  if (error || !data || data.length === 0) {
    throw new Error(
      `Save failed: ${error?.message ?? "Could not create record."}`
    )
  }

  return data[0].id
}

export function useCalculationsQuery(userId: string | null) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  return useQuery({
    queryKey: userId
      ? queryKeys.calculations.list(userId)
      : queryKeys.calculations.all,
    queryFn: () => fetchCalculations(supabase, userId as string),
    enabled: Boolean(userId),
  })
}

export function useDeleteCalculationMutation(userId: string | null) {
  const queryClient = useQueryClient()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  return useMutation({
    mutationFn: async (calculationId: string) => {
      if (!userId) {
        throw new Error("You must be signed in to delete calculations.")
      }

      await deleteCalculation(supabase, userId, calculationId)
      return calculationId
    },
    onSuccess: async () => {
      if (userId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.calculations.list(userId),
        })
      }
    },
  })
}

export function useRenameCalculationMutation(userId: string | null) {
  const queryClient = useQueryClient()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  return useMutation({
    mutationFn: (input: { calculationId: string; title: string }) => {
      if (!userId)
        throw new Error("You must be signed in to rename calculations.")
      return renameCalculation(supabase, userId, input)
    },
    onSuccess: async () => {
      if (userId)
        await queryClient.invalidateQueries({
          queryKey: queryKeys.calculations.list(userId),
        })
    },
  })
}

export function useDuplicateCalculationMutation(userId: string | null) {
  const queryClient = useQueryClient()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  return useMutation({
    mutationFn: (record: CalculationRecord) => {
      if (!userId)
        throw new Error("You must be signed in to duplicate calculations.")
      return duplicateCalculation(supabase, userId, record)
    },
    onSuccess: async () => {
      if (userId)
        await queryClient.invalidateQueries({
          queryKey: queryKeys.calculations.list(userId),
        })
    },
  })
}

export function useSaveAiGeneratedCalculationMutation(userId: string | null) {
  const queryClient = useQueryClient()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  return useMutation({
    mutationFn: async ({
      generatedPlan,
      sourcePrompt,
    }: {
      generatedPlan: DesignerPlan
      sourcePrompt: string
    }) => {
      if (!userId) {
        return null
      }

      return saveAiGeneratedCalculation(
        supabase,
        userId,
        generatedPlan,
        sourcePrompt
      )
    },
    onSuccess: async () => {
      if (userId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.calculations.list(userId),
        })
      }
    },
  })
}

export function useSaveCalculationMutation() {
  const queryClient = useQueryClient()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  return useMutation({
    mutationFn: async (input: SaveCalculationMutationInput) =>
      saveOrUpdateCalculation(supabase, input),
    onSuccess: async (_savedId, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.calculations.list(variables.userId),
      })
    },
  })
}
