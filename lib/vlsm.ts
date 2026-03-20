export interface SubnetRequirement {
  id: number
  name: string
  hosts: number
}

export interface VlsmAllocation {
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

function ipToInt(ip: string): number {
  const octets = ip.split(".").map(Number)
  return (((octets[0] << 24) >>> 0) + ((octets[1] << 16) >>> 0) + ((octets[2] << 8) >>> 0) + (octets[3] >>> 0)) >>> 0
}

function intToIp(value: number): string {
  const unsigned = value >>> 0
  return [
    (unsigned >>> 24) & 255,
    (unsigned >>> 16) & 255,
    (unsigned >>> 8) & 255,
    unsigned & 255,
  ].join(".")
}

function subnetMaskFromCidr(cidr: number): string {
  const mask = (~(Math.pow(2, 32 - cidr) - 1)) >>> 0
  return intToIp(mask)
}

export function totalAddressesFromCidr(cidrInput: string | number): number {
  const cidr = Math.max(0, Math.min(32, Number(cidrInput) || 0))
  return Math.pow(2, 32 - cidr)
}

export function calculateVlsm(baseNetwork: string, subnets: SubnetRequirement[]): VlsmAllocation[] {
  const sortedSubnets = [...subnets].sort((left, right) => right.hosts - left.hosts)
  const allocations: VlsmAllocation[] = []

  const baseIp = ipToInt(baseNetwork)
  let currentIp = baseIp

  for (const subnet of sortedSubnets) {
    const hostsNeeded = subnet.hosts + 2
    const hostBits = Math.ceil(Math.log2(hostsNeeded))
    const cidr = 32 - hostBits
    const blockSize = Math.pow(2, hostBits)

    const remainder = currentIp % blockSize
    if (remainder !== 0) {
      currentIp += blockSize - remainder
    }

    const networkIp = currentIp
    const broadcastIp = currentIp + blockSize - 1
    const firstHostIp = networkIp + 1
    const lastHostIp = broadcastIp - 1

    allocations.push({
      name: subnet.name,
      requiredHosts: subnet.hosts,
      networkAddress: intToIp(networkIp),
      cidr,
      subnetMask: subnetMaskFromCidr(cidr),
      firstHost: intToIp(firstHostIp),
      lastHost: intToIp(lastHostIp),
      broadcast: intToIp(broadcastIp),
      usableHosts: blockSize - 2,
      startOffset: networkIp - baseIp,
      blockSize,
    })

    currentIp += blockSize
  }

  return allocations
}
