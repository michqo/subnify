"use client"

import { Calculator, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { SubnetInput } from "@/lib/state/subnet-plan-types"

type SubnetRowProps = {
  subnet: SubnetInput
  index: number
  subnetCount: number
  onUpdateSubnet: (id: number, field: "name" | "hosts", value: string) => void
  onRemoveSubnet: (id: number) => void
}

function SubnetRow({
  subnet,
  index,
  subnetCount,
  onUpdateSubnet,
  onRemoveSubnet,
}: SubnetRowProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/5 text-xs font-medium text-primary">
        {index + 1}
      </span>
      <Input
        value={subnet.name}
        onChange={(event) => onUpdateSubnet(subnet.id, "name", event.target.value)}
        placeholder="Subnet name"
        className="h-9 flex-1 border-border bg-card"
      />
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={subnet.hosts}
          onChange={(event) => onUpdateSubnet(subnet.id, "hosts", event.target.value)}
          placeholder="Hosts"
          className="h-9 w-24 border-border bg-card font-mono"
        />
        <span className="text-sm text-muted-foreground">hosts</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemoveSubnet(subnet.id)}
        disabled={subnetCount === 1}
        className="shrink-0 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

type CalculatorInputSectionProps = {
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
}: CalculatorInputSectionProps) {
  return (
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
                <FieldLabel htmlFor="baseNetwork">Base Network</FieldLabel>
                <Input
                  id="baseNetwork"
                  value={baseNetwork}
                  onChange={(event) => onBaseNetworkChange(event.target.value)}
                  placeholder="192.168.1.0"
                />
              </Field>
              <Field className="w-24">
                <FieldLabel htmlFor="baseCidr">CIDR Notation</FieldLabel>
                <Input
                  type="number"
                  id="baseCidr"
                  value={baseCidr}
                  onChange={(event) => onBaseCidrChange(event.target.value)}
                  placeholder="24"
                  className="font-mono"
                />
              </Field>
            </div>

            {isAuthenticated && (shouldSaveToCloud || isCloudLinkedPlan) ? (
              <Field className="sm:col-span-2 lg:col-span-2">
                <FieldLabel htmlFor="planName">Plan name</FieldLabel>
                <Input
                  id="planName"
                  value={planName}
                  onChange={(event) => onPlanNameChange(event.target.value)}
                  placeholder="Branch office rollout"
                />
              </Field>
            ) : null}

            {isAuthenticated && !isAiPlan && !isCloudLinkedPlan ? (
              <Field>
                <label htmlFor="saveToCloud" className="flex items-center gap-2 text-sm font-medium">
                  <input
                    id="saveToCloud"
                    type="checkbox"
                    checked={shouldSaveToCloud}
                    onChange={(event) => onShouldSaveToCloudChange(event.target.checked)}
                    className="size-4"
                  />
                  Save this manual calculation to cloud history
                </label>
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
                <Button type="button" variant="outline" size="sm" onClick={onAddSubnet} className="gap-1.5">
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
                  />
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
  )
}
