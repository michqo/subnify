import { describe, expect, it } from "vitest"

import { buildPlanViewUrl, parsePlanView } from "@/lib/plan-view"

describe("plan view URLs", () => {
  it.each([
    [null, "table"],
    ["table", "table"],
    ["cards", "table"],
    ["visualizer", "visualizer"],
    ["hierarchy", "hierarchy"],
    ["unknown", "table"],
  ] as const)("parses %j as %s", (input, expected) => {
    expect(parsePlanView(input)).toBe(expected)
  })

  it.each([
    ["table", "/app"],
    ["visualizer", "/app?view=visualizer"],
    ["hierarchy", "/app?view=hierarchy"],
  ] as const)("builds the canonical %s URL", (view, expected) => {
    expect(buildPlanViewUrl(view)).toBe(expected)
  })
})
