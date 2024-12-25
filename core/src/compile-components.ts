import type { ChildNode, Element } from "domhandler";

import type { Options } from "./options.js";
import { parseHtml } from "./parse-html.js";
import type { IRCompiler } from "./compile-html.js";
import type { VirtualFile } from "./virtual-file.js";
import type { HtmlNodesCollection } from "./collect-html-nodes.js";
import { replaceElementWithMultiple } from "./html-nodes.js";
import { type HtmlSlotElement, isHtmlSlottableElement } from "./html-nodes.js";

export async function compileComponents(
  collection: HtmlNodesCollection,
  prepareIR: IRCompiler,
  _file: VirtualFile,
  options: Options,
): Promise<void> {
  for (const [componentUrl, componentElement] of collection.components) {
    const componentContent = await options.readFileContent(componentUrl);
    const componentFile: VirtualFile = {
      url: componentUrl,
      content: componentContent,
    };
    const ast = parseHtml(componentFile);
    const slots: Array<HtmlSlotElement> = [];

    collection.slots = slots;
    options.properties = componentElement.attribs;

    await prepareIR({
      ast,
      file: componentFile,
      htmlNodesCollection: collection,
      compilerOptions: options,
    });

    const childrenGroupedBySlots =
      getComponentChildrenGroupedBySlots(componentElement);

    replaceElementWithMultiple(componentElement, ast.children);

    slots.forEach((slot) => {
      const slotName = slot.attribs.name || "default";
      const replacerNodes = childrenGroupedBySlots[slotName] ?? [];

      replaceElementWithMultiple(slot, replacerNodes);

      // Replace nodes only once.
      delete childrenGroupedBySlots[slotName];
    });

    // Empty slots store to avoid populating it up the tree.
    slots.length = 0;
  }

  collection.components.length = 0;
}

function getComponentChildrenGroupedBySlots(
  componentElement: Element,
): Record<string, Array<ChildNode>> {
  const groups: Record<string, Array<ChildNode>> = {
    default: [],
  };

  componentElement.children.forEach((childNode) => {
    if (isHtmlSlottableElement(childNode)) {
      const slotName = childNode.attribs.slot;

      if (slotName) {
        groups[slotName] ??= [];
        groups[slotName].push(childNode);
      } else {
        groups.default.push(childNode);
      }

      delete childNode.attribs.slot;
    } else {
      groups.default.push(childNode);
    }
  });

  return groups;
}
