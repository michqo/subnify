"use client"

import { useCallback } from "react"
import { useForm } from "@tanstack/react-form"

import type { ReplacePlanInput, SubnetInput } from "@/lib/state/subnet-plan-types"

type CalculatorFormValues = {
  baseNetwork: string
  baseCidr: string
  subnets: SubnetInput[]
  sourceType: "manual" | "ai_design" | "history"
  aiPrompt: string | null
  aiRationale: string | null
  aiTitle: string | null
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
  aiTitle: null,
}

export function useCalculatorPlanForm() {
  const calculatorForm = useForm({
    defaultValues: defaultFormValues,
  })
  const formValues = calculatorForm.state.values

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
    const currentSubnets = calculatorForm.state.values.subnets
    const newId = Math.max(...currentSubnets.map((subnet) => subnet.id), 0) + 1
    const suffix = newId <= 26 ? String.fromCharCode(64 + newId) : `${newId}`

    calculatorForm.setFieldValue("subnets", [...currentSubnets, { id: newId, name: `LAN ${suffix}`, hosts: 10 }])
    keepSourceTypeConsistent()
  }, [calculatorForm, keepSourceTypeConsistent])

  const removeSubnet = useCallback(
    (id: number) => {
      const currentSubnets = calculatorForm.state.values.subnets
      if (currentSubnets.length <= 1) {
        return
      }

      calculatorForm.setFieldValue(
        "subnets",
        currentSubnets.filter((subnet) => subnet.id !== id)
      )
      keepSourceTypeConsistent()
    },
    [calculatorForm, keepSourceTypeConsistent]
  )

  const updateSubnet = useCallback(
    (id: number, field: "name" | "hosts", value: string) => {
      const currentSubnets = calculatorForm.state.values.subnets
      const nextSubnets = currentSubnets.map((subnet) =>
        subnet.id === id
          ? {
              ...subnet,
              [field]: field === "hosts" ? parseInt(value, 10) || 0 : value,
            }
          : subnet
      )

      calculatorForm.setFieldValue("subnets", nextSubnets)
      keepSourceTypeConsistent()
    },
    [calculatorForm, keepSourceTypeConsistent]
  )

  const moveSubnet = useCallback(
    (activeIndex: number, overIndex: number) => {
      if (activeIndex === overIndex) {
        return
      }

      const currentSubnets = calculatorForm.state.values.subnets

      if (activeIndex < 0 || overIndex < 0) {
        return
      }

      const nextSubnets = [...currentSubnets]
      const [moved] = nextSubnets.splice(activeIndex, 1)
      nextSubnets.splice(overIndex, 0, moved)

      calculatorForm.setFieldValue("subnets", nextSubnets)
      keepSourceTypeConsistent()
    },
    [calculatorForm, keepSourceTypeConsistent]
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
      calculatorForm.setFieldValue("aiTitle", plan.aiTitle ?? null)
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
