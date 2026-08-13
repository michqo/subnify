"use client"

import { useCallback, useEffect, useMemo, useRef, type MouseEvent } from "react"
import { Calculator, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { SubnetInput } from "@/lib/state/subnet-plan-types"
import type { VlsmIssue } from "@/lib/vlsm"
import { AnimatePresence, motion } from "framer-motion"
import { Checkbox } from "../ui/checkbox"

type SubnetRowProps = {
  subnet: SubnetInput
  index: number
  subnetCount: number
  onUpdateSubnet: (id: number, field: "name" | "hosts", value: string) => void
  onRemoveSubnet: (id: number) => void
  nameIssues: VlsmIssue[]
  hostIssues: VlsmIssue[]
}

function SubnetRow({
  subnet,
  index,
  subnetCount,
  onUpdateSubnet,
  onRemoveSubnet,
  nameIssues,
  hostIssues,
}: SubnetRowProps) {
  const nameErrorId = `subnet-${subnet.id}-name-error`
  const hostsErrorId = `subnet-${subnet.id}-hosts-error`
  const nameInputId = `subnet-${subnet.id}-name`
  const hostsInputId = `subnet-${subnet.id}-hosts`
  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/30 p-3 md:flex-row md:items-center"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/5 text-xs font-medium text-primary">
        {index + 1}
      </span>
      <div className="w-full flex-1 space-y-1">
        <Input
          id={nameInputId}
          value={subnet.name}
          aria-label={`Subnet ${index + 1} name`}
          aria-invalid={nameIssues.length > 0 ? true : undefined}
          aria-describedby={nameIssues.length > 0 ? nameErrorId : undefined}
          onChange={(event) => {
            const value = event.target.value
            if (Array.from(value).length <= 80) {
              onUpdateSubnet(subnet.id, "name", value)
            }
          }}
          placeholder="Subnet name"
          className="min-h-11 border-border bg-card md:min-h-9"
        />
        {nameIssues.length > 0 ? (
          <p id={nameErrorId} className="text-sm text-destructive">
            {nameIssues.map((issue) => issue.message).join(" ")}
          </p>
        ) : null}
      </div>
      <div className="w-full space-y-1 md:ml-auto md:w-auto">
        <div className="flex items-center gap-2">
          <Input
            id={hostsInputId}
            type="number"
            value={subnet.hosts}
            aria-label={`Subnet ${index + 1} required hosts`}
            aria-invalid={hostIssues.length > 0 ? true : undefined}
            aria-describedby={hostIssues.length > 0 ? hostsErrorId : undefined}
            onChange={(event) => onUpdateSubnet(subnet.id, "hosts", event.target.value)}
            placeholder="Hosts"
            min={1}
            max={4294967294}
            className="min-h-11 w-24 border-border bg-card font-mono md:min-h-9"
          />
          <span className="text-sm text-muted-foreground">hosts</span>
        </div>
        {hostIssues.length > 0 ? (
          <p id={hostsErrorId} className="text-sm text-destructive">
            {hostIssues.map((issue) => issue.message).join(" ")}
          </p>
        ) : null}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemoveSubnet(subnet.id)}
        disabled={subnetCount === 1}
        className="min-h-11 min-w-11 shrink-0 text-muted-foreground hover:text-destructive md:min-h-9 md:min-w-9"
        aria-label={`Remove ${subnet.name || `subnet ${index + 1}`}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

export type CalculatorInputSectionProps = {
  baseNetwork: string
  baseCidr: string
  onBaseNetworkChange: (value: string) => void
  onBaseCidrChange: (value: string) => void
  isAuthenticated: boolean
  planName: string
  onPlanNameChange: (value: string) => void
  isAiPlan: boolean
  isCloudLinkedPlan: boolean
  isEditingAiCloudPlan: boolean
  shouldSaveToCloud: boolean
  onShouldSaveToCloudChange: (value: boolean) => void
  subnets: SubnetInput[]
  onAddSubnet: () => void
  onUpdateSubnet: (id: number, field: "name" | "hosts", value: string) => void
  onRemoveSubnet: (id: number) => void
  onSubmit: () => void
  onReset: () => void
  submittedIssues: VlsmIssue[]
}

export function CalculatorInputSection({
  baseNetwork,
  baseCidr,
  onBaseNetworkChange,
  onBaseCidrChange,
  isAuthenticated,
  planName,
  onPlanNameChange,
  isAiPlan,
  isCloudLinkedPlan,
  isEditingAiCloudPlan,
  shouldSaveToCloud,
  onShouldSaveToCloudChange,
  subnets,
  onAddSubnet,
  onUpdateSubnet,
  onRemoveSubnet,
  onSubmit,
  onReset,
  submittedIssues,
}: CalculatorInputSectionProps) {
  const submissionAlertRef = useRef<HTMLDivElement>(null)
  const planIssues = useMemo(
    () => submittedIssues.filter((issue) => issue.field === "subnets"),
    [submittedIssues]
  )
  const baseNetworkIssues = submittedIssues.filter(
    (issue) => issue.field === "baseNetwork"
  )
  const baseCidrIssues = submittedIssues.filter(
    (issue) => issue.field === "baseCidr"
  )
  const handleUseSuggestion = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onBaseNetworkChange(event.currentTarget.value)
    },
    [onBaseNetworkChange]
  )

  useEffect(() => {
    if (planIssues.length > 0) {
      submissionAlertRef.current?.focus()
      return
    }

    const firstFieldIssue = submittedIssues[0]
    if (!firstFieldIssue) return

    let targetId: string | undefined
    if (firstFieldIssue.field === "baseNetwork") targetId = "baseNetwork"
    if (firstFieldIssue.field === "baseCidr") targetId = "baseCidr"

    const rowMatch = firstFieldIssue.field.match(
      /^subnets\.(\d+)\.(name|hosts)$/
    )
    if (rowMatch) {
      const subnet = subnets[Number(rowMatch[1])]
      if (subnet) targetId = `subnet-${subnet.id}-${rowMatch[2]}`
    }

    if (targetId) document.getElementById(targetId)?.focus()
  }, [planIssues, submittedIssues, subnets])

  return (
    <div>
      <div className="flex flex-row items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-mono text-sm font-semibold">Plan</h2>
          {isEditingAiCloudPlan ? <Badge variant="secondary">AI</Badge> : null}
          {!isEditingAiCloudPlan && isCloudLinkedPlan ? <Badge variant="outline">Saved</Badge> : null}
        </div>
      </div>
      <div className="space-y-6 pt-5">
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
          onReset={(event) => {
            event.preventDefault()
            onReset()
          }}
        >
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field className="sm:col-span-2 lg:col-span-1">
                <FieldLabel htmlFor="baseNetwork">Parent network</FieldLabel>
                <Input
                  id="baseNetwork"
                  value={baseNetwork}
                  aria-invalid={baseNetworkIssues.length > 0 ? true : undefined}
                  aria-describedby={baseNetworkIssues.length > 0 ? "baseNetwork-error" : undefined}
                  onChange={(event) => onBaseNetworkChange(event.target.value)}
                  placeholder="192.168.1.0"
                  className="min-h-11 md:min-h-9"
                />
                {baseNetworkIssues.length > 0 ? (
                  <div id="baseNetwork-error" className="space-y-2 text-sm text-destructive">
                    {baseNetworkIssues.map((issue) => (
                      <p key={issue.code}>
                        {issue.message}{" "}
                        {issue.suggestion ? (
                          <button
                            type="button"
                            value={issue.suggestion}
                            className="min-h-11 underline underline-offset-4 md:min-h-9"
                            onClick={handleUseSuggestion}
                          >
                            Use {issue.suggestion}
                          </button>
                        ) : null}
                      </p>
                    ))}
                  </div>
                ) : null}
              </Field>
              <Field className="w-24">
                <FieldLabel htmlFor="baseCidr">Prefix</FieldLabel>
                <Input
                  type="number"
                  id="baseCidr"
                  value={baseCidr}
                  aria-invalid={baseCidrIssues.length > 0 ? true : undefined}
                  aria-describedby={baseCidrIssues.length > 0 ? "baseCidr-error" : undefined}
                  onChange={(event) => onBaseCidrChange(event.target.value)}
                  placeholder="24"
                  className="min-h-11 font-mono md:min-h-9"
                />
                {baseCidrIssues.length > 0 ? (
                  <p id="baseCidr-error" className="text-sm text-destructive">
                    {baseCidrIssues.map((issue) => issue.message).join(" ")}
                  </p>
                ) : null}
              </Field>
            </div>

            <div className="relative grid sm:col-span-2 lg:col-span-2">
              <AnimatePresence initial={false}>
                {isAuthenticated && (shouldSaveToCloud || isCloudLinkedPlan) ? (
                  <motion.div
                    key="planNameField"
                    initial={{ opacity: 0, y: -10, position: "absolute", width: "100%" }}
                    animate={{ opacity: 1, y: 0, position: "static", width: "100%" }}
                    exit={{ opacity: 0, y: -10, position: "absolute", width: "100%" }}
                    transition={{ duration: 0.2 }}
                  >
                    <Field>
                      <FieldLabel htmlFor="planName">Plan name</FieldLabel>
                      <Input
                      id="planName"
                      value={planName}
                      maxLength={80}
                      onChange={(event) => onPlanNameChange(event.target.value)}
                      placeholder="Branch office rollout"
                      className="min-h-11 md:min-h-9"
                      />
                    </Field>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {isAuthenticated && !isAiPlan && !isCloudLinkedPlan ? (
              <Field orientation="horizontal">
                <Checkbox
                  id="saveToCloud"
                  checked={shouldSaveToCloud}
                  onCheckedChange={onShouldSaveToCloudChange}
                  className="after:-inset-3.5 md:after:-inset-x-3 md:after:-inset-y-2"
                />
                <FieldLabel htmlFor="saveToCloud" className="min-h-11 cursor-pointer items-center md:min-h-9">
                  Save to history
                </FieldLabel>
              </Field>
            ) : null}

            {isAiPlan ? (
              <Field>
                <FieldDescription>
                  {isEditingAiCloudPlan
                    ? "Calculate to update this saved AI plan."
                    : "Calculate to save this AI plan."}
                </FieldDescription>
              </Field>
            ) : null}

            {!isAiPlan && isCloudLinkedPlan ? (
              <Field>
                <FieldDescription>Calculate to update this saved plan.</FieldDescription>
              </Field>
            ) : null}

            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel>Requirements</FieldLabel>
                <Button type="button" variant="outline" size="sm" onClick={onAddSubnet} disabled={subnets.length >= 100} className="min-h-11 gap-1.5 md:min-h-9">
                  <Plus className="h-3.5 w-3.5" />
                  Add Subnet
                </Button>
              </div>

              <div className="space-y-2">
                {subnets.map((subnet, index) => (
                  <SubnetRow
                    key={subnet.id}
                    subnet={subnet}
                    index={index}
                    subnetCount={subnets.length}
                    onUpdateSubnet={onUpdateSubnet}
                    onRemoveSubnet={onRemoveSubnet}
                    nameIssues={submittedIssues.filter(
                      (issue) => issue.field === `subnets.${index}.name`
                    )}
                    hostIssues={submittedIssues.filter(
                      (issue) => issue.field === `subnets.${index}.hosts`
                    )}
                  />
                ))}
              </div>
            </Field>

            {submittedIssues.length > 0 ? (
              <div
                id="submission-errors"
                ref={submissionAlertRef}
                role="alert"
                tabIndex={-1}
                className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {submittedIssues.map((issue, index) => (
                  <p key={`${issue.code}-${issue.field}-${index}`}>
                    {issue.message}
                  </p>
                ))}
              </div>
            ) : null}

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
      </div>
    </div>
  )
}
