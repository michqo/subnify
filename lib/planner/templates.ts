import type { ReplacePlanInput } from "@/lib/state/subnet-plan-types"

export type PlannerTemplate = {
  slug: "home-lab" | "small-office" | "segmented-office"
  title: string
  description: string
  baseNetwork: string
  baseCidr: string
  subnets: Array<{ name: string; hosts: number }>
}

export const PLANNER_TEMPLATES: PlannerTemplate[] = [
  {
    slug: "home-lab",
    title: "Home lab",
    description: "Separate everyday clients, self-hosted services, and connected devices.",
    baseNetwork: "192.168.10.0",
    baseCidr: "24",
    subnets: [
      { name: "Clients", hosts: 30 },
      { name: "Servers", hosts: 14 },
      { name: "IoT", hosts: 20 },
    ],
  },
  {
    slug: "small-office",
    title: "Small office",
    description: "A practical office split for staff, visitors, and network infrastructure.",
    baseNetwork: "192.168.20.0",
    baseCidr: "24",
    subnets: [
      { name: "Staff", hosts: 62 },
      { name: "Guest Wi-Fi", hosts: 40 },
      { name: "Infrastructure", hosts: 12 },
    ],
  },
  {
    slug: "segmented-office",
    title: "Segmented office",
    description: "A larger security-conscious layout with dedicated service zones.",
    baseNetwork: "10.20.0.0",
    baseCidr: "23",
    subnets: [
      { name: "Staff", hosts: 120 },
      { name: "Guest Wi-Fi", hosts: 60 },
      { name: "Voice", hosts: 40 },
      { name: "IoT", hosts: 30 },
      { name: "Servers", hosts: 14 },
    ],
  },
]

export function templateToPlan(template: PlannerTemplate): ReplacePlanInput {
  return {
    baseNetwork: template.baseNetwork,
    baseCidr: template.baseCidr,
    subnets: template.subnets.map((subnet, index) => ({ id: index + 1, ...subnet })),
    sourceType: "manual",
    aiPrompt: null,
    aiRationale: null,
    suggestedTitle: template.title,
  }
}
