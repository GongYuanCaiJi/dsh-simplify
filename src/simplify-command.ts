import type { Agent } from "@deepseek-ai/dsh-agent";
import type { CommandResult } from "@deepseek-ai/dsh-commands";
import { createUserMessage } from "@deepseek-ai/dsh-llm";
import type { Context } from "@deepseek-ai/cordis";
import { getChangedFiles } from "./git-diff.js";
import { buildSimplifyPrompt } from "./prompt-builder.js";
import type { SimplifyOptions } from "./types.js";

export const COMMAND_NAME = "simplify";

export function parseArgs(args: string): SimplifyOptions {
  const tokens = args.trim().split(/\s+/).filter(Boolean);
  const files: string[] = [];
  let ref = "HEAD";
  let staged = false;

  for (const token of tokens) {
    if (token === "--staged") {
      staged = true;
    } else if (token.startsWith("--ref=")) {
      ref = token.slice("--ref=".length);
    } else {
      files.push(token);
    }
  }

  return { files, ref, staged };
}

export async function handleSimplifyCommand(
  args: string,
  ctx: Context,
  agent: Agent,
): Promise<CommandResult> {
  const options = parseArgs(args);
  const cwd = agent.session.header.cwd ?? process.cwd();
  const files = await getChangedFiles(ctx, cwd, options);

  if (files.length === 0) {
    return {
      kind: "success",
      text: "No changed files found. Specify file paths or make some changes first.",
    };
  }

  const prompt = buildSimplifyPrompt(files);
  agent.followup(createUserMessage({
    content: [{ type: "text", text: prompt }],
    source: { kind: "plugin", plugin: "dsh-simplify" },
  }));
  return { kind: "success" };
}
