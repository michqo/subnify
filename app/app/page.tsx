"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Calculator, Download, Copy, Check, ZoomIn, ZoomOut } from "lucide-react"
import { motion, type Variants } from "framer-motion"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { calculateVlsm, totalAddressesFromCidr, type VlsmAllocation } from "@/lib/vlsm"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/core/auth-provider"
import { parseSubnetInputArray, parseVlsmAllocations, type CalculationInsert } from "@/lib/history"
import {
  getAiPlanBase,
  normalizeAiDesignedSubnets,
  unpackAiDesignPayload,
  type AiDesignedPlan,
  type StoredAiDesignPayload,
} from "@/lib/planner"
import { useSubnetPlanStore } from "@/lib/state/subnet-plan-store"
import type { PlanSource, SubnetInput } from "@/lib/state/subnet-plan-types"

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

type CalculatedSubnet = VlsmAllocation

type SaveCalculationOptions = {
  sourceType?: PlanSource
  aiPrompt?: string | null
  aiRationale?: string | null
  title?: string | null
  calculationId?: string | null
  successMessage?: string
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

function CalculatorPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const { isAuthenticated, isAuthLoading, user } = useAuth()

  const baseNetwork = useSubnetPlanStore((state) => state.baseNetwork)
  const baseCidr = useSubnetPlanStore((state) => state.baseCidr)
  const subnets = useSubnetPlanStore((state) => state.subnets)
  const sourceType = useSubnetPlanStore((state) => state.sourceType)
  const aiPrompt = useSubnetPlanStore((state) => state.aiPrompt)
  const aiRationale = useSubnetPlanStore((state) => state.aiRationale)
  const aiTitle = useSubnetPlanStore((state) => state.aiTitle)
  const setBaseNetwork = useSubnetPlanStore((state) => state.setBaseNetwork)
  const setBaseCidr = useSubnetPlanStore((state) => state.setBaseCidr)
  const addSubnet = useSubnetPlanStore((state) => state.addSubnet)
  const removeSubnet = useSubnetPlanStore((state) => state.removeSubnet)
  const updateSubnet = useSubnetPlanStore((state) => state.updateSubnet)
  const replacePlan = useSubnetPlanStore((state) => state.replacePlan)
  const clearAiMetadata = useSubnetPlanStore((state) => state.clearAiMetadata)
  const resetPlan = useSubnetPlanStore((state) => state.resetPlan)
  const [results, setResults] = useState<CalculatedSubnet[]>([])
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [planName, setPlanName] = useState("")
  const [shouldSaveToCloud, setShouldSaveToCloud] = useState(false)
  const [activeCloudPlanId, setActiveCloudPlanId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [selectedSubnet, setSelectedSubnet] = useState<number | null>(null)
  const [activeView, setActiveView] = useState<"table" | "cards" | "visualizer">("table")
  const isAiPlan = sourceType === "ai_design"
  const isCloudLinkedPlan = activeCloudPlanId !== null
  const isEditingAiCloudPlan = isAiPlan && isCloudLinkedPlan
  const shouldApplyAiDesign = searchParams.get("aiDesign") === "1"
  const historyIdFromQuery = searchParams.get("history")
  const emailConfirmedFromQuery = searchParams.get("emailConfirmed") === "1"
  const saveSuccessMessage = "Calculation saved to history."
  const updateSuccessMessage = "Plan updated in cloud history."
  const signInToSaveMessage = "Sign in to save calculations to cloud history."

  const buildAppUrl = useCallback((view?: "table" | "cards" | "visualizer") => {
    if (!view || view === "table") {
      return "/app"
    }

    return `/app?view=${view}`
  }, [])

  const resolveViewFromQuery = useCallback((): "table" | "cards" | "visualizer" => {
    const queryView = searchParams.get("view")
    if (queryView === "cards" || queryView === "visualizer") {
      return queryView
    }
    return "table"
  }, [searchParams])

  useEffect(() => {
    setActiveView(resolveViewFromQuery())
  }, [resolveViewFromQuery])

  useEffect(() => {
    if (planName.trim().length === 0 && typeof aiTitle === "string" && aiTitle.trim().length > 0) {
      setPlanName(aiTitle.trim())
    }
  }, [aiTitle, planName])

  const handleViewChange = useCallback((value: string) => {
    const nextView = value === "cards" || value === "visualizer" ? value : "table"
    setActiveView(nextView)
    router.replace(buildAppUrl(nextView), { scroll: false })
  }, [buildAppUrl, router])

  const replaceToCurrentView = useCallback(() => {
    router.replace(buildAppUrl(resolveViewFromQuery()), { scroll: false })
  }, [router, buildAppUrl, resolveViewFromQuery])

  const saveCalculation = useCallback(async (
    calculatedResults: CalculatedSubnet[],
    snapshot: { baseNetwork: string; baseCidr: string; subnets: SubnetInput[] },
    options?: SaveCalculationOptions
  ) => {
    if (isAuthLoading) {
      return
    }

    if (!isAuthenticated || !user) {
      return
    }

    const totalRequiredHosts = calculatedResults.reduce((sum, subnet) => sum + subnet.requiredHosts, 0)
    const totalUsableHosts = calculatedResults.reduce((sum, subnet) => sum + subnet.usableHosts, 0)
    const normalizedTitle =
      typeof options?.title === "string" && options.title.trim().length > 0 ? options.title.trim() : null
    const payload: CalculationInsert = {
      title: normalizedTitle ?? `${snapshot.baseNetwork}/${snapshot.baseCidr} (${snapshot.subnets.length} subnets)`,
      source_type: options?.sourceType === "ai_design" ? "ai_design" : "manual",
      ai_prompt: options?.aiPrompt ?? null,
      ai_rationale: options?.aiRationale ?? null,
      base_network: snapshot.baseNetwork,
      base_cidr: Number(snapshot.baseCidr) || 0,
      input_subnets: snapshot.subnets.map(({ name, hosts }) => ({ name, hosts })),
      result_subnets: calculatedResults,
      total_required_hosts: totalRequiredHosts,
      total_usable_hosts: totalUsableHosts,
    }

    const updateId = typeof options?.calculationId === "string" && options.calculationId.length > 0 ? options.calculationId : null

    if (updateId) {
      const { count, error } = await supabase
        .from("calculations")
        .update(payload, { count: "exact" })
        .eq("id", updateId)
        .eq("user_id", user.id)

      if (error) {
        toast.error(`Update failed: ${error.message}`)
        return
      }

      if (!count || count < 1) {
        toast.error("Update failed: Plan was not found or you do not have permission.")
        return
      }

      setActiveCloudPlanId(updateId)
      toast.success(options?.successMessage ?? saveSuccessMessage)
      return
    }

    const { data, error } = await supabase
      .from("calculations")
      .insert({
        ...payload,
        user_id: user.id,
      })
      .select("id")

    if (error || !data || data.length === 0) {
      toast.error(`Save failed: ${error?.message ?? "Could not create record."}`)
      return
    }

    setActiveCloudPlanId(data[0].id)
    toast.success(options?.successMessage ?? saveSuccessMessage)
  }, [isAuthLoading, isAuthenticated, supabase, user, saveSuccessMessage])

  const calculateVLSM = () => {
    const calculatedResults = calculateVlsm(baseNetwork, subnets)
    setResults(calculatedResults)

    const shouldPersist = isCloudLinkedPlan || shouldSaveToCloud
    if (!shouldPersist) {
      return
    }

    if (!isAuthenticated) {
      toast.info(signInToSaveMessage)
      return
    }

    void saveCalculation(calculatedResults, { baseNetwork, baseCidr, subnets }, {
      sourceType: isAiPlan ? "ai_design" : sourceType,
      aiPrompt,
      aiRationale,
      title: planName,
      calculationId: activeCloudPlanId,
      successMessage: isCloudLinkedPlan ? updateSuccessMessage : saveSuccessMessage,
    })
  }

  useEffect(() => {
    if (!shouldApplyAiDesign || typeof window === "undefined") {
      return
    }

    const rawPlan = window.sessionStorage.getItem("subnify_ai_plan")
    window.sessionStorage.removeItem("subnify_ai_plan")

    if (!rawPlan) {
      toast.error("No AI design found. Generate one from the Designer tab.")
      replaceToCurrentView()
      return
    }

    try {
      const parsed = JSON.parse(rawPlan) as StoredAiDesignPayload | AiDesignedPlan
      const { parsedPlan, aiPrompt } = unpackAiDesignPayload(parsed)
      const designedSubnets = normalizeAiDesignedSubnets(parsedPlan.subnets)

      if (designedSubnets.length === 0) {
        toast.error("Generated design was empty. Please try a different prompt.")
        replaceToCurrentView()
        return
      }

      const { baseNetwork: nextBaseNetwork, baseCidr: nextBaseCidr } = getAiPlanBase(parsedPlan)

      replacePlan({
        baseNetwork: nextBaseNetwork,
        baseCidr: nextBaseCidr,
        subnets: designedSubnets,
        sourceType: "ai_design",
        aiPrompt,
        aiRationale:
          typeof parsedPlan.rationale === "string" && parsedPlan.rationale.trim().length > 0
            ? parsedPlan.rationale
            : null,
        aiTitle: typeof parsedPlan.title === "string" ? parsedPlan.title : null,
      })

      const calculated = calculateVlsm(nextBaseNetwork, designedSubnets)
      setResults(calculated)
      const aiGeneratedTitle = typeof parsedPlan.title === "string" ? parsedPlan.title : null
      setPlanName(aiGeneratedTitle?.trim() ?? "")
      setActiveCloudPlanId(null)
      toast.info("Applied AI-generated design.")

      void saveCalculation(calculated, { baseNetwork: nextBaseNetwork, baseCidr: nextBaseCidr, subnets: designedSubnets }, {
        sourceType: "ai_design",
        aiPrompt,
        aiRationale:
          typeof parsedPlan.rationale === "string" && parsedPlan.rationale.trim().length > 0
            ? parsedPlan.rationale
            : null,
        title: aiGeneratedTitle,
        successMessage: "AI design saved to cloud history.",
      })
    } catch {
      toast.error("Could not parse AI design. Please generate again.")
    } finally {
      replaceToCurrentView()
    }
  }, [shouldApplyAiDesign, saveCalculation, replaceToCurrentView, replacePlan])

  useEffect(() => {
    if (!historyIdFromQuery || !isAuthenticated) {
      return
    }

    let ignore = false
    const restoreFromHistory = async () => {
      const { data, error } = await supabase
        .from("calculations")
        .select("id,title,source_type,ai_prompt,ai_rationale,base_network,base_cidr,input_subnets,result_subnets")
        .eq("id", historyIdFromQuery)
        .single()

      if (ignore) {
        return
      }

      if (error || !data) {
        toast.error("Could not restore that history item.")
        return
      }

      const inputSubnets = parseSubnetInputArray(data.input_subnets)
      const restoredSubnets = inputSubnets.map((subnet, index) => ({
        id: index + 1,
        name: subnet.name ?? `LAN ${String.fromCharCode(65 + (index % 26))}`,
        hosts: subnet.hosts,
      }))

      const restoredBaseNetwork = String(data.base_network ?? "192.168.1.0")
      const restoredBaseCidr = String(data.base_cidr ?? "24")

      replacePlan({
        baseNetwork: restoredBaseNetwork,
        baseCidr: restoredBaseCidr,
        subnets: restoredSubnets,
        sourceType: data.source_type === "ai_design" ? "ai_design" : "history",
        aiPrompt: data.source_type === "ai_design" ? data.ai_prompt : null,
        aiRationale: data.source_type === "ai_design" ? data.ai_rationale : null,
        aiTitle: typeof data.title === "string" ? data.title : null,
      })

      const restoredResults = parseVlsmAllocations(data.result_subnets)

      if (restoredResults.length > 0) {
        setResults(restoredResults)
      } else {
        setResults(calculateVlsm(restoredBaseNetwork, restoredSubnets))
      }

      setPlanName(typeof data.title === "string" ? data.title : "")
      setActiveCloudPlanId(data.id)
      toast.info(data.source_type === "ai_design" ? "Editing AI design plan from history." : "Editing saved plan from history.")
      replaceToCurrentView()
    }

    void restoreFromHistory()
    return () => {
      ignore = true
    }
  }, [historyIdFromQuery, isAuthenticated, supabase, replaceToCurrentView, replacePlan])

  useEffect(() => {
    let emailConfirmedFromHash = false
    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
      const callbackType = hashParams.get("type")
      emailConfirmedFromHash = callbackType === "signup"
    }

    if (!emailConfirmedFromQuery && !emailConfirmedFromHash) {
      return
    }

    toast.success("Email confirmed. Your account is ready.")

    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", buildAppUrl(resolveViewFromQuery()))
    } else {
      replaceToCurrentView()
    }
  }, [emailConfirmedFromQuery, buildAppUrl, resolveViewFromQuery, replaceToCurrentView])

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
    resetPlan()
    clearAiMetadata()
    setPlanName("")
    setShouldSaveToCloud(false)
    setActiveCloudPlanId(null)
    setResults([])
  }

  const totalUsable = results.reduce((acc, r) => acc + r.usableHosts, 0)
  const totalRequired = results.reduce((acc, r) => acc + r.requiredHosts, 0)
  const totalAddresses = totalAddressesFromCidr(baseCidr)
  const allocatedAddresses = results.reduce((acc, r) => acc + r.blockSize, 0)

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
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Network Configuration</CardTitle>
                {isEditingAiCloudPlan ? <Badge variant="secondary">Editing AI design plan</Badge> : null}
                {!isEditingAiCloudPlan && isCloudLinkedPlan ? <Badge variant="outline">Editing saved plan</Badge> : null}
              </div>
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

                  {isAuthenticated ? (
                    <Field className="sm:col-span-2 lg:col-span-2">
                      <FieldLabel htmlFor="planName">Plan name</FieldLabel>
                      <Input
                        id="planName"
                        value={planName}
                        onChange={(event) => setPlanName(event.target.value)}
                        placeholder="Branch office rollout"
                      />
                      <FieldDescription>Name this plan before saving to cloud history.</FieldDescription>
                    </Field>
                  ) : null}

                  {isAuthenticated && !isAiPlan && !isCloudLinkedPlan ? (
                    <Field>
                      <label htmlFor="saveToCloud" className="flex items-center gap-2 text-sm font-medium">
                        <input
                          id="saveToCloud"
                          type="checkbox"
                          checked={shouldSaveToCloud}
                          onChange={(event) => setShouldSaveToCloud(event.target.checked)}
                          className="size-4"
                        />
                        Save this manual calculation to cloud history
                      </label>
                      <FieldDescription>
                        Off by default. AI-generated designs still auto-save when applied.
                      </FieldDescription>
                    </Field>
                  ) : null}

                  {isAiPlan ? (
                    <Field>
                      <FieldDescription>
                        {isEditingAiCloudPlan
                          ? "You are editing a saved AI design plan. Recalculate to update it in cloud history."
                          : "AI-generated design loaded. Recalculate to save it to cloud history."}
                      </FieldDescription>
                    </Field>
                  ) : null}

                  {!isAiPlan && isCloudLinkedPlan ? (
                    <Field>
                      <FieldDescription>
                        You are editing a saved plan. Recalculate to update it in cloud history.
                      </FieldDescription>
                    </Field>
                  ) : null}

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
          <motion.div variants={sectionVariants}>
              <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">Calculation Results</CardTitle>
                  <Badge variant="secondary">{results.length} subnets</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={copyResults} className="gap-1.5" disabled={results.length === 0}>
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={exportPdf} disabled={exporting || results.length === 0}>
                    <Download className="h-3.5 w-3.5" />
                    {exporting ? "Exporting..." : "Export"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeView} onValueChange={handleViewChange} className="w-full">
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
                    )}
                  </TabsContent>

                  <TabsContent value="visualizer" className="mt-0 space-y-6">
                    {results.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-6 text-center text-sm text-muted-foreground">
                        Run a calculation to open the visualizer view.
                      </div>
                    ) : null}
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={results.length === 0}
                        onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center text-sm text-muted-foreground">{(zoom * 100).toFixed(0)}%</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={results.length === 0}
                        onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                      >
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
          </motion.div>
        </div>
    </motion.div>
  )
}

export default function CalculatorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-5 w-44" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Skeleton className="h-10 sm:col-span-2 lg:col-span-1" />
                  <Skeleton className="h-10 w-24" />
                </div>
                <Skeleton className="h-28 w-full" />
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-11 w-24" />
                  <Skeleton className="h-11 w-36" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      }
    >
      <CalculatorPageContent />
    </Suspense>
  )
}
