// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { stubAvatarBrowserApis } from "../../features/agents/avatar-testing";
import type { HuddleView } from "../../features/huddle/window";
import { HuddleWindowView } from "./HuddleWindowView";

stubAvatarBrowserApis();
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("shows and clears the connected call's voice error alongside window errors", () => {
  const view: HuddleView = {
    id: "call",
    title: "Huddle",
    phase: "connected",
    muted: false,
    level: 0,
    dark: false,
    participants: [],
    error: "Codex: Voice disconnected. Leave and rejoin the Huddle to retry.",
  };
  const act = vi.fn();
  const mounted = render(<HuddleWindowView view={view} act={act} />);
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Codex: Voice disconnected.",
  );
  mounted.rerender(
    <HuddleWindowView
      view={view}
      act={act}
      error="Couldn’t update the call."
    />,
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Couldn’t update the call.",
  );
  mounted.rerender(<HuddleWindowView view={view} act={act} />);
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Codex: Voice disconnected.",
  );
  mounted.rerender(
    <HuddleWindowView view={{ ...view, error: undefined }} act={act} />,
  );
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("holds the listening size through silence until the agent responds", () => {
  const agent = {
    key: "agent",
    name: "Agent",
    picture: null,
    own: false,
    listening: true,
    attending: true,
    level: 0,
  };
  const view: HuddleView = {
    id: "call",
    title: "Huddle",
    phase: "connected",
    muted: false,
    level: 0,
    dark: false,
    participants: [agent],
  };
  const mounted = render(<HuddleWindowView view={view} act={vi.fn()} />);
  const scale = () =>
    mounted.container
      .querySelector<HTMLElement>('[class*="bubbleArtwork"]')
      ?.style.getPropertyValue("--voice-scale");
  expect(scale()).toBe("0.8");
  const update = (changes: Partial<typeof agent> & { thinking?: boolean }) =>
    mounted.rerender(
      <HuddleWindowView
        view={{
          ...view,
          participants: [{ ...agent, attending: false, ...changes }],
        }}
        act={vi.fn()}
      />,
    );
  update({});
  expect(scale()).toBe("0.8");
  update({ thinking: true });
  expect(scale()).toBe("0.8");
  update({ level: 0.3 });
  expect(Number(scale())).toBeGreaterThan(1);
  update({});
  expect(scale()).toBe("1");
});
