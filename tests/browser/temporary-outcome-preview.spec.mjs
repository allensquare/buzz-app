import { test, expect } from "./fixture.mjs";
import { open } from "./timeline.mjs";
import { pauseClock } from "./clock.mjs";

test.use({
  productionBroker: true,
  readState: true,
  historyCounts: { alpha: 1, beta: 1 },
});

// The real app places two autonomous variants side by side, with own-message
// explanations and no controls. A failed task produces no agent reply.
test("automatically compares silent failures with distinct explanations", async ({
  page,
  app,
}) => {
  // Install before mounting: the first demo timeout must use the controlled clock.
  await page.clock.install();
  await open(page, app);
  const request = app.append("primary", "alpha", "Review the release notes.");
  app.append(
    "primary",
    "alpha",
    "Checked the release notes.\n\n".repeat(30),
    true,
    false,
    request.id,
  );
  app.threadSummary(request.id, [], 1);
  const history = page.getByRole("region", { name: "Channel message history" });
  const requestRow = history.locator(`[data-message-id="${request.id}"]`);
  await requestRow.hover();
  await requestRow.getByRole("button", { name: /^View thread:/ }).click();
  const thread = page.getByRole("complementary", {
    name: "Thread",
    exact: true,
  });
  const channelExample = history.locator('[data-outcome-examples="channel"]');
  const threadExample = thread.locator('[data-outcome-examples="thread"]');
  await expect(threadExample).toBeAttached();
  await pauseClock(page);
  await page.clock.setFixedTime(new Date());
  // Observe phase boundaries without a test-only reset control. Exact cycle
  // timing is asserted with the controlled component clock.
  const advanceTo = async (stage) => {
    for (let tick = 0; tick < 101; tick++) {
      if (
        (await channelExample.getAttribute("data-comparison-stage")) === stage
      )
        return;
      await page.clock.runFor(100);
    }
    throw new Error(`Comparison never reached ${stage}`);
  };
  await advanceTo("error");
  for (const [example, variant] of [
    [channelExample, "This version fades errors."],
    [threadExample, "This version keeps errors."],
  ]) {
    await example.scrollIntoViewIfNeeded();
    const explanation = example.locator("[data-comparison-explanation]");
    await expect(explanation).toHaveAttribute("data-viewer-message", "");
    await expect(explanation).toContainText("Fixture Reader");
    await expect(explanation).toContainText(variant);
    await expect(explanation).toContainText("Work stopped without a reply.");
    await expect(example.locator("[data-message-id]")).toHaveCount(0);
    await expect(example.getByRole("switch")).toHaveCount(0);
    await expect(
      example.getByRole("button", { name: "Restart comparison" }),
    ).toHaveCount(0);
    await expect(
      example.getByText("Couldn’t finish", { exact: true }),
    ).toBeVisible();
    await expect(example.locator("[data-comparison-live]")).toHaveCount(0);
  }
  await advanceTo("retained");
  await expect(
    channelExample.getByText("Couldn’t finish", { exact: true }),
  ).toHaveCount(0);
  await expect(
    threadExample.getByText("Couldn’t finish", { exact: true }),
  ).toBeVisible();
  await expect(
    channelExample.locator("[data-comparison-explanation]"),
  ).toContainText("The activity balloon is gone and there’s still no reply.");
  await expect(
    channelExample.locator("[data-agent-response-preview]"),
  ).toHaveCount(0);
  await threadExample
    .getByRole("button", { name: "Show comparison activity: Couldn’t finish" })
    .click();
  await expect(
    threadExample.getByText(
      "The selected model could not complete this request.",
      { exact: true },
    ),
  ).toBeVisible();
  const collapse = threadExample.getByRole("button", {
    name: "Collapse comparison activity: Couldn’t finish",
  });
  await expect(collapse).not.toContainText("Couldn’t finish");
  const collapseBox = await collapse.boundingBox();
  const outcomeBox = await threadExample
    .getByText("Couldn’t finish", { exact: true })
    .boundingBox();
  expect(outcomeBox.y).toBeGreaterThanOrEqual(
    collapseBox.y + collapseBox.height,
  );
  await advanceTo("working");
  for (const example of [channelExample, threadExample]) {
    await expect(example).toHaveAttribute("data-comparison-stage", "working");
    await expect(example.locator("[data-comparison-live]")).toBeVisible();
    await expect(example.locator("[data-agent-response-preview]")).toHaveCount(
      1,
    );
  }
  for (const colorScheme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme });
    for (const scale of [1, 1.25]) {
      await page.evaluate((scale) => {
        document.documentElement.style.fontSize = `${16 * scale}px`;
      }, scale);
      for (const example of [channelExample, threadExample]) {
        const box = await example.boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(1440);
      }
    }
  }
  const left = await channelExample.boundingBox();
  const right = await threadExample.boundingBox();
  expect(left.x + left.width).toBeLessThanOrEqual(right.x);
});
