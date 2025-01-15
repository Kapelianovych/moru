import { inspect } from "node:util";

import colors from "picocolors";
import type { Colors } from "picocolors/types.js";
import type { Logger } from "vite";
import { type AnyMessage, type Diagnostics, MessageTag } from "@moru/core";

import type { Environment } from "./environment.js";

export class DiagnosticsReporter implements Diagnostics {
  constructor(private environment: Environment) {}

  get #logger(): Logger {
    return this.environment.viteConfiguration.logger;
  }

  publish(message: AnyMessage): void {
    switch (message.tag) {
      case MessageTag.SingleElseElement:
        this.#error(
          "An " +
            colors.magenta("<else>") +
            " element must be preceeded by an " +
            colors.magenta("<if>") +
            " or an " +
            colors.magenta("<else-if>") +
            " tags.\n" +
            this.#highlightedRegion(message),
        );
        break;
      case MessageTag.SingleElseIfElement:
        this.#error(
          "An " +
            colors.magenta("<else-if>") +
            " element must be preceeded by an " +
            colors.magenta("<if>") +
            " tag.\n" +
            this.#highlightedRegion(message),
        );
        break;
      case MessageTag.InvalidFileName:
        this.#error(
          "I am unable to extract the file name from " +
            colors.red(message.url) +
            " url.\n" +
            this.#highlightedRegion(message) +
            "It must end with " +
            colors.magenta(message.extension) +
            " extension\n" +
            "and consist of at least one character.\n",
        );
        break;
      case MessageTag.ExternalBuildScript:
        this.#error(
          "The " +
            colors.magenta("build") +
            " script cannot be referenced from a " +
            colors.red("src") +
            " attribute.\n" +
            this.#highlightedRegion(message) +
            "Use import declaration instead.\n" +
            colors.blue(
              '<script type="module" build>\nimport { /* ... */ } from "...";\\n</script>',
            ),
        );
        break;
      case MessageTag.InvalidChildOfExecutableScript:
        this.#error(
          "The " +
            colors.magenta("<script>") +
            " tag cannot contain any node except for the text node.\n" +
            this.#highlightedRegion(message) +
            "\nCurrently the " +
            colors.magenta("<" + message.tag + ">") +
            " is a child.",
        );
        break;
      case MessageTag.UnsupportedBuildScriptReexporting:
        this.#error(
          "The " +
            colors.magenta("build") +
            " script cannot reexport any value.\n" +
            this.#highlightedRegion(message) +
            "\nInstead you have to directly import all values and then export them using the named export syntax.",
        );
        break;
      case MessageTag.FailedBuildScriptExecution:
        this.#error(
          "An error has been detected while running the " +
            colors.magenta("build") +
            " script.\n" +
            this.#highlightedRegion(message) +
            "\nA thrown error description: " +
            message.error,
        );
        break;
      case MessageTag.ProhibitedReservedComponentRemapping:
        this.#error(
          "It is forbidden to import a custom component or create a markup fragment " +
            "with any of the reserved names.\n" +
            this.#highlightedRegion(message) +
            "\nPlease, use another alias or rename a component file.",
        );
        break;
      case MessageTag.EmptyExplicitComponentAlias:
        this.#error(
          "Custom component alias cannot be an empty string.\n" +
            this.#highlightedRegion(message),
        );
        break;
      case MessageTag.InvalidImportComponentPosition:
        this.#error(
          "The " +
            colors.magenta("<import>") +
            " tag cannot be a child of any other component or tag and should not be preceeded by any kind of a node.\n" +
            this.#highlightedRegion(message),
        );
        break;
      case MessageTag.FailedInHtmlExpressionExecution:
        this.#error(
          "An error has been detected while running the expression:\n" +
            this.#highlightedRegion(message) +
            "\nA thrown error description: " +
            message.error,
        );
        break;
      case MessageTag.InvalidExpandResult:
        this.#error(
          "An " +
            colors.magenta("expand") +
            " property is allowed to receive only objects.\n" +
            this.#highlightedRegion(message) +
            "\nThe actual value is " +
            colors.magenta(typeof message.actualResult) +
            ".\n" +
            colors.red(
              inspect(message.actualResult, {
                compact: false,
                depth: 5,
                breakLength: 80,
              }),
            ),
        );
        break;
      case MessageTag.NonIterableEachAttribute:
        this.#error(
          "An " +
            colors.magenta("each") +
            " property of the " +
            colors.magenta("<for>") +
            " component should have an " +
            colors.magenta("Iterable") +
            " value.\n" +
            this.#highlightedRegion(message) +
            "\nInstead the " +
            colors.red(typeof message.attributeValue) +
            " is received.\n" +
            colors.red(
              inspect(message.attributeValue, {
                compact: false,
                depth: 5,
                breakLength: 80,
              }),
            ),
        );
        break;
      case MessageTag.InvalidChildOfStyleElement:
        this.#error(
          "The " +
            colors.magenta("<style>") +
            " node can have only text as the child node.\n" +
            this.#highlightedRegion(message),
        );
        break;
      case MessageTag.MissingExportedValueFromBuild:
        this.#error(
          "Any " +
            colors.magenta("build") +
            " scripts do not export the " +
            colors.blue(message.names.join(", ")) +
            " value" +
            (message.names.length > 1 ? "s" : "") +
            ".\n" +
            this.#highlightedRegion(message),
        );
        break;
      case MessageTag.JsSyntaxError:
        this.#error(
          "A script in the " +
            colors.blue(message.sourceFile.url) +
            " file contains a syntax error.\n" +
            this.#highlightedRegion(message),
        );
        break;
      case MessageTag.NotDefinedPortalName:
        this.#error(
          "A portal name in the" +
            colors.blue(message.sourceFile.url) +
            " file is " +
            colors.red("undefined") +
            ".\n" +
            this.#highlightedRegion(message),
        );
        break;
      case MessageTag.ReferenceToNonExistendPortal:
        this.#error(
          "An element references a non-existent portal " +
            colors.magenta(String(message.name)) +
            " from the " +
            colors.blue(message.sourceFile.url) +
            " file.\n" +
            this.#highlightedRegion(message),
        );
        break;
      case MessageTag.NotDefinedExportName:
        this.#error(
          "An " +
            colors.magenta("<export>") +
            " element must contain the non-empty " +
            colors.bold("name") +
            " attribute.\n" +
            "Found in: " +
            colors.magenta(message.sourceFile.url) +
            ".\n" +
            this.#highlightedRegion(message),
        );
        break;
      case MessageTag.NotDefinedExportValueExpression:
        this.#error(
          "An " +
            colors.magenta("<export>") +
            " element must contain the non-empty " +
            colors.bold("value") +
            " attribute.\n" +
            "Found in: " +
            colors.magenta(message.sourceFile.url) +
            ".\n" +
            this.#highlightedRegion(message),
        );
        break;
      case MessageTag.InvalidExportElementPosition:
        this.#error(
          "An " +
            colors.magenta("<export>") +
            " element can be defined only at the top-level of the HTML file.\n" +
            "Found in: " +
            colors.magenta(message.sourceFile.url) +
            ".\n" +
            this.#highlightedRegion(message),
        );
        break;
      case MessageTag.ComponentMissingExport:
        this.#error(
          "A " +
            colors.bold(message.componentUrl) +
            " component does not export the " +
            colors.magenta(message.name) +
            " variable.\n" +
            "Found in: " +
            colors.magenta(message.sourceFile.url) +
            ".\n" +
            this.#highlightedRegion(message),
        );
        break;
    }
  }

  #highlightedRegion(message: AnyMessage): string {
    return (
      colors.underline(message.sourceFile.url) +
      ":\n" +
      colors.bold(
        message.sourceFile.content.slice(
          message.location.start,
          message.location.end + 1,
        ),
      )
    );
  }

  #error(message: string): void {
    this.#logger.error(this.#createMessage(message, colors.red));
  }

  #warn(message: string): void {
    this.#logger.warn(this.#createMessage(message, colors.yellow));
  }

  #info(message: string): void {
    this.#logger.info(this.#createMessage(message, colors.blue));
  }

  #createMessage(message: string, severity: Colors["white"]): string {
    return (severity("[@moru/core]\n") + message)
      .replaceAll("\n", "\n  ")
      .replaceAll("\\n", "\n");
  }
}
