export type PlanSource = "manual" | "ai_design" | "history"

export type SubnetInput = {
  id: number
  name: string
  hosts: number
}

export type ReplacePlanInput = {
  baseNetwork: string
  baseCidr: string
  subnets: SubnetInput[]
  sourceType?: PlanSource
  aiPrompt?: string | null
  aiRationale?: string | null
  suggestedTitle?: string | null
}
