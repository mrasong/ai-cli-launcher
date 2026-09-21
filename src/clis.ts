export interface CliDefinition {
  /** Config namespace segment. */
  readonly id: string;
  /** Full product name, used in the status bar, terminal tabs, tooltips and messages. */
  readonly displayName: string;
  /** Fallback status bar codicon, overridable per CLI with `aiCli.<id>.codicon`. */
  readonly codicon: string;
  /** Basename of the brand SVG under media/, which does not always match `id`. */
  readonly iconFile: string;
  readonly commandId: string;
  readonly profileId: string;
  /** Executable name searched for on PATH. */
  readonly binary: string;
  /** Absolute paths tried when PATH lookup fails, `~/` allowed. */
  readonly candidates: readonly string[];
  /** ThemeColor id for the terminal tab, or undefined for no tint. */
  readonly colorId?: string;
  /** Environment variables removed before launching the CLI. */
  readonly stripEnv: readonly string[];
  /** Whether the launch contract was verified by running this CLI locally. */
  readonly verified: boolean;
}

export const CLIS: readonly CliDefinition[] = [
  {
    id: "agy",
    displayName: "Antigravity",
    codicon: "rocket",
    iconFile: "antigravity",
    commandId: "aiCli.openAgy",
    profileId: "aiCli.agy",
    binary: "agy",
    candidates: ["/opt/homebrew/bin/agy", "/usr/local/bin/agy"],
    colorId: "terminal.ansiBlue",
    stripEnv: [],
    verified: true,
  },
  {
    id: "grok",
    displayName: "Grok",
    codicon: "sparkle",
    iconFile: "grok",
    commandId: "aiCli.openGrok",
    profileId: "aiCli.grok",
    binary: "grok",
    // The symlink is re-pointed by grok's self-update, so it is resolved on every
    // launch instead of being cached.
    candidates: ["~/.grok/bin/grok"],
    colorId: "terminal.ansiMagenta",
    stripEnv: [],
    verified: true,
  },
  {
    id: "qoder",
    displayName: "Qoder",
    codicon: "hubot",
    iconFile: "qoder",
    commandId: "aiCli.openQoder",
    profileId: "aiCli.qoder",
    // `qoder` on PATH is a dispatcher that starts the Qoder IDE as soon as it
    // receives an argument, so the CLI binary is looked up by its own name.
    binary: "qodercli",
    candidates: ["~/.local/bin/qodercli", "~/.qoder/bin/qodercli/qodercli"],
    colorId: "terminal.ansiGreen",
    stripEnv: ["QODER_AGENT_SDK_ENTRYPOINT"],
    verified: true,
  },
  {
    id: "qodercn",
    displayName: "Qoder CN",
    codicon: "robot",
    // Same brand artwork as the international build; only the executable differs.
    iconFile: "qoder",
    commandId: "aiCli.openQoderCn",
    profileId: "aiCli.qodercn",
    binary: "qoderclicn",
    // The bin directory holds versioned files only, so the launcher symlink is
    // the stable path.
    candidates: ["~/.local/bin/qoderclicn"],
    colorId: "terminal.ansiCyan",
    stripEnv: ["QODER_AGENT_SDK_ENTRYPOINT"],
    verified: true,
  },
  {
    id: "opencode",
    displayName: "OpenCode",
    codicon: "bracket-dot",
    iconFile: "opencode",
    commandId: "aiCli.openOpencode",
    profileId: "aiCli.opencode",
    binary: "opencode",
    candidates: ["/opt/homebrew/bin/opencode", "/usr/local/bin/opencode"],
    colorId: "terminal.ansiYellow",
    stripEnv: [],
    verified: true,
  },
  {
    id: "claude",
    displayName: "Claude Code",
    codicon: "flame",
    iconFile: "claude",
    commandId: "aiCli.openClaude",
    profileId: "aiCli.claude",
    binary: "claude",
    candidates: ["/opt/homebrew/bin/claude", "/usr/local/bin/claude"],
    stripEnv: [],
    verified: false,
  },
  {
    id: "codex",
    displayName: "Codex",
    codicon: "book",
    iconFile: "codex",
    commandId: "aiCli.openCodex",
    profileId: "aiCli.codex",
    binary: "codex",
    candidates: ["/opt/homebrew/bin/codex", "/usr/local/bin/codex"],
    stripEnv: [],
    verified: false,
  },
];
