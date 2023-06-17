import { createRenderer } from "@moru/renderer";

import { SelfClosedElements } from "./constants.js";

const OPEN_TAG_RE = /^<[\w-]+/;
const CLOSE_TAG_RE = /<\/[\w-]+>$/;
const DEFAULT_PARENT_TAG = "__parent__";

const stringRenderer = createRenderer({
  allowEffects: false,

  appendInstance(parent, instance) {
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
    if (!name.startsWith("on"))
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
      html: element == null || element === "" ? "<!---->" : String(element),
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
