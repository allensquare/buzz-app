# Huddles

Talk with people in your channels and direct messages using live audio on desktop.

## Getting started

1. Open a channel or direct message and select the headphone button to start or join a Huddle.
2. Allow microphone access when prompted. Use the Huddle controls to mute yourself or choose an audio device.
3. Leave using the call controls when you're finished. Closing the Huddle window keeps the call connected; reopen it from the mini player beside search.

In a one-to-one DM with an eligible Codex agent running on this computer, the
headphone action says **Talk with [agent]** and adds the agent to the Huddle
automatically. Protected agents and agents without a local voice runtime do not
offer this action. Group conversations still use **Add someone**.

While you speak, your listening Codex agent becomes 20% smaller. While it
thinks, it stays smaller and adds a rotating faded ring, and the mini player shows the same activity dots as DMs. Speaking restores
the normal portrait and speaking halo. Thinking and listening have no visible text captions; accessible avatar labels
still describe the state. Reduced motion keeps the thinking ring static.

For a simulated presentation preview, run `bin/pnpm dev` and open
`/tests/fixtures/huddles.html?chrome`. Join the fixture Huddle, then use
**Toggle agent thinking** and **Simulate Alex speaking**. This preview uses the
real components without connecting to a relay or microphone.

Thinking animations are supplied only by Codex voice seats, for both automatic
DM invitations and manually added huddle members. Adding an agent to the parent
conversation alone does not add it to the separate Huddle room. Voice currently
runs on its owner's computer while the owner is in the Huddle, and receives only
the owner's audio. Thinking state is local to that computer, not broadcast.

Codex work-turn start/completion drives the working state. The realtime adapter
also listens for response creation, output speech, completion and interruption;
those event timings still need live voice acceptance. Chat typing presence is not
used as a substitute for voice work state.
