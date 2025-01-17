import { type HtmlNodesCollection } from "./collect-html-nodes.js";
import { createMissingExportedValueFromHtmlDefinitionMessage } from "./diagnostics.js";
import { getLocationOfHtmlNode } from "./html-nodes.js";
import { type Options } from "./options.js";
import { type VirtualFile } from "./virtual-file.js";

export function evaluateExports(
  collection: HtmlNodesCollection,
  localThis: Record<string, unknown>,
  file: VirtualFile,
  options: Options,
): void {
  for (const localVariableNameForExport in collection.exports) {
    const node = collection.exports[localVariableNameForExport];

    const publicName = node.attribs.as ?? localVariableNameForExport;

    if (localVariableNameForExport in localThis) {
      options.exports[publicName] = localThis[localVariableNameForExport];
    } else {
      options.diagnostics.publish(
        createMissingExportedValueFromHtmlDefinitionMessage({
          name: localVariableNameForExport,
          sourceFile: file,
          location: getLocationOfHtmlNode(node),
        }),
      );
    }
  }
}
