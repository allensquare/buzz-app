import { useMemo, useSyncExternalStore } from "react";

type Stage = "working" | "error" | "fading" | "retained";
type Snapshot = { stage: Stage; cycle: number };
const comparisons = new Map<string, ReturnType<typeof comparison>>();

/** A continuous temporary demo clock, shared by the channel and thread. */
function comparison(scope: string) {
  let snapshot: Snapshot = { stage: "working", cycle: 0 };
  const listeners = new Set<() => void>();
  let fadeDuration = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    if (!listeners.size || timer !== undefined) return;
    const delay =
      snapshot.stage === "working"
        ? 2000
        : snapshot.stage === "error"
          ? 5000
          : snapshot.stage === "fading"
            ? fadeDuration
            : Math.max(0, 3000 - fadeDuration);
    timer = setTimeout(() => {
      timer = undefined;
      let stage: Stage =
        snapshot.stage === "working"
          ? "error"
          : snapshot.stage === "error"
            ? "fading"
            : snapshot.stage === "fading"
              ? "retained"
              : "working";
      if (stage === "fading") {
        const duration = getComputedStyle(document.documentElement)
          .getPropertyValue("--duration-fast")
          .trim();
        const milliseconds =
          Number.parseFloat(duration) * (duration.endsWith("ms") ? 1 : 1000);
        fadeDuration =
          window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
          !Number.isFinite(milliseconds)
            ? 0
            : milliseconds;
        if (!fadeDuration) stage = "retained";
      }
      snapshot = {
        stage,
        cycle: snapshot.cycle + (stage === "working" ? 1 : 0),
      };
      for (const listener of listeners) listener();
      schedule();
    }, delay);
  };
  const model = {
    snapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      schedule();
      return () => {
        listeners.delete(listener);
        if (listeners.size) return;
        clearTimeout(timer);
        timer = undefined;
        queueMicrotask(() => {
          if (!listeners.size && comparisons.get(scope) === model)
            comparisons.delete(scope);
        });
      };
    },
  };
  return model;
}

export function useTemporaryOutcomeComparison(scope: string) {
  const model = useMemo(() => {
    let value = comparisons.get(scope);
    if (!value) {
      value = comparison(scope);
      comparisons.set(scope, value);
    }
    return value;
  }, [scope]);
  return useSyncExternalStore(model.subscribe, model.snapshot, model.snapshot);
}
