import * as vscode from "vscode";
import { CLIS } from "./clis";
import type { AvailabilityRegistry, CliState } from "./availability";
import { readSettings } from "./detect";

export class StatusBarController {
  private readonly items = new Map<string, vscode.StatusBarItem>();

  constructor(
    context: vscode.ExtensionContext,
    private readonly registry: AvailabilityRegistry,
  ) {
    CLIS.forEach((def, index) => {
      const item = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        100 - index * 10,
      );
      item.command = def.commandId;
      context.subscriptions.push(item);
      this.items.set(def.id, item);
    });
  }

  refresh(): void {
    for (const [id, item] of this.items) {
      const state = this.registry.get(id);
      if (!state?.visible || !state.resolved.executable) {
        item.hide();
        continue;
      }
      item.text = `$(${readSettings(state.def).codicon}) ${state.def.displayName}`;
      item.tooltip = this.tooltip(state);
      item.show();
    }
  }

  private tooltip(state: CliState): vscode.MarkdownString {
    const tooltip = new vscode.MarkdownString();
    const { def, resolved } = state;
    const { extraArgs } = readSettings(def);
    tooltip.appendMarkdown(`**${def.displayName}**\n\n`);
    tooltip.appendMarkdown(`Open \`${def.binary}\` in a terminal\n\n`);
    tooltip.appendMarkdown(`Path: \`${resolved.executable}\`\n\n`);
    if (extraArgs.length > 0) {
      tooltip.appendMarkdown(`Extra arguments: \`${extraArgs.join(" ")}\`\n\n`);
    }
    if (!def.verified) {
      tooltip.appendMarkdown(`_⚠ The launch arguments for this CLI have not been verified on this machine._`);
    }
    return tooltip;
  }
}
