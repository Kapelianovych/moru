/**
 * @import { AnyNode } from "domhandler";
 */

import { hasChildren } from "domhandler";

/**
 * @template {AnyNode} T
 * @typedef {Object} HtmlVisitor
 * @property {(node: AnyNode) => node is T} matches
 * @property {(node: T) => boolean | void} [enter] Returned boolean value signals
 *   whether children of the {@link node} should be visited.
 * @property {(node: T) => void} [exit]
 */

/**
 * @param {AnyNode} node
 * @param {Array<HtmlVisitor<any>>} visitors
 * @param {boolean} skipStartingNode
 * @returns {void}
 */
export function traverseHtml(node, visitors, skipStartingNode = false) {
  const isParentNode = hasChildren(node);

  if (skipStartingNode) {
    if (isParentNode) {
      node.children
        // If element is removed in the exit method, then the children
        // property is modified which messes up with the iteration.
        .slice()
        .forEach((childNode) => traverseHtml(childNode, visitors));
    }
  } else {
    const visitor = visitors.find((visitor) => visitor.matches(node));

    const shouldDescend = visitor?.enter?.(node) ?? true;

    if (shouldDescend && isParentNode) {
      node.children
        // Same as above.
        .slice()
        .forEach((childNode) => traverseHtml(childNode, visitors));
    }

    visitor?.exit?.(node);
  }
}
