import { parse } from "shell-quote";

/** git global options that take their value as the next word (`git -c k=v commit`). */
const VALUE_OPTIONS = new Set([
  "-C",
  "-c",
  "--git-dir",
  "--work-tree",
  "--namespace",
  "--config-env",
  "--super-prefix",
]);

const ASSIGNMENT = /^[A-Za-z_]\w*=/;

/**
 * True when one simple command (words between shell operators) is `git commit`.
 * Skips leading `VAR=value` assignments and git's global options.
 * @param words The words of one simple command.
 * @returns `true` when the words run `git commit`.
 */
function wordsRunCommit(words: string[]): boolean {
  const start = words.findIndex((w) => !ASSIGNMENT.test(w));
  if (start === -1) return false;
  const [cmd, ...args] = words.slice(start);
  if (cmd.split("/").pop() !== "git") return false;
  let skipValue = false;
  for (const word of args) {
    if (skipValue) skipValue = false;
    else if (VALUE_OPTIONS.has(word)) skipValue = true;
    else if (!word.startsWith("-")) return word === "commit";
  }
  return false;
}

/**
 * True when the shell command runs `git commit`. The command is tokenized
 * with shell-quote, so quoting, chaining (`cd x && git commit`) and git's
 * global options (`git -C dir commit`, `git -c k=v commit`) are handled, and
 * quoted text such as `echo "git commit"` is not a match.
 * @param command The shell command string to test.
 * @returns `true` when the command runs `git commit`.
 */
export function isGitCommitCommand(command: string): boolean {
  // Keep `$VAR` as text instead of expanding it to "".
  const tokens = parse(command, (name) => `$${name}`);
  let words: string[] = [];
  for (const token of [...tokens, { op: ";" }]) {
    if (typeof token === "string") words.push(token);
    else if ("pattern" in token) words.push(token.pattern);
    else {
      if (wordsRunCommit(words)) return true;
      words = [];
    }
  }
  return false;
}
