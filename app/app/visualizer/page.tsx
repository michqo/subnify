"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, ZoomIn, ZoomOut } from "lucide-react"
import { motion, type Variants } from "framer-motion"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { calculateVlsm, totalAddressesFromCidr } from "@/lib/vlsm"

const pageVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut",
      staggerChildren: 0.06,
    },
  },
}

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: "easeOut" },
  },
}

interface Subnet {
  id: number
  name: string
  hosts: number
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
]

export default function VisualizerPage() {
  const [baseNetwork, setBaseNetwork] = useState("192.168.1.0")
  const [baseCidr, setBaseCidr] = useState("24")
  const [subnets, setSubnets] = useState<Subnet[]>([
    { id: 1, name: "LAN A", hosts: 50 },
    { id: 2, name: "LAN B", hosts: 25 },
    { id: 3, name: "LAN C", hosts: 10 },
    { id: 4, name: "LAN D", hosts: 10 },
  ])
  const [zoom, setZoom] = useState(1)
  const [selectedSubnet, setSelectedSubnet] = useState<number | null>(null)

  const addSubnet = () => {
    const newId = Math.max(...subnets.map((s) => s.id), 0) + 1
    const suffix = newId <= 26 ? String.fromCharCode(64 + newId) : `${newId}`
    setSubnets([...subnets, { id: newId, name: `LAN ${suffix}`, hosts: 10 }])
  }

  const removeSubnet = (id: number) => {
    if (subnets.length > 1) {
      setSubnets(subnets.filter((s) => s.id !== id))
    }
  }

  const updateSubnet = (id: number, field: "name" | "hosts", value: string) => {
    setSubnets(
      subnets.map((s) => (s.id === id ? { ...s, [field]: field === "hosts" ? parseInt(value) || 0 : value } : s))
    )
  }

  const results = useMemo(() => {
    return calculateVlsm(baseNetwork, subnets)
  }, [subnets, baseNetwork])

  const totalAddresses = totalAddressesFromCidr(baseCidr)
  const allocatedAddresses = results.reduce((acc, r) => acc + r.blockSize, 0)
  const utilizationPercent = ((allocatedAddresses / totalAddresses) * 100).toFixed(1)

  return (
    <motion.div
      className="flex-1 overflow-auto p-4 lg:p-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Configuration Panel */}
            <motion.div variants={sectionVariants} className="lg:col-span-1">
              <Card className="border-border h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="visualizer-base-network">Base Network</FieldLabel>
                    <div className="flex gap-2">
                      <Input
                        id="visualizer-base-network"
                        value={baseNetwork}
                        onChange={(e) => setBaseNetwork(e.target.value)}
                        className="h-9 border-border bg-secondary/50 font-mono"
                      />
                      <Input
                        id="visualizer-base-cidr"
                        value={baseCidr}
                        onChange={(e) => setBaseCidr(e.target.value)}
                        className="h-9 w-14 border-border bg-secondary/50 font-mono"
                      />
                    </div>
                    <FieldDescription>Network address and CIDR prefix.</FieldDescription>
                  </Field>

                  <Field>
                    <div className="flex items-center justify-between">
                      <FieldLabel>Subnets</FieldLabel>
                      <Button type="button" variant="ghost" size="sm" onClick={addSubnet} className="h-7 gap-1 px-2 text-xs">
                        <Plus className="h-3 w-3" />
                        Add
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {subnets.map((subnet, index) => (
                        <motion.div
                          key={subnet.id}
                          layout
                          initial={{ opacity: 0, y: 3 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.12, ease: "easeOut" }}
                          className={`flex items-center gap-2 rounded-lg border p-2 transition-colors ${
                            selectedSubnet === subnet.id
                              ? "border-primary bg-primary/10"
                              : "border-border bg-secondary/30 hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedSubnet(subnet.id === selectedSubnet ? null : subnet.id)}
                        >
                          <div className={`h-3 w-3 shrink-0 rounded-full ${COLORS[index % COLORS.length].dot}`} />
                          <Input
                            value={subnet.name}
                            onChange={(e) => {
                              e.stopPropagation()
                              updateSubnet(subnet.id, "name", e.target.value)
                            }}
                            className="h-7 flex-1 border-transparent bg-transparent px-1 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Input
                            type="number"
                            value={subnet.hosts}
                            onChange={(e) => {
                              e.stopPropagation()
                              updateSubnet(subnet.id, "hosts", e.target.value)
                            }}
                            className="h-7 w-16 border-transparent bg-transparent px-1 text-right font-mono text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeSubnet(subnet.id)
                            }}
                            disabled={subnets.length === 1}
                            className="h-6 w-6 shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                    <FieldDescription>Define subnet labels and required host counts.</FieldDescription>
                  </Field>
                </FieldGroup>

                {/* Stats */}
                <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Addresses</span>
                    <span className="font-mono font-medium">{totalAddresses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Allocated</span>
                    <span className="font-mono font-medium text-primary">{allocatedAddresses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Utilization</span>
                    <span className="font-mono font-medium">{utilizationPercent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary transition-all" style={{ width: `${utilizationPercent}%` }} />
                  </div>
                </div>
              </CardContent>
              </Card>
            </motion.div>

            {/* Visualization Panel */}
            <motion.div variants={sectionVariants} className="lg:col-span-2">
              <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-base">Address Space Visualization</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center text-sm text-muted-foreground">{(zoom * 100).toFixed(0)}%</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Linear Bar Visualization */}
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
                      return (
                        <div
                          key={index}
                          className={`absolute top-0 h-full cursor-pointer border-r transition-all ${COLORS[index % COLORS.length].barBg} ${COLORS[index % COLORS.length].border} ${
                            selectedSubnet === subnets.find((s) => s.name === result.name)?.id
                              ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                              : ""
                          }`}
                          style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                          onClick={() => {
                            const subnet = subnets.find((s) => s.name === result.name)
                            if (subnet) setSelectedSubnet(subnet.id === selectedSubnet ? null : subnet.id)
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

                {/* Subnet Hierarchy */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Subnet Hierarchy</p>
                  <div className="rounded-lg border border-border bg-secondary/20 p-4">
                    {/* Root */}
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

                    {/* Children */}
                    <div className="ml-6 mt-2 space-y-2 border-l border-border pl-6">
                      {results.map((result, index) => {
                        const subnet = subnets.find((s) => s.name === result.name)
                        const isSelected = selectedSubnet === subnet?.id
                        return (
                          <div
                            key={index}
                            className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-all ${
                              isSelected
                                ? `${COLORS[index % COLORS.length].border} ring-2 ring-primary`
                                : `${COLORS[index % COLORS.length].border} ${COLORS[index % COLORS.length].cardBg} hover:ring-1 hover:ring-primary/50`
                            }`}
                            onClick={() => {
                              if (subnet) setSelectedSubnet(subnet.id === selectedSubnet ? null : subnet.id)
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

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-4 rounded-lg bg-secondary/30 p-4">
                  {results.map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.1, ease: "easeOut", delay: index * 0.015 }}
                      className="flex items-center gap-2"
                    >
                      <div className={`h-3 w-3 rounded-full ${COLORS[index % COLORS.length].dot}`} />
                      <span className="text-sm">{result.name}</span>
                    </motion.div>
                  ))}
                  {allocatedAddresses < totalAddresses && (
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-muted" />
                      <span className="text-sm">Unallocated</span>
                    </div>
                  )}
                </div>
              </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
    </motion.div>
  )
}
