import type { VlsmAllocation } from "@/lib/vlsm"

export type SubnetInput = {
  name: string
  hosts: number
}

export type CalculationRecord = {
  id: string
  title: string | null
  source_type: "manual" | "ai_design"
  ai_prompt: string | null
  ai_rationale: string | null
  base_network: string
  base_cidr: number
  input_subnets: SubnetInput[]
  result_subnets: VlsmAllocation[]
  total_required_hosts: number
  total_usable_hosts: number
  created_at: string
}

export type CalculationInsert = {
  title: string | null
  source_type?: "manual" | "ai_design"
  ai_prompt?: string | null
  ai_rationale?: string | null
  base_network: string
  base_cidr: number
  input_subnets: SubnetInput[]
  result_subnets: VlsmAllocation[]
  total_required_hosts: number
  total_usable_hosts: number
}

export function parseSubnetInputArray(value: unknown): SubnetInput[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (typeof item !== "object" || item === null) {
        return null
      }

      const candidate = item as { name?: unknown; hosts?: unknown }
      return {
        name: typeof candidate.name === "string" ? candidate.name : "LAN",
        hosts: typeof candidate.hosts === "number" ? candidate.hosts : Number(candidate.hosts) || 0,
      }
    })
    .filter((item): item is SubnetInput => item !== null)
}

export function parseVlsmAllocations(value: unknown): VlsmAllocation[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is VlsmAllocation => {
    if (typeof item !== "object" || item === null) {
      return false
    }

    const allocation = item as Partial<VlsmAllocation>
    return (
      typeof allocation.name === "string" &&
      typeof allocation.networkAddress === "string" &&
      typeof allocation.cidr === "number" &&
      typeof allocation.subnetMask === "string" &&
      typeof allocation.firstHost === "string" &&
      typeof allocation.lastHost === "string" &&
      typeof allocation.broadcast === "string" &&
      typeof allocation.usableHosts === "number" &&
      typeof allocation.requiredHosts === "number" &&
      typeof allocation.startOffset === "number" &&
      typeof allocation.blockSize === "number"
    )
  })
}
