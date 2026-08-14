import type { Context } from "@deepseek-ai/cordis";
import type { CommandInvocation } from "@deepseek-ai/dsh-commands";
import { COMMAND_NAME, handleSimplifyCommand } from "./simplify-command.js";

export const name = "dsh-simplify";
export const inject = ["shell"];

export function apply(ctx: Context): void {
  ctx.inject(["commands"], (cmdCtx) => {
    cmdCtx.commands.register({
      name: COMMAND_NAME,
      description:
        "Review recently changed code for clarity, consistency, and maintainability improvements",
      input: { hint: "[--staged] [--ref=<ref>] [files...]" },
      handler: async (invocation: CommandInvocation) =>
        handleSimplifyCommand(invocation.rawInput, ctx, invocation.agent),
    });
  });
}
