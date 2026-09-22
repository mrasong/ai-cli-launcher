# AI CLI Launcher

[中文说明](./README.zh-cn.md)

Places shortcut buttons for terminal AI CLIs in the **status bar**. Clicking any button opens a new terminal tab running that CLI.

Seven CLIs are built in. Status bar buttons read `icon Full name`, for example `Antigravity`; terminal tabs use the same full name with a counter (`Antigravity`, `Antigravity 2`).

| Status bar    | Full name   | Executable   |
| ------------- | ----------- | ------------ |
| `Antigravity` | Antigravity | `agy`        |
| `Grok`        | Grok        | `grok`       |
| `Qoder`       | Qoder       | `qodercli`   |
| `Qoder CN`    | Qoder CN    | `qoderclicn` |
| `OpenCode`    | OpenCode    | `opencode`   |
| `Claude Code` | Claude Code | `claude`     |
| `Codex`       | Codex       | `codex`      |

**Anything not installed stays hidden.** The extension looks each executable up on startup and hides the entry when it is missing. After installing a new CLI mid-session, run `AI CLI: Rescan Installed CLIs` instead of reloading the window.

## Behavior

- Every click opens a **new** terminal tab, counted per CLI: `Antigravity`, `Antigravity 2`, `Antigravity 3`…
- The working directory is the workspace folder of the active file, falling back to the first folder.
- The CLI runs as the terminal's shell (not through `/bin/zsh -c`), so exiting the CLI closes the tab.
- Seven terminal profiles are registered as well, selectable from the terminal `+` dropdown.

## Settings

| Setting                  | Description                                                                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `aiCli.terminalLocation` | `panel` (default, bottom panel) or `editor` (its own editor tab). Full-screen TUIs are cramped in a narrow panel. |
| `aiCli.<id>.path`        | Absolute path to the executable. Leave empty for automatic lookup.                                                |
| `aiCli.<id>.extraArgs`   | Arguments appended at launch.                                                                                     |
| `aiCli.<id>.enabled`     | Hide an entry even when its CLI is installed.                                                                     |
| `aiCli.<id>.codicon`     | Status bar icon: a stock codicon name such as `rocket`. Applies without a reload.                                 |

Lookup order is fixed: **`aiCli.<id>.path` → `PATH` → built-in candidate paths** (`/opt/homebrew/bin`, `~/.grok/bin`, `~/.local/bin`, …). When VS Code is started from the Dock, `PATH` often lacks the Homebrew directories, which is what the third tier is for.

### Forcing a fresh agy project

`agy` may reuse an existing project session. To get a clean session on every click:

```json
{ "aiCli.agy.extraArgs": ["--new-project"] }
```

## Icons

The brand SVGs in `media/` are used for the terminal `+` dropdown and the terminal tab. `StatusBarItem` has no image API at all — only `text`, where `$(name)` resolves to a stock codicon — so the status bar uses a codicon per CLI. Change it with `aiCli.<id>.codicon`; the built-in defaults live in the `codicon` field of `src/clis.ts`:

| CLI         | Default       | Other options worth a look                 |
| ----------- | ------------- | ------------------------------------------ |
| Antigravity | `rocket`      | `zap`, `beaker`, `wand`                    |
| Grok        | `sparkle`     | `sparkle-filled`, `star-full`, `lightbulb` |
| Qoder       | `hubot`       | `robot`, `vm-active`, `code`               |
| Qoder CN    | `robot`       | `hubot`, `vm-active`, `code`               |
| OpenCode    | `bracket-dot` | `code`, `terminal`, `bracket`, `console`   |
| Claude Code | `flame`       | `beaker`, `sparkle`, `book`                |
| Codex       | `book`        | `notebook`, `library`, `mortar-board`      |

Names come from the ~570 codicons shipped with VS Code; an unknown name is rendered literally as `$(name)` rather than falling back, so a typo is visible at once.

The SVGs carry a `<style>` block with `@media (prefers-color-scheme)` so they recolor themselves instead of rendering black on a dark theme. Note that VS Code routes that query to Electron's `nativeTheme`, which by default follows **the OS appearance, not the VS Code theme**. If you deliberately mix the two (light OS, dark theme), set `"window.systemColorTheme": "auto"`.

## Known limitations

- Every status bar entry carries its full name, so a few of them together can push the right-hand indicators aside. Turn off what you do not need with `aiCli.<id>.enabled`.
- Command Center has no extension-facing menu point (it is absent from the 1.138 menu allowlist), so the buttons cannot live in the top center.
- **The editor actions buttons cannot be set apart from other extensions'.** Only items in the `navigation` group are visible there, they render flush against each other, and no extension can contribute a separator — see also the `…` overflow, where every other group ends up.
- **User-defined CLI entries are not possible.** Menu items must be declared statically in `package.json`, and there is no runtime API to add or remove them, so only these seven built-ins can appear in the editor actions area.
- The launch arguments for `claude` and `codex` are **unverified on this machine** (not installed here). Their tooltips say so.
- When `yushuailong.qodercli-for-vscode` is also installed, the status bar shows two Qoder entries: that one injects editor context, this one starts a bare `qodercli`. **Do not point `aiCli.qoder.path` at `~/.qoder/entry/qoder`** — that wrapper launches the Qoder IDE as soon as it receives an argument.

## Troubleshooting

| Expected                                            | If it does not happen                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Status bar buttons for installed CLIs               | Run `AI CLI: Rescan Installed CLIs`, then read the "AI CLI" output panel, which lists every path tried                     |
| Terminal tab titled `Antigravity` / `Antigravity 2` | If it shows the process name instead, check for a `terminal.integrated.tabs.title` override                                |
| Clicking Qoder opens the interactive CLI            | `sdk_invalid_args` means `QODER_AGENT_SDK_ENTRYPOINT` was not stripped; see `stripEnv` in `src/clis.ts`                    |
| TUI viewport too small                              | Set `aiCli.terminalLocation` to `editor`                                                                                   |
| Terminal tab icon is a broken image                 | `TerminalOptions.iconPath` only accepts a `Uri`; swap the SVG for a same-size PNG if your VS Code build will not render it |

## Development

```bash
pnpm install           # pnpm only; see pnpm-workspace.yaml
pnpm run typecheck     # tsc --noEmit
pnpm run build         # esbuild -> dist/extension.js
pnpm run package       # -> ai-cli-launcher-<version>.vsix
```

pnpm 11 blocks dependency build scripts unless they are approved in
`pnpm-workspace.yaml` (`allowBuilds`). This project approves none: the esbuild
binary arrives via `@esbuild/darwin-arm64` and the native `keytar` build is only
needed by `vsce` signing, so `ERR_PNPM_IGNORED_BUILDS` is expected to stay quiet.

Press F5 to debug in an Extension Development Host (`.vscode/launch.json` is set up). To install the built artifact:

```bash
code --install-extension ai-cli-launcher-0.1.0.vsix
```

## CLI launch contracts (measured locally)

Read this before changing `src/clis.ts`:

- `agy`: native binary (bubbletea), needs a real TTY — VS Code allocates a PTY, so using it as `shellPath` works. **No `--cwd`**; the working directory can only come from `TerminalOptions.cwd`.
- `grok`: `~/.grok/bin/grok` is a symlink that self-update re-points, so it is resolved on every click rather than cached.
- `qoder`: the real CLI is `~/.local/bin/qodercli`. `~/.qoder/entry/qoder` is a bash dispatcher that takes the IDE-launch branch as soon as it gets an argument. Terminals started from VS Code also inherit `QODER_AGENT_SDK_ENTRYPOINT`, which makes `qodercli` refuse to start interactively, so the variable is deleted before launch.
- `opencode`: goes through the stable Homebrew symlink, never the versioned Cellar path.
- `qoderclicn`: the China build of the same CLI, installed beside `qodercli` with its own config dir (`QODERCN_CONFIG_DIR`). It inherits the same `QODER_AGENT_SDK_ENTRYPOINT`, so that variable is stripped here too.

## License

MIT
