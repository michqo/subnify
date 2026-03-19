"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, ZoomIn, ZoomOut } from "lucide-react"
import { motion, type Variants } from "framer-motion"

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

interface CalculatedSubnet {
  name: string
  networkAddress: string
  cidr: number
  usableHosts: number
  startOffset: number
  blockSize: number
  color: string
}

const COLORS = [
  { bg: "bg-chart-1/40", border: "border-chart-1", dot: "bg-chart-1" },
  { bg: "bg-chart-2/40", border: "border-chart-2", dot: "bg-chart-2" },
  { bg: "bg-chart-3/40", border: "border-chart-3", dot: "bg-chart-3" },
  { bg: "bg-chart-4/40", border: "border-chart-4", dot: "bg-chart-4" },
  { bg: "bg-chart-5/40", border: "border-chart-5", dot: "bg-chart-5" },
  { bg: "bg-primary/40", border: "border-primary", dot: "bg-primary" },
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
    setSubnets([...subnets, { id: newId, name: `Subnet ${newId}`, hosts: 10 }])
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
    const sortedSubnets = [...subnets].sort((a, b) => b.hosts - a.hosts)
    const calculatedResults: CalculatedSubnet[] = []

    const baseOctets = baseNetwork.split(".").map(Number)
    const baseIp = (baseOctets[0] << 24) | (baseOctets[1] << 16) | (baseOctets[2] << 8) | baseOctets[3]
    let currentIp = baseIp

    sortedSubnets.forEach((subnet, index) => {
      const hostsNeeded = subnet.hosts + 2
      const hostBits = Math.ceil(Math.log2(hostsNeeded))
      const cidr = 32 - hostBits
      const blockSize = Math.pow(2, hostBits)

      const remainder = currentIp % blockSize
      if (remainder !== 0) {
        currentIp += blockSize - remainder
      }

      const networkAddress = [
        (currentIp >> 24) & 255,
        (currentIp >> 16) & 255,
        (currentIp >> 8) & 255,
        currentIp & 255,
      ].join(".")

      calculatedResults.push({
        name: subnet.name,
        networkAddress,
        cidr,
        usableHosts: blockSize - 2,
        startOffset: currentIp - baseIp,
        blockSize,
        color: COLORS[index % COLORS.length].bg,
      })

      currentIp += blockSize
    })

    return calculatedResults
  }, [subnets, baseNetwork])

  const totalAddresses = Math.pow(2, 32 - parseInt(baseCidr))
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
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Base Network
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={baseNetwork}
                      onChange={(e) => setBaseNetwork(e.target.value)}
                      className="h-9 border-border bg-secondary/50 font-mono"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">/</span>
                      <Input
                        value={baseCidr}
                        onChange={(e) => setBaseCidr(e.target.value)}
                        className="h-9 w-14 border-border bg-secondary/50 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Subnets
                    </label>
                    <Button variant="ghost" size="sm" onClick={addSubnet} className="h-7 gap-1 px-2 text-xs">
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
                </div>

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
                    className="relative h-16 overflow-hidden rounded-lg border border-border bg-secondary/30"
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
                          className={`absolute top-0 h-full cursor-pointer border-r transition-all ${COLORS[index % COLORS.length].bg} ${COLORS[index % COLORS.length].border} ${
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
                          {widthPercent > 8 && (
                            <div className="flex h-full flex-col items-center justify-center p-1">
                              <span className="truncate text-xs font-medium">{result.name}</span>
                              <span className="text-xs text-muted-foreground">/{result.cidr}</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {allocatedAddresses < totalAddresses && (
                      <div
                        className="absolute top-0 flex h-full items-center justify-center bg-muted/20"
                        style={{
                          left: `${(allocatedAddresses / totalAddresses) * 100}%`,
                          width: `${((totalAddresses - allocatedAddresses) / totalAddresses) * 100}%`,
                        }}
                      >
                        <span className="text-xs text-muted-foreground">Unallocated</span>
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
                                : `${COLORS[index % COLORS.length].border} ${COLORS[index % COLORS.length].bg} hover:ring-1 hover:ring-primary/50`
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
