import { createRenderer } from "@moru/renderer";

import {
  SVG_NAMESPACE,
  HTML_NAMESPACE,
  AttributesToProperties,
} from "./constants.js";

const endsAt = (once, capture, passive, noPassive) =>
  0 +
  (once ? -4 : 0) +
  (capture ? -7 : 0) +
  (noPassive ? -9 : passive ? -7 : 0);

export const mount = createRenderer({
  defaultRoot: document.body,
  allowEffects: true,

  appendInstance(parent, instance) {
    parent.append(instance);
  },
  removeInstance(_parent, instance) {
    instance.remove();
  },
  createInstance(parent, tag) {
    return document.createElementNS(
      tag === "svg"
        ? SVG_NAMESPACE
        : // This SVG element requires children to have a non-SVG namespace.
        // For a browser it is the most likely HTML namespace.
        parent.tagName === "foreignObject"
        ? HTML_NAMESPACE
        : // Otherwise just inherit the parent's namespace.
          parent.namespaceURI,
      tag
    );
  },
  setProperty(instance, name, value) {
    if (name.startsWith("on")) {
      const _name = name.toLowerCase(),
        once = _name.includes("once"),
        capture = _name.includes("capture"),
        passive = _name.includes("passive"),
        noPassive = _name.includes("nopassive");

      instance.addEventListener(
        _name.slice(
          2,
          endsAt(once, capture, passive, noPassive) || _name.length
        ),
        value,
        {
          once,
          capture,
          passive: noPassive ? false : passive,
        }
      );
    } else if (AttributesToProperties.get(name)?.includes(instance.tagName))
      instance[name] = value;
    else
      typeof value === "boolean"
        ? value
          ? instance.setAttribute(name, "")
          : instance.removeAttribute(name)
        : instance.setAttribute(name, value);
  },
  insertInstanceAfter(_parent, previousSibling, nextSibling) {
    previousSibling.after(nextSibling);
  },
  createDefaultInstance(_parent, element) {
    return element instanceof Node
      ? element
      : document.createTextNode(element ?? "");
  },
});
