import type { SubnetInput } from "@/lib/state/subnet-plan-types"

export interface AiDesignedSubnet {
  name?: string
  hosts?: number
}

export interface AiDesignedPlan {
  baseNetwork?: string | null
  baseCidr?: number | null
  title?: string
  subnets?: AiDesignedSubnet[]
  rationale?: string | null
}

export interface StoredAiDesignPayload {
  prompt?: string
  plan?: AiDesignedPlan
}

export function unpackAiDesignPayload(
  parsed: StoredAiDesignPayload | AiDesignedPlan
): {
  parsedPlan: AiDesignedPlan
  aiPrompt: string | null
} {
  const parsedPlan =
    typeof parsed === "object" && parsed && "plan" in parsed && parsed.plan ? parsed.plan : (parsed as AiDesignedPlan)

  const aiPrompt =
    typeof parsed === "object" && parsed && "prompt" in parsed && typeof parsed.prompt === "string"
      ? parsed.prompt
      : null

  return { parsedPlan, aiPrompt }
}

export function normalizeAiDesignedSubnets(subnets: AiDesignedSubnet[] | undefined): SubnetInput[] {
  const rawSubnets = Array.isArray(subnets) ? subnets : []

  return rawSubnets
    .map((subnet, index) => ({
      id: index + 1,
      name:
        typeof subnet.name === "string" && subnet.name.trim().length > 0
          ? subnet.name.trim()
          : `LAN ${String.fromCharCode(65 + (index % 26))}`,
      hosts: Number.isFinite(Number(subnet.hosts)) ? Math.max(1, Math.floor(Number(subnet.hosts))) : 2,
    }))
    .slice(0, 20)
}

export function getAiPlanBase(parsedPlan: AiDesignedPlan): {
  baseNetwork: string
  baseCidr: string
} {
  const baseNetwork =
    typeof parsedPlan.baseNetwork === "string" && parsedPlan.baseNetwork.trim().length > 0
      ? parsedPlan.baseNetwork.trim()
      : "192.168.0.0"

  const baseCidr =
    typeof parsedPlan.baseCidr === "number" &&
    Number.isFinite(parsedPlan.baseCidr)
      ? String(parsedPlan.baseCidr)
      : "24"

  return { baseNetwork, baseCidr }
}
