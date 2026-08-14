import type { Context } from "@deepseek-ai/cordis";
// Loads the `Context.shell` module augmentation declared by @deepseek-ai/dsh-shell.
import type {} from "@deepseek-ai/dsh-shell";

export interface ExecResult {
  readonly code: number;
  readonly stdout: string;
}

/** Foreground git runs are local and fast; 30s covers a slow machine cold start. */
export const DEFAULT_TIMEOUT_MS = 30_000;
/** One million lines of diff output would be ~10MB; generous for any repo. */
export const DEFAULT_STDOUT_MAX_BYTES = 10_000_000;

export function escapeShellArg(arg: string): string {
  return `'${arg.replaceAll("'", `'\\''`)}'`;
}

export function buildCommand(command: string, args: readonly string[]): string {
  return [command, ...args.map(escapeShellArg)].join(" ");
}

/**
 * dsh shell seam adapter: `exec(ctx, 'git', args, { cwd }) → { code, stdout }`.
 *
 * Maps the Pi `pi.exec(command, args, { cwd })` shape onto dsh's
 * `ctx.shell.resolve({ command, workdir, ... }) + run(spec)` seam so the
 * callers in git-diff.ts keep seeing `result.code === 0` and `result.stdout`
 * unchanged. The command string is built by single-quote-escaping every
 * argument (paths may contain spaces or quotes).
 */
export function exec(
  ctx: Context,
  command: string,
  args: readonly string[],
  options: { readonly cwd?: string } = {},
): Promise<ExecResult> {
  const spec = ctx.shell.resolve({
    command: buildCommand(command, args),
    timeoutMs: DEFAULT_TIMEOUT_MS,
    stdoutMaxBytes: DEFAULT_STDOUT_MAX_BYTES,
    workdir: options.cwd,
  });
  return ctx.shell.run(spec).then((result) => ({
    // `exitCode` is null when the process died from a signal; upstream `code`
    // is always a number, so map null to a non-zero code (failure).
    code: result.exitCode ?? -1,
    stdout: result.stdout.text,
  }));
}
