import { type AnyNode, hasChildren } from "domhandler";

export interface HtmlVisitor<T extends AnyNode> {
  matches(node: AnyNode): node is T;
  /**
   * Returned boolean value signals whether children of the {@link node}
   * should be visited.
   */
  enter?(node: T): void | boolean;
  exit?(node: T): void;
}

export function traverseHtml(
  node: AnyNode,
  visitors: Array<HtmlVisitor<AnyNode>>,
  skipStartingNode = false,
): void {
  const isParentNode = hasChildren(node);

  if (skipStartingNode) {
    if (isParentNode) {
      node.children.forEach((childNode) => traverseHtml(childNode, visitors));
    }
  } else {
    const visitor = visitors.find((visitor) => visitor.matches(node));

    const shouldDescend = visitor?.enter?.(node) ?? true;

    if (shouldDescend && isParentNode) {
      node.children.forEach((childNode) => traverseHtml(childNode, visitors));
    }

    visitor?.exit?.(node);
  }
}
