import { expect, it } from "vitest";
import type { Agents } from "../agents/service";
import type { RelaySnapshot } from "../relay/service";
import { dmVoiceAgent } from "./dm-agent";

function fixture() {
  const destination = {
    scope: "scope",
    viewer: "owner",
    relayUrl: "wss://example.org",
    channelId: "dm",
    channelName: "Agent",
  };
  const parent = {
    id: "dm",
    channelType: "dm",
    members: ["owner", "agent"],
    archived: false,
  };
  const agent = {
    pubkey: "agent",
    owner: "owner",
    relay: "https://example.org",
    place: "here",
    type: "buzz.codex/codex",
    protection: undefined as unknown,
    executionBinding: undefined as unknown,
  };
  const types = [{ key: "buzz.codex/codex", voice: () => {} }];
  const choices = { selectable: [{ pubkey: "agent" }] };
  const connection = {
    status: "ready",
    scope: "scope",
    viewer: "owner",
    session: {
      channels: { list: () => ({ channels: [parent] }) },
      agentChoices: { snapshot: () => choices },
    },
  } as unknown as RelaySnapshot;
  const agents = {
    snapshot: () => ({ status: "ready", running: [agent] }),
    types: () => types,
  } as unknown as Agents;
  return { destination, parent, agent, types, choices, connection, agents };
}
it("finds the owned voice-capable peer in a one-to-one DM", () => {
  const f = fixture();
  expect(dmVoiceAgent(f.connection, f.destination, f.agents)).toBe(f.agent);
});
it.each([
  "group",
  "channel",
  "archived",
  "protected",
  "elsewhere",
  "execution-target",
  "other-owner",
  "other-community",
  "unsupported",
  "not-selectable",
  "other-voice-harness",
])("does not automatically invite %s", (kind) => {
  const f = fixture();
  if (kind === "group") f.parent.members.push("other");
  if (kind === "channel") f.parent.channelType = "stream";
  if (kind === "archived") f.parent.archived = true;
  if (kind === "protected") f.agent.protection = {};
  if (kind === "elsewhere") f.agent.place = "elsewhere";
  if (kind === "execution-target") f.agent.executionBinding = {};
  if (kind === "other-owner") f.agent.owner = "other";
  if (kind === "other-community") f.agent.relay = "https://other.example.org";
  if (kind === "unsupported") f.types.length = 0;
  if (kind === "other-voice-harness") {
    f.agent.type = "other/voice";
    f.types.splice(0, 1, { key: "other/voice", voice: () => {} });
  }
  if (kind === "not-selectable") f.choices.selectable = [];
  expect(dmVoiceAgent(f.connection, f.destination, f.agents)).toBeUndefined();
});
