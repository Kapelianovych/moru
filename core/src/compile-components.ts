import { isTag, type ChildNode, type Element } from "domhandler";

import type { Options } from "./options.js";
import { parseHtml } from "./parse-html.js";
import type { ModuleCompiler } from "./compile-html.js";
import type { VirtualFile } from "./virtual-file.js";
import type { HtmlNodesCollection } from "./collect-html-nodes.js";
import { type HtmlSlotElement, isHtmlSlottableElement } from "./html-nodes.js";
import {
  isHtmlFragmentElement,
  replaceElementWithMultiple,
} from "./html-nodes.js";

export async function compileComponents(
  collection: HtmlNodesCollection,
  compileModule: ModuleCompiler,
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

    await compileModule({
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

      // Don't attach slot's name to children.
      delete slot.attribs.name;

      replacerNodes.forEach(function injectSlotAttributesTo(node) {
        if (isTag(node)) {
          // Treat the <fragment> as non-element and walk its direct children instead.
          if (isHtmlFragmentElement(node)) {
            node.children.forEach(injectSlotAttributesTo);
          } else {
            for (const attribute in slot.attribs) {
              const injectValue = slot.attribs[attribute] as
                | string
                | ((value: unknown) => string);

              const resultingAttributeValue =
                typeof injectValue === "function"
                  ? injectValue(node.attribs[attribute])
                  : injectValue;

              if (resultingAttributeValue === undefined) {
                delete node.attribs[attribute];
              } else {
                node.attribs[attribute] = resultingAttributeValue;
              }
            }
          }
        }
      });

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
