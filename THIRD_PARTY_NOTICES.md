# Third-party notices

## pi-simplify

This package is a port of `pi-simplify`. The upstream source is used under the MIT License.

| | |
|---|---|
| Package | [`pi-simplify@0.2.3`](https://www.npmjs.com/package/pi-simplify) |
| Repository | [MattDevy/pi-extensions](https://github.com/MattDevy/pi-extensions/tree/main/packages/pi-simplify) |
| Author | Matt Devy |
| License | MIT |
| Tarball | `https://registry.npmjs.org/pi-simplify/-/pi-simplify-0.2.3.tgz` |
| Integrity | `sha512-9dxsXiGmO7DmjguC4Bk/lu7IYlYt0x1m2VneUpIGSQspx4BtshBgt+Vb8xvoxXc/Ugif7/sdwcbf7TgULqiSHg==` |
| shasum | `f026d3b7a51a80896ea5a9be78cf37e81afdc8f4` |
| gitHead | `8fcf9b12b48e7852d19bfa97f20d88fd6977cbc1` |

### Verifying the verbatim claim yourself

The README states that some files are byte-identical to upstream. You do not have to take
that on trust — fetch the pinned upstream tarball and compare:

```bash
curl -sL https://registry.npmjs.org/pi-simplify/-/pi-simplify-0.2.3.tgz | tar xz
cmp package/src/types.ts          src/types.ts          && echo "types.ts OK"
cmp package/src/prompt-builder.ts src/prompt-builder.ts && echo "prompt-builder.ts OK"
```

Expected SHA-256 of the two byte-identical files:

```
a2bada5b13bc167c4e0907269dfed4c1e7d51499e9590dd870a276ff7d4a1fae  src/types.ts
1f406c80cb94ca0463e4da1d47ec7d3072fb9b5dca0ba0dd2f08647f68590bda  src/prompt-builder.ts
```

`src/git-diff.ts` is not byte-identical — the four parsing helpers
(`STATUS_MAP`, `parseDiffOutput`, `parseChangedLines`, `diffArgs`) are copied unchanged,
while the call sites are adapted to the dsh shell seam. Diff it against upstream to see
exactly which lines differ:

```bash
diff -u package/src/git-diff.ts src/git-diff.ts
```

`src/exec.ts` is new — it is the dsh shell adapter and has no upstream counterpart.
