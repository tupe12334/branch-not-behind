import { describe, expect, it } from "vitest";
import { isGitCommitCommand } from "./git.js";

describe("isGitCommitCommand", () => {
  it.each([
    "git commit",
    "git commit -m 'msg'",
    "git commit --amend --no-edit",
    "git -C /repo commit -m x",
    "cd repo && git commit -am x",
    "git add . && git commit -m x",
  ])("matches %j", (cmd) => {
    expect(isGitCommitCommand(cmd)).toBe(true);
  });

  it.each([
    "git status",
    "git log --oneline",
    "git committer-info",
    "git commit-tree abc",
    "echo git then commit later",
    "npm run commit",
  ])("does not match %j", (cmd) => {
    expect(isGitCommitCommand(cmd)).toBe(false);
  });
});
