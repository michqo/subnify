import { expect, test } from "@playwright/test"

test("history explains the cloud boundary to signed-out users", async ({ page }) => {
  await page.goto("/app/history")

  await expect(page.getByRole("heading", { name: "Plan history" })).toBeVisible()
  await expect(page.getByText("Sign in to view plans saved to cloud history.")).toBeVisible()
  await page.getByRole("main").getByRole("button", { name: "Sign in" }).click()
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()
})
