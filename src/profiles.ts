import * as vscode from "vscode";
import { CLIS } from "./clis";
import { resolveCli } from "./detect";
import { buildTerminalOptions, warnMissing } from "./terminals";

export function registerProfiles(context: vscode.ExtensionContext): void {
  for (const def of CLIS) {
    const provider: vscode.TerminalProfileProvider = {
      provideTerminalProfile: async (_token) => {
        const resolved = await resolveCli(def);
        if (!resolved.executable) {
          void warnMissing(def, resolved);
          return undefined;
        }
        return new vscode.TerminalProfile(
          buildTerminalOptions(def, resolved, context.extensionPath),
        );
      },
    };
    context.subscriptions.push(
      vscode.window.registerTerminalProfileProvider(def.profileId, provider),
    );
  }
}
