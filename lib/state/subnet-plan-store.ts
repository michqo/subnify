import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import type { PlanSource, ReplacePlanInput, SubnetInput } from "@/lib/state/subnet-plan-types"

type SubnetPlanState = {
  baseNetwork: string
  baseCidr: string
  subnets: SubnetInput[]
  sourceType: PlanSource
  aiPrompt: string | null
  aiRationale: string | null
  aiTitle: string | null
  setBaseNetwork: (value: string) => void
  setBaseCidr: (value: string) => void
  addSubnet: () => void
  removeSubnet: (id: number) => void
  updateSubnet: (id: number, field: "name" | "hosts", value: string) => void
  replacePlan: (plan: ReplacePlanInput) => void
  clearAiMetadata: () => void
  resetPlan: () => void
}

const defaultSubnets: SubnetInput[] = [
  { id: 1, name: "LAN A", hosts: 50 },
  { id: 2, name: "LAN B", hosts: 25 },
  { id: 3, name: "LAN C", hosts: 10 },
]

const defaultPlan = {
  baseNetwork: "192.168.1.0",
  baseCidr: "24",
  subnets: defaultSubnets,
  sourceType: "manual" as PlanSource,
  aiPrompt: null,
  aiRationale: null,
  aiTitle: null,
}

export const useSubnetPlanStore = create<SubnetPlanState>()(
  persist(
    (set, get) => ({
      ...defaultPlan,
      setBaseNetwork: (value) => set({ baseNetwork: value }),
      setBaseCidr: (value) => set({ baseCidr: value }),
      addSubnet: () => {
        const current = get().subnets
        const newId = Math.max(...current.map((subnet) => subnet.id), 0) + 1
        const suffix = newId <= 26 ? String.fromCharCode(64 + newId) : `${newId}`
        set({
          subnets: [...current, { id: newId, name: `LAN ${suffix}`, hosts: 10 }],
          sourceType: "manual",
        })
      },
      removeSubnet: (id) => {
        const current = get().subnets
        if (current.length <= 1) {
          return
        }

        set({
          subnets: current.filter((subnet) => subnet.id !== id),
          sourceType: "manual",
        })
      },
      updateSubnet: (id, field, value) => {
        const nextSubnets = get().subnets.map((subnet) =>
          subnet.id === id
            ? {
                ...subnet,
                [field]: field === "hosts" ? parseInt(value, 10) || 0 : value,
              }
            : subnet
        )

        set({ subnets: nextSubnets, sourceType: "manual" })
      },
      replacePlan: (plan) => {
        const normalizedSubnets =
          plan.subnets.length > 0
            ? plan.subnets.map((subnet, index) => ({
                id: index + 1,
                name: subnet.name,
                hosts: subnet.hosts,
              }))
            : defaultSubnets

        set({
          baseNetwork: plan.baseNetwork,
          baseCidr: plan.baseCidr,
          subnets: normalizedSubnets,
          sourceType: plan.sourceType ?? "manual",
          aiPrompt: plan.aiPrompt ?? null,
          aiRationale: plan.aiRationale ?? null,
          aiTitle: plan.aiTitle ?? null,
        })
      },
      clearAiMetadata: () => {
        set({
          sourceType: "manual",
          aiPrompt: null,
          aiRationale: null,
          aiTitle: null,
        })
      },
      resetPlan: () => set(defaultPlan),
    }),
    {
      name: "subnify-subnet-plan",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        baseNetwork: state.baseNetwork,
        baseCidr: state.baseCidr,
        subnets: state.subnets,
        sourceType: state.sourceType,
        aiPrompt: state.aiPrompt,
        aiRationale: state.aiRationale,
        aiTitle: state.aiTitle,
      }),
    }
  )
)
