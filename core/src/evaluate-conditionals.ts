import { removeElement } from "domutils";

import { replaceElementWithMultiple } from "./html-nodes.js";
import type { PreCompileOptions, PreCompiler } from "./compile-html.js";

export async function evaluateConditionals(
  options: PreCompileOptions,
  preCompile: PreCompiler,
): Promise<void> {
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
          await preCompile({ ...options, ast: node });
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