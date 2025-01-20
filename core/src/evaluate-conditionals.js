/**
 * @import { ScopePreCompilerOptions, ScopePreCompiler } from "./compile-html.js";
 */

import { removeElement } from "domutils";

import { replaceElementWithMultiple } from "./html-nodes.js";

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
          ("condition" in node.attribs ? node.attribs.condition : true)
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
