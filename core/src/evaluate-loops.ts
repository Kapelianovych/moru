import type { ChildNode, ParentNode } from "domhandler";
import {
  append,
  appendChild,
  getParent,
  prevElementSibling,
  removeElement,
} from "domutils";

import type { PreCompileOptions, PreCompiler } from "./compile-html.js";
import { createNonIterableEachAttributeMessage } from "./diagnostics.js";
import {
  getLocationOfHtmlNode,
  replaceElementWithMultiple,
} from "./html-nodes.js";

export async function evaluateLoops(
  options: PreCompileOptions,
  preCompile: PreCompiler,
): Promise<void> {
  const loops = options.htmlNodesCollection.loops;

  // Prepare an empty array for loops of inner scopes.
  options.htmlNodesCollection.loops = [];

  for (const [loopElement, fallbackElement] of loops) {
    const {
      each,
      as: asName = "item",
      index: indexName = "index",
    } = loopElement.attribs;

    // Detach loopElement early. It is not an issue, since
    // We do not need to know its position (relationships with other nodes) in the DOM.
    removeElement(loopElement);

    if (Array.isArray(each)) {
      // Borrow possibly defined names and save their values.
      const previousAsNameValue = options.localThis[asName];
      const previousIndexNameValue = options.localThis[indexName];

      let previousChildNode: ChildNode | null = prevElementSibling(loopElement);
      // In case the loopElement is the first child.
      const parentNode: ParentNode | null = getParent(loopElement);
      const lastChildIndex = loopElement.children.length - 1;

      // Make cloning node a little bit more efficient.
      loopElement.attribs.each = "";

      for (let index = 0; index < each.length; index++) {
        const item = each[index];

        options.localThis[asName] = item;
        options.localThis[indexName] = index;

        const clonedLoopElement = loopElement.cloneNode(true);

        await preCompile({ ...options, ast: clonedLoopElement });

        if (previousChildNode) {
          clonedLoopElement.children.forEach((child) => {
            append(previousChildNode!, child);
            previousChildNode = child;
          });
        } else if (parentNode) {
          clonedLoopElement.children.forEach((child, index) => {
            appendChild(parentNode, child);

            if (index === lastChildIndex) {
              previousChildNode = child;
            }
          });
        } else {
          // Impossible state. Should never happen.
        }
      }

      if (fallbackElement) {
        removeElement(fallbackElement);
      }

      // Restore borrowed names to their original values.
      options.localThis[asName] = previousAsNameValue;
      options.localThis[indexName] = previousIndexNameValue;
    } else {
      options.compilerOptions.diagnostics.publish(
        createNonIterableEachAttributeMessage({
          attributeValue: each,
          sourceFile: options.file,
          location: getLocationOfHtmlNode(loopElement),
        }),
      );

      if (fallbackElement) {
        await preCompile({ ...options, ast: fallbackElement });
        replaceElementWithMultiple(fallbackElement, fallbackElement.children);
      }
    }
  }
}
