import { isDev, connector } from "moru";

import { isServer, SVG_NAMESPACE, HTML_NAMESPACE } from "./constants.js";

if (isDev && isServer) {
  console.warn(
    "The client-side connector must not be used in the server-side code.",
  );
}

export const connect = connector({
  allowEffects: true,

  appendNode(parent, node, isHydrating) {
    // node can be undefined for nodes that cannot have children.
    if (node != null) (isHydrating && node.isConnected) || parent.append(node);
  },
  removeNode(parent, node) {
    if (node.isConnected) parent.removeChild(node);
  },
  createNode(parent, tag, isHydrating, position) {
    return isHydrating
      ? parent.childNodes[position]
      : document.createElementNS(
          tag === "svg"
            ? SVG_NAMESPACE
            : // This SVG element requires children to have a non-SVG namespace.
              // For a browser, it is the most likely HTML namespace.
              parent.tagName === "foreignObject"
              ? HTML_NAMESPACE
              : // Otherwise, just inherit the parent's namespace.
                parent.namespaceURI,
          tag,
        );
  },
  setProperty(node, name, value, isHydrating) {
    if (name.startsWith("on:")) {
      const _name = name.toLowerCase(),
        once = _name.includes("once"),
        capture = _name.includes("capture"),
        passive = _name.includes("passive"),
        noPassive = _name.includes("nopassive");

      const firstSuffixStart =
        0 +
        (once ? -4 : 0) +
        (capture ? -7 : 0) +
        (noPassive ? -9 : passive ? -7 : 0);

      node.addEventListener(
        _name.slice(3, firstSuffixStart || _name.length),
        value,
        {
          once,
          capture,
          passive: noPassive ? false : passive,
        },
      );
    } else if (name.startsWith("prop:")) node[name.slice(5)] = value;
    else if (!isHydrating)
      typeof value === "boolean"
        ? value
          ? node.setAttribute(name, "")
          : node.removeAttribute(name)
        : node.setAttribute(name, value);
  },
  insertNodeAfter(_, previousSibling, nextSibling) {
    previousSibling.nextSibling === nextSibling ||
      previousSibling.after(nextSibling);
  },
  createDefaultNode(parent, node, isHydrating, position) {
    if (node instanceof Node) {
      isHydrating && parent.childNodes[position].replaceWith(node);

      return node;
    } else
      return isHydrating
        ? parent.childNodes[position]
        : document.createTextNode(node ?? "");
  },
});
