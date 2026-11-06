import { useState } from "react";
import { Avatar } from "../../shared/design-system/ui/Avatar";
import { useMessageDensity } from "../../shared/theme/message-density";
import { avatarMedia } from "../../shared/avatar-source";
import type { Profile } from "../relay/contracts";
import messageStyles from "./Messages.module.css";
import { ActivityDisclosure } from "./ActivityDisclosure";
import { ActivityOutcome } from "./ActivityOutcome";
import { ActivityStepPreview } from "./ActivityStepPreview";
import { AgentResponsePreview } from "./AgentResponsePreview";
import { useTemporaryOutcomeComparison } from "./temporary-outcome-comparison";
import styles from "./TemporaryOutcomeExamples.module.css";

const explanations = {
  working: {
    thread:
      "The agent is working. I can see its current step and the live working dots.",
    channel:
      "The agent is working. I can see its current step and the live working dots.",
  },
  error: {
    thread:
      "Work stopped without a reply. This error tells me the agent failed, so I’m not left waiting.",
    channel:
      "Work stopped without a reply. I see the failure for five seconds, then it fades.",
  },
  fading: {
    thread:
      "Five seconds have passed. The channel’s error is fading, while this error stays visible.",
    channel:
      "Five seconds have passed, so the whole activity balloon fades away.",
  },
  retained: {
    thread:
      "There’s still no reply, but the error explains why. I can expand it to read what happened.",
    channel:
      "The activity balloon is gone and there’s still no reply. Nothing explains the silence now.",
  },
};

/** Independent modeled work, synchronized between channel and thread. */
export function TemporaryOutcomeExamples({
  scope,
  side,
  profile,
  media = (url) => url,
}: {
  profile?: Profile | undefined;
  media?: ((url: string, size?: "small") => string | undefined) | undefined;
  scope: string;
  side: "channel" | "thread";
}) {
  const snapshot = useTemporaryOutcomeComparison(scope);
  const own = useMessageDensity() !== "compact";
  return (
    <div
      data-outcome-examples={side}
      data-comparison-stage={snapshot.stage}
      className="flex flex-col gap-3"
    >
      <div
        className={messageStyles.message}
        data-layout={side === "thread" ? "thread" : "timeline"}
        data-viewer-message={own ? "" : undefined}
        data-comparison-explanation=""
      >
        <span className={messageStyles.messageGutter} />
        <div className={messageStyles.messageBody}>
          <div className={messageStyles.messageContent} data-bubble="">
            <div className={messageStyles.messageAvatar}>
              <Avatar
                src={avatarMedia(profile?.picture, media)}
                alt=""
                fallback={profile?.name ?? "You"}
                size={side === "channel" ? "default" : "small"}
              />
            </div>
            <div className={messageStyles.messageHeader}>
              <div className={messageStyles.byline}>
                <strong className={messageStyles.author}>
                  {profile?.name ?? "You"}
                </strong>
              </div>
            </div>
            <div
              className={messageStyles.messageBubble}
              data-own={own || undefined}
            >
              <p className={messageStyles.plainText}>
                {side === "thread"
                  ? "This version keeps errors. "
                  : "This version fades errors. "}
                {explanations[snapshot.stage][side]}
              </p>
            </div>
          </div>
        </div>
      </div>
      <Example key={snapshot.cycle} snapshot={snapshot} side={side} />
    </div>
  );
}

function Example({
  snapshot,
  side,
}: {
  snapshot: ReturnType<typeof useTemporaryOutcomeComparison>;
  side: "channel" | "thread";
}) {
  const [expanded, setExpanded] = useState(false);
  const working = snapshot.stage === "working";
  if (side === "channel" && snapshot.stage === "retained") return null;
  const summary = working ? (
    <ActivityStepPreview
      state="working"
      text="Checking the available context"
    />
  ) : (
    <ActivityOutcome state="error" />
  );
  return (
    <div
      data-comparison-sample={side}
      data-comparison-live={working ? "" : undefined}
      data-fading={
        (side === "channel" && snapshot.stage === "fading") || undefined
      }
      className={`${styles.sample} flex flex-col gap-3`}
    >
      <AgentResponsePreview
        name="Agent"
        layout={side === "thread" ? "thread" : "timeline"}
      >
        <ActivityDisclosure
          expanded={expanded}
          onToggle={() => setExpanded((value) => !value)}
          label={`${expanded ? "Collapse" : "Show"} comparison activity: ${working ? "Working" : "Couldn’t finish"}`}
          summary={summary}
          expandedSummary={!working && <ActivityOutcome state="error" />}
        >
          <p className="text-body-sm">Tool call: read_file</p>
          {!working && (
            <p className="text-body-sm">
              The selected model could not complete this request.
            </p>
          )}
        </ActivityDisclosure>
      </AgentResponsePreview>
    </div>
  );
}
