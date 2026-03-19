"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Calculator, Download, Copy, Check, RefreshCw } from "lucide-react"

interface Subnet {
  id: number
  name: string
  hosts: number
}

interface CalculatedSubnet {
  name: string
  networkAddress: string
  cidr: number
  subnetMask: string
  firstHost: string
  lastHost: string
  broadcast: string
  usableHosts: number
  requiredHosts: number
}

export default function CalculatorPage() {
  const [baseNetwork, setBaseNetwork] = useState("192.168.1.0")
  const [baseCidr, setBaseCidr] = useState("24")
  const [subnets, setSubnets] = useState<Subnet[]>([
    { id: 1, name: "LAN A", hosts: 50 },
    { id: 2, name: "LAN B", hosts: 25 },
    { id: 3, name: "LAN C", hosts: 10 },
  ])
  const [results, setResults] = useState<CalculatedSubnet[]>([])
  const [copied, setCopied] = useState(false)

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

  const calculateVLSM = () => {
    const sortedSubnets = [...subnets].sort((a, b) => b.hosts - a.hosts)
    const calculatedResults: CalculatedSubnet[] = []

    const baseOctets = baseNetwork.split(".").map(Number)
    let currentIp = (baseOctets[0] << 24) | (baseOctets[1] << 16) | (baseOctets[2] << 8) | baseOctets[3]

    for (const subnet of sortedSubnets) {
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

      const broadcastIp = currentIp + blockSize - 1
      const broadcast = [
        (broadcastIp >> 24) & 255,
        (broadcastIp >> 16) & 255,
        (broadcastIp >> 8) & 255,
        broadcastIp & 255,
      ].join(".")

      const firstHostIp = currentIp + 1
      const firstHost = [
        (firstHostIp >> 24) & 255,
        (firstHostIp >> 16) & 255,
        (firstHostIp >> 8) & 255,
        firstHostIp & 255,
      ].join(".")

      const lastHostIp = broadcastIp - 1
      const lastHost = [
        (lastHostIp >> 24) & 255,
        (lastHostIp >> 16) & 255,
        (lastHostIp >> 8) & 255,
        lastHostIp & 255,
      ].join(".")

      const mask = ~(Math.pow(2, 32 - cidr) - 1) >>> 0
      const subnetMask = [(mask >> 24) & 255, (mask >> 16) & 255, (mask >> 8) & 255, mask & 255].join(".")

      calculatedResults.push({
        name: subnet.name,
        networkAddress,
        cidr,
        subnetMask,
        firstHost,
        lastHost,
        broadcast,
        usableHosts: blockSize - 2,
        requiredHosts: subnet.hosts,
      })

      currentIp += blockSize
    }

    setResults(calculatedResults)
  }

  const copyResults = () => {
    const text = results
      .map(
        (r) =>
          `${r.name}: ${r.networkAddress}/${r.cidr} (Mask: ${r.subnetMask}, Range: ${r.firstHost} - ${r.lastHost})`
      )
      .join("\n")
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const resetForm = () => {
    setBaseNetwork("192.168.1.0")
    setBaseCidr("24")
    setSubnets([
      { id: 1, name: "LAN A", hosts: 50 },
      { id: 2, name: "LAN B", hosts: 25 },
      { id: 3, name: "LAN C", hosts: 10 },
    ])
    setResults([])
  }

  const totalUsable = results.reduce((acc, r) => acc + r.usableHosts, 0)
  const totalRequired = results.reduce((acc, r) => acc + r.requiredHosts, 0)

  return (
    <>
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Input Section */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base">Network Configuration</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm} className="gap-1.5 text-muted-foreground">
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Base Network */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <label className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    Base Network
                  </label>
                  <Input
                    value={baseNetwork}
                    onChange={(e) => setBaseNetwork(e.target.value)}
                    placeholder="192.168.1.0"
                    className="h-11 border-border bg-secondary/50 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium uppercase tracking-wider text-muted-foreground">CIDR</label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">/</span>
                    <Input
                      value={baseCidr}
                      onChange={(e) => setBaseCidr(e.target.value)}
                      placeholder="24"
                      className="h-11 w-20 border-border bg-secondary/50 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Subnets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    Subnet Requirements
                  </label>
                  <Button variant="outline" size="sm" onClick={addSubnet} className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Add Subnet
                  </Button>
                </div>

                <div className="space-y-2">
                  {subnets.map((subnet, index) => (
                    <div
                      key={subnet.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/20 text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                      <Input
                        value={subnet.name}
                        onChange={(e) => updateSubnet(subnet.id, "name", e.target.value)}
                        placeholder="Subnet name"
                        className="h-9 flex-1 border-border bg-card"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={subnet.hosts}
                          onChange={(e) => updateSubnet(subnet.id, "hosts", e.target.value)}
                          placeholder="Hosts"
                          className="h-9 w-24 border-border bg-card font-mono"
                        />
                        <span className="text-sm text-muted-foreground">hosts</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSubnet(subnet.id)}
                        disabled={subnets.length === 1}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={calculateVLSM} className="h-11 w-full gap-2 sm:w-auto">
                <Calculator className="h-4 w-4" />
                Calculate VLSM
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          {results.length > 0 && (
            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">Calculation Results</CardTitle>
                  <Badge variant="secondary">{results.length} subnets</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={copyResults} className="gap-1.5">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="table" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="table">Table View</TabsTrigger>
                    <TabsTrigger value="cards">Card View</TabsTrigger>
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
                          {results.map((result, index) => (
                            <tr key={index} className="group">
                              <td className="py-3 font-medium">{result.name}</td>
                              <td className="py-3 font-mono text-primary">{result.networkAddress}</td>
                              <td className="py-3">
                                <Badge variant="outline">/{result.cidr}</Badge>
                              </td>
                              <td className="py-3 font-mono text-muted-foreground">{result.subnetMask}</td>
                              <td className="py-3 font-mono text-xs">
                                {result.firstHost} - {result.lastHost}
                              </td>
                              <td className="py-3 font-mono text-muted-foreground">{result.broadcast}</td>
                              <td className="py-3 text-right font-semibold text-primary">{result.usableHosts}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>

                  <TabsContent value="cards" className="mt-0">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {results.map((result, index) => (
                        <div key={index} className="rounded-lg border border-border bg-secondary/30 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="font-medium">{result.name}</span>
                            <Badge variant="secondary">/{result.cidr}</Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Network:</span>
                              <code className="font-mono text-primary">{result.networkAddress}</code>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Mask:</span>
                              <code className="font-mono">{result.subnetMask}</code>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">First Host:</span>
                              <code className="font-mono">{result.firstHost}</code>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Last Host:</span>
                              <code className="font-mono">{result.lastHost}</code>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Broadcast:</span>
                              <code className="font-mono">{result.broadcast}</code>
                            </div>
                            <div className="mt-3 flex justify-between border-t border-border pt-3">
                              <span className="text-muted-foreground">Usable Hosts:</span>
                              <span className="font-semibold text-primary">{result.usableHosts}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Summary */}
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
