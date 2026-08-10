import { expect, test } from "@playwright/test"

test("calculates a plan and keeps selection synchronized across views", async ({ page }) => {
  await page.goto("/app")

  await page.getByLabel("Base Network").fill("192.168.10.0")
  await page.getByLabel("CIDR Notation").fill("24")

  const names = page.getByPlaceholder("Subnet name")
  const hosts = page.getByPlaceholder("Hosts")
  await names.nth(0).fill("Engineering")
  await hosts.nth(0).fill("62")
  await names.nth(1).fill("Guest Wi-Fi")
  await hosts.nth(1).fill("40")
  await page.getByRole("button", { name: "Remove LAN C" }).click()

  await page.getByRole("button", { name: "Calculate VLSM" }).click()

  await expect(page.getByRole("heading", { name: "Committed results" })).toBeVisible()
  await expect(page.getByText("2 subnets · 192.168.10.0/24")).toBeVisible()
  await expect(page.getByRole("row").filter({ hasText: "Engineering" })).toContainText("/26")

  await page.getByRole("tab", { name: "Allocation map" }).click()
  const engineeringBlock = page.getByRole("button", { name: "Engineering /26, 64 addresses" })
  await engineeringBlock.click()
  await expect(engineeringBlock).toHaveAttribute("aria-pressed", "true")

  await page.getByRole("tab", { name: "Table" }).click()
  await expect(page.getByRole("row").filter({ hasText: "Engineering" })).toHaveAttribute("aria-selected", "true")
  await expect(page.getByRole("button", { name: "PDF" })).toBeEnabled()
})

test("planner stays contained and exposes navigation on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/app")

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)

  await page.getByRole("button", { name: "Product menu" }).click()
  await expect(page.getByRole("navigation", { name: "Mobile product navigation" })).toBeVisible()
  await expect(page.getByRole("navigation", { name: "Mobile product navigation" }).getByRole("link", { name: "History" })).toBeVisible()
})
