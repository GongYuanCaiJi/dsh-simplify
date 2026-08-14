import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCommand, exec, DEFAULT_TIMEOUT_MS, DEFAULT_STDOUT_MAX_BYTES } from "../dist/exec.js";

test("empty args: command alone", () => {
  assert.equal(buildCommand("git", []), "git");
});

test("plain args are single-quoted", () => {
  assert.equal(
    buildCommand("git", ["diff", "--name-status"]),
    "git 'diff' '--name-status'",
  );
});

test("path with spaces stays a single argv word", () => {
  assert.equal(
    buildCommand("git", ["diff", "--", "my file.ts"]),
    "git 'diff' '--' 'my file.ts'",
  );
});

test("path with a single quote is escaped for bash -c", () => {
  assert.equal(
    buildCommand("git", ["diff", "--", "it's.ts"]),
    "git 'diff' '--' 'it'\\''s.ts'",
  );
});

test("exec maps exitCode/stdout and passes workdir + defaults into resolve", async () => {
  let resolved;
  const ctx = {
    shell: {
      resolve: (request) => {
        resolved = request;
        return { ...request, workdir: request.workdir ?? process.cwd() };
      },
      run: async (spec) => ({
        exitCode: 0,
        signal: null,
        timedOut: false,
        aborted: false,
        timeoutMs: spec.timeoutMs,
        stdout: { text: "M\tfoo.ts", truncated: false },
        stderr: { text: "", truncated: false },
      }),
    },
  };
  const result = await exec(ctx, "git", ["diff", "--name-status"], { cwd: "/tmp/x" });
  assert.deepEqual(result, { code: 0, stdout: "M\tfoo.ts" });
  assert.equal(resolved.command, "git 'diff' '--name-status'");
  assert.equal(resolved.workdir, "/tmp/x");
  assert.equal(resolved.timeoutMs, DEFAULT_TIMEOUT_MS);
  assert.equal(resolved.stdoutMaxBytes, DEFAULT_STDOUT_MAX_BYTES);
});

test("exec maps null exitCode (signal death) to code -1", async () => {
  const ctx = {
    shell: {
      resolve: (request) => ({ ...request, workdir: request.workdir ?? process.cwd() }),
      run: async () => ({
        exitCode: null,
        signal: "SIGKILL",
        timedOut: false,
        aborted: false,
        timeoutMs: 30000,
        stdout: { text: "", truncated: false },
        stderr: { text: "", truncated: false },
      }),
    },
  };
  const result = await exec(ctx, "git", ["diff"]);
  assert.deepEqual(result, { code: -1, stdout: "" });
});
