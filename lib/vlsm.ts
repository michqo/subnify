export type VlsmPlanInput = {
  baseNetwork: string
  baseCidr: number
  subnets: Array<{ id: number; name: string; hosts: number }>
}

export type VlsmIssueCode =
  | "INVALID_BASE_NETWORK"
  | "INVALID_BASE_CIDR"
  | "NON_CANONICAL_BASE_NETWORK"
  | "INVALID_SUBNET_COUNT"
  | "INVALID_SUBNET_NAME"
  | "DUPLICATE_SUBNET_NAME"
  | "INVALID_HOST_COUNT"
  | "INSUFFICIENT_ADDRESS_SPACE"
  | "IPV4_OVERFLOW"

export type VlsmIssue = {
  code: VlsmIssueCode
  message: string
  field:
    | "baseNetwork"
    | "baseCidr"
    | `subnets.${number}.name`
    | `subnets.${number}.hosts`
    | "subnets"
  suggestion?: string
}

export type VlsmAllocation = {
  requirementId: number
  name: string
  requiredHosts: number
  networkAddress: string
  cidr: number
  subnetMask: string
  firstHost: string
  lastHost: string
  broadcast: string
  usableHosts: number
  startOffset: number
  blockSize: number
}

export type VlsmCalculationSuccess = {
  ok: true
  parent: {
    networkAddress: string
    broadcast: string
    cidr: number
    totalAddresses: number
  }
  allocations: VlsmAllocation[]
  allocatedAddresses: number
  remainingAddresses: number
}

export type VlsmCalculationResult =
  | VlsmCalculationSuccess
  | { ok: false; issues: VlsmIssue[] }

const IPV4_SIZE = 2 ** 32
const IPV4_MAX = IPV4_SIZE - 1

function parseIpv4(value: unknown): number | null {
  if (typeof value !== "string" || value.trim() !== value) return null
  const parts = value.split(".")
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part)))
    return null
  const octets = parts.map(Number)
  if (octets.some((octet) => octet < 0 || octet > 255)) return null
  return (
    octets[0] * 2 ** 24 + octets[1] * 2 ** 16 + octets[2] * 2 ** 8 + octets[3]
  )
}

function intToIpv4(value: number): string {
  return [
    Math.floor(value / 2 ** 24),
    Math.floor(value / 2 ** 16) % 256,
    Math.floor(value / 2 ** 8) % 256,
    value % 256,
  ].join(".")
}

function maskFromCidr(cidr: number): string {
  const size = 2 ** (32 - cidr)
  return intToIpv4(IPV4_SIZE - size)
}

export function calculateVlsm(input: VlsmPlanInput): VlsmCalculationResult {
  const candidate = input as Partial<VlsmPlanInput> | null | undefined
  const issues: VlsmIssue[] = []
  const baseIp = parseIpv4(candidate?.baseNetwork)
  const cidr =
    typeof candidate?.baseCidr === "number" ? candidate.baseCidr : Number.NaN
  if (baseIp === null) {
    issues.push({
      code: "INVALID_BASE_NETWORK",
      message: "Enter an IPv4 address using four decimal octets from 0 to 255.",
      field: "baseNetwork",
    })
  }
  if (!Number.isInteger(cidr) || cidr < 0 || cidr > 30) {
    issues.push({
      code: "INVALID_BASE_CIDR",
      message: "CIDR must be a whole number from 0 to 30.",
      field: "baseCidr",
    })
  }

  let parentSize = 0
  let parentNetwork = 0
  let parentBroadcast = 0
  if (baseIp !== null && Number.isInteger(cidr) && cidr >= 0 && cidr <= 30) {
    parentSize = 2 ** (32 - cidr)
    parentNetwork = Math.floor(baseIp / parentSize) * parentSize
    parentBroadcast = parentNetwork + parentSize - 1
    if (baseIp !== parentNetwork) {
      issues.push({
        code: "NON_CANONICAL_BASE_NETWORK",
        message: `${candidate?.baseNetwork} is not the network address for /${cidr}.`,
        field: "baseNetwork",
        suggestion: intToIpv4(parentNetwork),
      })
    }
  }

  if (
    !Array.isArray(candidate?.subnets) ||
    candidate.subnets.length < 1 ||
    candidate.subnets.length > 100
  ) {
    issues.push({
      code: "INVALID_SUBNET_COUNT",
      message: "Add between 1 and 100 subnet requirements.",
      field: "subnets",
    })
  }

  const seen = new Set<string>()
  const validRows: Array<{
    row: VlsmPlanInput["subnets"][number]
    index: number
    name: string
    blockSize: number
  }> = []
  for (const [index, row] of (Array.isArray(candidate?.subnets)
    ? candidate.subnets
    : []
  ).entries()) {
    const name = typeof row.name === "string" ? row.name.trim() : ""
    const nameKey = name.toLowerCase()
    if (!name || [...name].length > 80) {
      issues.push({
        code: "INVALID_SUBNET_NAME",
        message: "Subnet name must contain 1 to 80 characters.",
        field: `subnets.${index}.name`,
      })
    } else if (seen.has(nameKey)) {
      issues.push({
        code: "DUPLICATE_SUBNET_NAME",
        message:
          "Subnet names must be unique, ignoring case and surrounding spaces.",
        field: `subnets.${index}.name`,
      })
    } else {
      seen.add(nameKey)
    }
    if (
      !Number.isInteger(row.hosts) ||
      row.hosts < 1 ||
      row.hosts > 4_294_967_294
    ) {
      issues.push({
        code: "INVALID_HOST_COUNT",
        message:
          "Required hosts must be a whole number from 1 to 4,294,967,294.",
        field: `subnets.${index}.hosts`,
      })
    } else {
      validRows.push({
        row,
        index,
        name,
        blockSize: 2 ** Math.ceil(Math.log2(row.hosts + 2)),
      })
    }
  }
  if (issues.length > 0) return { ok: false, issues }

  const ordered = validRows.sort(
    (left, right) =>
      right.row.hosts - left.row.hosts || left.index - right.index
  )
  const allocations: VlsmAllocation[] = []
  let current = parentNetwork
  for (const item of ordered) {
    const network =
      current + ((item.blockSize - (current % item.blockSize)) % item.blockSize)
    const broadcast = network + item.blockSize - 1
    if (network > IPV4_MAX || broadcast > IPV4_MAX) {
      return {
        ok: false,
        issues: [
          {
            code: "IPV4_OVERFLOW",
            message: "An allocation would extend beyond 255.255.255.255.",
            field: "subnets",
          },
        ],
      }
    }
    if (network < parentNetwork || broadcast > parentBroadcast) {
      return {
        ok: false,
        issues: [
          {
            code: "INSUFFICIENT_ADDRESS_SPACE",
            message:
              "Subnet requirements do not fit inside the parent network.",
            field: "subnets",
          },
        ],
      }
    }
    const childCidr = 32 - Math.log2(item.blockSize)
    allocations.push({
      requirementId: item.row.id,
      name: item.name,
      requiredHosts: item.row.hosts,
      networkAddress: intToIpv4(network),
      cidr: childCidr,
      subnetMask: maskFromCidr(childCidr),
      firstHost: intToIpv4(network + 1),
      lastHost: intToIpv4(broadcast - 1),
      broadcast: intToIpv4(broadcast),
      usableHosts: item.blockSize - 2,
      startOffset: network - parentNetwork,
      blockSize: item.blockSize,
    })
    current = broadcast + 1
  }

  const allocatedAddresses = allocations.reduce(
    (sum, row) => sum + row.blockSize,
    0
  )
  return {
    ok: true,
    parent: {
      networkAddress: intToIpv4(parentNetwork),
      broadcast: intToIpv4(parentBroadcast),
      cidr,
      totalAddresses: parentSize,
    },
    allocations,
    allocatedAddresses,
    remainingAddresses: parentSize - allocatedAddresses,
  }
}
