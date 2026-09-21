# AI CLI Launcher

[English](./README.md)

把终端 AI CLI 的快捷按钮放在**编辑器操作区**（编辑器标题栏右上角）和**底部状态栏**。点击任意按钮都会新建一个终端 tab 并运行对应 CLI。

内置 7 个 CLI。状态栏按钮显示为 `图标 全称`，例如 `Antigravity`；终端 tab 同样使用全称加计数（`Antigravity`、`Antigravity 2`）。

| 状态栏 | 全称 | 可执行文件 |
| --- | --- | --- |
| `Antigravity` | Antigravity | `agy` |
| `Grok` | Grok | `grok` |
| `Qoder` | Qoder | `qodercli` |
| `Qoder CN` | Qoder CN | `qoderclicn` |
| `OpenCode` | OpenCode | `opencode` |
| `Claude Code` | Claude Code | `claude` |
| `Codex` | Codex | `codex` |

**没安装的会自动隐藏。** 扩展启动时会逐个查找可执行文件，找不到就在两个位置同时隐藏该项。会话中途新装了 CLI，执行 `AI CLI: Rescan Installed CLIs` 即可，无需重载窗口。

## 行为

- 每次点击都新建**一个**终端 tab，按 CLI 分别计数：`Antigravity`、`Antigravity 2`、`Antigravity 3`……
- 工作目录取当前活动文件所属的 workspace folder，取不到则用第一个 folder。
- CLI 直接作为终端的 shell 运行（不经过 `/bin/zsh -c`），所以退出 CLI 就会关闭 tab。
- 同时注册了 7 个终端 profile，可以从终端 `+` 下拉菜单里选择。

## 设置

| 设置项 | 说明 |
| --- | --- |
| `aiCli.terminalLocation` | `panel`（默认，底部面板）或 `editor`（独立编辑器 tab）。全屏 TUI 在窄面板里会被挤。 |
| `aiCli.<id>.path` | 可执行文件的绝对路径。留空则自动查找。 |
| `aiCli.<id>.extraArgs` | 启动时追加的参数。 |
| `aiCli.<id>.enabled` | 即使 CLI 已安装也隐藏该项。 |
| `aiCli.<id>.codicon` | 状态栏图标，填内置 codicon 名称（如 `rocket`）。改完即时生效，无需重载。 |

查找顺序固定：**`aiCli.<id>.path` → `PATH` → 内置候选路径**（`/opt/homebrew/bin`、`~/.grok/bin`、`~/.local/bin` 等）。从 Dock 启动 VS Code 时 `PATH` 常常缺少 Homebrew 目录，第三层就是为此兜底。

### 强制 agy 开新会话

`agy` 可能复用已有项目会话。若希望每次点击都是干净会话：

```json
{ "aiCli.agy.extraArgs": ["--new-project"] }
```

## 图标

`media/` 下的品牌 SVG 用于编辑器操作区按钮、终端 `+` 下拉菜单和终端 tab。`StatusBarItem` 完全没有图片 API——只有 `text`，而 `$(name)` 只能解析内置 codicon——所以状态栏为每个 CLI 配一个 codicon。用 `aiCli.<id>.codicon` 就能换；内置默认值在 `src/clis.ts` 的 `codicon` 字段：

| CLI | 默认 | 其它可以试试的 |
| --- | --- | --- |
| Antigravity | `rocket` | `zap`、`beaker`、`wand` |
| Grok | `sparkle` | `sparkle-filled`、`star-full`、`lightbulb` |
| Qoder | `hubot` | `robot`、`vm-active`、`code` |
| Qoder CN | `robot` | `hubot`、`vm-active`、`code` |
| OpenCode | `bracket-dot` | `code`、`terminal`、`bracket`、`console` |
| Claude Code | `flame` | `beaker`、`sparkle`、`book` |
| Codex | `book` | `notebook`、`library`、`mortar-board` |

名称来自 VS Code 自带的约 570 个 codicon。写错的名字不会回退成默认值，而是原样显示成 `$(name)`，所以打错了立刻就能看见。

SVG 里带了一个 `<style>` 块，用 `@media (prefers-color-scheme)` 让自己随主题变色，避免深色主题下显示成黑色。注意 VS Code 会把该查询转给 Electron 的 `nativeTheme`，而默认跟随的是**系统外观，不是 VS Code 主题**。如果你刻意混用（浅色系统 + 深色主题），请设置 `"window.systemColorTheme": "auto"`。

## 已知限制

- 每个状态栏项都带全称，几项加起来宽度可观，可能把右侧指示器挤开。不需要的用 `aiCli.<id>.enabled` 关掉。
- Command Center 没有对外开放的 menu point（1.138 的菜单白名单里不存在），所以按钮放不到顶部中间。
- **编辑器操作区的按钮没法和其它扩展隔开。** 那里只有 `navigation` 组的项会显示，彼此紧挨着渲染，扩展也无法插入分隔线；其它组全部落到 `…` 溢出菜单里。
- **不支持用户自定义 CLI 条目。** 菜单项必须在 `package.json` 里静态声明，且没有运行时增删 API，所以编辑器操作区只能出现这 7 个内置项。
- `claude`、`codex` 的启动参数**未在本机验证过**（本机没装）。它们的 tooltip 里有说明。
- 如果同时安装了 `yushuailong.qodercli-for-vscode`，状态栏会出现两个 Qoder 项：那个会注入编辑器上下文，这个只启动纯净的 `qodercli`。**不要把 `aiCli.qoder.path` 指向 `~/.qoder/entry/qoder`**——那个 wrapper 一收到参数就会去启动 Qoder IDE。

## 排错

| 预期 | 没出现时怎么办 |
| --- | --- |
| 已安装的 CLI 出现在状态栏 | 执行 `AI CLI: Rescan Installed CLIs`，然后看 "AI CLI" 输出面板，里面列出了每一个尝试过的路径 |
| 终端 tab 标题是 `Antigravity` / `Antigravity 2` | 如果显示的是进程名，检查是否有 `terminal.integrated.tabs.title` 覆盖 |
| 点 Qoder 打开交互式 CLI | 报 `sdk_invalid_args` 说明 `QODER_AGENT_SDK_ENTRYPOINT` 没被剥掉，见 `src/clis.ts` 的 `stripEnv` |
| TUI 视口太小 | 把 `aiCli.terminalLocation` 设为 `editor` |
| 终端 tab 图标显示为破损图片 | `TerminalOptions.iconPath` 只接受 `Uri`；若你的 VS Code 版本渲染不了 SVG，换成同尺寸 PNG |

## 开发

```bash
npm install
npm run typecheck     # tsc --noEmit
npm run build         # esbuild -> dist/extension.js
npm run package       # -> ai-cli-launcher-<version>.vsix
```

按 F5 在 Extension Development Host 里调试（`.vscode/launch.json` 已配置）。安装构建产物：

```bash
code --install-extension ai-cli-launcher-0.1.0.vsix
```

## 各 CLI 启动契约（本机实测）

修改 `src/clis.ts` 前先读这段：

- `agy`：原生二进制（bubbletea），需要真实 TTY——VS Code 会分配 PTY，所以直接当 `shellPath` 可用。**不支持 `--cwd`**，工作目录只能通过 `TerminalOptions.cwd` 传。
- `grok`：`~/.grok/bin/grok` 是软链，自更新会重新指向，所以每次点击都重新解析，不做缓存。
- `qoder`：真正的 CLI 是 `~/.local/bin/qodercli`。`~/.qoder/entry/qoder` 是 bash 分发器，一拿到参数就走启动 IDE 的分支。从 VS Code 启动的终端还会继承 `QODER_AGENT_SDK_ENTRYPOINT`，导致 `qodercli` 拒绝交互式启动，所以启动前会删除该变量。
- `opencode`：走稳定的 Homebrew 软链，不用带版本号的 Cellar 路径。
- `qoderclicn`：同一 CLI 的国内版，和 `qodercli` 并存安装，配置目录独立（`QODERCN_CONFIG_DIR`）。它同样会继承 `QODER_AGENT_SDK_ENTRYPOINT`，所以这里也一并剥掉该变量。

## 许可

MIT
