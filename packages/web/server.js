import { createRenderer } from "@moru/renderer";

import { SelfClosedElements } from "./constants.js";

const OPEN_TAG_RE = /^<[\w-]+/;
const CLOSE_TAG_RE = /<\/[\w-]+>$/;
const DEFAULT_PARENT_TAG = "__parent__";

const stringRenderer = createRenderer({
  allowEffects: false,

  appendInstance(parent, instance, _isHydrating) {
    parent.html = parent.html.replace(CLOSE_TAG_RE, `${instance.html}$&`);
  },
  removeInstance(_parent, _instance) {
    // It is not needed in a static html.
  },
  createInstance(_parent, tag, _position, _isHydrating) {
    return {
      html: SelfClosedElements.has(tag) ? `<${tag}/>` : `<${tag}></${tag}>`,
    };
  },
  setProperty(instance, name, value, _isHydrating) {
    // on: and prop: namespaces.
    if (name.includes(":")) return;

    instance.html =
      typeof value === "boolean"
        ? value
          ? instance.html.replace(OPEN_TAG_RE, `$& ${name}`)
          : instance.html
        : instance.html.replace(OPEN_TAG_RE, `$& ${name}="${value}"`);
  },
  insertInstanceAfter(_parent, _previousSibling, _nextSibling) {
    // It is not needed in a static html.
  },
  createDefaultInstance(_parent, element, _position, _isHydrating) {
    return {
      html:
        element == null || element === ""
          ? // Empty string is lost after transporting HTML over the wire,
            // but it should be preserved, since it is a potential marker for
            // the nodes hydration.
            "<!---->"
          : String(element),
    };
  },
});

export const renderToString = (context, element) => {
  const root = { html: `<${DEFAULT_PARENT_TAG}></${DEFAULT_PARENT_TAG}>` };

  const _ = stringRenderer(context, element, root);

  return root.html
    .replace(`<${DEFAULT_PARENT_TAG}>`, "")
    .replace(`</${DEFAULT_PARENT_TAG}>`, "");
};
