import type { SubnetInput } from "@/lib/state/subnet-plan-types"
import { calculateVlsm, type VlsmAllocation, type VlsmIssue } from "@/lib/vlsm"

export type PlanDiagnostic = VlsmIssue & {
  severity?: "error" | "warning" | "info"
  subnetId?: number
}

export type DiagnosePlanInput = {
  baseNetwork: string
  baseCidr: string
  subnets: SubnetInput[]
}

export type PlanDiagnostics = {
  isValid: boolean
  issues: PlanDiagnostic[]
  allocations: VlsmAllocation[]
  totalAddresses: number
  allocatedAddresses: number
  remainingAddresses: number
  utilizationPercent: number
}

export function diagnosePlan(input: DiagnosePlanInput): PlanDiagnostics {
  const calculation = calculateVlsm({
    baseNetwork: input.baseNetwork,
    baseCidr: input.baseCidr.trim() === "" ? Number.NaN : Number(input.baseCidr),
    subnets: input.subnets,
  })

  if (!calculation.ok) {
    return {
      isValid: false,
      issues: calculation.issues,
      allocations: [],
      totalAddresses: 0,
      allocatedAddresses: 0,
      remainingAddresses: 0,
      utilizationPercent: 0,
    }
  }

  return {
    isValid: true,
    issues: [],
    allocations: calculation.allocations,
    totalAddresses: calculation.parent.totalAddresses,
    allocatedAddresses: calculation.allocatedAddresses,
    remainingAddresses: calculation.remainingAddresses,
    utilizationPercent: Math.round(
      (calculation.allocatedAddresses / calculation.parent.totalAddresses) * 100
    ),
  }
}

export function explainAllocation(allocation: VlsmAllocation): string {
  return `${allocation.requiredHosts} hosts plus network and broadcast require ${allocation.blockSize} addresses, so this subnet uses /${allocation.cidr}.`
}
