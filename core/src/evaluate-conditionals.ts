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
    const branchToRender = nodes.flat().find((node) => {
      if (node) {
        const shouldBeRendered =
          "condition" in node.attribs ? node.attribs.condition : true;

        if (!shouldBeRendered) {
          removeElement(node);
        }

        return shouldBeRendered;
      }
    });

    if (branchToRender) {
      await preCompile({ ...options, ast: branchToRender });
      replaceElementWithMultiple(branchToRender, branchToRender.children);
    }
  }
}
