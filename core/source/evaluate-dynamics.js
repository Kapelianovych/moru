/**
 * @import { Options } from "./options.js";
 * @import { VirtualFile } from "./virtual-file.js";
 * @import { HtmlNodesCollection } from "./collect-html-nodes.js";
 */

import { ElementType } from "htmlparser2";

import {
  collectHtmlNodes,
  RESERVED_HTML_ELEMENT_TAGS,
} from "./collect-html-nodes.js";
import {
  createDynamicReservedComponentTagMessage,
  createMissingDynamicTagExpressionMessage,
} from "./diagnostics.js";
import { getLocationOfHtmlNode } from "./html-nodes.js";

/**
 * @param {HtmlNodesCollection} collection
 * @param {VirtualFile} file
 * @param {Options} options
 * @returns {Promise<void>}
 */
export async function evaluateDynamics(collection, file, options) {
  for (const node of collection.dynamicElements) {
    if (RESERVED_HTML_ELEMENT_TAGS.includes(node.attribs.tag)) {
      options.diagnostics.publish(
        createDynamicReservedComponentTagMessage({
          sourceFile: file,
          tagName: node.attribs.tag,
          location: getLocationOfHtmlNode(node),
        }),
      );
    } else if (node.attribs.tag == null || node.attribs.tag.length === 0) {
      options.diagnostics.publish(
        createMissingDynamicTagExpressionMessage({
          sourceFile: file,
          location: getLocationOfHtmlNode(node),
        }),
      );
    } else {
      node.tagName = node.attribs.tag;

      // @ts-expect-error Until that time tag attribute is required, but
      // after this it should be removed to avoid leaking it to the final
      // DOM node.
      delete node.attribs.tag;

      collectHtmlNodes(
        {
          type: ElementType.Root,
          nodeType: 9,
          firstChild: node,
          lastChild: node,
          childNodes: [node],
          parent: null,
          prev: null,
          next: null,
          parentNode: null,
          previousSibling: null,
          nextSibling: null,
          startIndex: null,
          endIndex: null,
          children: [node],
          cloneNode() {
            return this;
          },
        },
        collection,
        file,
        options,
      );
    }
  }

  collection.dynamicElements.length = 0;
}
