// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TemporaryOutcomeExamples } from "./TemporaryOutcomeExamples";

let sequence = 0;
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  }));
});
afterEach(async () => {
  cleanup();
  await act(async () => {});
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function fixture() {
  const scope = `example:${sequence++}`;
  const view = render(
    <>
      <TemporaryOutcomeExamples
        scope={scope}
        side="channel"
        profile={{ name: "Tho" }}
      />
      <TemporaryOutcomeExamples
        scope={scope}
        side="thread"
        profile={{ name: "Tho" }}
      />
    </>,
  );
  const pane = (side: string) => {
    const node = view.container.querySelector(
      `[data-outcome-examples="${side}"]`,
    );
    if (!(node instanceof HTMLElement))
      throw new Error("Missing comparison pane");
    return node;
  };
  return { ...view, pane, scope };
}
const advance = (milliseconds: number) =>
  act(() => vi.advanceTimersByTime(milliseconds));
const stage = (element: Element, value: string) =>
  expect(element).toHaveAttribute("data-comparison-stage", value);

it("shows failure for five seconds and restarts both panes every ten seconds", () => {
  const f = fixture();
  expect(vi.getTimerCount()).toBe(1);
  for (const side of ["channel", "thread"]) {
    expect(
      f.pane(side).querySelectorAll("[data-agent-response-preview]"),
    ).toHaveLength(1);
  }
  advance(1999);
  stage(f.pane("thread"), "working");
  advance(1);
  for (const side of ["channel", "thread"]) {
    stage(f.pane(side), "error");
    expect(
      within(f.pane(side)).getByText("Couldn’t finish", { exact: true }),
    ).toBeVisible();
    expect(f.pane(side).querySelector("[data-comparison-live]")).toBeNull();
  }
  advance(4999);
  stage(f.pane("channel"), "error");
  advance(1);
  stage(f.pane("thread"), "retained");
  expect(
    within(f.pane("thread")).getByText("Couldn’t finish", { exact: true }),
  ).toBeVisible();
  expect(
    within(f.pane("channel")).queryByText("Couldn’t finish", { exact: true }),
  ).toBeNull();
  expect(
    f.pane("channel").querySelector("[data-agent-response-preview]"),
  ).toBeNull();
  expect(
    within(f.pane("channel")).getByText(/Nothing explains the silence now/),
  ).toBeVisible();
  advance(2999);
  stage(f.pane("channel"), "retained");
  advance(1);
  stage(f.pane("channel"), "working");
  stage(f.pane("thread"), "working");
  expect(f.container.querySelectorAll("[data-comparison-live]")).toHaveLength(
    2,
  );
});

it("keeps the demonstration moving even when unfocused or inspecting details", () => {
  vi.spyOn(document, "hasFocus").mockReturnValue(false);
  const observer = vi.fn();
  vi.stubGlobal("IntersectionObserver", observer);
  const f = fixture();
  fireEvent.click(
    within(f.pane("thread")).getByRole("button", {
      name: "Show comparison activity: Working",
    }),
  );
  advance(2000);
  stage(f.pane("thread"), "error");
  advance(8000);
  stage(f.pane("thread"), "working");
  expect(observer).not.toHaveBeenCalled();
});

it("distinguishes both variants in own-message bubbles without controls or message IDs", () => {
  const f = fixture();
  for (const side of ["thread", "channel"]) {
    const explanation = f
      .pane(side)
      .querySelector("[data-comparison-explanation]");
    expect(explanation).toHaveAttribute("data-viewer-message", "");
    expect(explanation?.querySelector("[data-own]")).toBeVisible();
    expect(explanation).toHaveTextContent("Tho");
    expect(explanation).toHaveTextContent(
      side === "thread"
        ? "This version keeps errors."
        : "This version fades errors.",
    );
    expect(f.pane(side).querySelector("[data-message-id]")).toBeNull();
    expect(within(f.pane(side)).queryByRole("switch")).toBeNull();
    expect(
      within(f.pane(side)).queryByRole("button", {
        name: "Restart comparison",
      }),
    ).toBeNull();
  }
  advance(2000);
  expect(
    f.pane("thread").querySelector("[data-comparison-explanation]"),
  ).toHaveTextContent("This error tells me the agent failed");
  expect(
    f.pane("channel").querySelector("[data-comparison-explanation]"),
  ).toHaveTextContent("I see the failure for five seconds, then it fades.");
  f.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it("keeps unrelated channel clocks independent", () => {
  const f = fixture();
  advance(1000);
  render(<TemporaryOutcomeExamples scope="another-channel" side="channel" />);
  advance(1000);
  stage(f.pane("thread"), "error");
  const other = document.querySelector(
    '[data-outcome-examples="channel"]:not([data-comparison-stage="error"])',
  );
  expect(other).toHaveAttribute("data-comparison-stage", "working");
});
