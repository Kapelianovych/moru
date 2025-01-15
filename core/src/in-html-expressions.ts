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
    exports: __,
    buildScripts: ___,
    markupDefinitions: ____,
    getParentMarkupDefinitionFor: _____,
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

  for (const { node } of components) {
    await evaluateInHtmlExpressionsOf(node, context, url, file, options);
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
      await findAndEvaluateInHtmlExpressionsIn(
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
      const spread = await findAndEvaluateInHtmlExpressionsIn(
        expand,
        localThis,
        node,
        url,
        file,
        options,
      );

      if (spread && typeof spread === "object") {
        for (const attributeName in spread) {
          const value = (spread as Record<string, unknown>)[attributeName];

          assignAttribute(node, attributeName, value);
        }
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

    for (const attributeName in attribs) {
      const value = attribs[attributeName];

      const evaluatedAttributeValue = await findAndEvaluateInHtmlExpressionsIn(
        value,
        localThis,
        node,
        url,
        file,
        options,
      );

      assignAttribute(node, attributeName, evaluatedAttributeValue);
    }
  }
}

function assignAttribute(
  target: Element,
  attributeName: string,
  attributeValue: unknown,
): void {
  // Discard all attributes with the value of undefined, so they
  // won't end up as boolean attributes in HTML.
  if (attributeValue === undefined) {
    delete target.attribs[attributeName];
  } else {
    // @ts-expect-error Final attribute value can be of any type.
    target.attribs[attributeName] = attributeValue;
  }
}

export async function findAndEvaluateInHtmlExpressionsIn(
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
