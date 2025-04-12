/**
 * @import { ScopePreCompilerOptions, ScopePreCompiler } from "./compile-html.js";
 */

import { removeElement } from "domutils";

import { isHtmlElseElement, replaceElementWithMultiple } from "./html-nodes.js";

/**
 * @param {ScopePreCompilerOptions} options
 * @param {ScopePreCompiler} preCompileScope
 * @returns {Promise<void> }
 */
export async function evaluateConditionals(options, preCompileScope) {
  const conditionals = options.htmlNodesCollection.conditionals;

  // Prepare an empty array for conditionals of inner scopes.
  options.htmlNodesCollection.conditionals = [];

  for (const nodes of conditionals) {
    let isBranchRendered = false;

    for (const node of nodes.flat()) {
      if (node) {
        if (
          !isBranchRendered &&
          (node.attribs.condition ||
            // We already checked that <else> comes last.
            // Here if we encounter it, we definitely want to render
            // its content.
            isHtmlElseElement(node))
        ) {
          // Prevent preemptive loops evaluation.
          const loops = options.htmlNodesCollection.loops;
          options.htmlNodesCollection.loops = [];
          await preCompileScope({ ...options, ast: node });
          options.htmlNodesCollection.loops = loops;

          replaceElementWithMultiple(node, node.children);
          isBranchRendered = true;
        } else {
          removeElement(node);
        }
      }
    }
  }
}
