import { describe, expect, it } from "vitest";
import type { HookEvent } from "@polyhook/sdk";
import { handle } from "./handler.js";
import type { BehindResult } from "./git.js";

function event(partial: Partial<HookEvent>): HookEvent {
  return {
    event: "tool:before",
    tool: "bash",
    input: { command: "git commit -m x" },
    sessionId: "s",
    caller: "claude-code",
    ...partial,
  };
}

const behind = (n: number): (() => BehindResult[]) => () =>
  [{ branch: "main", behind: n }];

describe("handle", () => {
  it("approves non-tool:before events", () => {
    expect(handle(event({ event: "session:start" }), ["main"], behind(3)).action).toBe(
      "approve",
    );
  });

  it("approves non-bash tools", () => {
    expect(
      handle(event({ tool: "write_file", input: {} }), ["main"], behind(3)).action,
    ).toBe("approve");
  });

  it("approves non-commit bash commands", () => {
    expect(
      handle(event({ input: { command: "git status" } }), ["main"], behind(3)).action,
    ).toBe("approve");
  });

  it("approves when no targets given", () => {
    expect(handle(event({}), [], behind(3)).action).toBe("approve");
  });

  it("approves when up to date", () => {
    expect(handle(event({}), ["main"], behind(0)).action).toBe("approve");
  });

  it("approves when only erroring targets", () => {
    const counts = () => [{ branch: "main", behind: 0, error: "ref not found" }];
    expect(handle(event({}), ["main"], counts).action).toBe("approve");
  });

  it("blocks a git commit when behind", () => {
    const r = handle(event({}), ["main"], behind(3));
    expect(r.action).toBe("block");
    if (r.action === "block") expect(r.message).toContain("behind origin/main by 3");
  });
});
