"use client"

import { motion } from "framer-motion"
import { Check, Copy, Download, ZoomIn, ZoomOut } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { PlanView } from "@/hooks/use-plan-view-state"
import type { SubnetInput } from "@/lib/state/subnet-plan-types"
import type { VlsmAllocation } from "@/lib/vlsm"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const onClickCopy = (address: string) => {
  navigator.clipboard.writeText(address)
  toast.success("Address copied to clipboard")
}

function AddressTableItem({
  className,
  address,
}: {
  className?: string
  address: string
}) {
  return (
    <td
      className={cn("cursor-pointer py-3 font-mono hover:underline", className)}
      onClick={() => onClickCopy(address)}
    >
      {address}
    </td>
  )
}

function AddressCardItem({
  className,
  label,
  address,
}: {
  className?: string
  label: string
  address: string
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}:</span>
      <code
        onClick={() => onClickCopy(address)}
        className={cn("cursor-pointer font-mono hover:underline", className)}
      >
        {address}
      </code>
    </div>
  )
}

type CalculatorResultsSectionProps = {
  results: VlsmAllocation[]
  activeView: PlanView
  onViewChange: (value: string) => void
  copied: boolean
  exporting: boolean
  onCopyResults: () => void
  onExportPdf: () => void
  zoom: number
  onZoomOut: () => void
  onZoomIn: () => void
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

const COLORS = [
  {
    barBg: "bg-chart-1/60 dark:bg-chart-1/40",
    cardBg: "bg-chart-1/25 dark:bg-chart-1/20",
    border: "border-chart-1",
    dot: "bg-chart-1",
  },
  {
    barBg: "bg-chart-2/60 dark:bg-chart-2/40",
    cardBg: "bg-chart-2/25 dark:bg-chart-2/20",
    border: "border-chart-2",
    dot: "bg-chart-2",
  },
  {
    barBg: "bg-chart-3/60 dark:bg-chart-3/40",
    cardBg: "bg-chart-3/25 dark:bg-chart-3/20",
    border: "border-chart-3",
    dot: "bg-chart-3",
  },
  {
    barBg: "bg-chart-4/60 dark:bg-chart-4/40",
    cardBg: "bg-chart-4/25 dark:bg-chart-4/20",
    border: "border-chart-4",
    dot: "bg-chart-4",
  },
  {
    barBg: "bg-chart-5/60 dark:bg-chart-5/40",
    cardBg: "bg-chart-5/25 dark:bg-chart-5/20",
    border: "border-chart-5",
    dot: "bg-chart-5",
  },
  {
    barBg: "bg-primary/60 dark:bg-primary/40",
    cardBg: "bg-primary/20 dark:bg-primary/15",
    border: "border-primary",
    dot: "bg-primary",
  },
] as const

export function CalculatorResultsSection({
  results,
  activeView,
  onViewChange,
  copied,
  exporting,
  onCopyResults,
  onExportPdf,
  zoom,
  onZoomOut,
  onZoomIn,
  selectedSubnet,
  onToggleSubnet,
  subnets,
  baseNetwork,
  baseCidr,
  totalAddresses,
  allocatedAddresses,
  totalRequired,
  totalUsable,
}: CalculatorResultsSectionProps) {
  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base">Calculation Results</CardTitle>
          <Badge variant="secondary">{results.length} subnets</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCopyResults} className="gap-1.5" disabled={results.length === 0}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onExportPdf} disabled={exporting || results.length === 0}>
            <Download className="h-3.5 w-3.5" />
            {exporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeView} onValueChange={onViewChange} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="cards">Card View</TabsTrigger>
            <TabsTrigger value="visualizer">Visualizer</TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="mt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left font-medium text-muted-foreground">Subnet</th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">Network</th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">CIDR</th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">Subnet Mask</th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">Host Range</th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">Broadcast</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">Usable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                        Run a calculation to populate the table.
                      </td>
                    </tr>
                  ) : (
                    results.map((result, index) => (
                      <tr key={index} className="group">
                        <td className="py-3 font-medium">{result.name}</td>
                        <AddressTableItem className="text-primary" address={result.networkAddress} />
                        <td className="py-3">
                          <Badge variant="outline">/{result.cidr}</Badge>
                        </td>
                        <AddressTableItem className="text-muted-foreground" address={result.subnetMask} />
                        <td className="py-3 font-mono text-xs">
                          <span onClick={() => onClickCopy(result.firstHost)} className="cursor-pointer hover:underline">
                            {result.firstHost}
                          </span> - <span onClick={() => onClickCopy(result.lastHost)} className="cursor-pointer hover:underline">
                            {result.lastHost}
                          </span>
                        </td>
                        <AddressTableItem className="text-muted-foreground" address={result.broadcast} />
                        <td className="py-3 text-right font-semibold text-primary">{result.usableHosts}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="cards" className="mt-0">
            {results.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-6 text-center text-sm text-muted-foreground">
                Run a calculation to view subnet cards.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.14, ease: "easeOut", delay: index * 0.02 }}
                    className="rounded-lg border border-border bg-secondary/30 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-medium">{result.name}</span>
                      <Badge variant="secondary">/{result.cidr}</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <AddressCardItem className="text-primary" label="Network" address={result.networkAddress} />
                      <AddressCardItem label="Subnet Mask" address={result.subnetMask} />
                      <AddressCardItem label="First Host" address={result.firstHost} />
                      <AddressCardItem label="Last Host" address={result.lastHost} />
                      <AddressCardItem label="Broadcast" address={result.broadcast} />
                    </div>
                    <div className="mt-3 flex justify-between border-t border-border pt-3">
                      <span className="text-muted-foreground">Usable Hosts:</span>
                      <span className="font-semibold text-primary">{result.usableHosts}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="visualizer" className="mt-0 space-y-6">
            {results.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-6 text-center text-sm text-muted-foreground">
                Run a calculation to open the visualizer view.
              </div>
            ) : null}
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={results.length === 0} onClick={onZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center text-sm text-muted-foreground">{(zoom * 100).toFixed(0)}%</span>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={results.length === 0} onClick={onZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Linear Address Space</p>
              <motion.div
                className="relative h-16 overflow-hidden rounded-lg border border-border bg-muted/50 dark:bg-secondary/30"
                style={{ minWidth: `${100 * zoom}%` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
              >
                {results.map((result, index) => {
                  const leftPercent = (result.startOffset / totalAddresses) * 100
                  const widthPercent = (result.blockSize / totalAddresses) * 100
                  const subnet = subnets.find((candidate) => candidate.name === result.name)
                  const subnetId = subnet?.id ?? null

                  return (
                    <div
                      key={index}
                      className={`absolute top-0 h-full cursor-pointer border-r transition-all ${COLORS[index % COLORS.length].barBg} ${COLORS[index % COLORS.length].border} ${
                        selectedSubnet === subnetId ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
                      }`}
                      style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                      onClick={() => {
                        if (subnetId) {
                          onToggleSubnet(subnetId)
                        }
                      }}
                    >
                      {widthPercent > 10 ? (
                        <div className="flex h-full flex-col items-center justify-center p-1">
                          <span className="truncate text-xs font-semibold text-white drop-shadow-sm">{result.name}</span>
                          <span className="text-[11px] text-white/95 drop-shadow-sm">/{result.cidr}</span>
                        </div>
                      ) : widthPercent > 3 ? (
                        <div className="flex h-full items-center justify-center p-1">
                          <span className="text-[10px] font-semibold text-white drop-shadow-sm">/{result.cidr}</span>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
                {allocatedAddresses < totalAddresses && (
                  <div
                    className="absolute top-0 flex h-full items-center justify-center bg-muted/65 dark:bg-muted/20"
                    style={{
                      left: `${(allocatedAddresses / totalAddresses) * 100}%`,
                      width: `${((totalAddresses - allocatedAddresses) / totalAddresses) * 100}%`,
                    }}
                  >
                    <span className="text-xs text-foreground/80">Unallocated</span>
                  </div>
                )}
              </motion.div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Subnet Hierarchy</p>
              <div className="rounded-lg border border-border bg-secondary/20 p-4">
                <div className="flex items-center gap-3 rounded-md border border-primary/50 bg-primary/10 p-3">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="font-mono text-sm font-medium">
                      {baseNetwork}/{baseCidr}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Root Network - {totalAddresses.toLocaleString()} total addresses
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    /{baseCidr}
                  </Badge>
                </div>

                <div className="ml-6 mt-2 space-y-2 border-l border-border pl-6">
                  {results.map((result, index) => {
                    const subnet = subnets.find((candidate) => candidate.name === result.name)
                    const subnetId = subnet?.id ?? null
                    const isSelected = selectedSubnet === subnetId

                    return (
                      <div
                        key={index}
                        className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-all ${
                          isSelected
                            ? `${COLORS[index % COLORS.length].border} ring-2 ring-primary`
                            : `${COLORS[index % COLORS.length].border} ${COLORS[index % COLORS.length].cardBg} hover:ring-1 hover:ring-primary/50`
                        }`}
                        onClick={() => {
                          if (subnetId) {
                            onToggleSubnet(subnetId)
                          }
                        }}
                      >
                        <div className={`h-3 w-3 rounded-full ${COLORS[index % COLORS.length].dot}`} />
                        <div className="flex-1">
                          <p className="font-mono text-sm font-medium">
                            {result.networkAddress}/{result.cidr}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {result.name} - {result.usableHosts} usable hosts
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          /{result.cidr}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {results.length > 0 ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-secondary/50 p-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Total Required</p>
                <p className="text-xl font-semibold">{totalRequired}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Allocated</p>
                <p className="text-xl font-semibold text-primary">{totalUsable}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Efficiency</p>
                <p className="text-xl font-semibold">
                  {totalUsable > 0 ? ((totalRequired / totalUsable) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
