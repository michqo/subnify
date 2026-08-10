"use client"

import type { SubnetInput } from "@/lib/state/subnet-plan-types"
import type { VlsmAllocation } from "@/lib/vlsm"
import { cn } from "@/lib/utils"

type AllocationMapProps = {
  results: VlsmAllocation[]
  totalAddresses: number
  selectedSubnet: number | null
  onToggleSubnet: (subnetId: number) => void
  subnets: SubnetInput[]
}

export function AllocationMap({ results, totalAddresses, selectedSubnet, onToggleSubnet, subnets }: AllocationMapProps) {
  const allocated = results.reduce((sum, result) => sum + result.blockSize, 0)
  const free = Math.max(0, totalAddresses - allocated)

  return (
    <div className="space-y-4">
      <div className="relative h-24 overflow-hidden rounded-sm border border-border bg-muted/60" aria-label="Address allocation map">
        {results.map((result, index) => {
          const subnetId = subnets.find((subnet) => subnet.name === result.name)?.id ?? index + 1
          const selected = selectedSubnet === subnetId
          const left = totalAddresses > 0 ? (result.startOffset / totalAddresses) * 100 : 0
          const width = totalAddresses > 0 ? (result.blockSize / totalAddresses) * 100 : 0
          return (
            <button
              key={`${result.name}-${result.startOffset}`}
              type="button"
              aria-label={`${result.name} /${result.cidr}, ${result.blockSize} addresses`}
              aria-pressed={selected}
              onClick={() => onToggleSubnet(subnetId)}
              className={cn(
                "absolute inset-y-0 overflow-hidden border-r border-background/60 bg-primary/25 px-1 font-mono text-[10px] transition-[box-shadow,background-color] duration-150 hover:bg-primary/35 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                index % 2 === 1 && "bg-primary/40",
                selected && "z-10 bg-primary/55 shadow-[inset_0_0_0_2px_var(--primary)]"
              )}
              style={{ left: `${left}%`, width: `${Math.max(width, 0.5)}%` }}
            >
              {width >= 10 ? <span>{result.name}<br />/{result.cidr}</span> : null}
            </button>
          )
        })}
        {free > 0 ? (
          <div
            className="absolute inset-y-0 right-0 flex items-center justify-center bg-muted px-2 font-mono text-[10px] text-muted-foreground"
            style={{ width: `${(free / totalAddresses) * 100}%` }}
          >
            {free} addresses free
          </div>
        ) : null}
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        {allocated.toLocaleString()} allocated · {free.toLocaleString()} addresses free
      </p>
    </div>
  )
}
