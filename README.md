# branch-not-behind

A [polyhook](https://github.com/tupe12334/polyhook) hook that **blocks an AI coding
agent's `git commit`** when the current branch is **behind** one or more target branches.
Write it once — it runs under Claude Code, Cursor, Windsurf, Cline, and Amp via
[`@polyhook/sdk`](https://www.npmjs.com/package/@polyhook/sdk).

## How it works

When the agent is about to run a shell command, the hook receives a normalized
`tool:before` event. If the command is a `git commit`, the hook:

1. Resolves the current branch.
2. For each target branch passed as a CLI arg, runs `git fetch origin <branch>` then
   counts how many commits `HEAD` is behind `origin/<branch>`
   (`git rev-list --count HEAD..origin/<branch>`).
3. **Blocks** the commit if any target is ahead, with a message naming each branch and
   the rebase command. Otherwise **approves**.

It **fails open**: if it isn't a git repo, git is missing, or fetch fails offline, the
commit is approved — the hook never blocks on tooling failure. A target equal to the
current branch is skipped.

## Install

```bash
npm install -g branch-not-behind
```

## Usage

Register it as a hook in your AI tool, passing the target branches as args:

```
branch-not-behind main develop
```

Now any agent-issued `git commit` is gated on the current branch being up to date with
`origin/main` **and** `origin/develop`. Example block output (Claude Code format):

```json
{
  "decision": "block",
  "reason": "Commit blocked: current branch is behind its target branch(es).\n  - behind origin/main by 2 commit(s); run: git fetch && git rebase origin/main\nRebase or merge the listed branch(es), then commit again."
}
```

## Programmatic API

```ts
import { handle, behindCounts, isGitCommitCommand } from "branch-not-behind";
```

- `handle(event, targets, counts?)` — pure decision function returning a polyhook response.
- `behindCounts(targets, current?)` — `{ branch, behind, stale?, error? }[]`.
- `isGitCommitCommand(command)` — detect a `git commit` shell command.
- `currentBranch()` — current branch name or `null`.

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```
