import type { SubnetInput } from "@/lib/state/subnet-plan-types"
import { calculateVlsm, totalAddressesFromCidr, type VlsmAllocation } from "@/lib/vlsm"

export type DiagnosticSeverity = "error" | "warning" | "info"

export type PlanDiagnosticCode =
  | "invalid_ipv4"
  | "invalid_cidr"
  | "base_not_aligned"
  | "invalid_hosts"
  | "blank_name"
  | "duplicate_name"
  | "capacity_overflow"

export type PlanDiagnostic = {
  code: PlanDiagnosticCode
  severity: DiagnosticSeverity
  message: string
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

function parseIpv4(value: string): number | null {
  const segments = value.trim().split(".")
  if (segments.length !== 4) return null

  const octets = segments.map((segment) => {
    if (!/^\d{1,3}$/.test(segment)) return null
    const octet = Number(segment)
    return Number.isInteger(octet) && octet >= 0 && octet <= 255 ? octet : null
  })

  if (octets.some((octet) => octet === null)) return null

  return (
    (octets[0] as number) * 2 ** 24 +
    (octets[1] as number) * 2 ** 16 +
    (octets[2] as number) * 2 ** 8 +
    (octets[3] as number)
  )
}

function parseCidr(value: string): number | null {
  if (value.trim() === "") return null
  const cidr = Number(value)
  return Number.isInteger(cidr) && cidr >= 0 && cidr <= 32 ? cidr : null
}

export function diagnosePlan(input: DiagnosePlanInput): PlanDiagnostics {
  const issues: PlanDiagnostic[] = []
  const baseIp = parseIpv4(input.baseNetwork)
  const cidr = parseCidr(input.baseCidr)

  if (baseIp === null) {
    issues.push({ code: "invalid_ipv4", severity: "error", message: "Enter a valid IPv4 address." })
  }

  if (cidr === null) {
    issues.push({ code: "invalid_cidr", severity: "error", message: "CIDR must be a whole number from 0 to 32." })
  }

  if (baseIp !== null && cidr !== null) {
    const parentSize = 2 ** (32 - cidr)
    if (baseIp % parentSize !== 0) {
      issues.push({
        code: "base_not_aligned",
        severity: "error",
        message: `${input.baseNetwork} is not the network address for /${cidr}.`,
      })
    }
  }

  const seenNames = new Map<string, number>()
  for (const subnet of input.subnets) {
    if (!Number.isFinite(subnet.hosts) || !Number.isInteger(subnet.hosts) || subnet.hosts <= 0) {
      issues.push({
        code: "invalid_hosts",
        severity: "error",
        message: "Host requirement must be a positive whole number.",
        subnetId: subnet.id,
      })
    }

    const normalizedName = subnet.name.trim().toLocaleLowerCase()
    if (!normalizedName) {
      issues.push({
        code: "blank_name",
        severity: "warning",
        message: "Add a name so this subnet is recognizable in results.",
        subnetId: subnet.id,
      })
    } else if (seenNames.has(normalizedName)) {
      issues.push({
        code: "duplicate_name",
        severity: "warning",
        message: `“${subnet.name.trim()}” is used more than once.`,
        subnetId: subnet.id,
      })
    } else {
      seenNames.set(normalizedName, subnet.id)
    }
  }

  const hasBlockingInputIssue = issues.some((issue) => issue.severity === "error")
  const totalAddresses = cidr === null ? 0 : totalAddressesFromCidr(cidr)
  const allocations = hasBlockingInputIssue ? [] : calculateVlsm(input.baseNetwork, input.subnets)
  const allocatedAddresses = allocations.reduce((sum, allocation) => sum + allocation.blockSize, 0)
  const remainingAddresses = totalAddresses - allocatedAddresses

  if (allocations.some((allocation) => allocation.startOffset + allocation.blockSize > totalAddresses)) {
    issues.push({
      code: "capacity_overflow",
      severity: "error",
      message: `Requirements need ${allocatedAddresses.toLocaleString()} addresses, but the parent network has ${totalAddresses.toLocaleString()}.`,
    })
  }

  return {
    isValid: !issues.some((issue) => issue.severity === "error"),
    issues,
    allocations,
    totalAddresses,
    allocatedAddresses,
    remainingAddresses,
    utilizationPercent: totalAddresses > 0 ? Math.round((allocatedAddresses / totalAddresses) * 100) : 0,
  }
}

export function explainAllocation(allocation: VlsmAllocation): string {
  return `${allocation.requiredHosts} hosts plus network and broadcast require ${allocation.blockSize} addresses, so this subnet uses /${allocation.cidr}.`
}
