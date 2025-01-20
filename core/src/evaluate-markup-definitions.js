/**
 * @import { Options } from "./options.js";
 * @import { VirtualFile } from "./virtual-file.js";
 * @import { HtmlNodesCollection } from "./collect-html-nodes.js";
 */

import { replaceElement } from "domutils";

import { collectHtmlNodes } from "./collect-html-nodes.js";

/**
 * @param {HtmlNodesCollection} htmlNodesCollection
 * @param {VirtualFile} file
 * @param {Options} options
 * @returns {void}
 */
export function evaluateMarkupDefinitions(htmlNodesCollection, file, options) {
  const references = htmlNodesCollection.reusableMarkupReferences;
  // Clear markup references array in case some of the current ones
  // contain nested markup fragments and references.
  htmlNodesCollection.reusableMarkupReferences = [];

  for (const markupElementReference of references) {
    const markupFragment =
      htmlNodesCollection.markupDefinitions[markupElementReference.tagName] ??
      htmlNodesCollection.getParentMarkupDefinitionFor?.(
        markupElementReference.tagName,
      );

    const clonedMarkupFragment = markupFragment.cloneNode(true);

    // Collect nodes of the cloned fragment.
    collectHtmlNodes(clonedMarkupFragment, htmlNodesCollection, file, options);
    // collectHtmlNodes skips the root element, so we have to move it
    // to the fragments array to discard it later.
    htmlNodesCollection.fragments.push(clonedMarkupFragment);

    replaceElement(markupElementReference, clonedMarkupFragment);
  }

  // If markup fragments contained nested markup fragments, then evaluate them as well.
  if (htmlNodesCollection.reusableMarkupReferences.length) {
    evaluateMarkupDefinitions(htmlNodesCollection, file, options);
  }
}
