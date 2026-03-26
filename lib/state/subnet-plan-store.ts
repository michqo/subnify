import { create } from "zustand"

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
  moveSubnet: (activeId: number, overId: number) => void
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

export const useSubnetPlanStore = create<SubnetPlanState>()((set, get) => ({
  ...defaultPlan,
  setBaseNetwork: (value) => set({ baseNetwork: value }),
  setBaseCidr: (value) => set({ baseCidr: value }),
  addSubnet: () => {
    const current = get().subnets
    const currentSourceType = get().sourceType
    const newId = Math.max(...current.map((subnet) => subnet.id), 0) + 1
    const suffix = newId <= 26 ? String.fromCharCode(64 + newId) : `${newId}`
    set({
      subnets: [...current, { id: newId, name: `LAN ${suffix}`, hosts: 10 }],
      sourceType: currentSourceType === "ai_design" ? "ai_design" : "manual",
    })
  },
  removeSubnet: (id) => {
    const current = get().subnets
    const currentSourceType = get().sourceType
    if (current.length <= 1) {
      return
    }

    set({
      subnets: current.filter((subnet) => subnet.id !== id),
      sourceType: currentSourceType === "ai_design" ? "ai_design" : "manual",
    })
  },
  updateSubnet: (id, field, value) => {
    const currentSourceType = get().sourceType
    const nextSubnets = get().subnets.map((subnet) =>
      subnet.id === id
        ? {
            ...subnet,
            [field]: field === "hosts" ? parseInt(value, 10) || 0 : value,
          }
        : subnet
    )

    set({
      subnets: nextSubnets,
      sourceType: currentSourceType === "ai_design" ? "ai_design" : "manual",
    })
  },
  moveSubnet: (activeId, overId) => {
    if (activeId === overId) {
      return
    }

    const current = get().subnets
    const currentSourceType = get().sourceType
    const activeIndex = current.findIndex((subnet) => subnet.id === activeId)
    const overIndex = current.findIndex((subnet) => subnet.id === overId)

    if (activeIndex < 0 || overIndex < 0) {
      return
    }

    const nextSubnets = [...current]
    const [moved] = nextSubnets.splice(activeIndex, 1)
    nextSubnets.splice(overIndex, 0, moved)

    set({
      subnets: nextSubnets,
      sourceType: currentSourceType === "ai_design" ? "ai_design" : "manual",
    })
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
}))
