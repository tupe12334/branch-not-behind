import { execFileSync } from "node:child_process";
export { isGitCommitCommand } from "./git-commit-command.js";

/** Result of comparing HEAD against a single target branch. */
export interface BehindResult {
  /** The target branch name, as passed in args. */
  branch: string;
  /** Commits HEAD is behind the target by. 0 means up to date. */
  behind: number;
  /** True when the count came from a local ref because fetch failed. */
  stale?: boolean;
  /** Set when the target could not be resolved (e.g. unknown ref). */
  error?: string;
}

/**
 * Run git, returning trimmed stdout. Throws on non-zero exit.
 * @param args Arguments to pass to the `git` executable.
 * @returns The trimmed stdout of the command.
 */
function git(args: string[]): string {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

/**
 * Current branch name, or null when detached / not a repo.
 * @returns The branch name, or `null` when detached or outside a repo.
 */
export function currentBranch(): string | null {
  try {
    const name = git(["rev-parse", "--abbrev-ref", "HEAD"]);
    return name === "HEAD" ? null : name;
  } catch {
    return null;
  }
}

/**
 * Number of commits HEAD is behind `ref` (commits in ref not in HEAD).
 * @param ref The ref to compare HEAD against.
 * @returns The commit count.
 */
function behindBy(ref: string): number {
  const out = git(["rev-list", "--count", `HEAD..${ref}`]);
  return Number.parseInt(out, 10) || 0;
}

/**
 * True when a ref resolves locally.
 * @param ref The ref to check.
 * @returns Whether the ref exists.
 */
function refExists(ref: string): boolean {
  try {
    git(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

/**
 * For each target branch, compute how far HEAD is behind it. Fetches
 * `origin/<branch>` first; on fetch failure falls back to the local ref and
 * marks the result `stale`. Targets equal to the current branch are skipped.
 * Never throws — unresolved targets carry an `error` and behind 0.
 * @param targets Branch names to compare HEAD against.
 * @param current The current branch name; targets matching it are skipped.
 * @returns One result per target (skipping targets equal to `current`).
 */
export function behindCounts(
  targets: string[],
  current = currentBranch(),
): BehindResult[] {
  const results: BehindResult[] = [];
  for (const branch of targets) {
    if (!branch || branch === current) continue;

    let fetched = false;
    try {
      git(["fetch", "origin", branch]);
      fetched = true;
    } catch {
      // offline / no remote — fall back to local refs below
    }

    const remoteRef = `origin/${branch}`;
    try {
      if (fetched && refExists(remoteRef)) {
        results.push({ branch, behind: behindBy(remoteRef) });
      } else if (refExists(remoteRef)) {
        results.push({ branch, behind: behindBy(remoteRef), stale: true });
      } else if (refExists(branch)) {
        results.push({ branch, behind: behindBy(branch), stale: true });
      } else {
        results.push({ branch, behind: 0, error: "ref not found" });
      }
    } catch (e) {
      results.push({
        branch,
        behind: 0,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return results;
}
