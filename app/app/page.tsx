"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Calculator, Download, Copy, Check } from "lucide-react"
import { AnimatePresence, motion, type Variants } from "framer-motion"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useRouter, useSearchParams } from "next/navigation"

import { calculateVlsm, totalAddressesFromCidr, type VlsmAllocation } from "@/lib/vlsm"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/core/auth-provider"
import { parseSubnetInputArray, parseVlsmAllocations, type CalculationInsert } from "@/lib/history"

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

type CalculatedSubnet = VlsmAllocation

export default function CalculatorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const { isAuthenticated, isAuthLoading, user } = useAuth()

  const [baseNetwork, setBaseNetwork] = useState("192.168.1.0")
  const [baseCidr, setBaseCidr] = useState("24")
  const [subnets, setSubnets] = useState<Subnet[]>([
    { id: 1, name: "LAN A", hosts: 50 },
    { id: 2, name: "LAN B", hosts: 25 },
    { id: 3, name: "LAN C", hosts: 10 },
  ])
  const [results, setResults] = useState<CalculatedSubnet[]>([])
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

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

  const saveCalculation = async (calculatedResults: CalculatedSubnet[]) => {
    if (isAuthLoading) {
      return
    }

    if (!isAuthenticated || !user) {
      return
    }

    const totalRequiredHosts = calculatedResults.reduce((sum, subnet) => sum + subnet.requiredHosts, 0)
    const totalUsableHosts = calculatedResults.reduce((sum, subnet) => sum + subnet.usableHosts, 0)
    const payload: CalculationInsert = {
      title: `${baseNetwork}/${baseCidr} (${subnets.length} subnets)`,
      base_network: baseNetwork,
      base_cidr: Number(baseCidr) || 0,
      input_subnets: subnets.map(({ name, hosts }) => ({ name, hosts })),
      result_subnets: calculatedResults,
      total_required_hosts: totalRequiredHosts,
      total_usable_hosts: totalUsableHosts,
    }

    const { error } = await supabase.from("calculations").insert({
      ...payload,
      user_id: user.id,
    })

    if (error) {
      setSaveError(`Save failed: ${error.message}`)
      setSaveMessage(null)
      return
    }

    setSaveError(null)
    setSaveMessage("Calculation saved to history.")
  }

  const calculateVLSM = () => {
    setSaveMessage(null)
    setSaveError(null)
    const calculatedResults = calculateVlsm(baseNetwork, subnets)
    setResults(calculatedResults)
    void saveCalculation(calculatedResults)
  }

  useEffect(() => {
    const historyId = searchParams.get("history")
    if (!historyId || !isAuthenticated) {
      return
    }

    let ignore = false
    const restoreFromHistory = async () => {
      const { data, error } = await supabase
        .from("calculations")
        .select("base_network,base_cidr,input_subnets,result_subnets")
        .eq("id", historyId)
        .single()

      if (ignore) {
        return
      }

      if (error || !data) {
        setRestoreMessage("Could not restore that history item.")
        return
      }

      const inputSubnets = parseSubnetInputArray(data.input_subnets)
      const restoredSubnets = inputSubnets.map((subnet, index) => ({
        id: index + 1,
        name: subnet.name ?? `LAN ${String.fromCharCode(65 + (index % 26))}`,
        hosts: subnet.hosts,
      }))

      setBaseNetwork(String(data.base_network ?? "192.168.1.0"))
      setBaseCidr(String(data.base_cidr ?? "24"))

      if (restoredSubnets.length > 0) {
        setSubnets(restoredSubnets)
      }

      const restoredResults = parseVlsmAllocations(data.result_subnets)

      if (restoredResults.length > 0) {
        setResults(restoredResults)
      } else {
        setResults(calculateVlsm(String(data.base_network ?? "192.168.1.0"), restoredSubnets))
      }

      setRestoreMessage("Restored calculation from history.")
      router.replace("/app", { scroll: false })
    }

    void restoreFromHistory()
    return () => {
      ignore = true
    }
  }, [isAuthenticated, router, searchParams, supabase])

  useEffect(() => {
    const emailConfirmedFromQuery = searchParams.get("emailConfirmed") === "1"

    let emailConfirmedFromHash = false
    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
      const callbackType = hashParams.get("type")
      emailConfirmedFromHash = callbackType === "signup"
    }

    if (!emailConfirmedFromQuery && !emailConfirmedFromHash) {
      return
    }

    setRestoreMessage("Email confirmed. Your account is ready.")

    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/app")
    } else {
      router.replace("/app", { scroll: false })
    }
  }, [router, searchParams])

  useEffect(() => {
    if (!saveMessage && !saveError) {
      return
    }

    const timeout = setTimeout(() => {
      setSaveMessage(null)
      setSaveError(null)
    }, 2800)

    return () => clearTimeout(timeout)
  }, [saveMessage, saveError])

  useEffect(() => {
    if (!restoreMessage) {
      return
    }

    const timeout = setTimeout(() => {
      setRestoreMessage(null)
    }, 4200)

    return () => clearTimeout(timeout)
  }, [restoreMessage])

  const exportPdf = async () => {
    if (results.length === 0 || exporting) {
      return
    }

    setExporting(true)
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")])

      const document = new jsPDF({ unit: "pt", format: "a4" })
      const createdAt = new Date().toLocaleString()

      document.setFontSize(16)
      document.text("Subnify VLSM Report", 40, 44)
      document.setFontSize(10)
      document.text(`Generated: ${createdAt}`, 40, 62)
      document.text(`Base Network: ${baseNetwork}/${baseCidr}`, 40, 76)

      autoTable(document, {
        startY: 96,
        head: [["Subnet", "Network", "CIDR", "Mask", "Host Range", "Broadcast", "Usable"]],
        body: results.map((row) => [
          row.name,
          row.networkAddress,
          `/${row.cidr}`,
          row.subnetMask,
          `${row.firstHost} - ${row.lastHost}`,
          row.broadcast,
          String(row.usableHosts),
        ]),
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [30, 41, 59] },
      })

      const tableEnd = (document as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 96
      const pageHeight = document.internal.pageSize.getHeight()
      if (tableEnd + 150 > pageHeight) {
        document.addPage()
      }

      const chartStartY = tableEnd + 36 > pageHeight - 120 ? 56 : tableEnd + 36
      if (chartStartY === 56) {
        document.setFontSize(16)
        document.text("Subnify VLSM Report (cont.)", 40, 40)
      }

      document.setFontSize(12)
      document.text("Address Space Visualization", 40, chartStartY)

      const totalAddresses = totalAddressesFromCidr(baseCidr)
      const allocatedAddresses = results.reduce((sum, row) => sum + row.blockSize, 0)
      const barX = 40
      const barY = chartStartY + 16
      const barWidth = 515
      const barHeight = 24

      document.setDrawColor(148, 163, 184)
      document.setFillColor(248, 250, 252)
      document.rect(barX, barY, barWidth, barHeight, "FD")

      const palette: Array<[number, number, number]> = [
        [59, 130, 246],
        [16, 185, 129],
        [245, 158, 11],
        [168, 85, 247],
        [236, 72, 153],
        [14, 165, 233],
      ]

      results.forEach((row, index) => {
        const left = barX + (row.startOffset / totalAddresses) * barWidth
        const width = Math.max(1, (row.blockSize / totalAddresses) * barWidth)
        const [red, green, blue] = palette[index % palette.length]
        document.setFillColor(red, green, blue)
        document.rect(left, barY, width, barHeight, "F")

        if (width > 56) {
          document.setTextColor(255, 255, 255)
          document.setFontSize(8)
          document.text(`${row.name} /${row.cidr}`, left + 3, barY + 15)
        } else if (width > 24) {
          document.setTextColor(255, 255, 255)
          document.setFontSize(8)
          document.text(`/${row.cidr}`, left + 3, barY + 15)
        }
      })

      if (allocatedAddresses < totalAddresses) {
        const left = barX + (allocatedAddresses / totalAddresses) * barWidth
        const width = ((totalAddresses - allocatedAddresses) / totalAddresses) * barWidth
        document.setFillColor(226, 232, 240)
        document.rect(left, barY, width, barHeight, "F")
      }

      document.setTextColor(15, 23, 42)
      document.setFontSize(9)
      document.text(`Allocated: ${allocatedAddresses.toLocaleString()} / ${totalAddresses.toLocaleString()} addresses`, 40, barY + 44)

      document.save(`subnify-vlsm-${Date.now()}.pdf`)
    } finally {
      setExporting(false)
    }
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
    <motion.div
      className="flex-1 overflow-auto p-4 lg:p-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Input Section */}
          <motion.div variants={sectionVariants}>
            <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base">Network Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <AnimatePresence mode="popLayout" initial={false}>
                {restoreMessage ? (
                  <motion.p
                    key={`restore-${restoreMessage}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="text-sm text-muted-foreground"
                  >
                    {restoreMessage}
                  </motion.p>
                ) : null}
              </AnimatePresence>
              <AnimatePresence mode="popLayout" initial={false}>
                {saveMessage ? (
                  <motion.p
                    key={`save-${saveMessage}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="text-sm text-muted-foreground"
                  >
                    {saveMessage}
                  </motion.p>
                ) : null}
              </AnimatePresence>
              <AnimatePresence mode="popLayout" initial={false}>
                {saveError ? (
                  <motion.p
                    key={`save-error-${saveError}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="text-sm text-destructive"
                  >
                    {saveError}
                  </motion.p>
                ) : null}
              </AnimatePresence>
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
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field className="sm:col-span-2 lg:col-span-1">
                      <FieldLabel htmlFor="baseNetwork">Base Network</FieldLabel>
                      <Input
                        id="baseNetwork"
                        value={baseNetwork}
                        onChange={(e) => setBaseNetwork(e.target.value)}
                        placeholder="192.168.1.0"
                      />
                    </Field>
                    <Field className="w-24">
                      <FieldLabel htmlFor="baseCidr">CIDR Notation</FieldLabel>
                      <Input
                        type="number"
                        id="baseCidr"
                        value={baseCidr}
                        onChange={(e) => setBaseCidr(e.target.value)}
                        placeholder="24"
                        className="font-mono"
                      />
                    </Field>
                  </div>

                  <Field>
                    <div className="flex items-center justify-between">
                      <FieldLabel>Subnet Requirements</FieldLabel>
                      <Button type="button" variant="outline" size="sm" onClick={addSubnet} className="gap-1.5">
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
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/5 text-xs font-medium text-primary">
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
                            type="button"
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
                    <FieldDescription>Each entry defines a subnet name and required hosts.</FieldDescription>
                  </Field>

                  <Field orientation="horizontal" className="justify-end">
                    <Button type="reset" variant="outline" className="h-11">
                      Reset
                    </Button>
                    <Button type="submit" className="h-11 gap-2">
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
          {results.length > 0 && (
            <motion.div variants={sectionVariants}>
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
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={exportPdf} disabled={exporting}>
                    <Download className="h-3.5 w-3.5" />
                    {exporting ? "Exporting..." : "Export"}
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
                        </motion.div>
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
            </motion.div>
          )}
        </div>
    </motion.div>
  )
}
