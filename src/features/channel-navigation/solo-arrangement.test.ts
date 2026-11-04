import { expect, it } from "vitest";
import { arrangeChats } from "./solo-arrangement";
import type { ChatFacts } from "../conversation/service";

const facts = (id: string): ChatFacts => ({
  id,
  title: id,
  workspaceId: undefined,
  lastActivityAt: undefined,
  unread: false,
  working: false,
  selected: false,
});
const chats = ["a", "b", "c", "d"].map(facts);
const run = (value: unknown) =>
  arrangeChats(() => value as never, chats).map((row) =>
    row.group ? `${row.group.id}:${row.id}` : row.id,
  );
const plain = ["a", "b", "c", "d"];

it("keeps input order without an arrangement, when it throws or returns a non-array", () => {
  expect(arrangeChats(undefined, chats).map((row) => row.id)).toEqual(plain);
  expect(
    arrangeChats(() => {
      throw new Error("boom");
    }, chats).map((row) => row.id),
  ).toEqual(plain);
  expect(run("nope")).toEqual(plain);
  expect(run(undefined)).toEqual(plain);
});

it("ignores unknown and duplicate ids and appends chats it did not mention", () => {
  expect(run(["c", "zzz", "c", "a"])).toEqual(["c", "a", "b", "d"]);
  expect(run([])).toEqual(plain);
});

it("places group members contiguously at the group position", () => {
  expect(
    run(["d", { group: "g", label: " Mine ", chats: ["c", "a"] }]),
  ).toEqual(["d", "g:c", "g:a", "b"]);
  expect(
    arrangeChats(
      () => [{ group: "g", label: " Mine ", chats: ["a"] }],
      chats,
    )[0]?.group,
  ).toEqual({ id: "g", label: "Mine" });
});

it("ungroups members of invalid, empty or duplicate groups and drops empty groups", () => {
  expect(run([{ group: "", label: "x", chats: ["a"] }])).toEqual(plain);
  expect(run([{ group: "g", label: "  ", chats: ["a"] }])).toEqual(plain);
  expect(
    run([
      { group: "g", label: "One", chats: ["a"] },
      { group: "g", label: "Two", chats: ["b"] },
    ]),
  ).toEqual(["g:a", "b", "c", "d"]);
  expect(run([{ group: "g", label: "x", chats: ["zzz"] }])).toEqual(plain);
  expect(run([{ group: "g", label: "x", chats: "a" }, null, 3])).toEqual(plain);
});
