import { approve, block } from "@polyhook/sdk";
import type { HookEvent, HookResponse } from "@polyhook/sdk";
import { type BehindResult, behindCounts, isGitCommitCommand } from "./git.js";

/** Compute the behind results for the targets. Injectable for tests. */
export type CountsFn = (targets: string[]) => BehindResult[];

/**
 * Build the block message from the branches HEAD is behind.
 * @param behind The behind-results to report, already filtered to those that matter.
 * @returns The multi-line message to surface in the block response.
 */
function blockMessage(behind: BehindResult[]): string {
  const lines = behind.map((r) => {
    const ref = r.stale ? r.branch : `origin/${r.branch}`;
    const note = r.stale ? " (local ref; fetch failed)" : "";
    return `  - behind ${ref} by ${String(r.behind)} commit(s)${note}; run: git fetch && git rebase origin/${r.branch}`;
  });
  return [
    "Commit blocked: current branch is behind its target branch(es).",
    ...lines,
    "Rebase or merge the listed branch(es), then commit again.",
  ].join("\n");
}

/**
 * Decide whether to approve or block a hook event. Pure: all git access is
 * supplied via `counts`. Approves everything except a `tool:before` bash
 * `git commit` where at least one target is behind.
 * @param event The hook event to evaluate.
 * @param targets Branch names HEAD must not be behind.
 * @param counts Behind-count lookup, injectable for tests.
 * @returns An `approve` or `block` hook response.
 */
export function handle(
  event: HookEvent,
  targets: string[],
  counts: CountsFn = behindCounts,
): HookResponse {
  if (event.event !== "tool:before" || event.tool !== "bash") return approve();

  const command = (event.input?.command as string | undefined) ?? "";
  if (!isGitCommitCommand(command)) return approve();

  if (targets.length === 0) return approve();

  const behind = counts(targets).filter((r) => !r.error && r.behind > 0);
  if (behind.length === 0) return approve();

  return block(blockMessage(behind));
}
