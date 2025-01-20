/**
 * @import { ScopePreCompilerOptions, ScopePreCompiler } from "./compile-html.js";
 * @import { HtmlElseElement, HtmlForElement } from "./html-nodes.js";
 */

import { prepend, removeElement } from "domutils";

import { createNonIterableEachAttributeMessage } from "./diagnostics.js";
import {
  getLocationOfHtmlNode,
  replaceElementWithMultiple,
} from "./html-nodes.js";

/**
 * @param {ScopePreCompilerOptions} options
 * @param {ScopePreCompiler} preCompileScope
 * @returns {Promise<void>}
 */
export async function evaluateLoops(options, preCompileScope) {
  const loops = options.htmlNodesCollection.loops;

  // Prepare an empty array for loops of inner scopes.
  options.htmlNodesCollection.loops = [];

  for (const [loopElement, fallbackElement] of loops) {
    const {
      each,
      as: asName = "item",
      index: indexName = "index",
    } = loopElement.attribs;

    if (Array.isArray(each)) {
      if (each.length) {
        await loopAndEvaluate(
          loopElement,
          each,
          asName,
          indexName,
          preCompileScope,
          options,
          fallbackElement,
        );
      } else {
        await renderPossibleFallback(preCompileScope, options, fallbackElement);
      }
    } else {
      options.compilerOptions.diagnostics.publish(
        createNonIterableEachAttributeMessage({
          attributeValue: each,
          sourceFile: options.file,
          location: getLocationOfHtmlNode(loopElement),
        }),
      );

      await renderPossibleFallback(preCompileScope, options, fallbackElement);
    }

    removeElement(loopElement);
  }
}

/**
 * @param {HtmlForElement} loopElement
 * @param {Array<unknown>} each
 * @param {string} asName
 * @param {string} indexName
 * @param {ScopePreCompiler} preCompileScope
 * @param {ScopePreCompilerOptions} options
 * @param {HtmlElseElement | undefined} fallbackElement
 * @returns {Promise<void>}
 */
async function loopAndEvaluate(
  loopElement,
  each,
  asName,
  indexName,
  preCompileScope,
  options,
  fallbackElement,
) {
  // Borrow possibly defined names and save their values.
  const previousAsNameValue = options.localThis[asName];
  const previousIndexNameValue = options.localThis[indexName];

  // Make cloning node a little bit more efficient.
  loopElement.attribs.each = "";

  for (let index = 0; index < each.length; index++) {
    const item = each[index];

    options.localThis[asName] = item;
    options.localThis[indexName] = index;

    const clonedLoopElement = loopElement.cloneNode(true);

    await preCompileScope({ ...options, ast: clonedLoopElement });

    prepend(loopElement, clonedLoopElement);
    replaceElementWithMultiple(clonedLoopElement, clonedLoopElement.children);
  }

  if (fallbackElement) {
    removeElement(fallbackElement);
  }

  // Restore borrowed names to their original values.
  options.localThis[asName] = previousAsNameValue;
  options.localThis[indexName] = previousIndexNameValue;
}

/**
 * @param {ScopePreCompiler} preCompileScope
 * @param {ScopePreCompilerOptions} options
 * @param {HtmlElseElement | undefined} fallbackElement
 * @returns {Promise<void>}
 */
async function renderPossibleFallback(
  preCompileScope,
  options,
  fallbackElement,
) {
  if (fallbackElement) {
    await preCompileScope({ ...options, ast: fallbackElement });
    replaceElementWithMultiple(fallbackElement, fallbackElement.children);
  }
}
