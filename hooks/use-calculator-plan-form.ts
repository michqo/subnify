"use client"

import { useCallback } from "react"
import { useForm, useStore } from "@tanstack/react-form"

import type { ReplacePlanInput, SubnetInput } from "@/lib/state/subnet-plan-types"

type CalculatorFormValues = {
  baseNetwork: string
  baseCidr: string
  subnets: SubnetInput[]
  sourceType: "manual" | "ai_design" | "history"
  aiPrompt: string | null
  aiRationale: string | null
  suggestedTitle: string | null
}

const defaultSubnets: SubnetInput[] = [
  { id: 1, name: "LAN A", hosts: 50 },
  { id: 2, name: "LAN B", hosts: 25 },
  { id: 3, name: "LAN C", hosts: 10 },
]

const defaultFormValues: CalculatorFormValues = {
  baseNetwork: "192.168.1.0",
  baseCidr: "24",
  subnets: defaultSubnets,
  sourceType: "manual",
  aiPrompt: null,
  aiRationale: null,
  suggestedTitle: null,
}

export function useCalculatorPlanForm() {
  const calculatorForm = useForm({
    defaultValues: defaultFormValues,
  })
  const formValues = calculatorForm.state.values
  const subnets = useStore(calculatorForm.store, (state) => state.values.subnets)

  const keepSourceTypeConsistent = useCallback(() => {
    calculatorForm.setFieldValue(
      "sourceType",
      calculatorForm.state.values.sourceType === "ai_design" ? "ai_design" : "manual"
    )
  }, [calculatorForm])

  const setBaseNetwork = useCallback(
    (value: string) => {
      calculatorForm.setFieldValue("baseNetwork", value)
    },
    [calculatorForm]
  )

  const setBaseCidr = useCallback(
    (value: string) => {
      calculatorForm.setFieldValue("baseCidr", value)
    },
    [calculatorForm]
  )

  const addSubnet = useCallback(() => {
    const newId = Math.max(...subnets.map((subnet) => subnet.id), 0) + 1
    const suffix = newId <= 26 ? String.fromCharCode(64 + newId) : `${newId}`

    calculatorForm.setFieldValue("subnets", [...subnets, { id: newId, name: `LAN ${suffix}`, hosts: 10 }])
    keepSourceTypeConsistent()
  }, [calculatorForm, keepSourceTypeConsistent, subnets])

  const removeSubnet = useCallback(
    (id: number) => {
      if (subnets.length <= 1) {
        return
      }

      calculatorForm.setFieldValue(
        "subnets",
        subnets.filter((subnet) => subnet.id !== id)
      )
      keepSourceTypeConsistent()
    },
    [calculatorForm, keepSourceTypeConsistent, subnets]
  )

  const updateSubnet = useCallback(
    (id: number, field: "name" | "hosts", value: string) => {
      const nextSubnets = subnets.map((subnet) =>
        subnet.id === id
          ? {
              ...subnet,
              [field]: field === "hosts" ? (value === "" ? 0 : Number(value)) : value,
            }
          : subnet
      )

      calculatorForm.setFieldValue("subnets", nextSubnets)
      keepSourceTypeConsistent()
    },
    [calculatorForm, keepSourceTypeConsistent, subnets]
  )

  const moveSubnet = useCallback(
    (activeIndex: number, overIndex: number) => {
      if (activeIndex === overIndex) {
        return
      }

      if (activeIndex < 0 || overIndex < 0) {
        return
      }

      const nextSubnets = [...subnets]
      const [moved] = nextSubnets.splice(activeIndex, 1)
      nextSubnets.splice(overIndex, 0, moved)

      calculatorForm.setFieldValue("subnets", nextSubnets)
      keepSourceTypeConsistent()
    },
    [calculatorForm, keepSourceTypeConsistent, subnets]
  )

  const replacePlan = useCallback(
    (plan: ReplacePlanInput) => {
      const normalizedSubnets =
        plan.subnets.length > 0
          ? plan.subnets.map((subnet, index) => ({
              id: index + 1,
              name: subnet.name,
              hosts: subnet.hosts,
            }))
          : defaultSubnets

      calculatorForm.setFieldValue("baseNetwork", plan.baseNetwork)
      calculatorForm.setFieldValue("baseCidr", plan.baseCidr)
      calculatorForm.setFieldValue("subnets", normalizedSubnets)
      calculatorForm.setFieldValue("sourceType", plan.sourceType ?? "manual")
      calculatorForm.setFieldValue("aiPrompt", plan.aiPrompt ?? null)
      calculatorForm.setFieldValue("aiRationale", plan.aiRationale ?? null)
      calculatorForm.setFieldValue("suggestedTitle", plan.suggestedTitle ?? null)
    },
    [calculatorForm]
  )

  const resetPlanForm = useCallback(() => {
    calculatorForm.reset()
  }, [calculatorForm])

  return {
    formValues,
    isAiPlan: formValues.sourceType === "ai_design",
    setBaseNetwork,
    setBaseCidr,
    addSubnet,
    removeSubnet,
    updateSubnet,
    moveSubnet,
    replacePlan,
    resetPlanForm,
  }
}
