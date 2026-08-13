import { expect, test, type Locator, type Page } from "@playwright/test"

function captureConsoleErrors(page: Page) {
  const errors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  return errors
}

class PlannerPage {
  readonly page: Page
  readonly editor: Locator
  readonly baseNetwork: Locator
  readonly baseCidr: Locator
  readonly calculateButton: Locator
  readonly copyButton: Locator
  readonly pdfButton: Locator
  readonly results: Locator

  constructor(page: Page) {
    this.page = page
    this.editor = page.getByRole("region", { name: "Plan editor" })
    this.baseNetwork = page.getByLabel("Base Network")
    this.baseCidr = page.getByLabel("CIDR Notation")
    this.calculateButton = page.getByRole("button", { name: "Calculate VLSM" })
    this.copyButton = page.getByRole("button", { name: /^(Copy|Copied)$/ })
    this.pdfButton = page.getByRole("button", { name: /^(PDF|Exporting)$/ })
    this.results = page.getByRole("region", {
      name: "Committed VLSM results",
    })
  }

  async goto() {
    await this.page.goto("/app")
  }

  async calculate() {
    await this.calculateButton.click()
  }

  async assertNoHorizontalOverflow() {
    await expect
      .poll(() =>
        this.page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth
        )
      )
      .toBeLessThanOrEqual(1)
  }

  async assertEditorTargetsAtLeast44Pixels() {
    const targets = [
      ...(await this.editor.getByRole("button").all()),
      ...(await this.editor.getByRole("textbox").all()),
      ...(await this.editor.getByRole("spinbutton").all()),
    ]

    expect(targets.length).toBeGreaterThan(0)
    for (const target of targets) {
      await expect(target).toBeVisible()
      const box = await target.boundingBox()
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44)
    }
  }

  async assertTargetsAtLeast44Pixels(targets: Locator[]) {
    expect(targets.length).toBeGreaterThan(0)
    for (const target of targets) {
      await expect(target).toBeVisible()
      const box = await target.boundingBox()
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44)
    }
  }

  async assertDefaultMapProportions() {
    const map = this.page.getByRole("img", {
      name: "Address allocation map",
    })
    const segments = map.locator('[data-slot="allocation-segment"]')
    await expect(segments).toHaveCount(3)

    const mapBox = await map.boundingBox()
    expect(mapBox).not.toBeNull()
    const mapMetrics = await map.evaluate((element) => ({
      clientLeft: element.clientLeft,
      clientWidth: element.clientWidth,
    }))
    const expected = [
      { left: 0, width: 0.25 },
      { left: 0.25, width: 0.125 },
      { left: 0.375, width: 0.0625 },
    ]

    for (const [index, proportions] of expected.entries()) {
      const segmentBox = await segments.nth(index).boundingBox()
      expect(segmentBox).not.toBeNull()
      expect((segmentBox?.x ?? 0) - (mapBox?.x ?? 0)).toBeCloseTo(
        mapMetrics.clientLeft + mapMetrics.clientWidth * proportions.left,
        0
      )
      expect(segmentBox?.width ?? 0).toBeCloseTo(
        mapMetrics.clientWidth * proportions.width,
        0
      )
    }

    await expect
      .poll(() =>
        map.evaluate((element) => element.scrollWidth - element.clientWidth)
      )
      .toBeLessThanOrEqual(1)
  }
}

for (const viewport of [
  { name: "desktop", width: 1280, height: 720 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`rejects a /30 plan and clears stale output on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    const consoleErrors = captureConsoleErrors(page)
    const planner = new PlannerPage(page)
    await planner.goto()
    await planner.calculate()

    await expect(planner.results).toBeVisible()
    await expect(
      page.getByRole("row").filter({ hasText: "LAN A" })
    ).toBeVisible()

    await planner.baseCidr.fill("30")
    await planner.calculate()

    const alert = planner.editor.getByRole("alert")
    await expect(alert).toContainText(/do not fit/i)
    await expect(alert).toBeFocused()
    await expect(page.getByText(/run a valid calculation/i)).toBeVisible()
    await expect(
      page.getByRole("row").filter({ hasText: "LAN A" })
    ).toHaveCount(0)
    await expect(planner.copyButton).toBeDisabled()
    await expect(planner.pdfButton).toBeDisabled()
    await planner.assertNoHorizontalOverflow()
    expect(consoleErrors).toEqual([])
  })
}

test("applies a canonical suggestion and remains usable at narrow widths", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  const consoleErrors = captureConsoleErrors(page)
  const planner = new PlannerPage(page)
  await planner.goto()

  await planner.baseNetwork.fill("192.168.1.5")
  await planner.calculate()
  const canonicalSuggestion = page.getByRole("button", {
    name: "Use 192.168.1.0",
  })
  await canonicalSuggestion.click()

  await expect(planner.baseNetwork).toHaveValue("192.168.1.0")
  await planner.assertNoHorizontalOverflow()
  await planner.assertEditorTargetsAtLeast44Pixels()

  await planner.baseNetwork.focus()
  await page.keyboard.press("Tab")
  await expect(canonicalSuggestion).toBeFocused()
  const suggestionFocusStyle = await canonicalSuggestion.evaluate(
    (element) => ({
      boxShadow: getComputedStyle(element).boxShadow,
      outlineStyle: getComputedStyle(element).outlineStyle,
    })
  )
  expect(
    suggestionFocusStyle.boxShadow !== "none" ||
      suggestionFocusStyle.outlineStyle !== "none"
  ).toBe(true)
  await page.keyboard.press("Tab")
  await expect(planner.baseCidr).toBeFocused()

  await page.setViewportSize({ width: 320, height: 844 })
  const firstSubnetName = page.getByLabel("Subnet 1 name")
  const firstSubnetHosts = page.getByLabel("Subnet 1 required hosts")
  await firstSubnetName.fill("Editable at 320")
  await firstSubnetHosts.fill("20")
  await expect(firstSubnetName).toHaveValue("Editable at 320")
  await expect(firstSubnetHosts).toHaveValue("20")
  await planner.assertNoHorizontalOverflow()

  const calculateTransitionDurationSeconds =
    await planner.calculateButton.evaluate((element) =>
      parseFloat(getComputedStyle(element).transitionDuration)
    )
  expect(calculateTransitionDurationSeconds).toBeLessThanOrEqual(0.00001)
  expect(consoleErrors).toEqual([])
})

for (const viewport of [
  { name: "desktop", width: 1280, height: 720 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`commits one contract across every output on ${viewport.name}`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize(viewport)
    const consoleErrors = captureConsoleErrors(page)
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    const planner = new PlannerPage(page)
    await planner.goto()
    await planner.calculate()

    const lanA = page.getByRole("row").filter({ hasText: "LAN A" })
    const lanB = page.getByRole("row").filter({ hasText: "LAN B" })
    const lanC = page.getByRole("row").filter({ hasText: "LAN C" })
    await expect(lanA).toContainText("192.168.1.0")
    await expect(lanA).toContainText("/26")
    await expect(lanB).toContainText("192.168.1.64")
    await expect(lanB).toContainText("/27")
    await expect(lanC).toContainText("192.168.1.96")
    await expect(lanC).toContainText("/28")

    if (viewport.name === "mobile") {
      await planner.assertTargetsAtLeast44Pixels([
        planner.copyButton,
        planner.pdfButton,
        page.getByRole("tab", { name: "Table" }),
        page.getByRole("tab", { name: "Allocation map" }),
        page.getByRole("tab", { name: "Hierarchy" }),
        page.getByRole("button", { name: "LAN A", exact: true }),
      ])
    }

    await page.getByRole("tab", { name: "Allocation map" }).click()
    await planner.assertDefaultMapProportions()
    const mapControls = page.getByRole("group", {
      name: "Select a subnet from allocation map",
    })
    const mapSelectionButtons = [
      mapControls.getByRole("button", {
        name: "LAN A /26, 64 addresses",
      }),
      mapControls.getByRole("button", {
        name: "LAN B /27, 32 addresses",
      }),
      mapControls.getByRole("button", {
        name: "LAN C /28, 16 addresses",
      }),
    ]
    if (viewport.name === "mobile") {
      await planner.assertTargetsAtLeast44Pixels(mapSelectionButtons)
    }
    await mapSelectionButtons[1].click()
    await page.getByRole("tab", { name: "Hierarchy" }).click()
    const selectedHierarchy = page.getByRole("button", {
      name: /LAN B 192\.168\.1\.64\/27 selected/,
    })
    await expect(selectedHierarchy).toHaveAttribute("aria-pressed", "true")
    if (viewport.name === "mobile") {
      await planner.assertTargetsAtLeast44Pixels([selectedHierarchy])
    }
    await page.getByRole("tab", { name: "Table" }).click()
    await expect(lanB).toHaveAttribute("aria-selected", "true")

    await page.getByRole("button", { name: "Copy 255.255.255.192" }).click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe("255.255.255.192")

    await planner.copyButton.click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(
        [
          "LAN A: 192.168.1.0/26 (Mask: 255.255.255.192, Range: 192.168.1.1 - 192.168.1.62)",
          "LAN B: 192.168.1.64/27 (Mask: 255.255.255.224, Range: 192.168.1.65 - 192.168.1.94)",
          "LAN C: 192.168.1.96/28 (Mask: 255.255.255.240, Range: 192.168.1.97 - 192.168.1.110)",
        ].join("\n")
      )

    const downloadPromise = page.waitForEvent("download")
    await planner.pdfButton.click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/^subnify-plan-\d{8}\.pdf$/)
    expect(await download.failure()).toBeNull()
    await planner.assertNoHorizontalOverflow()
    expect(consoleErrors).toEqual([])
  })
}

test("calculates an edited plan and keeps selection synchronized across views", async ({
  page,
}) => {
  const consoleErrors = captureConsoleErrors(page)
  const planner = new PlannerPage(page)
  await planner.goto()

  await planner.baseNetwork.fill("192.168.10.0")
  await planner.baseCidr.fill("24")
  await page.getByLabel("Subnet 1 name").fill("Engineering")
  await page.getByLabel("Subnet 1 required hosts").fill("62")
  await page.getByLabel("Subnet 2 name").fill("Guest Wi-Fi")
  await page.getByLabel("Subnet 2 required hosts").fill("40")
  await page.getByRole("button", { name: "Remove LAN C" }).click()

  await planner.calculate()

  await expect(
    page.getByRole("heading", { name: "Committed results" })
  ).toBeVisible()
  await expect(page.getByText("2 subnets · 192.168.10.0/24")).toBeVisible()
  const engineeringRow = page
    .getByRole("row")
    .filter({ hasText: "Engineering" })
  await expect(engineeringRow).toContainText("192.168.10.0")
  await expect(engineeringRow).toContainText("/26")

  await page.getByRole("tab", { name: "Allocation map" }).click()
  const engineeringBlock = page.getByRole("button", {
    name: "Engineering /26, 64 addresses",
  })
  await engineeringBlock.click()
  await expect(engineeringBlock).toHaveAttribute("aria-pressed", "true")

  await page.getByRole("tab", { name: "Table" }).click()
  await expect(engineeringRow).toHaveAttribute("aria-selected", "true")
  await expect(planner.pdfButton).toBeEnabled()
  await planner.assertNoHorizontalOverflow()
  expect(consoleErrors).toEqual([])
})

test("planner stays contained and exposes product navigation on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const consoleErrors = captureConsoleErrors(page)
  const planner = new PlannerPage(page)
  await planner.goto()

  await planner.assertNoHorizontalOverflow()
  await page.getByRole("button", { name: "Product menu" }).click()
  const mobileNavigation = page.getByRole("navigation", {
    name: "Mobile product navigation",
  })
  await expect(mobileNavigation).toBeVisible()
  await expect(
    mobileNavigation.getByRole("link", { name: "History" })
  ).toBeVisible()
  await planner.assertNoHorizontalOverflow()
  expect(consoleErrors).toEqual([])
})
