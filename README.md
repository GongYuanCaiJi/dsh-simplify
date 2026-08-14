# dsh-simplify

简体中文 | [English](#english)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![DSH](https://img.shields.io/badge/DSH-DeepSeek%20Harness-blue.svg)](https://github.com/deepseek-ai/deepseek-harness)
[![上游](https://img.shields.io/badge/移植自-pi--simplify-orange.svg)](https://www.npmjs.com/package/pi-simplify)

> **一句话：改完代码打一句 `/simplify`，让 agent 只审查你刚改动的那几行，不碰其他地方。**

移植自 [`pi-simplify`](https://www.npmjs.com/package/pi-simplify)（MIT），
上游的提示词与 git diff 解析逻辑逐字保留，只适配 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的 API 差异。

## ✨ 功能

- 🎯 **只审查改动行** —— 通过 `git diff` 定位改动的文件与行号范围，agent 可以读周围代码当背景，但**编辑严格限制在改动行内**
- 🔍 **四种范围** —— 未提交改动 / 已 staged / 与任意 ref 比较 / 指定文件
- 🧪 **改完自己跑测试** —— 审查结束前会运行既有测试，确认没有改坏
- 📐 **遵守项目规范** —— 自动遵循项目里的 `CLAUDE.md` / `AGENTS.md` 约定
- 🈶 **空白与引号文件名安全** —— 参数逐个 POSIX 单引号转义

## 📸 效果

在一个有未提交改动的仓库里：

```
> /simplify

  read  src/alpha.ts          ← 只读被改过的文件
  read  src/beta.ts
  edit  src/alpha.ts          ← 只改 4-5 行（本次改动范围内）
  edit  src/beta.ts           ← 只改 3-4 行
  bash  npm test              → 1 pass, 0 fail
```

agent 的总结会明确说明范围外的行为什么不动：

> Removed the intermediate variable `d`… Both edits stayed strictly within the
> listed changed line ranges… the test suite passes (1 pass, 0 fail).

没有任何改动时：

```
> /simplify
No changed files found. Specify file paths or make some changes first.
```

## 📦 安装

```bash
dsh plugin --profile <你的 profile> add dsh-simplify
```

从本地目录安装：

```bash
git clone https://github.com/GongYuanCaiJi/dsh-simplify.git
dsh plugin --profile <你的 profile> add ./dsh-simplify
```

## 🚀 用法

```
/simplify                      # 审查所有未提交的改动
/simplify --staged             # 只审查已 staged 的改动
/simplify --ref=<ref>          # 与指定 ref 比较，例如 --ref=main、--ref=HEAD~3
/simplify <file...>            # 只审查指定文件
```

<details>
<summary>移植说明（对上游 <code>pi-simplify@0.2.3</code>）</summary>

逐字保留，`cmp` 验证一致：`src/types.ts`、`src/prompt-builder.ts`（含提示词全文）、
以及 `src/git-diff.ts` 的 `STATUS_MAP` / `parseDiffOutput` / `parseChangedLines` / `diffArgs`。

六处适配（dsh 与 Pi 的 API 不同）：入口改为 Cordis namespace 形状；命令改注册到 `commands` 服务；
工作目录取自 `agent.session.header.cwd`；「无改动」提示改为命令回传值；
`pi.exec` 改走 `ctx.shell`（薄转接层，调用端零改动）；提示词改用 `agent.followup` 送出。

**已知限制：** agent 收到的提示词是英文的 —— 那是上游原文，逐字保留未做翻译。

</details>

## 📄 License

MIT。上游 [`pi-simplify`](https://github.com/MattDevy/pi-extensions/tree/main/packages/pi-simplify)
`Copyright (c) 2026 Matt Devy`，本移植 `Copyright (c) 2026 GongYuanCaiJi`。见 [LICENSE](./LICENSE)。

感谢 [MattDevy/pi-extensions](https://github.com/MattDevy/pi-extensions) 的原作者。

---

# English

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![DSH](https://img.shields.io/badge/DSH-DeepSeek%20Harness-blue.svg)](https://github.com/deepseek-ai/deepseek-harness)

> **One line: after editing, type `/simplify` and the agent reviews only the lines you just changed — nothing else.**

A port of [`pi-simplify`](https://www.npmjs.com/package/pi-simplify) (MIT) to
[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). The upstream prompt and
git-diff parsing are kept byte-identical; only the dsh API seams are adapted.

## ✨ Features

- 🎯 **Changed lines only** — locates changed files and line ranges via `git diff`; the agent may read surrounding code for context but **edits stay inside the changed ranges**
- 🔍 **Four scopes** — uncommitted / staged / against any ref / specific files
- 🧪 **Runs your tests** — verifies nothing broke before finishing
- 📐 **Follows project standards** — honours `CLAUDE.md` / `AGENTS.md`
- 🈶 **Safe with spaces and quotes in paths** — every argument is POSIX single-quote escaped

## 📦 Install

```bash
dsh plugin --profile <your-profile> add dsh-simplify
```

## 🚀 Usage

```
/simplify                      # review all uncommitted changes
/simplify --staged             # review only staged changes
/simplify --ref=<ref>          # diff against a ref, e.g. --ref=main, --ref=HEAD~3
/simplify <file...>            # review only the given files
```

## 📄 License

MIT. Upstream [`pi-simplify`](https://github.com/MattDevy/pi-extensions/tree/main/packages/pi-simplify)
`Copyright (c) 2026 Matt Devy`; this port `Copyright (c) 2026 GongYuanCaiJi`. See [LICENSE](./LICENSE).

Thanks to the authors of [MattDevy/pi-extensions](https://github.com/MattDevy/pi-extensions).
