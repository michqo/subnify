# Subnify Reliability v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every Subnify IPv4 plan deterministic, parent-bounded, validated before display or persistence, accessible, tested, and free of avoidable production dependency exposure.

**Architecture:** `lib/vlsm.ts` becomes the only calculation and validation boundary and returns a discriminated result containing either issues or a complete normalized parent/allocation contract. UI diagnostics adapt that result for live guidance, while committed planner state, history, AI, clipboard, visualizations, and PDF consume only successful results. Supabase RPCs serialize AI quota reservations; server routes log privacy-safe events and stable correlation IDs.

**Tech Stack:** Next.js 16.3.0, React 19.2.8, TypeScript 5.9, Vitest 4, Testing Library, Playwright, Supabase Postgres/RLS, OpenAI SDK/OpenRouter, jsPDF, Tailwind CSS 4.

## Global Constraints

- IPv4 only; parent prefixes `0` through `30`; traditional network and broadcast reservation; `/31` and `/32` allocations excluded.
- Base address must be exactly four decimal octets and the canonical address for its prefix; public IPv4 ranges remain valid.
- Subnet count `1` through `100`; trimmed name length `1` through `80` Unicode code points; names unique after locale-independent lowercasing.
- Required hosts must be an integer from `1` through `4,294,967,294`; all arithmetic stays exact within `0` through `2^32`.
- Allocate largest block first; retain original order for ties; align every block; reject the whole plan on capacity or IPv4 overflow.
- Every allocation retains its input `requirementId`; consumers never recover identity by name.
- Expected input failures return `{ ok: false, issues }`; they do not throw.
- Invalid plans never remain visible, copyable, exportable, chargeable as successful AI output, or persistable as valid history.
- Preserve current visual language, React 19 compatibility, Supabase auth, and calculations RLS.
- No third-party analytics, IPv6, `/31`, `/32`, integrations, pricing, collaboration, or unrelated redesign.

## File Structure

- `lib/vlsm.ts`: pure IPv4 parsing, validation, allocation, utilization, and public domain types.
- `lib/planner/diagnostics.ts`: presentation-only adapter from `VlsmCalculationResult` to live guidance.
- `lib/calculation-events.ts`: privacy-safe client event payload and sender.
- `app/api/calculation-events/route.ts`: server log boundary accepting only event names and issue codes.
- `hooks/use-calculator-page-controller.ts`: committed successful-result state and submit boundary.
- `components/app/calculator-input-section.tsx`: field associations, submission alert, responsive controls.
- `components/app/calculator-results-section.tsx`, `components/app/allocation-map.tsx`, `components/app/subnet-hierarchy.tsx`: successful-result consumers keyed by `requirementId`.
- `hooks/use-copy-results.ts`, `lib/calculator/export-pdf.ts`: clipboard and PDF functions accepting only successful calculations.
- `lib/queries/calculations.ts`, `hooks/use-plan-persistence.ts`, `hooks/use-history-restoration.ts`, `lib/history.ts`: recalculate-before-write and recalculate-on-restore history boundaries.
- `app/api/ai-designer/route.ts`, `lib/ai-designer-types.ts`, `components/app/generate-requirements-dialog.tsx`: bounded prompt, validated model output, stable errors.
- `supabase/migrations/202608120001_calculation_host_bigint.sql`: aggregate host columns widened to `bigint`.
- `supabase/migrations/202608120002_atomic_ai_quota.sql`: atomic quota reservation/completion RPCs and `pending` state.
- `app/app/help/page.tsx`: calculation, AI validation, history, and deletion trust documentation.
- `app/tailwind-variants.css`: local Tailwind variants formerly imported from the production `shadcn` CLI package.
- `tests/lib/vlsm.test.ts`, `tests/lib/vlsm-invariants.test.ts`: exact examples, invalid input matrix, boundaries, and seeded invariants.
- `tests/hooks/use-calculator-page-controller.test.tsx`, `tests/hooks/use-history-restoration.test.tsx`: invalid-submit and legacy-restore boundaries.
- `tests/components/calculator-input-section.test.tsx`, `tests/components/result-views.test.tsx`, `tests/components/generate-requirements-dialog.test.tsx`: accessible fields/actions and consumer identity.
- `tests/api/ai-designer-route.test.ts`, `tests/api/calculation-events-route.test.ts`, `tests/lib/queries/calculations.test.ts`: route and persistence boundary tests.
- `tests/e2e/planner.spec.ts`: desktop and `390x844` success/failure/browser verification.

---

### Task 1: Validated IPv4/VLSM Domain Engine

**Files:**
- Modify: `lib/vlsm.ts`
- Create: `tests/lib/vlsm.test.ts`
- Create: `tests/lib/vlsm-invariants.test.ts`

**Interfaces:**
- Consumes: `VlsmPlanInput = { baseNetwork: string; baseCidr: number; subnets: Array<{ id: number; name: string; hosts: number }> }`.
- Produces: `calculateVlsm(input: VlsmPlanInput): VlsmCalculationResult`, `VlsmIssue`, `VlsmIssueCode`, `VlsmAllocation`, and `VlsmCalculationSuccess`.

- [ ] **Step 1: Write exact-example and validation tests**

```ts
import { describe, expect, it } from "vitest"
import { calculateVlsm, type VlsmPlanInput } from "@/lib/vlsm"

const defaults: VlsmPlanInput = {
  baseNetwork: "192.168.1.0",
  baseCidr: 24,
  subnets: [
    { id: 1, name: "LAN A", hosts: 50 },
    { id: 2, name: "LAN B", hosts: 25 },
    { id: 3, name: "LAN C", hosts: 10 },
  ],
}

describe("calculateVlsm", () => {
  it("allocates the default plan exactly", () => {
    const result = calculateVlsm(defaults)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.parent).toEqual({ networkAddress: "192.168.1.0", broadcast: "192.168.1.255", cidr: 24, totalAddresses: 256 })
    expect(result.allocations.map(({ requirementId, networkAddress, cidr, broadcast }) => ({ requirementId, networkAddress, cidr, broadcast }))).toEqual([
      { requirementId: 1, networkAddress: "192.168.1.0", cidr: 26, broadcast: "192.168.1.63" },
      { requirementId: 2, networkAddress: "192.168.1.64", cidr: 27, broadcast: "192.168.1.95" },
      { requirementId: 3, networkAddress: "192.168.1.96", cidr: 28, broadcast: "192.168.1.111" },
    ])
    expect(result.allocatedAddresses).toBe(112)
    expect(result.remainingAddresses).toBe(144)
  })

  it("rejects the default requirements inside a /30", () => {
    const result = calculateVlsm({ ...defaults, baseCidr: 30 })
    expect(result).toEqual({ ok: false, issues: [expect.objectContaining({ code: "INSUFFICIENT_ADDRESS_SPACE", field: "subnets" })] })
  })

  it.each(["192.168.1", "192.168.one.1", "-1.2.3.4", "256.1.1.1", " 192.168.1.0 "])("rejects invalid IPv4 %j", (baseNetwork) => {
    const result = calculateVlsm({ ...defaults, baseNetwork })
    expect(result).toMatchObject({ ok: false, issues: expect.arrayContaining([expect.objectContaining({ code: "INVALID_BASE_NETWORK", field: "baseNetwork" })]) })
  })

  it.each([-1, 31, 24.5, Number.NaN, "", "x"])("rejects invalid parent CIDR %j", (baseCidr) => {
    const result = calculateVlsm({ ...defaults, baseCidr: baseCidr as number })
    expect(result).toMatchObject({ ok: false, issues: expect.arrayContaining([expect.objectContaining({ code: "INVALID_BASE_CIDR", field: "baseCidr" })]) })
  })

  it("suggests the canonical base", () => {
    expect(calculateVlsm({ ...defaults, baseNetwork: "192.168.1.5" })).toMatchObject({
      ok: false,
      issues: [expect.objectContaining({ code: "NON_CANONICAL_BASE_NETWORK", suggestion: "192.168.1.0" })],
    })
  })

  it.each([0, -1, 1.5, Number.POSITIVE_INFINITY, 4_294_967_295])("rejects host count %j", (hosts) => {
    const result = calculateVlsm({ ...defaults, subnets: [{ id: 9, name: "LAN", hosts }] })
    expect(result).toMatchObject({ ok: false, issues: [expect.objectContaining({ code: "INVALID_HOST_COUNT", field: "subnets.0.hosts" })] })
  })

  it("rejects blank, overlong, and case-insensitive duplicate names", () => {
    const result = calculateVlsm({ ...defaults, subnets: [
      { id: 1, name: " ", hosts: 1 },
      { id: 2, name: "x".repeat(81), hosts: 1 },
      { id: 3, name: "Staff", hosts: 1 },
      { id: 4, name: " staff ", hosts: 1 },
    ] })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(["INVALID_SUBNET_NAME", "DUPLICATE_SUBNET_NAME"]))
  })

  it("preserves input order for equal blocks", () => {
    const result = calculateVlsm({ ...defaults, subnets: [{ id: 7, name: "First", hosts: 10 }, { id: 3, name: "Second", hosts: 10 }] })
    expect(result.ok && result.allocations.map((row) => row.requirementId)).toEqual([7, 3])
  })

  it("orders different requirements largest-first even when they use the same block size", () => {
    const result = calculateVlsm({ ...defaults, subnets: [{ id: 7, name: "Smaller", hosts: 9 }, { id: 3, name: "Larger", hosts: 12 }] })
    expect(result.ok && result.allocations.map((row) => row.requirementId)).toEqual([3, 7])
  })

  it.each([0, 101])("rejects subnet count %i", (count) => {
    const result = calculateVlsm({ ...defaults, subnets: Array.from({ length: count }, (_, index) => ({ id: index, name: `LAN ${index}`, hosts: 1 })) })
    expect(result).toMatchObject({ ok: false, issues: expect.arrayContaining([expect.objectContaining({ code: "INVALID_SUBNET_COUNT", field: "subnets" })]) })
  })

  it("accepts public IPv4 parents", () => {
    expect(calculateVlsm({ baseNetwork: "203.0.113.0", baseCidr: 24, subnets: [{ id: 1, name: "Public", hosts: 10 }] }).ok).toBe(true)
  })

  it("aligns allocations across octet and signed-32-bit boundaries", () => {
    const octet = calculateVlsm({ baseNetwork: "10.0.0.0", baseCidr: 23, subnets: [{ id: 1, name: "A", hosts: 126 }, { id: 2, name: "B", hosts: 126 }, { id: 3, name: "C", hosts: 62 }] })
    expect(octet.ok && octet.allocations.map((row) => row.networkAddress)).toEqual(["10.0.0.0", "10.0.0.128", "10.0.1.0"])
    const signed = calculateVlsm({ baseNetwork: "128.0.0.0", baseCidr: 30, subnets: [{ id: 4, name: "Signed", hosts: 1 }] })
    expect(signed.ok && signed.allocations[0].networkAddress).toBe("128.0.0.0")
  })

  it("distinguishes exact fit, one-address excess, and IPv4-end overflow", () => {
    expect(calculateVlsm({ baseNetwork: "192.168.1.0", baseCidr: 29, subnets: [{ id: 1, name: "Exact", hosts: 6 }] }).ok).toBe(true)
    expect(calculateVlsm({ baseNetwork: "192.168.1.0", baseCidr: 29, subnets: [{ id: 1, name: "One over", hosts: 7 }] })).toMatchObject({ ok: false, issues: [expect.objectContaining({ code: "INSUFFICIENT_ADDRESS_SPACE" })] })
    expect(calculateVlsm({ baseNetwork: "255.255.255.252", baseCidr: 30, subnets: [{ id: 1, name: "Past IPv4", hosts: 3 }] })).toMatchObject({ ok: false, issues: [expect.objectContaining({ code: "IPV4_OVERFLOW" })] })
  })

  it.each([
    [{ baseNetwork: "0.0.0.0", baseCidr: 0, subnets: [{ id: 1, name: "All", hosts: 4_294_967_294 }] }, "0.0.0.0", 0, "255.255.255.255"],
    [{ baseNetwork: "255.255.255.252", baseCidr: 30, subnets: [{ id: 1, name: "Pair", hosts: 2 }] }, "255.255.255.252", 30, "255.255.255.255"],
  ])("supports exact boundary plan", (input, networkAddress, cidr, broadcast) => {
    const result = calculateVlsm(input as VlsmPlanInput)
    expect(result.ok && result.allocations[0]).toMatchObject({ networkAddress, cidr, broadcast })
  })
})
```

- [ ] **Step 2: Run the new domain tests and confirm old API failure**

Run: `pnpm vitest run tests/lib/vlsm.test.ts`

Expected: FAIL because current `calculateVlsm` accepts positional arguments and returns an unchecked array.

- [ ] **Step 3: Replace the domain engine with validated arithmetic**

```ts
export type VlsmPlanInput = {
  baseNetwork: string
  baseCidr: number
  subnets: Array<{ id: number; name: string; hosts: number }>
}

export type VlsmIssueCode = "INVALID_BASE_NETWORK" | "INVALID_BASE_CIDR" | "NON_CANONICAL_BASE_NETWORK" | "INVALID_SUBNET_COUNT" | "INVALID_SUBNET_NAME" | "DUPLICATE_SUBNET_NAME" | "INVALID_HOST_COUNT" | "INSUFFICIENT_ADDRESS_SPACE" | "IPV4_OVERFLOW"
export type VlsmIssue = { code: VlsmIssueCode; message: string; field: "baseNetwork" | "baseCidr" | `subnets.${number}.name` | `subnets.${number}.hosts` | "subnets"; suggestion?: string }
export type VlsmAllocation = { requirementId: number; name: string; requiredHosts: number; networkAddress: string; cidr: number; subnetMask: string; firstHost: string; lastHost: string; broadcast: string; usableHosts: number; startOffset: number; blockSize: number }
export type VlsmCalculationSuccess = { ok: true; parent: { networkAddress: string; broadcast: string; cidr: number; totalAddresses: number }; allocations: VlsmAllocation[]; allocatedAddresses: number; remainingAddresses: number }
export type VlsmCalculationResult = VlsmCalculationSuccess | { ok: false; issues: VlsmIssue[] }

const IPV4_SIZE = 2 ** 32
const IPV4_MAX = IPV4_SIZE - 1

function parseIpv4(value: unknown): number | null {
  if (typeof value !== "string" || value.trim() !== value) return null
  const parts = value.split(".")
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) return null
  const octets = parts.map(Number)
  if (octets.some((octet) => octet < 0 || octet > 255)) return null
  return octets[0] * 2 ** 24 + octets[1] * 2 ** 16 + octets[2] * 2 ** 8 + octets[3]
}

function intToIpv4(value: number): string {
  return [Math.floor(value / 2 ** 24), Math.floor(value / 2 ** 16) % 256, Math.floor(value / 2 ** 8) % 256, value % 256].join(".")
}

function maskFromCidr(cidr: number): string {
  const size = 2 ** (32 - cidr)
  return intToIpv4(IPV4_SIZE - size)
}

export function calculateVlsm(input: VlsmPlanInput): VlsmCalculationResult {
  const candidate = input as Partial<VlsmPlanInput> | null | undefined
  const issues: VlsmIssue[] = []
  const baseIp = parseIpv4(candidate?.baseNetwork)
  const cidr = typeof candidate?.baseCidr === "number" ? candidate.baseCidr : Number.NaN
  if (baseIp === null) issues.push({ code: "INVALID_BASE_NETWORK", message: "Enter an IPv4 address using four decimal octets from 0 to 255.", field: "baseNetwork" })
  if (!Number.isInteger(cidr) || cidr < 0 || cidr > 30) issues.push({ code: "INVALID_BASE_CIDR", message: "CIDR must be a whole number from 0 to 30.", field: "baseCidr" })

  let parentSize = 0
  let parentNetwork = 0
  let parentBroadcast = 0
  if (baseIp !== null && Number.isInteger(cidr) && cidr >= 0 && cidr <= 30) {
    parentSize = 2 ** (32 - cidr)
    parentNetwork = Math.floor(baseIp / parentSize) * parentSize
    parentBroadcast = parentNetwork + parentSize - 1
    if (baseIp !== parentNetwork) issues.push({ code: "NON_CANONICAL_BASE_NETWORK", message: `${candidate?.baseNetwork} is not the network address for /${cidr}.`, field: "baseNetwork", suggestion: intToIpv4(parentNetwork) })
  }

  if (!Array.isArray(candidate?.subnets) || candidate.subnets.length < 1 || candidate.subnets.length > 100) issues.push({ code: "INVALID_SUBNET_COUNT", message: "Add between 1 and 100 subnet requirements.", field: "subnets" })
  const seen = new Set<string>()
  const validRows: Array<{ row: VlsmPlanInput["subnets"][number]; index: number; name: string; blockSize: number }> = []
  for (const [index, row] of (Array.isArray(candidate?.subnets) ? candidate.subnets : []).entries()) {
    const name = typeof row.name === "string" ? row.name.trim() : ""
    const nameKey = name.toLowerCase()
    if (!name || [...name].length > 80) issues.push({ code: "INVALID_SUBNET_NAME", message: "Subnet name must contain 1 to 80 characters.", field: `subnets.${index}.name` })
    else if (seen.has(nameKey)) issues.push({ code: "DUPLICATE_SUBNET_NAME", message: "Subnet names must be unique, ignoring case and surrounding spaces.", field: `subnets.${index}.name` })
    else seen.add(nameKey)
    if (!Number.isInteger(row.hosts) || row.hosts < 1 || row.hosts > 4_294_967_294) issues.push({ code: "INVALID_HOST_COUNT", message: "Required hosts must be a whole number from 1 to 4,294,967,294.", field: `subnets.${index}.hosts` })
    else validRows.push({ row, index, name, blockSize: 2 ** Math.ceil(Math.log2(row.hosts + 2)) })
  }
  if (issues.length > 0) return { ok: false, issues }

  const ordered = validRows.sort((left, right) => right.row.hosts - left.row.hosts || left.index - right.index)
  const allocations: VlsmAllocation[] = []
  let current = parentNetwork
  for (const item of ordered) {
    const network = current + ((item.blockSize - (current % item.blockSize)) % item.blockSize)
    const broadcast = network + item.blockSize - 1
    if (network > IPV4_MAX || broadcast > IPV4_MAX) return { ok: false, issues: [{ code: "IPV4_OVERFLOW", message: "An allocation would extend beyond 255.255.255.255.", field: "subnets" }] }
    if (network < parentNetwork || broadcast > parentBroadcast) return { ok: false, issues: [{ code: "INSUFFICIENT_ADDRESS_SPACE", message: "Subnet requirements do not fit inside the parent network.", field: "subnets" }] }
    const childCidr = 32 - Math.log2(item.blockSize)
    allocations.push({ requirementId: item.row.id, name: item.name, requiredHosts: item.row.hosts, networkAddress: intToIpv4(network), cidr: childCidr, subnetMask: maskFromCidr(childCidr), firstHost: intToIpv4(network + 1), lastHost: intToIpv4(broadcast - 1), broadcast: intToIpv4(broadcast), usableHosts: item.blockSize - 2, startOffset: network - parentNetwork, blockSize: item.blockSize })
    current = broadcast + 1
  }
  const allocatedAddresses = allocations.reduce((sum, row) => sum + row.blockSize, 0)
  return { ok: true, parent: { networkAddress: intToIpv4(parentNetwork), broadcast: intToIpv4(parentBroadcast), cidr, totalAddresses: parentSize }, allocations, allocatedAddresses, remainingAddresses: parentSize - allocatedAddresses }
}
```

- [ ] **Step 4: Add deterministic seeded invariant coverage**

```ts
import { describe, expect, it } from "vitest"
import { calculateVlsm } from "@/lib/vlsm"

function rng(seed: number) {
  let state = seed >>> 0
  return () => ((state = (state * 1664525 + 1013904223) >>> 0) / 2 ** 32)
}

describe("VLSM invariants", () => {
  const toInt = (ip: string) => ip.split(".").map(Number).reduce((value, octet) => value * 256 + octet, 0)
  for (const seed of [1, 7, 42, 20260812]) {
    it(`keeps allocations aligned, bounded, disjoint, and balanced; seed=${seed}`, () => {
      const random = rng(seed)
      const count = 1 + Math.floor(random() * 12)
      const result = calculateVlsm({ baseNetwork: "10.0.0.0", baseCidr: 8, subnets: Array.from({ length: count }, (_, index) => ({ id: 100 + index, name: `LAN ${index}`, hosts: 1 + Math.floor(random() * 4094) })) })
      expect(result.ok).toBe(true)
      if (!result.ok) return
      for (const [index, row] of result.allocations.entries()) {
        expect(row.startOffset % row.blockSize, `seed=${seed}`).toBe(0)
        expect(row.usableHosts, `seed=${seed}`).toBeGreaterThanOrEqual(row.requiredHosts)
        expect(row.blockSize, `seed=${seed}`).toBe(row.usableHosts + 2)
        if (index > 0) expect(row.startOffset, `seed=${seed}`).toBeGreaterThanOrEqual(result.allocations[index - 1].startOffset + result.allocations[index - 1].blockSize)
        expect(row.startOffset + row.blockSize, `seed=${seed}`).toBeLessThanOrEqual(result.parent.totalAddresses)
        expect(toInt(row.networkAddress), `seed=${seed}`).toBeGreaterThanOrEqual(toInt(result.parent.networkAddress))
        expect(toInt(row.broadcast), `seed=${seed}`).toBeLessThanOrEqual(toInt(result.parent.broadcast))
      }
      expect(result.allocatedAddresses + result.remainingAddresses, `seed=${seed}`).toBe(result.parent.totalAddresses)
    })
  }
})
```

- [ ] **Step 5: Run domain tests**

Run: `pnpm vitest run tests/lib/vlsm.test.ts tests/lib/vlsm-invariants.test.ts`

Expected: PASS, including `/0`, `/30`, signed-32-bit, octet-boundary, exact-fit, one-address overflow, and IPv4-end cases.

- [ ] **Step 6: Commit domain boundary**

```bash
git add lib/vlsm.ts tests/lib/vlsm.test.ts tests/lib/vlsm-invariants.test.ts
git commit -m "feat: validate VLSM plans at domain boundary"
```

### Task 2: Diagnostics Adapter and Landing Proof

**Files:**
- Modify: `lib/planner/diagnostics.ts`
- Modify: `components/home/hero-section.tsx`
- Modify: `components/home/product-proof.tsx`
- Modify: `tests/lib/planner/diagnostics.test.ts`
- Modify: `tests/components/home-page.test.tsx`

**Interfaces:**
- Consumes: `calculateVlsm(VlsmPlanInput)` from Task 1.
- Produces: `diagnosePlan({ baseNetwork: string; baseCidr: string; subnets: SubnetInput[] }): PlanDiagnostics` as a UI-only adapter; no allocation implementation.

- [ ] **Step 1: Rewrite diagnostics tests around engine issue codes**

```ts
it("uses the domain engine for live diagnostics", () => {
  const result = diagnosePlan({ baseNetwork: "192.168.1.0", baseCidr: "30", subnets: [{ id: 1, name: "LAN", hosts: 50 }] })
  expect(result.isValid).toBe(false)
  expect(result.issues).toContainEqual(expect.objectContaining({ code: "INSUFFICIENT_ADDRESS_SPACE", field: "subnets" }))
  expect(result.allocations).toEqual([])
})

it("returns the canonical suggestion unchanged", () => {
  expect(diagnosePlan({ baseNetwork: "192.168.1.5", baseCidr: "24", subnets: [{ id: 1, name: "LAN", hosts: 10 }] }).issues)
    .toContainEqual(expect.objectContaining({ code: "NON_CANONICAL_BASE_NETWORK", suggestion: "192.168.1.0" }))
})
```

- [ ] **Step 2: Run diagnostics tests and confirm type/API failures**

Run: `pnpm vitest run tests/lib/planner/diagnostics.test.ts tests/components/home-page.test.tsx`

Expected: FAIL because diagnostics calls the removed positional API and exposes legacy warning codes.

- [ ] **Step 3: Make diagnostics a thin adapter**

```ts
export function diagnosePlan(input: DiagnosePlanInput): PlanDiagnostics {
  const calculation = calculateVlsm({ baseNetwork: input.baseNetwork, baseCidr: input.baseCidr.trim() === "" ? Number.NaN : Number(input.baseCidr), subnets: input.subnets })
  if (!calculation.ok) return { isValid: false, issues: calculation.issues, allocations: [], totalAddresses: 0, allocatedAddresses: 0, remainingAddresses: 0, utilizationPercent: 0 }
  return {
    isValid: true,
    issues: [],
    allocations: calculation.allocations,
    totalAddresses: calculation.parent.totalAddresses,
    allocatedAddresses: calculation.allocatedAddresses,
    remainingAddresses: calculation.remainingAddresses,
    utilizationPercent: Math.round((calculation.allocatedAddresses / calculation.parent.totalAddresses) * 100),
  }
}
```

Update both landing fixtures to call `calculateVlsm` with numeric CIDR, assert `ok`, and render `allocations`, `parent.totalAddresses`, and `remainingAddresses` from that result. Remove every private parsing, sorting, block-size, CIDR, and capacity calculation outside `lib/vlsm.ts`.

- [ ] **Step 4: Verify landing and diagnostics parity**

Run: `pnpm vitest run tests/lib/planner/diagnostics.test.ts tests/components/home-page.test.tsx`

Expected: PASS; same invalid input produces the same domain issue code everywhere.

- [ ] **Step 5: Commit shared diagnostics**

```bash
git add lib/planner/diagnostics.ts components/home/hero-section.tsx components/home/product-proof.tsx tests/lib/planner/diagnostics.test.ts tests/components/home-page.test.tsx
git commit -m "refactor: derive previews from shared VLSM engine"
```

### Task 3: Planner Submission, Field Errors, and Stale-Result Clearing

**Files:**
- Modify: `hooks/use-calculator-page-controller.ts`
- Modify: `hooks/use-calculator-plan-form.ts`
- Modify: `components/app/calculator-input-section.tsx`
- Modify: `components/app/planner-workspace.tsx`
- Modify: `components/app/live-intelligence.tsx`
- Modify: `app/app/page.tsx`
- Create: `tests/hooks/use-calculator-page-controller.test.tsx`
- Create: `tests/components/calculator-input-section.test.tsx`

**Interfaces:**
- Consumes: `calculateVlsm(input): VlsmCalculationResult`.
- Produces: controller state `{ calculation: VlsmCalculationSuccess | null; submittedIssues: VlsmIssue[]; calculateVLSM(): void }` and field errors keyed by domain `field`.

- [ ] **Step 1: Add invalid-submit boundary tests**

```tsx
it("clears stale results and skips persistence after an invalid submission", () => {
  const saveCalculation = vi.fn()
  const props: UseCalculatorPageControllerArgs = {
    formValues: { baseNetwork: "192.168.1.0", baseCidr: "24", subnets: [{ id: 1, name: "LAN", hosts: 10 }], sourceType: "manual", aiPrompt: null, aiRationale: null },
    isAiPlan: false,
    isCloudLinkedPlan: false,
    shouldSaveToCloud: true,
    isAuthenticated: true,
    signInToSaveMessage: "Sign in.",
    planName: "Test",
    activeCloudPlanId: null,
    updateSuccessMessage: "Updated.",
    saveSuccessMessage: "Saved.",
    saveCalculation,
    calculateVlsm,
    resetPlanForm: vi.fn(),
    setPlanName: vi.fn(),
    setShouldSaveToCloud: vi.fn(),
    setActiveCloudPlanId: vi.fn(),
    emailConfirmedFromQuery: false,
    buildAppUrl: () => "/app",
    resolveViewFromQuery: () => "table",
    replaceToCurrentView: vi.fn(),
  }
  const { result, rerender } = renderHook((nextProps: UseCalculatorPageControllerArgs) => useCalculatorPageController(nextProps), { initialProps: props })
  act(() => result.current.calculateVLSM())
  expect(result.current.calculation?.ok).toBe(true)
  rerender({ ...props, formValues: { ...props.formValues, baseCidr: "30" } })
  act(() => result.current.calculateVLSM())
  expect(result.current.calculation).toBeNull()
  expect(result.current.submittedIssues).toContainEqual(expect.objectContaining({ code: "INSUFFICIENT_ADDRESS_SPACE" }))
  expect(saveCalculation).not.toHaveBeenCalled()
})
```

Export `UseCalculatorPageControllerArgs` from the hook so the test fixture compiles against the real contract.

```tsx
it("associates errors and focuses the plan alert", async () => {
  const props: CalculatorInputSectionProps = {
    baseNetwork: "192.168.1.5",
    baseCidr: "24",
    onBaseNetworkChange: vi.fn(),
    onBaseCidrChange: vi.fn(),
    isAuthenticated: false,
    planName: "",
    onPlanNameChange: vi.fn(),
    isAiPlan: false,
    isCloudLinkedPlan: false,
    isEditingAiCloudPlan: false,
    shouldSaveToCloud: false,
    onShouldSaveToCloudChange: vi.fn(),
    subnets: [{ id: 1, name: "LAN", hosts: 50 }],
    onAddSubnet: vi.fn(),
    onUpdateSubnet: vi.fn(),
    onRemoveSubnet: vi.fn(),
    onSubmit: vi.fn(),
    onReset: vi.fn(),
  }
  render(<CalculatorInputSection {...props} submittedIssues={[
    { code: "NON_CANONICAL_BASE_NETWORK", field: "baseNetwork", message: "Use the canonical network.", suggestion: "192.168.1.0" },
    { code: "INSUFFICIENT_ADDRESS_SPACE", field: "subnets", message: "Requirements do not fit." },
  ]} />)
  expect(screen.getByLabelText("Base Network")).toHaveAttribute("aria-invalid", "true")
  expect(screen.getByLabelText("Base Network")).toHaveAccessibleDescription(/canonical network/i)
  expect(await screen.findByRole("alert")).toHaveFocus()
  expect(screen.getByRole("button", { name: /use 192\.168\.1\.0/i })).toBeEnabled()
})
```

Export `CalculatorInputSectionProps` so this fixture compiles against the real contract.

- [ ] **Step 2: Run planner tests and confirm failure**

Run: `pnpm vitest run tests/hooks/use-calculator-page-controller.test.tsx tests/components/calculator-input-section.test.tsx`

Expected: FAIL because committed state is an allocation array, invalid submit leaves old results, and field issues are not rendered.

- [ ] **Step 3: Store only successful calculations and clear before failure handling**

In `calculateVLSM`, build the typed input once, call the engine once, then use this order:

```ts
const baseCidr = formValues.baseCidr.trim() === "" ? Number.NaN : Number(formValues.baseCidr)
const result = calculateVlsm({ baseNetwork: formValues.baseNetwork, baseCidr, subnets: formValues.subnets })
if (!result.ok) {
  setCalculation(null)
  setCommittedPlanFingerprint(null)
  setSubmittedIssues(result.issues)
  recordCalculationEvent({ event: "validation_failure", issueCodes: [...new Set(result.issues.map((issue) => issue.code))] })
  return
}
setSubmittedIssues([])
setCalculation(result)
setCommittedPlanFingerprint(currentPlanFingerprint)
recordCalculationEvent({ event: "success", issueCodes: [] })
```

Pass `result` to persistence. Remove `canCalculate={diagnostics.isValid}` so submit remains operable and can announce expected failures. Keep live diagnostics advisory; submitted errors are authoritative after submit.

- [ ] **Step 4: Render field and plan issues accessibly**

Use stable IDs: `baseNetwork-error`, `baseCidr-error`, `subnet-${id}-name-error`, `subnet-${id}-hosts-error`, and `plan-errors`. Set `aria-invalid` and `aria-describedby` only when an issue exists. Render plan issues in a `tabIndex={-1}` `role="alert"` region; focus it in an effect when a new non-empty plan issue list arrives. Canonical suggestions use a native button that calls `onBaseNetworkChange(issue.suggestion)`.

Change subnet rows to stack below `768px` and set mobile buttons/inputs to `min-h-11`; keep desktop table density with `md:min-h-9`. Add `maxLength={80}`, `min={1}`, `max={4294967294}`, and disable Add Subnet at 100 rows.

Replace `parseInt(value, 10) || 0` in `updateSubnet` with `value === "" ? 0 : Number(value)` so fractional, non-finite, and above-limit values reach the domain engine unchanged and are rejected instead of silently truncated. Add component assertions for accessible names on Remove subnet and Hide/Show explanations controls.

- [ ] **Step 5: Verify planner error behavior**

Run: `pnpm vitest run tests/hooks/use-calculator-page-controller.test.tsx tests/components/calculator-input-section.test.tsx tests/components/planner-workspace.test.tsx`

Expected: PASS; invalid submissions clear committed output and do not call save, copy, or export.

- [ ] **Step 6: Commit planner boundary**

```bash
git add hooks/use-calculator-page-controller.ts hooks/use-calculator-plan-form.ts components/app/calculator-input-section.tsx components/app/planner-workspace.tsx components/app/live-intelligence.tsx app/app/page.tsx tests/hooks/use-calculator-page-controller.test.tsx tests/components/calculator-input-section.test.tsx tests/components/planner-workspace.test.tsx
git commit -m "feat: enforce validated planner submissions"
```

### Task 4: Successful-Contract Result Views, Clipboard, and PDF

**Files:**
- Modify: `components/app/calculator-results-section.tsx`
- Modify: `components/app/allocation-map.tsx`
- Modify: `components/app/subnet-hierarchy.tsx`
- Modify: `hooks/use-copy-results.ts`
- Modify: `lib/calculator/export-pdf.ts`
- Modify: `tests/components/result-views.test.tsx`
- Modify: `tests/lib/calculator/export-pdf.test.ts`

**Interfaces:**
- Consumes: `VlsmCalculationSuccess` only.
- Produces: `copyResults(calculation)`, `exportVlsmPdf({ calculation, planName, createdAt })`, and views keyed by `allocation.requirementId`.

- [ ] **Step 1: Add identity and parent-utilization tests**

```tsx
it("uses returned requirement IDs after largest-first reordering", async () => {
  const result = calculateVlsm({ baseNetwork: "192.168.1.0", baseCidr: 24, subnets: [
    { id: 41, name: "Small", hosts: 10 },
    { id: 87, name: "Large", hosts: 50 },
  ] })
  if (!result.ok) throw new Error("fixture must be valid")
  const onToggle = vi.fn()
  render(<AllocationMap calculation={result} selectedSubnet={87} onToggleSubnet={onToggle} />)
  expect(screen.getByRole("button", { name: "Large /26, 64 addresses" })).toHaveAttribute("aria-pressed", "true")
})
```

```ts
const mockText = vi.fn()

vi.mock("jspdf", () => ({
  jsPDF: class {
    text = mockText
    setTextColor = vi.fn()
    setFont = vi.fn()
    setFontSize = vi.fn()
    setDrawColor = vi.fn()
    setFillColor = vi.fn()
    rect = vi.fn()
    addPage = vi.fn()
    save = vi.fn()
    internal = { pageSize: { getHeight: () => 842 } }
  },
}))
vi.mock("jspdf-autotable", () => ({ default: vi.fn() }))

it("uses returned parent counts for PDF utilization", async () => {
  const calculation = calculateVlsm({ baseNetwork: "192.168.1.0", baseCidr: 24, subnets: [
    { id: 1, name: "A", hosts: 50 }, { id: 2, name: "B", hosts: 25 }, { id: 3, name: "C", hosts: 10 },
  ] })
  if (!calculation.ok) throw new Error("fixture must be valid")
  await exportVlsmPdf({ calculation, planName: "Branch", createdAt: new Date("2026-08-12T12:00:00Z") })
  expect(mockText).toHaveBeenCalledWith("Allocated: 112 / 256 addresses", 40, expect.any(Number))
})
```

- [ ] **Step 2: Run result/export tests and confirm failure**

Run: `pnpm vitest run tests/components/result-views.test.tsx tests/lib/calculator/export-pdf.test.ts`

Expected: FAIL because consumers accept loose arrays and recover row IDs by matching names.

- [ ] **Step 3: Convert every result consumer to the successful contract**

Replace `subnetIdFor` and all name matching with `result.requirementId`. Use `calculation.parent.totalAddresses`, `calculation.allocatedAddresses`, and `calculation.remainingAddresses` in the table summary, map, hierarchy, copy text, and PDF bar. Disable Copy and PDF whenever `calculation === null` or results are stale.

```ts
export type ExportVlsmPdfArgs = { calculation: VlsmCalculationSuccess; planName?: string | null; createdAt?: Date }

export function useCopyResults() {
  const copyResults = useCallback((calculation: VlsmCalculationSuccess) => {
    const text = calculation.allocations.map((row) => `${row.name}: ${row.networkAddress}/${row.cidr} (Mask: ${row.subnetMask}, Range: ${row.firstHost} - ${row.lastHost})`).join("\n")
    return navigator.clipboard.writeText(text)
  }, [])
  return { copied, copyResults }
}
```

Ensure address actions remain native `<button type="button">` elements with visible focus and `aria-label="Copy <address>"`. Selection uses `aria-pressed` plus border/background, not color alone.

Below `768px`, give Copy, PDF, tabs, subnet-selection buttons, and each address-copy button `min-h-11`; give compact icon/text address actions `min-w-11`. Desktop controls may return to existing compact heights with `md:min-h-0` where the full table row remains keyboard focusable.

- [ ] **Step 4: Verify all result views**

Run: `pnpm vitest run tests/components/result-views.test.tsx tests/lib/calculator/export-pdf.test.ts`

Expected: PASS; table, allocation map, hierarchy, clipboard, and PDF use one returned success object.

- [ ] **Step 5: Commit output contract**

```bash
git add components/app/calculator-results-section.tsx components/app/allocation-map.tsx components/app/subnet-hierarchy.tsx hooks/use-copy-results.ts lib/calculator/export-pdf.ts tests/components/result-views.test.tsx tests/lib/calculator/export-pdf.test.ts
git commit -m "refactor: consume validated calculation results"
```

### Task 5: Persistence Revalidation, Legacy Restoration, and Bigint Migration

**Files:**
- Modify: `lib/queries/calculations.ts`
- Modify: `hooks/use-plan-persistence.ts`
- Modify: `hooks/use-history-restoration.ts`
- Modify: `lib/history.ts`
- Modify: `app/app/page.tsx`
- Create: `supabase/migrations/202608120001_calculation_host_bigint.sql`
- Create: `tests/lib/queries/calculations.test.ts`
- Create: `tests/hooks/use-history-restoration.test.tsx`

**Interfaces:**
- Consumes: raw history inputs and `calculateVlsm`.
- Produces: `buildCalculationPayload(snapshot, options): CalculationInsert`, `recalculateHistoryRecord(record): { inputs: ReplacePlanInput; calculation: VlsmCalculationSuccess | null; issues: VlsmIssue[] }`, inserts/updates built from fresh results, and restore state containing recalculated current results or issues.

- [ ] **Step 1: Add persistence and legacy tests**

```ts
it("rejects an invalid snapshot before a payload exists", () => {
  expect(() => buildCalculationPayload({
    baseNetwork: "192.168.1.0",
    baseCidr: "30",
    subnets: [{ id: 1, name: "LAN", hosts: 50 }],
  }, { sourceType: "manual", title: "Invalid" })).toThrow("Plan validation failed: INSUFFICIENT_ADDRESS_SPACE")
})

it("recalculates duplicate payloads without reading stored result JSON", () => {
  const record: CalculationRecord = {
    id: "legacy", title: "Legacy", source_type: "manual", ai_prompt: null, ai_rationale: null,
    base_network: "192.168.1.0", base_cidr: 24,
    input_subnets: [{ name: "LAN", hosts: 10 }],
    result_subnets: [{ networkAddress: "203.0.113.9" } as VlsmAllocation],
    total_required_hosts: 10, total_usable_hosts: 14, created_at: "2026-01-01T00:00:00Z",
  }
  const payload = buildCalculationPayload({
    baseNetwork: record.base_network,
    baseCidr: String(record.base_cidr),
    subnets: record.input_subnets.map((row, index) => ({ id: index + 1, ...row })),
  }, { sourceType: record.source_type, title: `${record.title} copy` })
  expect(payload.result_subnets).toEqual([expect.objectContaining({ networkAddress: "192.168.1.0" })])
})
```

```tsx
it("blocks invalid legacy results without overwriting the record", async () => {
  const restored = recalculateHistoryRecord({
    id: "legacy", title: "Too large", source_type: "manual", ai_prompt: null, ai_rationale: null,
    base_network: "192.168.1.0", base_cidr: 30,
    input_subnets: [{ name: "LAN", hosts: 50 }],
    result_subnets: [{ networkAddress: "192.168.1.0" } as VlsmAllocation],
    total_required_hosts: 50, total_usable_hosts: 62, created_at: "2026-01-01T00:00:00Z",
  })
  expect(restored.calculation).toBeNull()
  expect(restored.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "INSUFFICIENT_ADDRESS_SPACE" })]))
  expect(restored.inputs).toMatchObject({ baseNetwork: "192.168.1.0", baseCidr: "30" })
})
```

- [ ] **Step 2: Run persistence tests and confirm unsafe behavior**

Run: `pnpm vitest run tests/lib/queries/calculations.test.ts tests/hooks/use-history-restoration.test.tsx`

Expected: FAIL because writes trust caller result arrays and restore trusts historical result JSON.

- [ ] **Step 3: Recalculate at every history write and restore boundary**

Export both pure functions named in this task's interface. `saveOrUpdateCalculation`, AI-save code, and duplicate code must call `buildCalculationPayload` before `.from("calculations")`; on failure throw `Plan validation failed: ${firstIssue.code}` before any Supabase write. Persist the successful `allocations`, derive totals from the success, and store trimmed names.

On restore, ignore `result_subnets`, recreate IDs from input order, call the engine using stored `base_network` and `base_cidr`, and set committed calculation only on success. On failure, load editable inputs, clear results, expose issues, retain record ID for an explicit corrected save, and never update automatically.

- [ ] **Step 4: Add forward-only bigint migration**

```sql
alter table public.calculations
  alter column total_required_hosts type bigint using total_required_hosts::bigint,
  alter column total_usable_hosts type bigint using total_usable_hosts::bigint;
```

- [ ] **Step 5: Verify persistence boundaries**

Run: `pnpm vitest run tests/lib/queries/calculations.test.ts tests/hooks/use-history-restoration.test.tsx tests/components/history-list.test.tsx`

Expected: PASS; invalid legacy rows remain editable but never authoritative or silently rewritten.

- [ ] **Step 6: Commit persistence reliability**

```bash
git add lib/queries/calculations.ts hooks/use-plan-persistence.ts hooks/use-history-restoration.ts lib/history.ts app/app/page.tsx supabase/migrations/202608120001_calculation_host_bigint.sql tests/lib/queries/calculations.test.ts tests/hooks/use-history-restoration.test.tsx
git commit -m "feat: revalidate saved and restored plans"
```

### Task 6: Atomic AI Quota, Prompt Limits, Timeout, and Output Validation

**Files:**
- Modify: `app/api/ai-designer/route.ts`
- Modify: `lib/ai-designer-types.ts`
- Modify: `lib/queries/ai-designer.ts`
- Modify: `components/app/generate-requirements-dialog.tsx`
- Create: `supabase/migrations/202608120002_atomic_ai_quota.sql`
- Create: `tests/api/ai-designer-route.test.ts`
- Modify: `tests/components/generate-requirements-dialog.test.tsx`

**Interfaces:**
- Consumes: sanitized model JSON and `calculateVlsm`.
- Produces: only validated `DesignerPlan`; database RPCs `reserve_ai_design_request(integer, integer, text)` and `complete_ai_design_request(uuid, text, integer)`.

- [ ] **Step 1: Add route tests for limits, validation, timeout, quota, and stable errors**

```ts
const { rpc, completion } = vi.hoisted(() => ({ rpc: vi.fn(), completion: vi.fn() }))

function requestWithPrompt(prompt: string): Request {
  return new Request("http://localhost/api/ai-designer", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt }),
  })
}

function modelJson(plan: object) {
  return { choices: [{ message: { content: JSON.stringify({ title: "Generated", rationale: "Generated requirements.", ...plan }) } }] }
}

it("rejects prompts over 4000 characters before quota reservation", async () => {
  const response = await POST(requestWithPrompt("x".repeat(4001)))
  expect(response.status).toBe(400)
  expect(rpc).not.toHaveBeenCalled()
})

it("marks invalid model output failed and returns a retryable stable error", async () => {
  completion.mockResolvedValue(modelJson({ baseNetwork: "192.168.1.0", baseCidr: 30, subnets: [{ name: "LAN", hosts: 50 }] }))
  const response = await POST(requestWithPrompt("small parent"))
  expect(response.status).toBe(422)
  await expect(response.json()).resolves.toMatchObject({ error: "Generated requirements did not fit a valid IPv4 plan. Try again.", retryable: true })
  expect(rpc).toHaveBeenLastCalledWith("complete_ai_design_request", expect.objectContaining({ p_status: "failed" }))
})

it("never returns provider error text", async () => {
  completion.mockRejectedValue(new Error("secret upstream detail"))
  const response = await POST(requestWithPrompt("office"))
  expect(JSON.stringify(await response.json())).not.toContain("secret upstream detail")
  expect(response.status).toBe(502)
})
```

Use these module mocks in the same test file:

```ts
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
    rpc,
  }),
}))

vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: completion } }
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  rpc.mockResolvedValue({ data: [{ request_id: "request-1", used: 1, remaining: 2 }], error: null })
})
```

- [ ] **Step 2: Run route tests and confirm failure**

Run: `pnpm vitest run tests/api/ai-designer-route.test.ts tests/components/generate-requirements-dialog.test.tsx`

Expected: FAIL because quota is count-then-insert, prompt has no maximum, provider timeout is implicit, and invalid output can be returned as success.

- [ ] **Step 3: Add serialized quota RPCs**

```sql
alter table public.ai_design_requests drop constraint if exists ai_design_requests_status_check;
alter table public.ai_design_requests add constraint ai_design_requests_status_check check (status in ('pending', 'success', 'failed', 'quota_blocked'));

create or replace function public.reserve_ai_design_request(p_limit integer, p_window_hours integer, p_model text)
returns table(request_id uuid, used integer, remaining integer)
language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_used integer; v_id uuid;
begin
  if v_user is null then raise exception 'unauthorized'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
  update public.ai_design_requests set status = 'failed'
    where user_id = v_user and status = 'pending' and created_at < now() - interval '5 minutes';
  select count(*)::integer into v_used from public.ai_design_requests
    where user_id = v_user and status in ('pending', 'success')
      and created_at >= now() - make_interval(hours => p_window_hours);
  if v_used >= p_limit then return query select null::uuid, v_used, 0; return; end if;
  insert into public.ai_design_requests(user_id, prompt, model, status, latency_ms)
    values (v_user, 'redacted', p_model, 'pending', 0) returning id into v_id;
  return query select v_id, v_used + 1, greatest(0, p_limit - v_used - 1);
end $$;

create or replace function public.complete_ai_design_request(p_request_id uuid, p_status text, p_latency_ms integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('success', 'failed') then raise exception 'invalid status'; end if;
  update public.ai_design_requests set status = p_status, latency_ms = greatest(0, p_latency_ms)
    where id = p_request_id and user_id = auth.uid() and status = 'pending';
  if not found then raise exception 'reservation not found'; end if;
end $$;

revoke all on function public.reserve_ai_design_request(integer, integer, text) from public;
revoke all on function public.complete_ai_design_request(uuid, text, integer) from public;
grant execute on function public.reserve_ai_design_request(integer, integer, text) to authenticated;
grant execute on function public.complete_ai_design_request(uuid, text, integer) to authenticated;
drop policy if exists "ai_design_requests_insert_own" on public.ai_design_requests;
```

- [ ] **Step 4: Validate AI output before quota success**

Trim prompt, reject empty or length above 4,000, add `maxLength={4000}` plus a visible character count to the prompt field, reserve only after auth/config/input checks, configure `timeout: 120_000`, and map sanitized subnet rows to IDs before calling the engine. Complete reservation as `success` only after `calculateVlsm` returns `ok: true`; complete it as `failed` on invalid output, empty output, parsing failure, timeout, or provider failure. GET quota snapshots count successful rows in the rolling window plus pending rows newer than five minutes; stale pending rows are excluded.

Generate `const correlationId = crypto.randomUUID()` per POST. Server-log only `{ correlationId, event: "ai_provider_failure", errorName, providerStatus }`; omit error messages, prompts, addresses, and model output. Return stable messages containing the correlation ID but no provider/model raw error text. UI preserves prompt and offers Generate again.

- [ ] **Step 5: Verify AI reliability**

Run: `pnpm vitest run tests/api/ai-designer-route.test.ts tests/components/generate-requirements-dialog.test.tsx`

Expected: PASS; concurrent allowance is reserved in one transaction and only valid plans consume success quota.

- [ ] **Step 6: Commit AI boundary**

```bash
git add app/api/ai-designer/route.ts lib/ai-designer-types.ts lib/queries/ai-designer.ts components/app/generate-requirements-dialog.tsx supabase/migrations/202608120002_atomic_ai_quota.sql tests/api/ai-designer-route.test.ts tests/components/generate-requirements-dialog.test.tsx
git commit -m "feat: validate AI plans with atomic quota"
```

### Task 7: Privacy-Safe Calculation Events and Trust Documentation

**Files:**
- Create: `lib/calculation-events.ts`
- Create: `app/api/calculation-events/route.ts`
- Create: `tests/api/calculation-events-route.test.ts`
- Modify: `hooks/use-calculator-page-controller.ts`
- Modify: `app/app/help/page.tsx`
- Modify: `tests/components/home-page.test.tsx`

**Interfaces:**
- Consumes: `{ event: "success" | "validation_failure"; issueCodes: VlsmIssueCode[] }`.
- Produces: server logs containing counts/classifications only; expanded Help content.

- [ ] **Step 1: Add privacy-boundary route tests**

```ts
function jsonRequest(body: object): Request {
  return new Request("http://localhost/api/calculation-events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

it("accepts only event names and known issue codes", async () => {
  const response = await POST(jsonRequest({ event: "validation_failure", issueCodes: ["INVALID_BASE_NETWORK"] }))
  expect(response.status).toBe(204)
  expect(console.info).toHaveBeenCalledWith("subnify.calculation", { event: "validation_failure", issueCodes: ["INVALID_BASE_NETWORK"] })
})

it("rejects plan content", async () => {
  const response = await POST(jsonRequest({ event: "validation_failure", issueCodes: [], baseNetwork: "10.0.0.0" }))
  expect(response.status).toBe(400)
})
```

- [ ] **Step 2: Run event tests and confirm missing route**

Run: `pnpm vitest run tests/api/calculation-events-route.test.ts`

Expected: FAIL because the event route does not exist.

- [ ] **Step 3: Implement strict privacy-safe event logging**

Use a closed object schema: exactly `event` and `issueCodes`, at most nine unique known codes, JSON body limit enforced by rejecting `content-length > 2048`, and `console.info("subnify.calculation", payload)`. `recordCalculationEvent` calls:

```ts
void fetch("/api/calculation-events", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(payload),
  keepalive: true,
}).catch(() => undefined)
```

Logging transport failure never blocks calculation.

- [ ] **Step 4: Replace Help content with required trust explanations**

Document largest-first allocation, stable tie ordering, network/broadcast reservation, `/31` and `/32` exclusion, canonical base suggestions, parent capacity, allocated addresses, usable hosts, efficiency, a valid `192.168.1.0/24` worked example, a failing `/30` example, deterministic AI validation, stored history fields, and confirmed deletion. Remove unqualified “RFC-compliant” claims.

- [ ] **Step 5: Verify event and Help content**

Run: `pnpm vitest run tests/api/calculation-events-route.test.ts tests/components/home-page.test.tsx`

Expected: PASS; no address, subnet name, or prompt can enter calculation logs.

- [ ] **Step 6: Commit observability and docs**

```bash
git add lib/calculation-events.ts app/api/calculation-events/route.ts tests/api/calculation-events-route.test.ts hooks/use-calculator-page-controller.ts app/app/help/page.tsx tests/components/home-page.test.tsx
git commit -m "docs: add reliability trust guidance"
```

### Task 8: Production Dependency Remediation

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `app/globals.css`
- Create: `app/tailwind-variants.css`

**Interfaces:**
- Consumes: current Next 16/React 19 application.
- Produces: production graph without the `shadcn` CLI and without undocumented moderate/high audit findings.

- [ ] **Step 1: Capture failing production audit**

Run: `pnpm audit --prod`

Expected: FAIL; current graph reports advisories through `next@16.1.7`, `shadcn@4.0.8`, `ws@8.19.0`, and patched transitive packages.

- [ ] **Step 2: Vendor the tiny Tailwind stylesheet and remove the CLI**

Create `app/tailwind-variants.css` with the complete stylesheet:

```css
@theme inline {
  @keyframes accordion-down {
    from { height: 0; }
    to { height: var(--radix-accordion-content-height, var(--accordion-panel-height, auto)); }
  }
  @keyframes accordion-up {
    from { height: var(--radix-accordion-content-height, var(--accordion-panel-height, auto)); }
    to { height: 0; }
  }
}

@custom-variant data-open {
  &:where([data-state="open"]), &:where([data-open]:not([data-open="false"])) { @slot; }
}
@custom-variant data-closed {
  &:where([data-state="closed"]), &:where([data-closed]:not([data-closed="false"])) { @slot; }
}
@custom-variant data-checked {
  &:where([data-state="checked"]), &:where([data-checked]:not([data-checked="false"])) { @slot; }
}
@custom-variant data-unchecked {
  &:where([data-state="unchecked"]), &:where([data-unchecked]:not([data-unchecked="false"])) { @slot; }
}
@custom-variant data-selected { &:where([data-selected="true"]) { @slot; } }
@custom-variant data-disabled {
  &:where([data-disabled="true"]), &:where([data-disabled]:not([data-disabled="false"])) { @slot; }
}
@custom-variant data-active {
  &:where([data-state="active"]), &:where([data-active]:not([data-active="false"])) { @slot; }
}
@custom-variant data-horizontal { &:where([data-orientation="horizontal"]) { @slot; } }
@custom-variant data-vertical { &:where([data-orientation="vertical"]) { @slot; } }
@utility no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}
```

Change the package import in `app/globals.css` to:

```css
@import "./tailwind-variants.css";
```

Then run: `pnpm remove shadcn`

Expected: `package.json` has no `shadcn` dependency and CSS builds from the local file.

- [ ] **Step 3: Upgrade patched compatible releases together**

Run:

```bash
pnpm up next@16.3.0 eslint-config-next@16.3.0 react@19.2.8 react-dom@19.2.8 @supabase/supabase-js@2.112.3 @supabase/ssr@0.12.4 jspdf-autotable@5.0.8 sonner@2.0.8 zustand@5.0.14 tailwind-merge@3.6.0
pnpm pkg set 'pnpm.overrides.dompurify=3.4.13' 'pnpm.overrides.ws=8.21.3'
pnpm install
pnpm dedupe
```

Expected: Next and ESLint config remain on the same release; React remains 19; `dompurify` and `ws` resolve to patched versions.

- [ ] **Step 4: Verify dependency and framework gates**

Run:

```bash
pnpm audit --prod
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Expected: audit contains zero moderate, high, or critical findings; lint, TypeScript, unit/component tests, and production build all exit 0. Any remaining low finding may remain only when no patched compatible version exists; record its package path and reachability in the release notes, not as a moderate/high exemption.

- [ ] **Step 5: Commit dependency remediation**

```bash
git add package.json pnpm-lock.yaml app/globals.css app/tailwind-variants.css
git commit -m "chore: remediate production dependencies"
```

### Task 9: Browser Acceptance and Complete Release Gate

**Files:**
- Modify: `tests/e2e/planner.spec.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: completed Reliability v1 application.
- Produces: automated desktop/mobile acceptance coverage and updated operating instructions.

- [ ] **Step 1: Add browser regression scenarios**

```ts
test("rejects a /30 plan, clears stale output, and keeps exports disabled", async ({ page }) => {
  await page.goto("/app")
  await page.getByRole("button", { name: "Calculate VLSM" }).click()
  await expect(page.getByRole("heading", { name: "Committed results" })).toBeVisible()
  await page.getByLabel("CIDR Notation").fill("30")
  await page.getByRole("button", { name: "Calculate VLSM" }).click()
  await expect(page.getByRole("alert")).toContainText(/do not fit/i)
  await expect(page.getByText(/run a valid calculation/i)).toBeVisible()
  await expect(page.getByRole("button", { name: "Copy" })).toBeDisabled()
  await expect(page.getByRole("button", { name: "PDF" })).toBeDisabled()
})

test("applies a canonical suggestion and remains usable at 390x844", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/app")
  await page.getByLabel("Base Network").fill("192.168.1.5")
  await page.getByRole("button", { name: "Calculate VLSM" }).click()
  await page.getByRole("button", { name: "Use 192.168.1.0" }).click()
  await expect(page.getByLabel("Base Network")).toHaveValue("192.168.1.0")
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  for (const target of await page.locator("form button, form input").all()) expect((await target.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44)
})
```

Add this complete success scenario beside the two regressions:

```ts
test("commits one contract to table, map, hierarchy, clipboard, and PDF", async ({ page, context }) => {
  const consoleErrors: string[] = []
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()) })
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/app")
  await page.getByRole("button", { name: "Calculate VLSM" }).click()

  await expect(page.getByRole("row").filter({ hasText: "LAN A" })).toContainText("192.168.1.0")
  await expect(page.getByRole("row").filter({ hasText: "LAN A" })).toContainText("/26")
  await expect(page.getByRole("row").filter({ hasText: "LAN B" })).toContainText("192.168.1.64")
  await expect(page.getByRole("row").filter({ hasText: "LAN B" })).toContainText("/27")
  await expect(page.getByRole("row").filter({ hasText: "LAN C" })).toContainText("192.168.1.96")
  await expect(page.getByRole("row").filter({ hasText: "LAN C" })).toContainText("/28")

  await page.getByRole("tab", { name: "Allocation map" }).click()
  await page.getByRole("button", { name: "LAN B /27, 32 addresses" }).click()
  await page.getByRole("tab", { name: "Hierarchy" }).click()
  await expect(page.getByRole("button", { name: /LAN B 192\.168\.1\.64\/27 selected/ })).toHaveAttribute("aria-pressed", "true")
  await page.getByRole("tab", { name: "Table" }).click()
  await expect(page.getByRole("row").filter({ hasText: "LAN B" })).toHaveAttribute("aria-selected", "true")

  await page.getByRole("button", { name: "Copy" }).click()
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("LAN B: 192.168.1.64/27")
  const download = page.waitForEvent("download")
  await page.getByRole("button", { name: "PDF" }).click()
  await expect(download).resolves.toBeTruthy()
  expect(consoleErrors).toEqual([])
})
```

Task 5 hook tests cover invalid legacy restoration without overwrite. Task 6 route/component tests cover invalid AI output, retryability, and absence from history; no authenticated external Supabase fixture is required for browser acceptance.

- [ ] **Step 2: Update README operating contract**

Document the canonical parent requirement, `/0`–`/30` model, `1`–`100` rows, deterministic AI validation, migrations `202608120001` and `202608120002`, and verification commands. Link the Reliability v1 spec and this plan.

- [ ] **Step 3: Run full automated gate**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm audit --prod
```

Expected: every command exits 0; Playwright passes desktop and `390x844`; no console errors or horizontal clipping; production audit has no undocumented moderate/high findings.

- [ ] **Step 4: Manual browser verification**

At desktop and `390x844`, verify default success, `/30` failure announcement and focus, canonical suggestion, editable rows down to `320px`, visible keyboard focus, all three result views, address copy, full-result copy, PDF export, and disabled outputs after failure. Enable reduced motion and confirm planner transitions complete without visible animation.

- [ ] **Step 5: Commit release verification**

```bash
git add tests/e2e/planner.spec.ts README.md
git commit -m "test: verify Reliability v1 acceptance"
```

## Final Verification Checklist

- [ ] `rg -n "calculateVlsm\(" --glob '*.{ts,tsx}'` shows every caller passing `{ baseNetwork, baseCidr, subnets }`.
- [ ] `rg -n "find\(.*name|subnet\.name ===|result\.name ===" components hooks lib` finds no result-to-input identity recovery.
- [ ] `rg -n "shadcn" package.json pnpm-lock.yaml app/globals.css` finds no production package/import reference.
- [ ] `rg -n "RFC-compliant|raw provider|OPENROUTER_API_KEY is not configured" app components lib` finds no client-facing unsupported trust or infrastructure detail.
- [ ] All approved spec acceptance criteria map to Tasks 1–9; no non-goal work appears in the diff.
