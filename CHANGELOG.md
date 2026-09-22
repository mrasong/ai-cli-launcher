# Changelog

## 0.2.0

- Status bar buttons for seven terminal AI CLIs: Antigravity (`agy`), Grok (`grok`), Qoder (`qodercli`), Qoder CN (`qoderclicn`), OpenCode (`opencode`), Claude Code (`claude`) and Codex (`codex`).
- Every click opens a new terminal tab that runs the CLI directly, named after the CLI and numbered per CLI (`Antigravity`, `Antigravity 2`, …).
- Terminal `+` dropdown profiles for all seven.
- Entries whose executable cannot be found are hidden; `AI CLI: Rescan Installed CLIs` re-detects after installing one.
- Settings per CLI: `path`, `extraArgs`, `enabled`, `codicon` (status bar icon), plus global `terminalLocation`.
- Lightweight native `.vsix` packaging script with zero deprecated subdependencies.
