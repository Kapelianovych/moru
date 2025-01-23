/** @import { Text } from "domhandler"; */

/**
 * @import { Options } from "./options.js";
 * @import { VirtualFile } from "./virtual-file.js";
 * @import { HtmlNodesCollection } from "./collect-html-nodes.js";
 * @import { PublicNameWithAlias } from "./run-build-scripts.js";
 * @import { LocalThis } from "./local-this.js";
 */

import { getLocationOfHtmlNode } from "./html-nodes.js";
import { createMissingExportedValueFromBuildMessage } from "./diagnostics.js";

const IMPORTS =
  /import(?:(?:\s+([^\s,]+)\s+)|(?:\s+([^\s,]+)\s*,\s*)?\s*{([^}]*)}\s*|(?:\s+([^\s,]+)\s*,\s*)?\s*\*\s*as\s+([^\s]+)\s+)from\s*['"]build['"]/g;
const NAMED_IMPORT_NAME = /(\S+)(?:\s+as\s+(\S+))?/;

/**
 * @param {HtmlNodesCollection} collection
 * @param {LocalThis} localThis
 * @param {Array<PublicNameWithAlias>} publicNames
 * @param {VirtualFile} file
 * @param {Options} options
 * @returns {void}
 */
export function inlineClientData(
  collection,
  localThis,
  publicNames,
  file,
  options,
) {
  for (const clientScriptElement of collection.clientScripts) {
    const text = /** @type {Text | null} */ (clientScriptElement.firstChild);

    if (text) {
      const matches = text.data.matchAll(IMPORTS);

      for (const [
        fullMatch,
        onlyDefaultImport,
        defaultImportBeforeNamed,
        namedImports,
        defaultImportBeforeNamespace,
        namespaceImport,
      ] of matches) {
        const defaultImportName =
          onlyDefaultImport ||
          defaultImportBeforeNamed ||
          defaultImportBeforeNamespace;

        if (defaultImportName) {
          const alias = publicNames.find(
            (alias) => alias.exported === "default",
          );

          if (alias) {
            text.data = text.data.replace(
              fullMatch,
              `const ${defaultImportName} = JSON.parse(${stringifyClientData(
                localThis[alias.local],
              )});${
                onlyDefaultImport
                  ? ""
                  : // Preserve original statement for named or namespaced imports to replace.
                    fullMatch
              }`,
            );
          } else {
            options.diagnostics.publish(
              createMissingExportedValueFromBuildMessage({
                names: ["default"],
                sourceFile: file,
                location: getLocationOfHtmlNode(clientScriptElement),
              }),
            );
          }
        }

        if (namespaceImport) {
          /** @type {Record<string, unknown>} */
          const values = {};

          for (const { local, exported } of publicNames) {
            if (exported !== "default") {
              values[exported] = localThis[local];
            }
          }

          text.data = text.data.replace(
            fullMatch,
            `const ${namespaceImport} = JSON.parse(${stringifyClientData(
              values,
            )});`,
          );
        } else if (namedImports) {
          const [importNames, nonDeclaredPublicNames] = collectImportNames(
            namedImports,
            publicNames,
          );

          if (nonDeclaredPublicNames.length) {
            options.diagnostics.publish(
              createMissingExportedValueFromBuildMessage({
                names: nonDeclaredPublicNames,
                sourceFile: file,
                location: getLocationOfHtmlNode(clientScriptElement),
              }),
            );
          }

          /** @type {Record<string, unknown>} */
          const values = {};

          for (const { local, exported } of importNames) {
            values[exported] = localThis[local];
          }

          text.data = text.data.replace(
            fullMatch,
            `const { ${importNames
              .map((alias) => `${alias.exported}: ${alias.clientLocal}`)
              .join(", ")} } = JSON.parse(${stringifyClientData(values)});`,
          );
        } else {
          // Do nothing.
        }
      }
    } else {
      // No need to check if "text" is an actual text, because
      // we did that while rebasing URLs.
    }
  }

  collection.clientScripts.length = 0;
}

/**
 * @private
 * @typedef {PublicNameWithAlias & { clientLocal: string }} ClientPublicNameWithAlias
 */

/**
 *
 * @param {string} namedImports
 * @param {Array<PublicNameWithAlias>} declaredPublicNames
 * @returns {[Array<ClientPublicNameWithAlias>, Array<string>]}
 */
function collectImportNames(namedImports, declaredPublicNames) {
  /** @type {Array<ClientPublicNameWithAlias>} */
  const publicNames = [];
  /** @type {Array<string>} */
  const nonDeclaredPublicNames = [];

  const parts = namedImports.split(",");

  for (const part of parts) {
    const match = part.match(NAMED_IMPORT_NAME);

    if (match) {
      const name = declaredPublicNames.find(
        (name) => name.exported === match[1],
      );

      if (name) {
        publicNames.push({
          local: name.local,
          exported: match[1],
          clientLocal: match[2] || match[1],
        });
      } else {
        nonDeclaredPublicNames.push(match[1]);
      }
    }
  }

  return [publicNames, nonDeclaredPublicNames];
}

/**
 * @param {unknown} values
 * @returns {string}
 */
function stringifyClientData(values) {
  return JSON.stringify(JSON.stringify(values));
}
