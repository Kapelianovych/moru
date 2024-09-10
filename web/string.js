import { connector } from "moru";

import { SelfClosedElements } from "./constants.js";

const OPEN_TAG_RE = /^<[\w-]+/;
const CLOSE_TAG_RE = /<\/[\w-]+>$/;
const DEFAULT_PARENT_TAG = "__parent__";

const connectToString = connector({
  appendNode(parent, node) {
    parent.html = parent.html.replace(CLOSE_TAG_RE, `${node.html}$&`);
  },
  removeNode() {
    // It is not needed in a static html.
  },
  createNode(_, tag) {
    return {
      html: SelfClosedElements.has(tag) ? `<${tag}/>` : `<${tag}></${tag}>`,
    };
  },
  setProperty(node, name, value) {
    // on: and prop: namespaces.
    if (name.includes(":")) return;

    node.html =
      typeof value === "boolean"
        ? value
          ? node.html.replace(OPEN_TAG_RE, `$& ${name}`)
          : node.html
        : node.html.replace(OPEN_TAG_RE, `$& ${name}="${value}"`);
  },
  insertNodeAfter() {
    // It is not needed in a static html.
  },
  createDefaultNode(_, node) {
    return {
      html:
        node == null || String(node).trim() === ""
          ? // Empty string is lost after transporting HTML over the wire,
            // but it should be preserved, since it is a potential marker for
            // the nodes hydration.
            "<!---->"
          : String(node),
    };
  },
});

export function toString(jsx) {
  const root = { html: `<${DEFAULT_PARENT_TAG}></${DEFAULT_PARENT_TAG}>` };

  connectToString(jsx, root);

  return root.html
    .replace(`<${DEFAULT_PARENT_TAG}>`, "")
    .replace(`</${DEFAULT_PARENT_TAG}>`, "");
}
