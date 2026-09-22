import * as vscode from "vscode";
import { CLIS, type CliDefinition } from "./clis";
import { readSettings, resolveCli, type ResolvedCli } from "./detect";

export interface CliState {
  readonly def: CliDefinition;
  readonly resolved: ResolvedCli;
  readonly enabled: boolean;
  readonly visible: boolean;
}

export interface ScanResult {
  readonly appeared: readonly string[];
  readonly disappeared: readonly string[];
}

export class AvailabilityRegistry {
  private states = new Map<string, CliState>();
  private hasScanned = false;

  constructor(private readonly output: vscode.LogOutputChannel) {}

  get(id: string): CliState | undefined {
    return this.states.get(id);
  }

  get firstScan(): boolean {
    return !this.hasScanned;
  }

  async scan(): Promise<ScanResult> {
    const before = this.visibleIds();
    const next = new Map<string, CliState>();

    for (const def of CLIS) {
      const resolved = await resolveCli(def);
      const enabled = readSettings(def).enabled;
      const visible = enabled && Boolean(resolved.executable);
      next.set(def.id, { def, resolved, enabled, visible });

      if (resolved.executable) {
        this.output.info(
          `${def.id}: ${resolved.executable} (source: ${resolved.source})`,
        );
      } else {
        this.output.warn(
          `${def.id}: executable not found, tried ${resolved.attempted.length} locations:\n  ${resolved.attempted.join("\n  ")}`,
        );
      }
    }

    this.states = next;
    this.hasScanned = true;
    const after = [...this.visibleIds()];
    return {
      appeared: after.filter((id) => !before.has(id)),
      disappeared: [...before].filter((id) => !after.includes(id)),
    };
  }

  private visibleIds(): Set<string> {
    return new Set(
      [...this.states.values()]
        .filter((state) => state.visible)
        .map((s) => s.def.id),
    );
  }
}
