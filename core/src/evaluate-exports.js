/**
 * @import { HtmlNodesCollection } from "./collect-html-nodes.js";
 * @import { LocalThis, Options } from "./options.js";
 * @import { VirtualFile } from "./virtual-file.js";
 */

import { getLocationOfHtmlNode } from "./html-nodes.js";
import { createMissingExportedValueFromHtmlDefinitionMessage } from "./diagnostics.js";

/**
 * @param {HtmlNodesCollection} collection
 * @param {LocalThis} localThis
 * @param {VirtualFile} file
 * @param {Options} options
 * @returns {void}
 */
export function evaluateExports(collection, localThis, file, options) {
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
