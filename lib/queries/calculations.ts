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
import { calculateVlsm, type VlsmAllocation } from "@/lib/vlsm"

export type SaveCalculationMutationInput = {
  userId: string
  calculatedResults: VlsmAllocation[]
  snapshot: {
    baseNetwork: string
    baseCidr: string
    subnets: SubnetInput[]
  }
  options?: {
    sourceType?: PlanSource
    aiPrompt?: string | null
    aiRationale?: string | null
    title?: string | null
    calculationId?: string | null
  }
}

function toCalculationRecords(raw: Partial<CalculationRecord>[]): CalculationRecord[] {
  return raw.map((item): CalculationRecord => ({
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
  }))
}

async function fetchCalculations(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("calculations")
    .select("id,title,source_type,ai_prompt,ai_rationale,base_network,base_cidr,input_subnets,result_subnets,total_required_hosts,total_usable_hosts,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    throw new Error(error.message)
  }

  return toCalculationRecords((data ?? []) as Partial<CalculationRecord>[])
}

async function deleteCalculation(supabase: SupabaseClient, userId: string, calculationId: string) {
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
    throw new Error("Calculation was not removed (permission or record mismatch).")
  }
}

async function saveAiGeneratedCalculation(
  supabase: SupabaseClient,
  userId: string,
  generatedPlan: DesignerPlan,
  sourcePrompt: string
) {
  const baseNetwork = generatedPlan.baseNetwork ?? "192.168.0.0"
  const baseCidr = Number(generatedPlan.baseCidr ?? 24)
  const subnets = parseSubnetInputArray(
    generatedPlan.subnets.map((subnet) => ({
      name: subnet.name,
      hosts: subnet.hosts,
    }))
  )

  const vlsmInput = subnets.map((subnet, index) => ({
    id: index + 1,
    name: subnet.name,
    hosts: subnet.hosts,
  }))
  const calculatedResults = calculateVlsm(baseNetwork, vlsmInput)

  const payload: CalculationInsert = {
    title: generatedPlan.title,
    source_type: "ai_design",
    ai_prompt: sourcePrompt,
    ai_rationale: generatedPlan.rationale,
    base_network: baseNetwork,
    base_cidr: baseCidr,
    input_subnets: subnets,
    result_subnets: calculatedResults,
    total_required_hosts: calculatedResults.reduce((sum, subnet) => sum + subnet.requiredHosts, 0),
    total_usable_hosts: calculatedResults.reduce((sum, subnet) => sum + subnet.usableHosts, 0),
  }

  const { data, error } = await supabase
    .from("calculations")
    .insert({
      ...payload,
      user_id: userId,
    })
    .select("id")

  if (error || !data || data.length === 0) {
    throw new Error("Design generated, but saving to history failed. You can still open and calculate manually.")
  }

  return data[0].id
}

async function saveOrUpdateCalculation(
  supabase: SupabaseClient,
  input: SaveCalculationMutationInput
) {
  const { userId, calculatedResults, snapshot, options } = input
  const totalRequiredHosts = calculatedResults.reduce((sum, subnet) => sum + subnet.requiredHosts, 0)
  const totalUsableHosts = calculatedResults.reduce((sum, subnet) => sum + subnet.usableHosts, 0)
  const normalizedTitle =
    typeof options?.title === "string" && options.title.trim().length > 0 ? options.title.trim() : null

  const payload: CalculationInsert = {
    title: normalizedTitle ?? `${snapshot.baseNetwork}/${snapshot.baseCidr} (${snapshot.subnets.length} subnets)`,
    source_type: options?.sourceType === "ai_design" ? "ai_design" : "manual",
    ai_prompt: options?.aiPrompt ?? null,
    ai_rationale: options?.aiRationale ?? null,
    base_network: snapshot.baseNetwork,
    base_cidr: Number(snapshot.baseCidr) || 0,
    input_subnets: snapshot.subnets.map(({ name, hosts }) => ({ name, hosts })),
    result_subnets: calculatedResults,
    total_required_hosts: totalRequiredHosts,
    total_usable_hosts: totalUsableHosts,
  }

  const updateId =
    typeof options?.calculationId === "string" && options.calculationId.length > 0 ? options.calculationId : null

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
      throw new Error("Update failed: Plan was not found or you do not have permission.")
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
    throw new Error(`Save failed: ${error?.message ?? "Could not create record."}`)
  }

  return data[0].id
}

export function useCalculationsQuery(userId: string | null) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  return useQuery({
    queryKey: userId ? queryKeys.calculations.list(userId) : queryKeys.calculations.all,
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

export function useSaveAiGeneratedCalculationMutation(userId: string | null) {
  const queryClient = useQueryClient()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  return useMutation({
    mutationFn: async ({ generatedPlan, sourcePrompt }: { generatedPlan: DesignerPlan; sourcePrompt: string }) => {
      if (!userId) {
        return null
      }

      return saveAiGeneratedCalculation(supabase, userId, generatedPlan, sourcePrompt)
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
    mutationFn: async (input: SaveCalculationMutationInput) => saveOrUpdateCalculation(supabase, input),
    onSuccess: async (_savedId, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.calculations.list(variables.userId),
      })
    },
  })
}
