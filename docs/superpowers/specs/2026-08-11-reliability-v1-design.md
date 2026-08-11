# Subnify Reliability v1 Design

**Status:** Approved for implementation planning

**Date:** 2026-08-11

**Owner:** Subnify
**Target:** The existing Next.js web application

## Summary

Reliability v1 makes Subnify's IPv4 VLSM output safe to trust. It replaces the duplicated, permissive allocation logic with one validated calculation boundary, prevents plans from escaping their declared parent network, adds automated correctness coverage, improves calculator accessibility, and removes known runtime dependency debt.

This phase deliberately preserves the current product shape. AI design, history, PDF export, and the three result views remain, but every path that creates or restores a plan must use the same deterministic validation rules.

## Problem

The current calculator accepts a base CIDR in the UI but does not pass it to the allocation function. A plan declared as `192.168.1.0/30` can therefore return `/26`, `/27`, and `/28` allocations without warning. IPv4 strings, host counts, parent boundaries, and total capacity are also not validated at the calculation boundary.

The same allocation algorithm is duplicated in the landing-page preview, which creates a second source of truth. There is no automated test suite for this deterministic networking logic. Several calculator interactions are not keyboard accessible, the help content does not explain calculation assumptions, and the production dependency graph contains known advisories that need remediation or explicit triage.

## Goals

1. Make invalid or impossible plans impossible to present, export, or save as valid.
2. Establish one shared IPv4/VLSM engine for manual, preview, AI-generated, and restored plans.
3. Return actionable, field-specific errors without throwing for expected user mistakes.
4. Cover the networking invariants with deterministic automated tests.
5. Make all calculator controls and copy interactions keyboard and screen-reader accessible.
6. Remove avoidable production dependency exposure and document any advisories that cannot be removed immediately.
7. Preserve the existing visual language and core user workflow.

## Non-goals

- IPv6 allocation.
- RFC 3021 `/31` point-to-point behavior or `/32` host routes.
- Collaboration, share links, version history, comments, or approvals.
- Vendor configuration, NetBox, Terraform, Ansible, CSV, or API integrations.
- New AI capabilities, models, prompt features, or higher quotas.
- Pricing, billing, teams, or monetization.
- A broad visual redesign.
- Refactoring unrelated shared UI components.

## Product Decisions

### Addressing model

Reliability v1 uses the traditional IPv4 subnet model in which every allocated child block reserves a network address and broadcast address. A subnet requiring one or two usable hosts therefore receives a `/30`. Parent prefixes must be between `/0` and `/30` inclusive.

The base address must be the canonical network address for the supplied prefix. Subnify does not silently rewrite a host address. For example, `192.168.1.5/24` is rejected with an error that suggests `192.168.1.0/24`. This keeps saved plans and exported documentation explicit.

Public and private IPv4 ranges are accepted. The UI may identify RFC 1918 ranges, but it must not claim that public ranges are invalid.

### Allocation policy

- Allocate subnets largest-first by required usable hosts.
- Preserve original input order when two requirements have the same host count.
- Align every child to its calculated block boundary.
- Require every child network and broadcast address to remain inside the parent block.
- Reject the entire plan if any requirement cannot fit. Partial results must not be returned as success.
- Treat subnet names as case-insensitively unique after trimming.
- Return calculated results in allocation order and retain each row's original input identifier.

### Input limits

- Base address: exactly four decimal IPv4 octets, each from `0` through `255`.
- Parent CIDR: integer from `0` through `30`.
- Subnet count: `1` through `100`.
- Subnet name: trimmed, non-empty, at most `80` Unicode characters.
- Required hosts: integer from `1` through `4,294,967,294`.
- Total and derived address counts must remain within the unsigned 32-bit IPv4 address space.

Postgres aggregate host columns must use `bigint` so valid large IPv4 counts are not truncated. JSON payloads continue to store individual requirements and results.

## Domain Interface

The shared engine receives one object instead of separate positional arguments:

```ts
export type VlsmPlanInput = {
  baseNetwork: string
  baseCidr: number
  subnets: Array<{
    id: number
    name: string
    hosts: number
  }>
}

export type VlsmIssueCode =
  | "INVALID_BASE_NETWORK"
  | "INVALID_BASE_CIDR"
  | "NON_CANONICAL_BASE_NETWORK"
  | "INVALID_SUBNET_COUNT"
  | "INVALID_SUBNET_NAME"
  | "DUPLICATE_SUBNET_NAME"
  | "INVALID_HOST_COUNT"
  | "INSUFFICIENT_ADDRESS_SPACE"
  | "IPV4_OVERFLOW"

export type VlsmIssue = {
  code: VlsmIssueCode
  message: string
  field: "baseNetwork" | "baseCidr" | `subnets.${number}.name` | `subnets.${number}.hosts` | "subnets"
  suggestion?: string
}

export type VlsmCalculationResult =
  | {
      ok: true
      parent: {
        networkAddress: string
        broadcast: string
        cidr: number
        totalAddresses: number
      }
      allocations: VlsmAllocation[]
      allocatedAddresses: number
      remainingAddresses: number
    }
  | {
      ok: false
      issues: VlsmIssue[]
    }

export function calculateVlsm(input: VlsmPlanInput): VlsmCalculationResult
```

`VlsmAllocation` retains the current display and export fields and adds `requirementId: number`. Consumers must not recover row identity by matching names.

Expected validation failures return `{ ok: false }`. Programmer errors and unavailable infrastructure may still throw at their relevant boundaries.

## Validation and Calculation Flow

1. Parse and validate the IPv4 address without bitwise coercion of malformed values.
2. Validate the CIDR and derive the parent mask, canonical network, broadcast, and address count.
3. Reject a non-canonical base address and include the canonical address in `suggestion`.
4. Validate subnet count, names, uniqueness, and integer host requirements.
5. Derive each required block size using `hosts + 2`, rounded up to the next power of two.
6. Stable-sort requirements by block size descending.
7. Allocate each block at the next valid boundary.
8. Before accepting a block, verify that its network and broadcast are inside the parent and inside IPv4.
9. Return all allocations and parent utilization only when every requirement succeeds.

Arithmetic must use non-negative JavaScript numbers. The largest supported value is `2^32`, which remains exactly representable. Bitwise operators may be used only after range validation and only where their signed 32-bit behavior cannot alter the result; arithmetic conversion is preferred for clarity.

## Application Integration

### Planner

Submitting the calculator calls the shared engine with the visible base address, CIDR, and subnet rows. On failure:

- Existing results are cleared so stale valid output cannot appear beside invalid inputs.
- No cloud save, history update, PDF export, or copy operation is triggered.
- Field issues appear adjacent to the relevant controls.
- Plan-level capacity issues appear above the submit actions and receive focus.
- A summary region uses `role="alert"` so submission failures are announced immediately.

On success, the planner displays, saves, copies, and exports only the returned normalized allocation object.

### Landing-page preview

The preview imports the shared engine and removes its private allocation implementation. It uses the same limits and errors as the planner. Preview errors may use shorter copy, but the issue codes and acceptance behavior must remain identical.

### AI designer

Model output remains untrusted input. After schema sanitation, the generated plan passes through the shared engine before it is displayed or saved. An invalid AI plan is not charged as a successful usable design and is not inserted into calculation history. The user receives a retryable message without raw provider details.

The quota reservation and completion update must be atomic at the database boundary so concurrent requests cannot exceed the configured allowance. Prompts are trimmed and limited to `4,000` characters. Provider requests use an explicit timeout of `120` seconds.

### History restoration

Restored inputs are recalculated with the current engine. Stored result JSON is treated as historical display data, not authoritative output. If a legacy plan is invalid under Reliability v1, the app explains the issue and does not silently overwrite it. The user may edit the inputs and save a corrected plan.

### PDF and clipboard output

Export and copy actions consume only a successful calculation result. They remain disabled after validation failure. PDF utilization bars use the parent's returned address counts rather than recalculating CIDR values independently.

## Accessibility Requirements

- Every icon-only action has an accessible name, including subnet deletion and visibility toggles.
- Address-copy interactions are native buttons or links, not click handlers on table cells or `<code>` elements.
- Keyboard focus remains visible.
- Validation errors are programmatically associated with their fields using `aria-describedby` and `aria-invalid`.
- Plan-level errors are announced and focused after submission.
- At viewport widths below `768px`, every interactive calculator target is at least `44px` by `44px`. Desktop table controls may remain compact but must have an equivalent keyboard-focusable action.
- At widths down to `320px`, subnet name and host inputs remain usable without clipping. Rows may stack vertically.
- Motion respects `prefers-reduced-motion` for calculator transitions.
- Color is not the only signal for allocation selection or error state.

## Help and Trust Content

Replace the placeholder Help page with concise documentation covering:

- Largest-first VLSM allocation.
- The traditional network/broadcast reservation model.
- Why `/31` and `/32` are excluded in Reliability v1.
- Canonical base-network requirements.
- Capacity, allocated addresses, usable hosts, and efficiency definitions.
- One valid worked example and one insufficient-capacity example.
- AI-generated plans being validated by the deterministic engine.
- What account history stores and how a user deletes it.

The UI must stop describing every output as RFC-compliant unless the exact RFC claim is documented and tested.

## Dependency and Security Work

- Upgrade Next.js and `eslint-config-next` together to a release that resolves all advisories affecting the installed `16.1.7` line and remains compatible with React 19.
- Remove the `shadcn` CLI from production dependencies. If the CLI is retained, place it in `devDependencies`; otherwise remove it entirely.
- Update direct dependencies and the lockfile to remove patched transitive advisories where compatible versions exist.
- Run `pnpm audit --prod` after upgrades.
- Any remaining moderate or high finding must be documented with package path, runtime reachability, mitigation, owner, and review date. Reliability v1 has no acceptance exemption for an undocumented high finding.
- Do not expose raw OpenRouter or model error strings to clients. Log a correlation identifier server-side and return stable user-facing errors.
- Preserve Supabase authentication and RLS checks for history and AI routes.

## Test Strategy

### Unit tests

Use Vitest for the domain engine. Tests must cover:

1. The current default `192.168.1.0/24` example and its exact `/26`, `/27`, and `/28` allocations.
2. A `/30` parent rejecting the default requirements with `INSUFFICIENT_ADDRESS_SPACE`.
3. Invalid octet count, non-numeric octets, negative octets, octets above `255`, and surrounding whitespace behavior.
4. CIDRs below `0`, above `30`, fractional values, empty values, and non-numeric values.
5. Non-canonical bases such as `192.168.1.5/24`, including suggestion `192.168.1.0`.
6. Empty, whitespace-only, overlong, and case-insensitively duplicate names.
7. Zero, negative, fractional, non-finite, and above-limit host counts.
8. Stable ordering for equal-sized requirements.
9. Alignment across octet and signed-32-bit boundaries.
10. Exact-fit parents, one-address overflow, and IPv4-end overflow.
11. `/0` allocation from `0.0.0.0` and `/30` minimum-host allocations.
12. Every successful allocation remaining inside the parent and never overlapping another allocation.

### Property-style invariants

Generate deterministic seeded valid plans and assert:

- Allocation network addresses are aligned to their block sizes.
- Allocation ranges never overlap.
- Network and broadcast addresses remain inside the parent.
- `usableHosts >= requiredHosts`.
- `blockSize === usableHosts + 2`.
- `allocatedAddresses + remainingAddresses === parent.totalAddresses`.

The seed is printed on failure so a case can be reproduced.

### Component and route tests

- Planner renders field and plan-level issues and clears stale results.
- Copy, export, and persistence do not run after invalid submission.
- Landing preview and planner return the same issue codes for the same inputs.
- AI plans are validated before display and persistence.
- Legacy invalid history records are blocked without being overwritten.
- All icon actions have accessible names.
- Address copy controls are keyboard operable.

### Browser verification

Verify at desktop width and at `390x844`:

- Default calculation succeeds.
- `/30` capacity failure is visible, announced, and does not show old results.
- Non-canonical base suggestions are usable.
- Subnet rows remain editable without horizontal clipping.
- Table, card, and visualizer views render the same allocations.
- Copy and PDF export work after success and remain disabled after failure.

## Data Migration

Add a forward-only Supabase migration that changes `calculations.total_required_hosts` and `calculations.total_usable_hosts` from `integer` to `bigint`. Existing values cast without loss. No stored calculation rows are rewritten during deployment.

Legacy rows remain readable. They are validated and recalculated only when opened. Saving a corrected legacy plan updates its result payload using the Reliability v1 engine.

## Observability

- Log validation issue codes in aggregate without storing addresses, subnet names, or prompts.
- Log AI provider failures using a generated correlation identifier.
- Record calculation success and validation failure counts separately.
- Do not add third-party analytics as part of this phase; use the application's existing server logging surface.

## Rollout

1. Ship the shared engine and tests behind no feature flag because the existing behavior can return invalid plans.
2. Integrate the planner and landing preview in the same release so there is never more than one active algorithm.
3. Apply the bigint migration before enabling saves from the new engine.
4. Integrate AI and history validation before declaring the release complete.
5. Complete dependency upgrades, accessibility verification, and Help content before removing the Alpha reliability warning.

If previously accepted inputs become invalid, the app explains the exact rule and offers a correction suggestion where one can be calculated. It never silently falls back to the previous engine.

## Acceptance Criteria

Reliability v1 is complete when all of the following are true:

- The parent CIDR participates in every calculation path.
- The `/30` default-plan regression is covered by an automated test and rejected in the UI.
- Malformed, non-canonical, out-of-range, duplicate, and over-capacity inputs cannot be displayed, copied, exported, or persisted as valid.
- Planner, landing preview, AI designer, history restoration, clipboard, visualizer, and PDF export consume the same successful calculation contract.
- The duplicated landing-page allocation algorithm is removed.
- Unit, invariant, component, and route tests pass.
- ESLint, TypeScript, and the production build pass.
- Desktop and `390x844` browser verification passes without console errors or horizontal clipping.
- `pnpm audit --prod` has no undocumented moderate or high findings.
- The `shadcn` CLI is absent from production dependencies.
- The Help page documents the calculation model and data behavior.
- No unrelated product feature or visual redesign is included.

## Success Measures

For the first 30 days after release:

- Zero known cases where a successful plan exceeds its parent network.
- Zero divergence between preview and planner results for identical inputs.
- Every reported calculation defect is reproducible through an automated test before correction.
- Validation failures are classified by issue code, enabling the team to identify confusing fields without collecting network-plan contents.

## Risks and Mitigations

- **Stricter validation surprises existing users:** show precise errors and canonical-address suggestions; preserve legacy rows until users choose to correct them.
- **Large IPv4 values overflow storage:** migrate aggregate columns to `bigint` before new saves.
- **AI output becomes less frequently usable:** validate before charging success and provide a retry path.
- **Dependency upgrades introduce framework regressions:** upgrade Next.js and its ESLint config together, then run the complete verification gate.
- **Scope expands into product redesign:** enforce the non-goals and accept only changes directly supporting correctness, accessibility, documentation, or security.
