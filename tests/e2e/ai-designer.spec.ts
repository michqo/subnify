import { expect, test } from "@playwright/test"

test("legacy AI route returns to planner and preserves the auth gate", async ({ page }) => {
  await page.goto("/app/designer")

  await expect(page).toHaveURL(/\/app$/)
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()
  await expect(page.getByRole("dialog").getByText("Generate requirements", { exact: true })).toHaveCount(0)
})
