export type DesignerSubnet = {
  name: string
  hosts: number
  purpose?: string
}

export type DesignerPlan = {
  baseNetwork: string | null
  baseCidr: number | null
  title: string
  rationale: string
  subnets: DesignerSubnet[]
}

export type QuotaSnapshot = {
  limit: number
  used: number
  remaining: number
  windowHours: number
}

export function formatWaitTime(seconds: number): string {
  if (seconds < 120) {
    return `${seconds}s`
  }

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}
