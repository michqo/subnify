# Subnify Product Roadmap and Portfolio Positioning

**Status:** Approved roadmap direction

**Date:** 2026-08-13

**Owner:** Subnify / Miqal

**Horizon:** Five sequential product releases. Release order is binding; calendar dates are intentionally excluded.

## Overview

Subnify will grow from a reliable IPv4 VLSM planner into a deterministic IP address planning workspace for designing, validating, sharing, and exporting IPv4 and IPv6 plans. The roadmap optimizes for genuine user value and defensible engineering depth rather than generic SaaS breadth.

Subnify also acts as a flagship Miqal portfolio project. Each release must produce both a useful product increment and evidence that communicates the engineering behind it: architecture, trade-offs, verification, security boundaries, and measurable quality.

This document governs roadmap scope and sequencing. It does not authorize all five releases as one implementation project. Before work begins on a release, that release receives its own approved design specification and implementation plan.

## Current Baseline

Subnify currently provides:

- deterministic IPv4 VLSM allocation for canonical parent prefixes from `/0` through `/30`;
- live validation and capacity diagnostics;
- synchronized table, allocation-map, and hierarchy views;
- templates and an authenticated AI requirements draft flow;
- Supabase authentication, row-level-security-protected history, rename, duplicate, reopen, and confirmed deletion;
- clipboard and PDF output;
- responsive, keyboard-accessible light and dark interfaces using `@miqal/theme`;
- Vitest and Playwright coverage, production builds, and a production dependency audit gate.

The active technical-editorial refinement remains part of Release 1. Current product behavior and Reliability v1 contracts remain the baseline for every later release.

## Product Position

Subnify is a hybrid professional and learning tool, weighted toward practical network planning.

**Product statement:**

> A deterministic IP address planning workspace for designing, validating, sharing, and exporting IPv4 and IPv6 plans.

### Primary users

- Network students and junior network engineers validating address plans.
- Homelab builders planning segmented private networks.
- Small IT teams producing clear address-allocation artifacts.

### Secondary users

- Recruiters and hiring managers evaluating product engineering work.
- Developers evaluating reusable calculation and automation interfaces.

### User value

- Results are explainable and reproducible.
- Invalid or impossible plans cannot appear, save, publish, or export as valid.
- Plans can move between the web app, files, shared pages, and later automation tools.
- IPv4 and IPv6 use distinct domain rules instead of a misleading shared abstraction.

### Portfolio value

The roadmap should demonstrate:

- deterministic algorithms and domain modeling;
- accessible data-dense frontend design;
- schema evolution and backward compatibility;
- authentication, RLS, privacy, and explicit publishing boundaries;
- guarded AI integration;
- protocol-aware IPv6 arithmetic;
- reusable libraries, CLI design, and automated release quality.

## Strategic Decisions

1. **Flagship technical product over mini-SaaS.** Domain depth, portability, and automation take priority over billing, teams, or collaboration.
2. **Shared identity, independent products.** Miqal apps share theme, product navigation, metadata conventions, and quality standards; they do not share databases or authentication without a real user need.
3. **Deterministic engine remains authoritative.** UI, AI, imported documents, restored history, public shares, and CLI input all pass through the appropriate deterministic address-family engine.
4. **Private by default.** Saving a plan never publishes it. Public sharing is a separate, explicit, revocable action.
5. **Portfolio evidence ships with product code.** A release is incomplete without the artifacts needed to explain and verify it.
6. **No calendar promises.** Releases advance only after their acceptance gates pass.

## Roadmap Summary

| Release                | Product outcome                                        | Primary engineering signal                        |
| ---------------------- | ------------------------------------------------------ | ------------------------------------------------- |
| 1. Portfolio-ready     | Complete, credible public product and case study       | Product ownership and release discipline          |
| 2. Portable plans      | Versioned files and secure read-only sharing           | Contracts, migrations, privacy, data portability  |
| 3. Advanced IPv4       | Reservations, fixed placement, and revision comparison | Algorithms, domain modeling, complex state        |
| 4. IPv6 and dual stack | Protocol-correct prefix planning                       | BigInt arithmetic and abstraction design          |
| 5. Automation surface  | Stable schema, core interfaces, and CLI                | Library, CLI, interoperability, developer tooling |

## Release 1 — Portfolio-ready

### Goal

Make the current product understandable within one minute, useful without registration, operationally credible, and easy to present from the Miqal portfolio or a resume.

### Scope

- Finish the approved technical-editorial refinement.
- Provide one-click example plans that open in the planner without authentication.
- Keep manual anonymous planning, copy, and local export available.
- Publish stable desktop and mobile product screenshots.
- Add concise architecture, reliability, security, and test documentation.
- Add product version, changelog, and release status information.
- Replace the portfolio `MVP` label with a concrete release label after all gates pass.
- Add a portfolio case study covering problem, constraints, architecture, decisions, and verification.
- Capture measurable accessibility, responsive, performance, build, test, and audit results.

### Exit evidence

- Live public URL and source repository.
- One reproducible demo scenario.
- Architecture diagram and data-flow summary.
- Desktop and mobile screenshots in both themes.
- Release-gate record.
- Portfolio case study and one resume-ready bullet.

## Release 2 — Portable plans

### Goal

Turn a calculation into a durable, versioned technical artifact that can be imported, exported, and deliberately shared.

### Scope

- Define a versioned `.subnify.json` document format.
- Validate imports before changing editor state.
- Preview imported document metadata and migration effects before applying.
- Export JSON, CSV, PDF, and clipboard formats from the same successful plan.
- Add plan descriptions, notes, and lightweight tags.
- Add explicit public read-only snapshots.
- Keep snapshots private until the owner chooses Publish.
- Allow the owner to revoke a public snapshot.
- Exclude owner identity, prompts, private notes, and account metadata from public payloads unless a field is explicitly marked public.
- Support the current document major version and the immediately previous major version through explicit migrations.

### Exit evidence

- Published JSON Schema and example documents.
- Document round-trip and migration tests.
- Threat model for public sharing.
- RLS and revocation test evidence.
- Case-study section explaining schema versioning and privacy decisions.

## Release 3 — Advanced IPv4

### Goal

Support realistic IPv4 planning constraints that ordinary sequential subnet calculators cannot represent.

### Scope

- Reserve arbitrary valid ranges inside the parent network.
- Place selected child subnets at fixed network addresses.
- Mix fixed, reserved, and automatically allocated space.
- Allocate automatic requirements into valid gaps without overlap.
- Explain fragmentation and insufficient contiguous space separately from insufficient total space.
- Add optional gateway, DHCP range, VLAN ID, purpose, and technical notes to a requirement.
- Preserve synchronized selection across table, map, and hierarchy.
- Add immutable plan revisions and side-by-side revision comparison.
- Display field, allocation, and metadata differences without mutating either compared revision.

### Exit evidence

- Gap-aware allocation design and invariant suite.
- Worked examples for fixed placement, fragmentation, and conflict resolution.
- Revision data model and migration documentation.
- Browser coverage for dense and mobile visualizations.
- Case-study section focused on algorithmic trade-offs.

## Release 4 — IPv6 and dual stack

### Goal

Add protocol-correct IPv6 prefix planning without importing IPv4 reservation rules or unsafe number arithmetic.

### Scope

- Introduce an IPv6-specific canonical parsing and prefix-allocation engine.
- Use `BigInt`-safe 128-bit arithmetic internally.
- Format displayed addresses according to RFC 5952 canonical text rules.
- Define IPv6 requirements by child prefix length and count, not IPv4-style usable-host counts.
- Do not reserve network or broadcast addresses in IPv6 allocations.
- Recommend `/64` where appropriate without rejecting valid non-`/64` use cases.
- Support IPv6 table, map, hierarchy, copy, JSON, CSV, and PDF output.
- Pair IPv4 and IPv6 requirements in an explicit dual-stack plan model.
- Keep validation issues and calculations isolated by address family while allowing a combined presentation.

### Exit evidence

- IPv6 domain specification with RFC references.
- Canonicalization and 128-bit boundary tests.
- Property-style allocation invariants.
- Dual-stack example plan and visual evidence.
- Case-study section explaining why IPv4 and IPv6 use separate models.

## Release 5 — Automation surface

### Goal

Make Subnify plans and deterministic validation useful outside the browser without creating a premature public platform.

### Scope

- Stabilize address-family calculation interfaces behind a versioned core contract.
- Publish the plan JSON Schema and generated TypeScript types.
- Add a small CLI that validates and calculates `.subnify.json` documents.
- Support human-readable and machine-readable JSON CLI output.
- Add CSV import for existing subnet inventories.
- Guarantee web and CLI parity by running shared fixtures through the same engine.
- Consider NetBox or Terraform-oriented export only after the neutral plan schema is stable and a concrete mapping is documented.
- Add an HTTP API only when a real integration requires remote execution; the roadmap does not require one.

### Exit evidence

- CLI package, usage reference, and exit-code contract.
- Shared web/CLI conformance suite.
- Versioning and deprecation policy.
- Example CI validation workflow.
- Case-study section focused on reusable domain boundaries.

## Functional Requirements

### Roadmap-wide requirements

**FR-CORE-001 — Deterministic authority**\
When any manual, restored, imported, AI-generated, shared, or CLI plan is evaluated, Subnify shall validate it through the deterministic engine for its address family before presenting it as valid.

**FR-CORE-002 — Invalid result boundary**\
When plan validation fails, Subnify shall prevent saving, publishing, copying, exporting, or returning calculated results for that invalid state.

**FR-CORE-003 — Anonymous core workflow**\
While a user is signed out, Subnify shall allow manual planning, built-in examples, result inspection, clipboard output, and local file export without requiring registration.

**FR-CORE-004 — Account boundary**\
Where cloud history, private metadata, publishing, or revocation is used, Subnify shall require an authenticated owner and enforce ownership at the database boundary.

**FR-CORE-005 — Miqal identity**\
The product shall use the canonical Miqal theme, product identity, app registry, metadata conventions, and accessibility standards while retaining Subnify-specific composition and domain language.

**FR-CORE-006 — Evidence gate**\
When a roadmap release is declared complete, the repository and portfolio shall contain its required demo, documentation, screenshots, verification results, and resume evidence.

### Release 1 requirements

**FR-R1-001 — Example entry**\
When a visitor chooses a documented example, Subnify shall open the planner with deterministic example inputs without creating cloud history or requiring authentication.

**FR-R1-002 — Demo clarity**\
When a first-time visitor opens the product, Subnify shall expose a path from product purpose to a valid result without requiring prior networking knowledge or account setup.

**FR-R1-003 — Case study**\
When Release 1 passes its quality gates, the Miqal portfolio shall present Subnify as a released project and link to its live demo, source, architecture, and verification story.

**FR-R1-004 — Release state**\
The product repository shall publish a semantic product version, changelog entry, supported feature boundary, and current release status.

### Release 2 requirements

**FR-R2-001 — Versioned document**\
Every `.subnify.json` export shall identify its schema version, address family, plan metadata, inputs, and normalized calculated output fields defined by the published schema.

**FR-R2-002 — Import preview**\
When a user selects a plan document, Subnify shall validate its structure, version, and domain inputs and show a preview before replacing current editor state.

**FR-R2-003 — Import atomicity**\
When an import is invalid, unsupported, or cancelled, Subnify shall preserve the existing plan without partial changes.

**FR-R2-004 — Format consistency**\
When a successful plan is exported as JSON, CSV, PDF, or clipboard text, every format shall derive from the same normalized calculation result.

**FR-R2-005 — Explicit publishing**\
While a plan is private, when its owner chooses Publish and confirms the public fields, Subnify shall create a read-only public snapshot without changing the private source plan.

**FR-R2-006 — Revocation**\
While a public snapshot exists, when its owner revokes it, Subnify shall make the public URL unavailable without deleting the private source plan.

**FR-R2-007 — Public minimization**\
Public snapshot responses shall exclude owner identity, authentication metadata, AI prompts, private notes, and unpublished revision data.

**FR-R2-008 — Schema migration**\
When a document from the immediately previous supported major version is imported, Subnify shall apply an explicit deterministic migration and disclose the target version before the user applies it.

### Release 3 requirements

**FR-R3-001 — Reserved ranges**\
When a valid reserved IPv4 range is added, the allocator shall exclude every address in that range from automatic placement.

**FR-R3-002 — Fixed placement**\
When a child subnet is assigned a valid fixed network address, the allocator shall preserve that placement or reject the plan with an actionable conflict issue.

**FR-R3-003 — Gap-aware allocation**\
While fixed or reserved ranges fragment the parent, when automatic requirements are calculated, the allocator shall place complete aligned blocks only inside available gaps.

**FR-R3-004 — Capacity distinction**\
When total free addresses are sufficient but no contiguous aligned gap can fit a requirement, Subnify shall report fragmentation rather than total-capacity exhaustion.

**FR-R3-005 — Metadata validation**\
Where gateway, DHCP, VLAN, or purpose metadata is supplied, Subnify shall validate its format and relationship to the owning subnet before saving or exporting it.

**FR-R3-006 — Revision comparison**\
When a user compares two plan revisions, Subnify shall display added, removed, changed, and unchanged allocation fields without mutating either revision.

### Release 4 requirements

**FR-R4-001 — IPv6 arithmetic**\
The IPv6 engine shall perform address and prefix calculations with exact 128-bit-safe arithmetic and shall not coerce IPv6 values through JavaScript `number` or 32-bit bitwise operations.

**FR-R4-002 — IPv6 canonicalization**\
When a valid non-canonical IPv6 address is entered, Subnify shall preserve the user’s opportunity to review an RFC 5952 canonical suggestion before applying it.

**FR-R4-003 — Prefix requirements**\
When an IPv6 plan is created, each requirement shall specify a child prefix length and allocation count rather than an IPv4-style usable-host count.

**FR-R4-004 — IPv6 reservation semantics**\
The IPv6 engine shall not subtract network or broadcast addresses from a child prefix.

**FR-R4-005 — `/64` guidance**\
Where an IPv6 child prefix differs from `/64`, Subnify may present contextual guidance but shall accept valid non-`/64` prefixes within the parent.

**FR-R4-006 — Dual-stack pairing**\
When a requirement is marked dual stack, Subnify shall associate its IPv4 allocation and IPv6 prefix through a stable requirement identifier.

**FR-R4-007 — Address-family isolation**\
When one address-family plan is invalid, Subnify shall identify the failing family and shall not present the combined dual-stack plan as fully valid.

### Release 5 requirements

**FR-R5-001 — Core contract**\
The web application and CLI shall consume the same versioned deterministic calculation interfaces and plan document types.

**FR-R5-002 — CLI validation**\
When the CLI receives a valid supported plan document, it shall validate and calculate the plan without requiring a browser, account, or network connection.

**FR-R5-003 — CLI failure contract**\
When the CLI receives an invalid or unsupported document, it shall return a non-zero exit code, machine-readable issues when requested, and no successful result payload.

**FR-R5-004 — Conformance**\
For every shared fixture, the web engine and CLI shall return equivalent normalized plans and issue codes.

**FR-R5-005 — Vendor neutrality**\
Where a vendor-oriented exporter is added, it shall consume the neutral normalized plan contract and shall not add vendor fields to the core address model.

## Non-functional Requirements

### Correctness and reliability

- All address-family engines shall remain pure and deterministic for equivalent normalized input.
- Every successful allocation shall be aligned, non-overlapping, within its parent, and arithmetically exact.
- Property-style invariants shall cover IPv4, fragmented IPv4, IPv6, and dual-stack identity relationships as their releases land.
- Stored or shared calculated output shall be treated as derived data and revalidated when restored into an editable planner.
- A failed cloud, sharing, analytics, or AI request shall not disable anonymous local calculation and local export after the application has loaded.

### Performance

- A valid 100-requirement IPv4 plan shall calculate within `100 ms` at the 95th percentile over 50 warm runs on the documented project benchmark machine.
- Planner input feedback shall appear within `100 ms` for ordinary editing operations.
- Public landing, example, and shared-plan pages shall target Core Web Vitals rated Good under the production browser test profile.
- Large technical tables may scroll within their owning region; the page itself shall not overflow horizontally at `320px`.

### Accessibility

- Primary workflows shall meet WCAG 2.2 AA requirements.
- Every action shall be keyboard operable with visible focus.
- Mobile interactive targets shall be at least `44px` by `44px`.
- Validation, import, publishing, revocation, and CLI-equivalent UI errors shall not rely on color alone.
- Motion shall respect `prefers-reduced-motion`.

### Security and privacy

- Supabase RLS shall enforce ownership for private plans, revisions, and publishing controls.
- `SUPABASE_SERVICE_ROLE_KEY` and provider secrets shall remain server-only.
- Public share identifiers shall be non-sequential and unguessable; revocation shall be enforced server-side.
- Public responses shall use explicit allowlists rather than removing known-private fields from a complete private record.
- Imported JSON and CSV shall be treated as untrusted data, size-limited, schema-validated, and never executed.
- AI prompts and plan contents shall not enter product analytics by default.
- Public endpoints shall receive documented abuse controls before release.
- Production dependency audits shall report no known vulnerabilities at each release gate.

### Compatibility and evolution

- Plan documents shall carry an explicit semantic schema version.
- Import shall support the current schema major and the immediately previous major.
- Unsupported older documents shall fail without mutating the current plan and shall retain enough issue detail for manual recovery.
- Database changes shall use forward-only migrations with tested RLS policies.
- Vendor exporters and CLI versions shall declare the core schema versions they support.

### Observability

- Server failures shall receive correlation identifiers without exposing provider or database internals to users.
- Release health shall cover route availability, API failure rates, share failures, import failures, and client exceptions.
- Analytics shall use coarse product events and shall avoid raw IP plans, prompts, notes, filenames, and account identity.

## Acceptance Criteria

### AC-001 — Public first use

Given a visitor has no Subnify account\
When they open a built-in example and calculate it\
Then they can inspect all result views, copy output, and export locally\
And no cloud history record is created.

### AC-002 — Portfolio release evidence

Given Release 1 product gates pass\
When Subnify is presented on the Miqal portfolio\
Then the project links to a working demo and source repository\
And shows current screenshots, architecture, verification evidence, and a concrete release label.

### AC-003 — Document round trip

Given a valid calculated plan with metadata\
When it is exported as `.subnify.json` and imported into a fresh planner\
Then normalized inputs, public metadata, calculation results, and schema version match the original document.

### AC-004 — Invalid import safety

Given the editor contains unsaved changes\
When a user selects an invalid or unsupported plan document\
Then Subnify reports structured issues\
And leaves the current editor state unchanged.

### AC-005 — Public share privacy

Given an authenticated owner has a private plan containing private notes and AI metadata\
When they publish a read-only snapshot\
Then an unauthenticated visitor can inspect only the confirmed public plan fields\
And cannot derive the owner identity, prompt, private notes, or unpublished revisions from the response.

### AC-006 — Share revocation

Given a public snapshot exists\
When its owner revokes it\
Then the public URL returns the product’s unavailable-share state\
And the private source plan remains available to its owner.

### AC-007 — Fragmented IPv4 allocation

Given fixed and reserved ranges leave multiple valid gaps\
When automatic requirements are calculated\
Then every block is aligned and contained in a gap\
And no block overlaps another allocation or reserved range.

### AC-008 — Fragmentation diagnosis

Given total free address count can satisfy a requirement but no aligned contiguous gap can\
When the plan is calculated\
Then Subnify reports an address-fragmentation issue\
And does not return partial successful results.

### AC-009 — Revision comparison

Given two revisions of one plan\
When the owner compares them\
Then added, removed, and changed allocations are identified\
And neither stored revision is modified.

### AC-010 — IPv6 canonical plan

Given a valid IPv6 parent and valid child-prefix requirements\
When the plan is calculated\
Then every child prefix is canonical, aligned, inside the parent, and non-overlapping\
And no network or broadcast reservation is subtracted.

### AC-011 — IPv6 boundary arithmetic

Given an IPv6 plan crosses a 64-bit boundary or approaches the end of the 128-bit address space\
When it is validated and calculated\
Then the result remains exact\
And overflow is rejected with a structured issue.

### AC-012 — Dual-stack identity

Given a dual-stack requirement has valid IPv4 and IPv6 inputs\
When the combined plan is calculated\
Then both allocations reference the same stable requirement identifier\
And each family retains its own validation and display semantics.

### AC-013 — CLI parity

Given a fixture supported by both web and CLI\
When each surface validates and calculates it\
Then normalized results and issue codes are equivalent.

### AC-014 — Local resilience

Given Supabase or the AI provider is unavailable after the app loads\
When a visitor edits and calculates a manual plan\
Then local calculation, result inspection, clipboard output, and local export remain functional\
And unavailable cloud actions present retryable errors without clearing the plan.

### AC-015 — Responsive and accessible release

Given desktop, `390x844`, and `320x844` browser profiles\
When core workflows run with keyboard and reduced-motion settings\
Then pages have no document-level horizontal overflow\
And actions remain named, focused, operable, and at least `44px` on mobile.

## Error Handling

| Condition                      | Required behavior                                                  | User-facing outcome                                         | State guarantee                           |
| ------------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------- | ----------------------------------------- |
| Invalid manual plan            | Return structured field or plan issue                              | Specific correction and canonical suggestion where possible | No save, publish, copy, or export         |
| Invalid imported file          | Reject before apply                                                | Import issue summary                                        | Existing editor unchanged                 |
| Unsupported schema version     | Reject with detected and supported versions                        | Upgrade or compatible-export guidance                       | Existing editor unchanged                 |
| Oversized JSON or CSV          | Stop parsing at documented limit                                   | File-size error                                             | Existing editor unchanged                 |
| Missing or revoked share       | Return generic unavailable state                                   | “Shared plan unavailable”                                   | No private existence or owner data leaked |
| Publish authorization failure  | Reject at database/API boundary                                    | Sign-in or permission error                                 | Private plan remains private              |
| Reserved/fixed conflict        | Return conflict paths and ranges                                   | Actionable overlap explanation                              | No partial calculated plan                |
| IPv6 parse or overflow failure | Return address-family-specific issue                               | Canonical suggestion or boundary error                      | No approximate value displayed            |
| Database outage                | Keep local planner available                                       | Retryable history/save message                              | Local plan retained                       |
| AI provider/quota failure      | Preserve prompt and editor                                         | Stable retry/quota message                                  | No invalid draft applied or saved         |
| CLI invalid document           | Exit non-zero and write diagnostics to stderr or JSON issue output | Scriptable failure                                          | No success payload                        |
| Vendor export mapping failure  | Stop affected export only                                          | Export-specific issue                                       | Core plan remains valid and unchanged     |

## Architecture Direction

### Domain boundaries

- `IPv4PlanEngine`: canonical IPv4 validation, VLSM, reservations, fixed placement, gaps, and invariants.
- `IPv6PlanEngine`: RFC 5952 parsing, exact 128-bit prefix arithmetic, allocation, and invariants.
- `PlanDocument`: versioned portable schema containing address-family inputs and selected metadata.
- `PlanPresentation`: table, map, hierarchy, summaries, comparison, clipboard, and PDF adapters.
- `PlanPersistence`: private history, revisions, public snapshots, ownership, and revocation.
- `PlanImportExport`: JSON/CSV validation, migrations, neutral serialization, and vendor adapters.
- `SubnifyCore`: stable interfaces shared by web and CLI after Release 5 boundaries are proven.

Address-family engines may share low-level utilities only when the behavior is protocol-neutral. IPv6 must not inherit IPv4 host-reservation or 32-bit arithmetic assumptions.

### Data flow

1. Manual, restored, imported, AI, shared, or CLI input enters an untrusted boundary.
2. Schema and address-family validation produce structured issues or normalized input.
3. The deterministic engine calculates the complete plan.
4. Presentation and export adapters consume only successful normalized output.
5. Persistence stores source input, metadata, derived output, schema version, and ownership state.
6. Editable restoration revalidates derived output against the current engine.

### Ecosystem boundary

- `@miqal/theme` owns shared tokens and visual foundations.
- A small app registry owns ecosystem names, URLs, descriptions, and source links.
- Each app owns its content composition, data, auth, deployment, and product-specific behavior.
- Cross-app auth, user profiles, or shared databases remain deferred until a concrete workflow requires them.

## Portfolio Evidence Matrix

| Release | Reviewer takeaway                           | Required artifact                                   | Resume evidence                                             |
| ------- | ------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------- |
| 1       | Can finish and operate a polished product   | Case study, architecture, screenshots, release gate | Deterministic planner, RLS, guarded AI, automated quality   |
| 2       | Designs secure evolving data contracts      | JSON Schema, migrations, sharing threat model       | Versioned imports/exports and revocable public snapshots    |
| 3       | Solves non-trivial domain problems          | Invariants, fragmentation examples, revision model  | Gap-aware allocation with reservations and fixed placement  |
| 4       | Understands protocol-specific system design | IPv6 spec, BigInt tests, dual-stack demo            | RFC-aware IPv6 prefix planning and exact 128-bit arithmetic |
| 5       | Builds reusable developer tooling           | CLI, conformance suite, CI example                  | Shared core contracts and offline validation CLI            |

Claims must describe implemented, verified behavior. Do not publish user counts, performance numbers, or availability claims without collected evidence.

## Implementation Checklist

### Roadmap governance

- [ ] Create a dedicated approved design spec before each release.
- [ ] Create a task-level implementation plan from that release spec.
- [ ] Preserve current reliability contracts unless the release explicitly replaces them.
- [ ] Update this roadmap only through reviewed scope decisions.
- [ ] Record release evidence in repository documentation.

### Release 1

- [ ] Finish technical-editorial refinement and whole-product browser gate.
- [ ] Add deterministic one-click examples.
- [ ] Verify anonymous demo, copy, and local export.
- [ ] Publish architecture, reliability, security, and test summaries.
- [ ] Capture stable responsive screenshots.
- [ ] Add semantic version and changelog.
- [ ] Update English and Slovak portfolio project content.
- [ ] Replace `MVP` only after every Release 1 gate passes.

### Release 2

- [ ] Specify `PlanDocument` v1 and JSON Schema.
- [ ] Build atomic import preview/apply flow.
- [ ] Implement JSON and CSV adapters from normalized output.
- [ ] Add descriptions, notes, and tags with public/private classification.
- [ ] Design public snapshot storage, RLS, rate limits, and revocation.
- [ ] Add previous-major migration fixtures.
- [ ] Complete privacy threat model and public-payload tests.

### Release 3

- [ ] Specify reserved ranges, fixed placement, and gap policy.
- [ ] Implement gap-aware IPv4 engine behind current result contract.
- [ ] Add conflict, fragmentation, and metadata diagnostics.
- [ ] Extend map and hierarchy for reserved/free/fixed regions.
- [ ] Add immutable revisions and comparison.
- [ ] Add deterministic and property-style invariant coverage.

### Release 4

- [ ] Approve separate IPv6 domain specification with cited RFC rules.
- [ ] Implement canonical parser and formatter.
- [ ] Implement exact prefix arithmetic and allocation.
- [ ] Add IPv6-specific form and diagnostics.
- [ ] Extend presentation and exports.
- [ ] Define and implement stable dual-stack pairing.
- [ ] Add boundary, invariant, browser, and accessibility coverage.

### Release 5

- [ ] Freeze stable core and document contracts.
- [ ] Generate types from published JSON Schema or verify schema/type parity.
- [ ] Implement offline CLI validation and calculation.
- [ ] Define stdout, stderr, JSON output, and exit-code contracts.
- [ ] Run shared fixtures through web and CLI.
- [ ] Document CI usage and version support.
- [ ] Evaluate vendor exporters against concrete use cases.

### Every release

- [ ] Run lint, typecheck, unit, component, route, build, and Playwright gates.
- [ ] Run production dependency audit with no known vulnerabilities.
- [ ] Verify keyboard, reduced motion, dark mode, and `320px` layout.
- [ ] Review secrets, RLS, public payloads, and error disclosure.
- [ ] Update README, changelog, architecture, screenshots, case study, and resume evidence.

## Explicitly Out of Scope

- Billing, subscriptions, or paid tiers.
- Team workspaces, roles, comments, approvals, or real-time collaboration.
- Native mobile applications.
- Full network topology simulation or packet simulation.
- Automated deployment of configurations to network devices.
- Shared authentication or a shared user database across Miqal apps.
- A public HTTP API without a concrete integration requirement.
- Vendor-specific fields in the neutral plan model.
- Additional AI features without demonstrated user value and deterministic validation.
- User-count, uptime, or performance marketing claims without evidence.

## Risks and Mitigations

| Risk                                         | Mitigation                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------- |
| Roadmap becomes a broad rewrite              | One release per approved spec and plan; preserve prior contracts          |
| Sharing leaks private metadata               | Explicit public allowlist, RLS, threat model, revocation tests            |
| Import format becomes unstable               | Versioned schema, migration fixtures, previous-major support              |
| Advanced IPv4 corrupts current VLSM behavior | Isolated gap-aware engine changes plus legacy conformance fixtures        |
| IPv6 is forced through IPv4 abstractions     | Separate engine and requirement model; shared utilities only when neutral |
| CLI and web diverge                          | Shared core package and fixture-based conformance suite                   |
| Portfolio overstates project maturity        | Evidence-gated labels and claims only                                     |
| Ecosystem cohesion erases product identity   | Shared foundations; product-specific composition and copy remain local    |
| Generic SaaS work displaces domain value     | Explicit out-of-scope list and release ordering                           |

## Roadmap Completion Rules

- A release starts only after its design spec is approved.
- A release completes only when product, test, security, documentation, and portfolio evidence gates pass.
- Later release work must not bypass an incomplete earlier release unless this roadmap is explicitly revised.
- A roadmap item may be removed when user evidence shows low value; removal must update product and portfolio claims.
- No open decision currently blocks Release 1 specification work.
