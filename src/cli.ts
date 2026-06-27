import { read, respond, approve } from "@polyhook/sdk";
import { handle } from "./handler.js";

async function main(): Promise<void> {
  const targets = process.argv.slice(2);
  try {
    const event = await read();
    await respond(handle(event, targets));
  } catch {
    // Fail open: never block the agent on a hook/tooling failure.
    await respond(approve());
  }
}

void main();
