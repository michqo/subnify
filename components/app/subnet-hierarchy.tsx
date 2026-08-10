"use client"

import type { SubnetInput } from "@/lib/state/subnet-plan-types"
import type { VlsmAllocation } from "@/lib/vlsm"
import { cn } from "@/lib/utils"

type SubnetHierarchyProps = {
  baseNetwork: string
  baseCidr: string
  results: VlsmAllocation[]
  totalAddresses: number
  selectedSubnet: number | null
  onToggleSubnet: (subnetId: number) => void
  subnets: SubnetInput[]
}

export function SubnetHierarchy({
  baseNetwork,
  baseCidr,
  results,
  totalAddresses,
  selectedSubnet,
  onToggleSubnet,
  subnets,
}: SubnetHierarchyProps) {
  const allocated = results.reduce((sum, result) => sum + result.blockSize, 0)

  return (
    <div className="rounded-sm border border-border p-4">
      <div className="border-l-2 border-primary pl-3">
        <p className="font-mono text-sm font-semibold">{baseNetwork}/{baseCidr}</p>
        <p className="text-xs text-muted-foreground">Parent · {totalAddresses.toLocaleString()} addresses</p>
      </div>
      <div className="ml-3 mt-4 space-y-2 border-l border-border pl-5">
        {results.map((result, index) => {
          const subnetId = subnets.find((subnet) => subnet.name === result.name)?.id ?? index + 1
          const selected = selectedSubnet === subnetId
          return (
            <button
              key={`${result.name}-${result.startOffset}`}
              type="button"
              aria-label={`${result.name} ${result.networkAddress}/${result.cidr}${selected ? " selected" : ""}`}
              aria-pressed={selected}
              onClick={() => onToggleSubnet(subnetId)}
              className={cn(
                "flex w-full items-center justify-between gap-4 rounded-sm border border-border bg-card px-3 py-2 text-left transition-colors duration-150 hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected && "border-primary bg-accent"
              )}
            >
              <span><span className="block text-sm font-medium">{result.name}</span><span className="font-mono text-xs text-muted-foreground">{result.networkAddress}/{result.cidr}</span></span>
              <span className="font-mono text-xs text-muted-foreground">{result.blockSize} addresses</span>
            </button>
          )
        })}
        {allocated < totalAddresses ? (
          <div className="rounded-sm border border-dashed border-border px-3 py-2 font-mono text-xs text-muted-foreground">
            Unallocated · {(totalAddresses - allocated).toLocaleString()} addresses
          </div>
        ) : null}
      </div>
    </div>
  )
}
