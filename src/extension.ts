import * as vscode from "vscode";
import { CLIS } from "./clis";
import { AvailabilityRegistry } from "./availability";
import { StatusBarController } from "./statusBar";
import { openCli } from "./terminals";
import { registerProfiles } from "./profiles";

function displayName(id: string): string {
  return CLIS.find((def) => def.id === id)?.displayName ?? id;
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const output = vscode.window.createOutputChannel("AI CLI", { log: true });
  const registry = new AvailabilityRegistry(output);
  const statusBar = new StatusBarController(context, registry);

  for (const def of CLIS) {
    context.subscriptions.push(
      vscode.commands.registerCommand(def.commandId, () => openCli(def, context.extensionPath)),
    );
  }

  context.subscriptions.push(
    vscode.commands.registerCommand("aiCli.rescan", async () => {
      const result = await registry.scan();
      statusBar.refresh();
      const parts: string[] = [];
      if (result.appeared.length > 0) {
        parts.push(`now available: ${result.appeared.map(displayName).join(", ")}`);
      }
      if (result.disappeared.length > 0) {
        parts.push(`no longer available: ${result.disappeared.map(displayName).join(", ")}`);
      }
      const message = parts.length > 0 ? parts.join("; ") : "no changes";
      void vscode.window.showInformationMessage(
        `AI CLI Launcher: ${message}. Per-CLI lookup results are in the "AI CLI" output panel.`,
      );
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (event) => {
      if (event.affectsConfiguration("aiCli")) {
        await registry.scan();
        statusBar.refresh();
      }
    }),
  );

  registerProfiles(context);
  await registry.scan();
  statusBar.refresh();
}

export function deactivate(): void {
  // Nothing to release: every disposable is registered on the extension context.
}
