// Startup provider: parses the verify line (default "/simplify") from the
// app command line, mirroring @deepseek-ai/dsh-headless/startup.
import { Command } from "commander";
import { parseCmdline } from "@deepseek-ai/dsh-cmdline";

export const name = "verify-driver-startup";
export const inject = ["cmdlineArgs"];
export const VERIFY_DRIVER_SERVICE = "verifyDriverStartup";

function verifyCommand() {
  return new Command()
    .name("dsh --profile verify")
    .description("Boot the verify profile, run one slash command, print the result, and exit.")
    .helpOption("-h, --help", "show this help")
    .argument("[line...]", "the slash command line; multiple words are joined by spaces (default: /simplify)")
    .addHelpText("after", `
Examples:
  dsh --profile verify --patch tools/verify-driver/patch.yml
  dsh --profile verify --patch tools/verify-driver/patch.yml "/simplify --staged"
`);
}

export function apply(ctx) {
  const program = verifyCommand();
  program.action(() => {
    const line = program.args.join(" ") || "/simplify";
    ctx.provide(VERIFY_DRIVER_SERVICE, { line });
  });
  parseCmdline(ctx, program);
}
