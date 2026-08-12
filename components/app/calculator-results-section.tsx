"use client"

import { Check, Copy, Download } from "lucide-react"
import { toast } from "sonner"

import { AllocationMap } from "@/components/app/allocation-map"
import { SubnetHierarchy } from "@/components/app/subnet-hierarchy"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { PlanView } from "@/lib/plan-view"
import type { VlsmCalculationSuccess } from "@/lib/vlsm"
import { cn } from "@/lib/utils"

type CalculatorResultsSectionProps = {
  calculation: VlsmCalculationSuccess | null
  resultsAreStale: boolean
  activeView: PlanView
  onViewChange: (value: string) => void
  copied: boolean
  exporting: boolean
  onCopyResults: () => void
  onExportPdf: () => void
  selectedSubnet: number | null
  onToggleSubnet: (subnetId: number) => void
}

function CopyAddressButton({
  address,
  className,
}: {
  address: string
  className?: string
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center rounded-sm font-mono text-xs hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:min-h-0 md:min-w-0",
        className
      )}
      onClick={() => {
        void navigator.clipboard.writeText(address)
        toast.success("Address copied to clipboard")
      }}
      aria-label={`Copy ${address}`}
    >
      {address}
    </button>
  )
}

export function CalculatorResultsSection({
  calculation,
  resultsAreStale,
  activeView,
  onViewChange,
  copied,
  exporting,
  onCopyResults,
  onExportPdf,
  selectedSubnet,
  onToggleSubnet,
}: CalculatorResultsSectionProps) {
  const results = calculation?.allocations ?? []
  const outputsDisabled = calculation === null || resultsAreStale

  return (
    <div className="rounded-md border border-border bg-card/80">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div>
          <h2 className="font-mono text-sm font-semibold">Committed results</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {calculation === null
              ? "No committed calculation"
              : `${results.length} subnets · ${calculation.parent.networkAddress}/${calculation.parent.cidr}`}
          </p>
          {calculation !== null ? (
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {calculation.allocatedAddresses.toLocaleString()} allocated ·{" "}
              {calculation.remainingAddresses.toLocaleString()} addresses free
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="min-h-11 md:min-h-0"
            onClick={onCopyResults}
            disabled={outputsDisabled}
          >
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="min-h-11 md:min-h-0"
            onClick={onExportPdf}
            disabled={exporting || outputsDisabled}
          >
            <Download className="size-4" /> {exporting ? "Exporting" : "PDF"}
          </Button>
        </div>
      </div>

      <Tabs
        value={activeView}
        onValueChange={onViewChange}
        className="p-4 sm:p-5"
      >
        <TabsList variant="line" className="mb-5">
          <TabsTrigger value="table" className="min-h-11 md:min-h-0">
            Table
          </TabsTrigger>
          <TabsTrigger value="visualizer" className="min-h-11 md:min-h-0">
            Allocation map
          </TabsTrigger>
          <TabsTrigger value="hierarchy" className="min-h-11 md:min-h-0">
            Hierarchy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-0">
          {results.length === 0 ? (
            <p className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Run a valid calculation to commit results.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                    <th className="sticky left-0 z-10 bg-card pr-4 pb-3">
                      Subnet
                    </th>
                    <th className="pr-4 pb-3">Network</th>
                    <th className="pr-4 pb-3">CIDR</th>
                    <th className="pr-4 pb-3">Mask</th>
                    <th className="pr-4 pb-3">Usable range</th>
                    <th className="pr-4 pb-3">Broadcast</th>
                    <th className="pb-3 text-right">Hosts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.map((result) => {
                    const subnetId = result.requirementId
                    const selected = selectedSubnet === subnetId
                    return (
                      <tr
                        key={result.requirementId}
                        aria-selected={selected}
                        className={cn(
                          "transition-colors",
                          selected && "bg-accent/70"
                        )}
                      >
                        <td className="sticky left-0 z-10 bg-card py-3 pr-4 font-medium">
                          <button
                            type="button"
                            aria-pressed={selected}
                            className={cn(
                              "min-h-11 rounded-sm border border-transparent px-2 text-left hover:border-primary/60 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:min-h-0",
                              selected && "border-primary bg-accent"
                            )}
                            onClick={() => onToggleSubnet(subnetId)}
                          >
                            {result.name}
                          </button>
                        </td>
                        <td className="py-3 pr-4">
                          <CopyAddressButton
                            address={result.networkAddress}
                            className="text-primary"
                          />
                        </td>
                        <td className="py-3 pr-4 font-mono">/{result.cidr}</td>
                        <td className="py-3 pr-4">
                          <CopyAddressButton address={result.subnetMask} />
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs">
                          {result.firstHost} – {result.lastHost}
                        </td>
                        <td className="py-3 pr-4">
                          <CopyAddressButton address={result.broadcast} />
                        </td>
                        <td className="py-3 text-right font-mono">
                          {result.usableHosts}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="visualizer" className="mt-0">
          {calculation === null ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Calculate a plan to view allocation.
            </p>
          ) : (
            <AllocationMap
              calculation={calculation}
              selectedSubnet={selectedSubnet}
              onToggleSubnet={onToggleSubnet}
            />
          )}
        </TabsContent>

        <TabsContent value="hierarchy" className="mt-0">
          {calculation === null ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Calculate a plan to view hierarchy.
            </p>
          ) : (
            <SubnetHierarchy
              calculation={calculation}
              selectedSubnet={selectedSubnet}
              onToggleSubnet={onToggleSubnet}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
