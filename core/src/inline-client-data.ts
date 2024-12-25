import type { Text } from "domhandler";

import type { Options } from "./options.js";
import type { VirtualFile } from "./virtual-file.js";
import type { HtmlNodesCollection } from "./collect-html-nodes.js";
import type { PublicNameWithAlias } from "./run-build-scripts.js";
import { getLocationOfHtmlNode } from "./html-nodes.js";
import { createMissingExportedValueFromBuildMessage } from "./diagnostics.js";

const IMPORTS =
  /import(?:(?:\s+([^\s,]+)\s+)|(?:\s+([^\s,]+)\s*,\s*)?\s*{([^}]*)}\s*|(?:\s+([^\s,]+)\s*,\s*)?\s*\*\s*as\s+([^\s]+)\s+)from\s*['"]build['"]/g;
const NAMED_IMPORT_NAME = /(\S+)(?:\s+as\s+(\S+))?/;

export function inlineClientData(
  collection: HtmlNodesCollection,
  localThis: Record<string, unknown>,
  publicNames: Array<PublicNameWithAlias>,
  file: VirtualFile,
  options: Options,
): void {
  for (const clientScriptElement of collection.clientScripts) {
    const text = clientScriptElement.firstChild as Text | null;

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
              )});`,
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
          const values: Record<string, unknown> = {};

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

          const values: Record<string, unknown> = {};

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

interface ClientPublicNameWithAlias extends PublicNameWithAlias {
  clientLocal: string;
}

function collectImportNames(
  namedImports: string,
  declaredPublicNames: Array<PublicNameWithAlias>,
): [Array<ClientPublicNameWithAlias>, Array<string>] {
  const publicNames: Array<ClientPublicNameWithAlias> = [];
  const nonDeclaredPublicNames: Array<string> = [];

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

function stringifyClientData(values: unknown): string {
  return JSON.stringify(JSON.stringify(values));
}
