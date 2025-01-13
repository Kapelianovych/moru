import { removeElement } from "domutils";
import { type AnyNode, type Element, isText, type Text } from "domhandler";

import type { Options } from "./options.js";
import type { VirtualFile } from "./virtual-file.js";
import type { HtmlNodesCollection } from "./collect-html-nodes.js";
import { createUrlCreator, type UrlCreator } from "./location.js";
import { getLocationOfHtmlNode } from "./html-nodes.js";
import { createAsyncExpressionJsRunner } from "./js-runners.js";
import {
  createFailedInHtmlExpressionExecutionMessage,
  createInvalidExpandResultMessage,
  createNotDefinedPortalNameMessage,
} from "./diagnostics.js";

const EXPRESSION_INTERPOLATION = "{{\\s*(.+?)\\s*}}";
const ESCAPED_EXPRESSION_INTERPOLATION = new RegExp(
  `\\\\${EXPRESSION_INTERPOLATION}`,
  "gs",
);
const NON_ESCAPED_EXPRESSION_INTERPOLATION = new RegExp(
  `(?<!\\\\)${EXPRESSION_INTERPOLATION}`,
  "gs",
);

export function hasAnyInHtmlExpression(text: string): boolean {
  return (
    // We must clone regular expressions here, because they contain the global flag,
    // which makes the regular expression stateful,
    new RegExp(ESCAPED_EXPRESSION_INTERPOLATION).test(text) ||
    new RegExp(NON_ESCAPED_EXPRESSION_INTERPOLATION).test(text)
  );
}

export async function evaluateInHtmlExpressions(
  {
    imports: _,
    buildScripts: __,
    markupDefinitions: ___,
    getParentMarkupDefinitionFor: ____,
    portals,
    components,
    ...nodes
  }: HtmlNodesCollection,
  context: Record<string, unknown>,
  file: VirtualFile,
  options: Options,
): Promise<void> {
  const url = createUrlCreator(file, options);

  for (const key in nodes) {
    const nodeGroupName = key as keyof typeof nodes;

    for (const node of nodes[nodeGroupName].flat(2)) {
      if (node) {
        await evaluateInHtmlExpressionsOf(node, context, url, file, options);
      }
    }
  }

  for (const [, component] of components) {
    await evaluateInHtmlExpressionsOf(component, context, url, file, options);
  }

  for (const portalName in portals) {
    const portalElement = portals[portalName];
    await evaluateInHtmlExpressionsOf(
      portalElement,
      context,
      url,
      file,
      options,
    );
    const probablyNewName = portalElement.attribs.name;

    // Change portal's key if it was an expression.
    if (portalName !== probablyNewName) {
      if (probablyNewName === undefined) {
        options.diagnostics.publish(
          createNotDefinedPortalNameMessage({
            location: getLocationOfHtmlNode(portalElement),
            sourceFile: file,
          }),
        );
        // Name is not defined, so we have to remove it from the HTML with its children.
        removeElement(portalElement);
      } else {
        portals[probablyNewName] = portalElement;
      }

      delete portals[portalName];
    }
  }

  // We can remove basic nodes to avoid walking
  // through them every time for every inner scope.
  nodes.texts.length = 0;
  nodes.elements.length = 0;
}

async function evaluateInHtmlExpressionsOf(
  node: Text | Element,
  localThis: Record<string, unknown>,
  url: UrlCreator,
  file: VirtualFile,
  options: Options,
): Promise<void> {
  if (isText(node)) {
    node.data = String(
      await findAndEvaluateInhtmlExpressionsIn(
        node.data,
        localThis,
        node,
        url,
        file,
        options,
      ),
    );
  } else {
    const attribs = node.attribs;
    node.attribs = {};

    const expand = attribs.expand;
    delete attribs.expand;

    if (expand?.trim()) {
      const spread = await findAndEvaluateInhtmlExpressionsIn(
        expand,
        localThis,
        node,
        url,
        file,
        options,
      );

      if (typeof spread === "object") {
        Object.assign(node.attribs, spread);
      } else {
        options.diagnostics.publish(
          createInvalidExpandResultMessage({
            actualResult: spread,
            sourceFile: file,
            location: getLocationOfHtmlNode(node),
          }),
        );
      }
    }

    for (const attribute in attribs) {
      const value = attribs[attribute];

      // @ts-expect-error final attribute value can be of any type.
      node.attribs[attribute] =
        // There is no error in the assigment value.
        await findAndEvaluateInhtmlExpressionsIn(
          value,
          localThis,
          node,
          url,
          file,
          options,
        );
    }
  }
}

async function findAndEvaluateInhtmlExpressionsIn(
  text: string,
  localThis: Record<string, unknown>,
  node: AnyNode,
  url: UrlCreator,
  file: VirtualFile,
  options: Options,
): Promise<unknown> {
  const matches = text.matchAll(NON_ESCAPED_EXPRESSION_INTERPOLATION);
  let finalValue: unknown = text;

  let replacementOffset = 0;
  for (const match of matches) {
    const [fullMatch, expression] = match;
    const runInHtmlExpression = createAsyncExpressionJsRunner(
      expression,
      Object.keys(localThis),
    );

    try {
      const result = await runInHtmlExpression(
        options.properties,
        localThis,
        options.buildStore,
        url,
        options.dynamicallyImportJsFile,
      );

      if (text === fullMatch) {
        finalValue = result;
      } else {
        finalValue = replaceAt(
          finalValue as string,
          fullMatch,
          String(result),
          match.index + replacementOffset,
        );
        replacementOffset += String(result).length - fullMatch.length;
      }
    } catch (error) {
      options.diagnostics.publish(
        createFailedInHtmlExpressionExecutionMessage({
          error,
          sourceFile: file,
          location: getLocationOfHtmlNode(node),
        }),
      );
    }
  }

  if (typeof finalValue === "string") {
    const escapedMatches = finalValue.matchAll(
      ESCAPED_EXPRESSION_INTERPOLATION,
    );

    let replacementOffset = 0;
    for (const match of escapedMatches) {
      const [fullMatch] = match;

      finalValue = replaceAt(
        finalValue as string,
        fullMatch,
        fullMatch.slice(1),
        match.index + replacementOffset,
      );
      replacementOffset -= 1;
    }
  }

  return finalValue;
}

function replaceAt(
  target: string,
  toReplace: string,
  toInsert: string,
  startPosition: number,
): string {
  return (
    target.slice(0, startPosition) +
    toInsert +
    target.slice(startPosition + toReplace.length)
  );
}
