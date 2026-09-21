import * as vscode from "vscode";
import * as path from "node:path";
import type { CliDefinition } from "./clis";
import { readSettings, resolveCli, terminalLocation, type ResolvedCli } from "./detect";

/**
 * Launch counters live in memory rather than being derived from
 * `vscode.window.terminals`, since terminal names are not unique across windows
 * and a closed terminal would otherwise leave a stale name behind.
 */
const launchCounts = new Map<string, number>();

function nextName(def: CliDefinition): string {
  const count = (launchCounts.get(def.id) ?? 0) + 1;
  launchCounts.set(def.id, count);
  return count === 1 ? def.displayName : `${def.displayName} ${count}`;
}

function resolveCwd(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return undefined;
  }
  const active = vscode.window.activeTextEditor?.document.uri;
  if (active) {
    const folder = vscode.workspace.getWorkspaceFolder(active);
    if (folder) {
      return folder.uri.fsPath;
    }
  }
  return folders[0].uri.fsPath;
}

export function buildTerminalOptions(
  def: CliDefinition,
  resolved: ResolvedCli,
  extensionPath: string,
): vscode.TerminalOptions {
  const { extraArgs } = readSettings(def);
  const env: Record<string, string | null> = {};
  for (const key of def.stripEnv) {
    env[key] = null;
  }
  const options: vscode.TerminalOptions = {
    name: nextName(def),
    shellPath: resolved.executable,
    shellArgs: [...extraArgs],
    env,
    location: terminalLocation(),
    iconPath: vscode.Uri.file(path.join(extensionPath, "media", `${def.iconFile}.svg`)),
  };
  const cwd = resolveCwd();
  if (cwd) {
    options.cwd = cwd;
  }
  if (def.colorId) {
    options.color = new vscode.ThemeColor(def.colorId);
  }
  return options;
}

export async function warnMissing(def: CliDefinition, resolved: ResolvedCli): Promise<void> {
  const reason =
    resolved.source === "config-missing"
      ? `the configured path aiCli.${def.id}.path is not executable`
      : `${def.binary} was not found on PATH or in the known locations`;
  const choice = await vscode.window.showWarningMessage(
    `AI CLI Launcher: cannot start ${def.displayName}, ${reason}.`,
    "Open Settings",
  );
  if (choice === "Open Settings") {
    await vscode.commands.executeCommand("workbench.action.openSettings", `aiCli.${def.id}.path`);
  }
}

export async function openCli(def: CliDefinition, extensionPath: string): Promise<void> {
  const resolved = await resolveCli(def);
  if (!resolved.executable) {
    await warnMissing(def, resolved);
    return;
  }
  const terminal = vscode.window.createTerminal(
    buildTerminalOptions(def, resolved, extensionPath),
  );
  terminal.show();
}
