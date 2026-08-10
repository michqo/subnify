import { expect, test } from "@playwright/test"

test("renders the intended Miqal blue and portfolio font stack", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" })
  await page.goto("/")

  const styles = await page.evaluate(() => {
    const body = getComputedStyle(document.body)
    const hero = getComputedStyle(document.querySelector("h1")!)
    const primaryAction = getComputedStyle(
      [...document.querySelectorAll("a")].find((link) => link.textContent?.trim().startsWith("Open planner"))!,
    )

    return {
      bodyFont: body.fontFamily,
      bodyBackgroundImage: body.backgroundImage,
      heroFont: hero.fontFamily,
      primaryBackground: primaryAction.backgroundColor,
    }
  })

  expect(styles.bodyFont).toContain("Geist")
  expect(styles.heroFont).toContain("Geist Mono")
  expect(styles.primaryBackground).toBe("rgb(37, 99, 235)")
  expect(styles.bodyBackgroundImage).toContain("37, 99, 235")
})

test("keeps the intended Miqal blue in dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" })
  await page.goto("/")

  const styles = await page.evaluate(() => ({
    bodyBackgroundImage: getComputedStyle(document.body).backgroundImage,
    primaryBackground: getComputedStyle(
      [...document.querySelectorAll("a")].find((link) => link.textContent?.trim().startsWith("Open planner"))!,
    ).backgroundColor,
  }))

  expect(styles.primaryBackground).toBe("rgb(96, 165, 250)")
  expect(styles.bodyBackgroundImage).toContain("96, 165, 250")
})
