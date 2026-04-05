/**
 * @import { SlotContentCompiler } from "./slot-content-compiler.js";
 * @import { HtmlNodesCollection } from "./collect-html-nodes.js";
 */

/**
 * @param {HtmlNodesCollection} htmlNodesCollection
 * @param {Record<string, SlotContentCompiler>} slotContentCompilers
 */
export async function evaluateLeafSlots(
  htmlNodesCollection,
  slotContentCompilers,
) {
  for (const slotElement of htmlNodesCollection.slots) {
    const slotName = slotElement.attribs.name ?? "default";

    await slotContentCompilers[slotName]?.(slotElement);

    delete slotContentCompilers[slotName];
  }

  htmlNodesCollection.slots.length = 0;
}
