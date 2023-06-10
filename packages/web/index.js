import { createRenderer } from "@moru/renderer";

import {
  SVG_ELEMENTS,
  SVG_NAMESPACE,
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

  appendChild(parent, instance) {
    parent.append(instance);
  },
  removeInstance(instance) {
    instance.remove();
  },
  createInstance(tag) {
    return SVG_ELEMENTS.has(tag)
      ? document.createElementNS(SVG_NAMESPACE, tag)
      : document.createElement(tag);
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
    } else if (
      AttributesToProperties.get(name)?.includes(instance.tagName.toLowerCase())
    )
      instance[name] = value;
    else
      typeof value === "boolean"
        ? value
          ? instance.setAttribute(name, "")
          : instance.removeAttribute(name)
        : instance.setAttribute(name, value);
  },
  insertInstanceAfter(previousSibling, nextSibling) {
    previousSibling.after(nextSibling);
  },
  createDefaultInstance(element) {
    return element instanceof Node
      ? element
      : document.createTextNode(element ?? "");
  },
});
