"use client"

import { Check, Copy, Download } from "lucide-react"
import { toast } from "sonner"

import { AllocationMap } from "@/components/app/allocation-map"
import { SubnetHierarchy } from "@/components/app/subnet-hierarchy"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { PlanView } from "@/lib/plan-view"
import type { SubnetInput } from "@/lib/state/subnet-plan-types"
import type { VlsmAllocation } from "@/lib/vlsm"
import { cn } from "@/lib/utils"

type CalculatorResultsSectionProps = {
  results: VlsmAllocation[]
  activeView: PlanView
  onViewChange: (value: string) => void
  copied: boolean
  exporting: boolean
  onCopyResults: () => void
  onExportPdf: () => void
  selectedSubnet: number | null
  onToggleSubnet: (subnetId: number) => void
  subnets: SubnetInput[]
  baseNetwork: string
  baseCidr: string
  totalAddresses: number
  allocatedAddresses: number
  totalRequired: number
  totalUsable: number
}

function subnetIdFor(result: VlsmAllocation, index: number, subnets: SubnetInput[]): number {
  return subnets.find((subnet) => subnet.name === result.name)?.id ?? index + 1
}

function CopyAddressButton({ address, className }: { address: string; className?: string }) {
  return (
    <button
      type="button"
      className={cn("font-mono text-xs hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
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
  results,
  activeView,
  onViewChange,
  copied,
  exporting,
  onCopyResults,
  onExportPdf,
  selectedSubnet,
  onToggleSubnet,
  subnets,
  baseNetwork,
  baseCidr,
  totalAddresses,
}: CalculatorResultsSectionProps) {
  return (
    <div className="rounded-md border border-border bg-card/80">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div>
          <h2 className="font-mono text-sm font-semibold">Committed results</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{results.length} subnets · {baseNetwork}/{baseCidr}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCopyResults} disabled={results.length === 0}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="outline" size="sm" onClick={onExportPdf} disabled={exporting || results.length === 0}>
            <Download className="size-4" /> {exporting ? "Exporting" : "PDF"}
          </Button>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={onViewChange} className="p-4 sm:p-5">
        <TabsList variant="line" className="mb-5">
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="visualizer">Allocation map</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-0">
          {results.length === 0 ? (
            <p className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Run a valid calculation to commit results.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-sm">
                <thead><tr className="border-b border-border text-left font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="sticky left-0 z-10 bg-card pb-3 pr-4">Subnet</th><th className="pb-3 pr-4">Network</th><th className="pb-3 pr-4">CIDR</th><th className="pb-3 pr-4">Mask</th><th className="pb-3 pr-4">Usable range</th><th className="pb-3 pr-4">Broadcast</th><th className="pb-3 text-right">Hosts</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {results.map((result, index) => {
                    const subnetId = subnetIdFor(result, index, subnets)
                    const selected = selectedSubnet === subnetId
                    return (
                      <tr key={`${result.name}-${result.startOffset}`} aria-selected={selected} className={cn("transition-colors", selected && "bg-accent/70")}>
                        <td className="sticky left-0 z-10 bg-card py-3 pr-4 font-medium"><button type="button" className="text-left hover:text-primary" onClick={() => onToggleSubnet(subnetId)}>{result.name}</button></td>
                        <td className="py-3 pr-4"><CopyAddressButton address={result.networkAddress} className="text-primary" /></td>
                        <td className="py-3 pr-4 font-mono">/{result.cidr}</td>
                        <td className="py-3 pr-4"><CopyAddressButton address={result.subnetMask} /></td>
                        <td className="py-3 pr-4 font-mono text-xs">{result.firstHost} – {result.lastHost}</td>
                        <td className="py-3 pr-4"><CopyAddressButton address={result.broadcast} /></td>
                        <td className="py-3 text-right font-mono">{result.usableHosts}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="visualizer" className="mt-0">
          {results.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Calculate a plan to view allocation.</p> : (
            <AllocationMap results={results} totalAddresses={totalAddresses} selectedSubnet={selectedSubnet} onToggleSubnet={onToggleSubnet} subnets={subnets} />
          )}
        </TabsContent>

        <TabsContent value="hierarchy" className="mt-0">
          {results.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Calculate a plan to view hierarchy.</p> : (
            <SubnetHierarchy baseNetwork={baseNetwork} baseCidr={baseCidr} results={results} totalAddresses={totalAddresses} selectedSubnet={selectedSubnet} onToggleSubnet={onToggleSubnet} subnets={subnets} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
