/**
 * @import { AnyNode, Element, Text } from 'domhandler';
 *
 * @import { Options } from "./options.js";
 * @import { VirtualFile } from "./virtual-file.js";
 * @import { UrlCreator } from "./location.js";
 * @import { HtmlNodesCollection } from "./collect-html-nodes.js";
 * @import { LocalThis } from "./local-this.js";
 * @import { LifecyclePhaseSubscriber } from "./lifecycle.js";
 */

import { isText } from "domhandler";
import { removeElement } from "domutils";

import { createUrlCreator } from "./location.js";
import { getLocationOfHtmlNode } from "./html-nodes.js";
import {
  collectGlobalVariablesForJsRunner,
  createAsyncExpressionJsRunner,
} from "./js-runners.js";
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

/**
 * @param {string} text
 * @returns {boolean}
 */
export function hasAnyInHtmlExpression(text) {
  return (
    // We must clone regular expressions here, because they contain the global flag,
    // which makes the regular expression stateful,
    new RegExp(ESCAPED_EXPRESSION_INTERPOLATION).test(text) ||
    new RegExp(NON_ESCAPED_EXPRESSION_INTERPOLATION).test(text)
  );
}

/**
 * @param {HtmlNodesCollection} collection
 * @param {LocalThis} localThis
 * @param {LifecyclePhaseSubscriber} onAfterRender
 * @param {VirtualFile} file
 * @param {Options} options
 * @return {Promise<void>}
 */
export async function evaluateInHtmlExpressions(
  {
    imports: _,
    exports: __,
    buildScripts: ___,
    getParentMarkupDefinitionFor: _____,
    markupDefinitions,
    portals,
    components,
    ...nodes
  },
  localThis,
  onAfterRender,
  file,
  options,
) {
  const url = createUrlCreator(file, options);

  for (const key in nodes) {
    const nodeGroupName = /** @type {keyof typeof nodes} */ (key);

    for (const node of nodes[nodeGroupName].flat(2)) {
      if (node) {
        await evaluateInHtmlExpressionsOf(
          node,
          localThis,
          url,
          onAfterRender,
          file,
          options,
        );
      }
    }
  }

  for (const { node } of components) {
    await evaluateInHtmlExpressionsOf(
      node,
      localThis,
      url,
      onAfterRender,
      file,
      options,
    );
  }

  for (const name in markupDefinitions) {
    const markupDefinitionElement = markupDefinitions[name];
    await evaluateInHtmlExpressionsOf(
      markupDefinitionElement,
      localThis,
      url,
      onAfterRender,
      file,
      options,
    );
  }

  for (const portalName in portals) {
    const portalElement = portals[portalName];
    await evaluateInHtmlExpressionsOf(
      portalElement,
      localThis,
      url,
      onAfterRender,
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

/**
 * @param {Text | Element} node
 * @param {LocalThis} localThis
 * @param {UrlCreator} url
 * @param {LifecyclePhaseSubscriber} onAfterRender
 * @param {VirtualFile} file
 * @param {Options} options
 * @returns {Promise<void>}
 */
async function evaluateInHtmlExpressionsOf(
  node,
  localThis,
  url,
  onAfterRender,
  file,
  options,
) {
  if (isText(node)) {
    node.data = String(
      await findAndEvaluateInHtmlExpressionsIn(
        node.data,
        localThis,
        node,
        url,
        onAfterRender,
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
        onAfterRender,
        file,
        options,
      );

      if (spread && typeof spread === "object") {
        for (const attributeName in spread) {
          const value = /** @type {Record<string, unknown>} */ (spread)[
            attributeName
          ];

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
        onAfterRender,
        file,
        options,
      );

      assignAttribute(node, attributeName, evaluatedAttributeValue);
    }
  }
}

/**
 * @param {Element} target
 * @param {string} attributeName
 * @param {unknown} attributeValue
 * @returns {void}
 */
function assignAttribute(target, attributeName, attributeValue) {
  // Discard all attributes with the value of undefined, so they
  // won't end up as boolean attributes in HTML.
  if (attributeValue === undefined) {
    delete target.attribs[attributeName];
  } else {
    // @ts-expect-error Final attribute value can be of any type.
    target.attribs[attributeName] = attributeValue;
  }
}

/**
 * @param {string} text
 * @param {LocalThis} localThis
 * @param {AnyNode} node
 * @param {UrlCreator} url
 * @param {LifecyclePhaseSubscriber} onAfterRender
 * @param {VirtualFile} file
 * @param {Options} options
 * @returns {Promise<unknown>}
 */
async function findAndEvaluateInHtmlExpressionsIn(
  text,
  localThis,
  node,
  url,
  onAfterRender,
  file,
  options,
) {
  const matches = text.matchAll(NON_ESCAPED_EXPRESSION_INTERPOLATION);
  /** @type {unknown} */
  let finalValue = text;

  let replacementOffset = 0;
  for (const match of matches) {
    const [fullMatch, expression] = match;
    const runInHtmlExpression = createAsyncExpressionJsRunner(
      expression,
      collectGlobalVariablesForJsRunner(localThis),
    );

    try {
      const result = await runInHtmlExpression(
        options.properties,
        localThis,
        options.buildStore,
        url,
        onAfterRender,
        options.dynamicallyImportJsFile,
      );

      if (text === fullMatch) {
        finalValue = result;
      } else {
        finalValue = replaceAt(
          /** @type {string} */ (finalValue),
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
        /** @type {string} */ (finalValue),
        fullMatch,
        fullMatch.slice(1),
        match.index + replacementOffset,
      );
      replacementOffset -= 1;
    }
  }

  return finalValue;
}

/**
 * @param {string} target
 * @param {string} toReplace
 * @param {string} toInsert
 * @param {number} startPosition
 * @returns {string}
 */
function replaceAt(target, toReplace, toInsert, startPosition) {
  return (
    target.slice(0, startPosition) +
    toInsert +
    target.slice(startPosition + toReplace.length)
  );
}
