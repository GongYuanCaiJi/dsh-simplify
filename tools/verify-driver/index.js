// One-shot runner: create an agent in the current directory, dispatch the
// verify line through the real `commands.execute` seam (the same path the web
// UI uses), wait for the whole follow-up turn, flush the session, print the
// final assistant text, and exit.
import { randomUUID } from "node:crypto";
import { installModelSelection } from "@deepseek-ai/dsh-agent";
import { SessionId } from "@deepseek-ai/dsh-session";

export const name = "verify-driver-runner";
export const inject = ["agents", "sessions", "agentDefaultModel", "verifyDriverStartup", "loader", "commands"];

const STAGE_TIMEOUT_MS = 30_000;
const FOLLOWUP_TIMEOUT_MS = 600_000;

function withTimeout(promise, label, ms = STAGE_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)),
  ]);
}

function summarize(events, firstSeq) {
  let started = false;
  let text = "";
  let reason;
  for (const event of events) {
    if (event.seq < firstSeq) continue;
    if (event.type === "turn/start") {
      started = true;
      continue;
    }
    if (!started) continue;
    if (event.type === "assistant/message") {
      const joined = event.data.message.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("");
      if (joined !== "") text = joined;
    }
    if (event.type === "turn/end") reason = event.data.reason;
  }
  return { text, reason };
}

export function apply(ctx) {
  // Fire-and-forget, mirroring @deepseek-ai/dsh-headless: apply() must return
  // synchronously or the loader entry stays pending and `loader.await()` below
  // deadlocks against this very entry.
  void run(ctx).catch((error) => {
    process.stderr.write(`verify-driver: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
}

async function run(ctx) {
  await ctx.get("loader")?.await();
  const agents = ctx.get("agents");
  const defaultModel = ctx.get("agentDefaultModel");
  const sessions = ctx.get("sessions");
  const startup = ctx.get("verifyDriverStartup");
  const commands = ctx.get("commands");
  if (agents === undefined || defaultModel === undefined || sessions === undefined || startup === undefined || commands === undefined) {
    process.stderr.write("verify-driver: required service missing\n");
    process.exit(3);
  }

  const selection = defaultModel.currentSelection();
  const { agent } = await withTimeout(agents.create({
    sessionId: SessionId(`session-${randomUUID()}`),
    meta: { cwd: process.cwd() },
    agentOptions: {
      provider: selection.provider,
      model: selection.model,
    },
    setup: (agentCtx) => {
      installModelSelection(agentCtx, {
        current: selection,
        assembled: undefined,
      });
    },
  }), "agents.create");
  await withTimeout(agent.whenIdle(), "initial agent.whenIdle");

  const firstSeq = agent.session.seq;
  const execution = await withTimeout(commands.execute(agent, startup.line, new AbortController().signal), "commands.execute");
  if (execution === undefined) {
    process.stderr.write(`verify-driver: no command matched: ${startup.line}\n`);
    process.exit(2);
  }

  await withTimeout(agent.whenIdle(), "follow-up agent.whenIdle", FOLLOWUP_TIMEOUT_MS);
  await sessions.flush(agent.session);

  const outcome = summarize(agent.session.events, firstSeq);
  process.stdout.write(`\n--- verify-driver: command ${startup.line} -> ${execution.result.kind}\n`);
  if (execution.result.text !== undefined) process.stdout.write(`--- command result text: ${execution.result.text}\n`);
  process.stdout.write(`--- final assistant text:\n${outcome.text}\n`);
  if (outcome.reason?.kind === "error") {
    process.stderr.write(`verify-driver: ${outcome.reason.error.code}: ${outcome.reason.error.message}\n`);
    process.exit(1);
  }
  process.exit(0);
}
