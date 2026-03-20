"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Plus, Trash2, Calculator } from "lucide-react"
import { motion } from "framer-motion"
import { itemVariants, sectionVariants } from "./motion"

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
}

export function CalculatorPreview() {
  const [baseNetwork, setBaseNetwork] = useState("192.168.1.0")
  const [baseCidr, setBaseCidr] = useState("24")
  const [subnets, setSubnets] = useState<Subnet[]>([
    { id: 1, name: "LAN A", hosts: 50 },
    { id: 2, name: "LAN B", hosts: 25 },
    { id: 3, name: "LAN C", hosts: 10 },
  ])
  const [results, setResults] = useState<CalculatedSubnet[]>([])

  const addSubnet = () => {
    const newId = Math.max(...subnets.map((s) => s.id), 0) + 1
    setSubnets([...subnets, { id: newId, name: `LAN ${String.fromCharCode(64 + newId)}`, hosts: 10 }])
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
    // Sort subnets by hosts required (descending)
    const sortedSubnets = [...subnets].sort((a, b) => b.hosts - a.hosts)
    const calculatedResults: CalculatedSubnet[] = []

    // Parse base network
    const baseOctets = baseNetwork.split(".").map(Number)
    let currentIp = (baseOctets[0] << 24) | (baseOctets[1] << 16) | (baseOctets[2] << 8) | baseOctets[3]

    for (const subnet of sortedSubnets) {
      // Calculate required bits for hosts
      const hostsNeeded = subnet.hosts + 2 // +2 for network and broadcast
      const hostBits = Math.ceil(Math.log2(hostsNeeded))
      const cidr = 32 - hostBits
      const blockSize = Math.pow(2, hostBits)

      // Align to block boundary
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

      // Calculate subnet mask
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
      })

      currentIp += blockSize
    }

    setResults(calculatedResults)
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

  return (
    <motion.section
      id="calculator"
      className="border-t border-border py-24 sm:py-32"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={itemVariants} className="mx-auto max-w-2xl text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">Calculator</h2>
          <p className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Build an allocation plan
          </p>
          <p className="mt-4 text-pretty text-muted-foreground">
            Input a base CIDR block and required hosts per subnet.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="mx-auto mt-16 grid max-w-6xl gap-8 lg:grid-cols-2">
          {/* Input Section */}
          <motion.div variants={itemVariants}>
            <Card className="border-border">
            <CardHeader>
              <CardTitle>Network Configuration</CardTitle>
              <CardDescription>Base network and per-subnet host requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault()
                  calculateVLSM()
                }}
                onReset={(e) => {
                  e.preventDefault()
                  resetForm()
                }}
              >
                <FieldGroup>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="preview-base-network">Base Network</FieldLabel>
                      <Input
                        id="preview-base-network"
                        value={baseNetwork}
                        onChange={(e) => setBaseNetwork(e.target.value)}
                        placeholder="192.168.1.0"
                      />
                      <FieldDescription>IPv4 network address.</FieldDescription>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="preview-base-cidr">CIDR</FieldLabel>
                      <Input
                        id="preview-base-cidr"
                        value={baseCidr}
                        onChange={(e) => setBaseCidr(e.target.value)}
                        placeholder="24"
                        className="w-20"
                      />
                      <FieldDescription>Prefix length (0-32).</FieldDescription>
                    </Field>
                  </div>

                  <Field>
                    <div className="flex items-center justify-between">
                      <FieldLabel>Subnets</FieldLabel>
                      <Button type="button" variant="outline" size="sm" onClick={addSubnet} className="gap-1">
                        <Plus className="h-3 w-3" />
                        Add
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {subnets.map((subnet) => (
                        <div key={subnet.id} className="flex items-center gap-2">
                          <Input
                            value={subnet.name}
                            onChange={(e) => updateSubnet(subnet.id, "name", e.target.value)}
                            placeholder="Subnet name"
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={subnet.hosts}
                            onChange={(e) => updateSubnet(subnet.id, "hosts", e.target.value)}
                            placeholder="Hosts"
                            className="w-24"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSubnet(subnet.id)}
                            disabled={subnets.length === 1}
                            className="shrink-0"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <FieldDescription>Each row defines one subnet and required hosts.</FieldDescription>
                  </Field>

                  <Field orientation="horizontal" className="justify-end">
                    <Button type="reset" variant="outline">
                      Reset
                    </Button>
                    <Button type="submit" className="gap-2">
                      <Calculator className="h-4 w-4" />
                      Calculate VLSM
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
            </Card>
          </motion.div>

          {/* Results Section */}
          <motion.div variants={itemVariants}>
            <Card className="border-border">
            <CardHeader>
              <CardTitle>Calculation Results</CardTitle>
              <CardDescription>Generated network, mask, range, and usable host data</CardDescription>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
                  <p className="text-sm text-muted-foreground">Execute a calculation to populate this table</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1], delay: index * 0.04 }}
                      className="rounded-lg border border-border bg-secondary/30 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="font-medium">{result.name}</span>
                        <Badge variant="secondary">/{result.cidr}</Badge>
                      </div>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Network:</span>
                          <code className="font-mono text-primary">{result.networkAddress}</code>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mask:</span>
                          <code className="font-mono">{result.subnetMask}</code>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Host Range:</span>
                          <code className="font-mono text-xs">
                            {result.firstHost} - {result.lastHost}
                          </code>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Usable Hosts:</span>
                          <span className="font-semibold text-primary">{result.usableHosts}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  )
}
