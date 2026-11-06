# Temporary silent-failure comparison

Open a channel with a thread beside it and scroll to the bottom. The loop starts
automatically; there are no toggle, restart or status controls. A local message
from the current viewer explains the difference in each pane at every stage:

- Thread: **This version keeps errors.**
- Channel: **This version fades errors.**

Each complete cycle takes ten seconds: two seconds working, five seconds showing
failure, then the channel fades its whole activity balloon and holds the comparison until
the next cycle. Each pane shows one working balloon with dots and the current
step, which becomes the error balloon on failure. No agent reply appears: the
failure is the explanation for the agent's silence. The thread keeps that visible
explanation; the channel leaves no agent balloon or replacement summary. The
viewer’s explanation bubble stays in both panes. The prototype does not invent a
completed-work sentence from a status endpoint.
Expanded failures place their icon and label below the Collapse control, above
the details.

The demo runs continuously, including while unfocused, offscreen or inspecting
details, so it cannot get stuck on Working. It uses one shared stage timer per
channel/community and no visibility observers, scroll handlers or polling. Reduced
Motion skips the brief fade while preserving the ten-second cycle.

These are local modeled examples. Explanation bubbles reuse outgoing-message
layout and the viewer's name/avatar, with no message IDs, actions or publication.
Real messages, requests and outcomes are untouched. Revert the single temporary
commit to remove the whole prototype.
