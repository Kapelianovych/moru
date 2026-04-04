/**
 * @import { ScopePreCompiler, ScopePreCompilerOptions } from "./compile-html.js";
 */

import { findAll, replaceElement } from "domutils";

import { augmentLocalThis } from "./local-this.js";
import { getComponentChildrenGroupedBySlots } from "./slot-content-compiler.js";
import { isHtmlSlotElement, replaceElementWithMultiple } from "./html-nodes.js";

const DEFAULT_ATTRIBUTE_PREFIX = "default:";

/**
 * @param {ScopePreCompilerOptions} scopePreCompilerOptions
 * @param {ScopePreCompiler} preCompileScope
 * @returns {Promise<void>}
 */
export async function evaluateMarkupDefinitions(
  scopePreCompilerOptions,
  preCompileScope,
) {
  const references =
    scopePreCompilerOptions.htmlNodesCollection.reusableMarkupReferences;
  // Clear markup references array in case some of the current ones
  // contain nested markup fragments and references.
  scopePreCompilerOptions.htmlNodesCollection.reusableMarkupReferences = [];

  for (const markupElementReference of references) {
    const markupFragment =
      scopePreCompilerOptions.htmlNodesCollection.markupDefinitions[
        markupElementReference.tagName
      ] ??
      scopePreCompilerOptions.htmlNodesCollection.getParentMarkupDefinitionFor?.(
        markupElementReference.tagName,
      );

    const clonedMarkupFragment = markupFragment.cloneNode(true);

    /** @type {Array<VoidFunction>} */
    const rollbacks = [];

    // Augment default values.
    for (const attribute in clonedMarkupFragment.attribs) {
      if (attribute.startsWith(DEFAULT_ATTRIBUTE_PREFIX)) {
        const actualAttributeName = attribute.slice(
          DEFAULT_ATTRIBUTE_PREFIX.length,
        );

        if (
          scopePreCompilerOptions.localThis[actualAttributeName] === undefined
        ) {
          const rollback = augmentLocalThis(
            scopePreCompilerOptions.localThis,
            actualAttributeName,
            clonedMarkupFragment.attribs[attribute],
          );

          rollbacks.push(rollback);
        }
      }
    }

    // Augment non-void user-provided values.
    for (const attribute in markupElementReference.attribs) {
      const attributeValue = markupElementReference.attribs[attribute];

      if (attributeValue !== undefined) {
        const rollback = augmentLocalThis(
          scopePreCompilerOptions.localThis,
          attribute,
          attributeValue,
        );

        rollbacks.push(rollback);
      }
    }

    const currentScopeSlots = scopePreCompilerOptions.htmlNodesCollection.slots;
    scopePreCompilerOptions.htmlNodesCollection.slots = [];

    await preCompileScope({
      ...scopePreCompilerOptions,
      ast: clonedMarkupFragment,
      collectedMarkupDefinitions: {},
    });

    scopePreCompilerOptions.htmlNodesCollection.slots = currentScopeSlots;

    const groups = getComponentChildrenGroupedBySlots(markupElementReference);
    for (const slotElement of findAll(
      isHtmlSlotElement,
      clonedMarkupFragment,
    )) {
      const elements = groups[slotElement.attribs.name ?? "default"];
      if (elements != null) {
        replaceElementWithMultiple(slotElement, elements);
      }
    }

    // Rollback to the initial state in an opposite order.
    rollbacks.reduceRight(
      (/** @type {null | void} */ _, rollback) => rollback(),
      null,
    );

    // collectHtmlNodes skips the root element, so we have to move it
    // to the fragments array to discard it later.
    scopePreCompilerOptions.htmlNodesCollection.fragments.push(
      clonedMarkupFragment,
    );

    replaceElement(markupElementReference, clonedMarkupFragment);
  }
}
