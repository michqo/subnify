import { describe, expect, it } from "vitest"

import { PLANNER_TEMPLATES, templateToPlan } from "@/lib/planner/templates"

describe("planner templates", () => {
  it("provides the three approved starter shapes", () => {
    expect(PLANNER_TEMPLATES.map((template) => template.slug)).toEqual([
      "home-lab",
      "small-office",
      "segmented-office",
    ])
  })

  it("normalizes a template into a manual replacement plan", () => {
    const template = PLANNER_TEMPLATES[1]
    const plan = templateToPlan(template)

    expect(plan.sourceType).toBe("manual")
    expect(plan.suggestedTitle).toBe("Small office")
    expect(plan.aiPrompt).toBeNull()
    expect(plan.aiRationale).toBeNull()
    expect(plan.subnets.map((subnet) => subnet.id)).toEqual([1, 2, 3])
    expect(plan.subnets.map(({ name, hosts }) => ({ name, hosts }))).toEqual([
      { name: "Staff", hosts: 62 },
      { name: "Guest Wi-Fi", hosts: 40 },
      { name: "Infrastructure", hosts: 12 },
    ])
  })
})
