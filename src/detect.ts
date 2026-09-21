import * as vscode from "vscode";
import { constants as fsConstants, promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { CliDefinition } from "./clis";

export interface CliSettings {
  readonly configuredPath: string;
  readonly extraArgs: readonly string[];
  readonly enabled: boolean;
  readonly codicon: string;
}

export type ResolveSource = "config" | "config-missing" | "path" | "candidate" | "none";

export interface ResolvedCli {
  /** Absolute path of the executable, or undefined when nothing usable was found. */
  readonly executable?: string;
  readonly source: ResolveSource;
  /** Paths tried, for the output channel and the missing-CLI warning. */
  readonly attempted: readonly string[];
}

export function readSettings(def: CliDefinition): CliSettings {
  const cfg = vscode.workspace.getConfiguration(`aiCli.${def.id}`);
  return {
    configuredPath: (cfg.get<string>("path", "") ?? "").trim(),
    extraArgs: cfg.get<string[]>("extraArgs", []) ?? [],
    enabled: cfg.get<boolean>("enabled", true),
    codicon: readCodicon(cfg.get<string>("codicon", "") ?? "", def.codicon),
  };
}

/**
 * Accepts a bare codicon name or the `$(name)` form copied out of the docs.
 * Unknown names are passed through: VS Code then renders the literal text, which
 * points straight at the typo instead of silently reverting to the default.
 */
function readCodicon(raw: string, fallback: string): string {
  const value = raw.trim();
  if (!value) {
    return fallback;
  }
  const wrapped = /^\$\((.+)\)$/.exec(value);
  return wrapped ? wrapped[1].trim() : value;
}

export function terminalLocation(): vscode.TerminalLocation {
  const value = vscode.workspace
    .getConfiguration("aiCli")
    .get<string>("terminalLocation", "panel");
  return value === "editor" ? vscode.TerminalLocation.Editor : vscode.TerminalLocation.Panel;
}

export function expandHome(input: string): string {
  if (input === "~") {
    return os.homedir();
  }
  if (input.startsWith("~/")) {
    return path.join(os.homedir(), input.slice(2));
  }
  return input;
}

async function isUsable(candidate: string): Promise<boolean> {
  try {
    const stat = await fs.stat(candidate);
    if (!stat.isFile()) {
      return false;
    }
    await fs.access(candidate, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export async function resolveCli(def: CliDefinition): Promise<ResolvedCli> {
  const attempted: string[] = [];
  const configured = readSettings(def).configuredPath;

  if (configured) {
    const expanded = expandHome(configured);
    attempted.push(`aiCli.${def.id}.path = ${expanded}`);
    return (await isUsable(expanded))
      ? { executable: expanded, source: "config", attempted }
      : { source: "config-missing", attempted };
  }

  const pathDirs = (process.env.PATH ?? "").split(path.delimiter).filter(Boolean);
  for (const dir of pathDirs) {
    const candidate = path.join(dir, def.binary);
    attempted.push(candidate);
    if (await isUsable(candidate)) {
      return { executable: candidate, source: "path", attempted };
    }
  }

  for (const candidate of def.candidates.map(expandHome)) {
    attempted.push(candidate);
    if (await isUsable(candidate)) {
      return { executable: candidate, source: "candidate", attempted };
    }
  }

  return { source: "none", attempted };
}
