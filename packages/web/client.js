import { renderer } from "moru";

import { SVG_NAMESPACE, HTML_NAMESPACE } from "./constants.js";

const endsAt = (once, capture, passive, noPassive) =>
  0 +
  (once ? -4 : 0) +
  (capture ? -7 : 0) +
  (noPassive ? -9 : passive ? -7 : 0);

export const mount = renderer({
  defaultRoot: document.body,
  allowEffects: true,

  appendInstance(parent, instance, isHydrating) {
    // instance can be undefined for nodes that cannot have children.
    if (instance != null)
      (isHydrating() && instance.isConnected) || parent.append(instance);
  },
  removeInstance(parent, instance) {
    parent.removeChild(instance);
  },
  createInstance(parent, tag, position, isHydrating) {
    return isHydrating()
      ? parent.childNodes[position]
      : document.createElementNS(
          tag === "svg"
            ? SVG_NAMESPACE
            : // This SVG element requires children to have a non-SVG namespace.
              // For a browser it is the most likely HTML namespace.
              parent.tagName === "foreignObject"
              ? HTML_NAMESPACE
              : // Otherwise just inherit the parent's namespace.
                parent.namespaceURI,
          tag,
        );
  },
  setProperty(instance, name, value, isHydrating) {
    if (name.startsWith("on:")) {
      const _name = name.toLowerCase(),
        once = _name.includes("once"),
        capture = _name.includes("capture"),
        passive = _name.includes("passive"),
        noPassive = _name.includes("nopassive");

      instance.addEventListener(
        _name.slice(
          3,
          endsAt(once, capture, passive, noPassive) || _name.length,
        ),
        value,
        {
          once,
          capture,
          passive: noPassive ? false : passive,
        },
      );
    } else if (name.startsWith("prop:")) instance[name.slice(5)] = value;
    else if (!isHydrating())
      typeof value === "boolean"
        ? value
          ? instance.setAttribute(name, "")
          : instance.removeAttribute(name)
        : instance.setAttribute(name, value);
  },
  insertInstanceAfter(_parent, previousSibling, nextSibling) {
    previousSibling.after(nextSibling);
  },
  createDefaultInstance(parent, element, position, isHydrating) {
    if (element instanceof Node) {
      isHydrating() && parent.childNodes[position].replaceWith(element);

      return element;
    } else
      return isHydrating()
        ? parent.childNodes[position]
        : document.createTextNode(element ?? "");
  },
});

export const hydrate = (context, element, root) =>
  mount(context, element, root, true);
