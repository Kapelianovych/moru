/**
 * @import { Transformer } from '@parcel/plugin';
 * @import { DiagnosticCodeHighlight, DiagnosticCodeFrame } from '@parcel/diagnostic';
 * @import { Diagnostics, VirtualFile, Location } from "@moru/core";
 */

import { md } from "@parcel/diagnostic";
import { MessageTag } from "@moru/core";

/** @typedef {Parameters<ConstructorParameters<typeof Transformer<unknown>>['0']['transform']>[0]['logger']} PluginLogger */

const markdown =
  /** @type {function(TemplateStringsArray, ...unknown): string} */ (
    /** @type {unknown} */ (md)
  );

/**
 * @param {PluginLogger} logger
 * @returns {Diagnostics}
 */
export function createDiagnostics(logger) {
  return {
    publish(message) {
      /** @type {Array<DiagnosticCodeFrame>} */
      const codeFrames = [
        {
          filePath: message.sourceFile.url,
          code: message.sourceFile.content,
          codeHighlights: [
            getDiagnosticCodeHighlight(message.sourceFile, message.location),
          ],
        },
      ];

      switch (message.tag) {
        case MessageTag.ComponentMissingExport:
          logger.error({
            message: markdown`The ${md.bold(message.componentUrl)} component does not export the ${md.bold(message.importedVariableName)} variable.`,
            hints: [
              markdown`Add the <export name="${message.importedVariableName}" /> to the ${md.bold(message.componentUrl)} component.`,
            ],
            codeFrames,
          });
          break;
        case MessageTag.SingleElseElement:
          logger.error({
            message: markdown`The ${md.bold("<else>")} element must be preceeded by the ${md.bold("<if>")} or ${md.bold("<else-if>")} tags.`,
            codeFrames,
          });
          break;
        case MessageTag.SingleElseIfElement:
          logger.error({
            message: markdown`The ${md.bold("<else-if>")} element must be preceeded by the ${md.bold("<if>")} tag.`,
            codeFrames,
          });
          break;
        case MessageTag.InvalidNameOfImportedComponent:
          logger.error({
            message: markdown`Invalid component import url. Component's name should end with one of ${message.allowedExtensions.map((extension) => md.bold(extension)).join(", ")} extensions and consist of at least one character.`,
            codeFrames,
          });
          break;
        case MessageTag.ExternalBuildScript:
          logger.error({
            message: markdown`${md.bold("build")} scripts cannot have the ${md.bold("src")} attribute.`,
            hints: [
              'Use import declaration instead: <script type="module">\n import { ... } from "...";\n</script>',
            ],
            codeFrames,
          });
          break;
        case MessageTag.UnsupportedBuildScriptReexporting:
          logger.error({
            message: markdown`The ${md.bold("build")} script cannot reexport any value.`,
            hints: [
              "Directly import all values and then export them using the named or export default syntax.",
            ],
            codeFrames,
          });
          break;
        case MessageTag.FailedBuildScriptExecution: {
          if (message.error instanceof Error) {
            logger.error({
              message: message.error.message,
              stack: message.error.stack,
              name: message.error.name,
              origin: message.sourceFile.url,
              codeFrames,
            });
          } else {
            logger.error({
              message: String(message.error),
              origin: message.sourceFile.url,
              codeFrames,
            });
          }
          break;
        }
        case MessageTag.ProhibitedReservedComponentRemapping:
          logger.error({
            message: markdown`The ${md.bold(message.reservedComponentName)} component name is reserved and cannot be remapped.`,
            hints: [
              message.remapFor === "named-fragment"
                ? "Create another name for the fragment."
                : "Rename the component file or provide different alias for the imported component.",
            ],
            codeFrames,
          });
          break;
        case MessageTag.EmptyExplicitComponentAlias:
          logger.error({
            message:
              "Imported component cannot have an empty string as an aliased name.",
            hints: [
              "Either remove alias or provide name with at least one character.",
            ],
            codeFrames,
          });
          break;
        case MessageTag.InvalidImportComponentPosition:
          logger.error({
            message: markdown`The ${md.bold("<import>")} tag cannot be a child of any other component or tag and should not be preceeded by any kind of a node.`,
            codeFrames,
          });
          break;
        case MessageTag.FailedInHtmlExpressionExecution:
          logger.error({
            message: "An error has been detected while running the expression.",
            origin: String(message.error),
            codeFrames,
          });
          break;
        case MessageTag.InvalidExpandResult:
          logger.error({
            message: markdown`Value of the ${md.bold("expand")} attribute must be an object, but got ${typeof md.bold(message.actualResult)}.`,
            codeFrames,
          });
          break;
        case MessageTag.NonIterableEachAttribute:
          logger.error({
            message: markdown`Value of the ${md.bold("each")} attribute must be an array, but got ${typeof md.bold(message.attributeValue)}.`,
            codeFrames,
          });
          break;
        case MessageTag.MissingExportedValueFromBuild:
          logger.error({
            message: markdown`There is no one ${md.bold("build")} script that exports ${message.names.map((name) => md.bold(name)).join(", ")} variable${message.names.length > 2 ? "s" : ""}.`,
            codeFrames,
          });
          break;
        case MessageTag.JsSyntaxError:
          logger.error({
            message: markdown`A ${md.bold("SyntaxError")} detected.`,
            origin: String(message.error),
            codeFrames,
          });
          break;
        case MessageTag.ReferenceToNonExistentPortal:
          logger.error({
            message: markdown`There is no portal with the ${md.bold(message.name)} name.`,
            hints: [
              markdown`Create the ${md.bold(`<portal name="${message.name}" />`)} somewhere.`,
            ],
            codeFrames,
          });
          break;
        case MessageTag.NotDefinedPortalName:
          logger.error({
            message: markdown`Portal's name cannot be ${md.bold("undefined")}.`,
            codeFrames,
          });
          break;
        case MessageTag.NotDefinedExportName:
          logger.error({
            message: markdown`Export's name cannot be ${md.bold("undefined")}.`,
            codeFrames,
          });
          break;
        case MessageTag.MissingExportedFromHtmlValueDefinition:
          logger.error({
            message: markdown`The ${md.bold(message.name)} variable is not defined, so cannot be exported.`,
            codeFrames,
          });
          break;
        case MessageTag.InvalidExportElementPosition:
          logger.error({
            message: markdown`The ${md.bold("<export>")} element can be defined only at the top level of the HTML file.`,
            codeFrames,
          });
          break;
      }
    },
  };
}

/**
 * @typedef {Object} CodePoint
 * @property {number} line
 * @property {number} column
 */

/**
 *
 * @param {VirtualFile} file
 * @param {Location} location
 * @param {string} [message]
 * @returns {DiagnosticCodeHighlight}
 */
function getDiagnosticCodeHighlight(file, location, message) {
  /** @type {CodePoint} */
  const end = {
    line: 1,
    column: 0,
  };
  /** @type {CodePoint} */
  const start = {
    line: 1,
    column: 0,
  };

  let index = 0;

  while (index < location.start) {
    const character = file.content[index];

    if (character === "\n") {
      end.line = ++start.line;
      end.column = start.column = 0;
    } else {
      end.column = ++start.column;
    }

    index++;
  }

  while (index <= location.end) {
    const character = file.content[index];

    if (character === "\n") {
      end.line++;
      end.column = 0;
    } else {
      end.column++;
    }

    index++;
  }

  return {
    end,
    start,
    message,
  };
}
