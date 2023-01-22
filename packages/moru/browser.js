import { isFunction } from "./utils.js";
import { isJSXCoreElement } from "./core.js";
import { useFree, useImmediateEffect } from "./state.js";
import {
  SVG_ELEMENTS,
  SVG_NAMESPACE,
  AttributesToProperties,
} from "./constants.js";

export const isServer = false,
  isBrowser = true,
  isHydrationEnabled = import.meta.env.MORU_IS_HYDRATION_ENABLED;

let hydrationId = 0,
  hydrationFinished,
  nodesToHydrate = {};

const endsAt = (once, capture, passive, noPassive) =>
  0 +
  (once ? -4 : 0) +
  (capture ? -7 : 0) +
  (noPassive ? -9 : passive ? -7 : 0);

const clearNode = (node) =>
  node.__nodes ? node.__nodes.forEach(clearNode) : node.remove();

const renderChild = (to, child, lastChild) => {
  if (isFunction(child)) {
    const tagId = hydrationId++,
      emptyNode = document.createTextNode("");

    let hydrationCleanup;

    if (isHydrationEnabled && !hydrationFinished) {
      const startNode = nodesToHydrate[`${tagId}/`],
        endNode = nodesToHydrate[`/${tagId}`];

      startNode.before(emptyNode);

      hydrationCleanup = () => {
        while (startNode.nextSibling !== endNode) {
          clearNode(startNode.nextSibling);
        }
        clearNode(startNode);
        clearNode(endNode);

        hydrationCleanup = null;
      };
    } else to.append(emptyNode);

    useImmediateEffect(() => {
      const cleanup = renderChild(to, child(), emptyNode);

      return isHydrationEnabled && !hydrationFinished
        ? hydrationCleanup
        : cleanup;
    });
  } else if (Array.isArray(child))
    return renderChild(to, createFragment(child), lastChild);
  else if (isJSXCoreElement(child))
    return renderChild(
      to,
      child.tag === "fragment"
        ? createFragment(child.children)
        : createElement(child),
      lastChild
    );
  else {
    if (isHydrationEnabled && !hydrationFinished) return;

    if (child == null) return;

    const next = child instanceof Node ? child : document.createTextNode(child);

    if (next instanceof DocumentFragment && !next.__nodes)
      next.__nodes = Array.from(next.childNodes);

    to?.__nodes?.push(next);

    lastChild ? lastChild.after(next) : to.append(next);

    return () => clearNode(next);
  }
};

const renderChildren = (parent, children) =>
  Array.isArray(children)
    ? children.forEach((child) => renderChild(parent, child))
    : renderChild(parent, children);

const createElement = ({ tag, ref, attributes, children }) => {
  if (typeof tag === "string") {
    const node =
      isHydrationEnabled && !hydrationFinished
        ? nodesToHydrate[hydrationId++]
        : SVG_ELEMENTS.has(tag)
        ? document.createElementNS(SVG_NAMESPACE, tag)
        : document.createElement(tag);

    let wasHydrated = !!ref;

    Object.entries(attributes).forEach(([name, value]) => {
      if (isHydrationEnabled && !node) return;

      if (name.startsWith("on")) {
        const _name = name.toLowerCase(),
          once = _name.includes("once"),
          capture = _name.includes("capture"),
          passive = _name.includes("passive"),
          noPassive = _name.includes("nopassive");

        node.addEventListener(
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

        isHydrationEnabled && !hydrationFinished && (wasHydrated = true);
      } else if (name === "class" && Array.isArray(value))
        value.forEach((name) =>
          typeof name === "string"
            ? node.classList.add(name)
            : Object.entries(name).forEach(([name, value]) => {
                const isFn = isFunction(value);

                isHydrationEnabled &&
                  !hydrationFinished &&
                  (wasHydrated ||= isFn);

                useImmediateEffect(() => {
                  const shouldClassBeAdded = isFn ? value() : value;

                  if (isHydrationEnabled && !hydrationFinished) return;

                  node.classList[shouldClassBeAdded ? "add" : "remove"](name);
                });
              })
        );
      else if (name === "style" && typeof value === "object")
        Object.entries(value ?? {}).forEach(([name, value]) => {
          const isFn = isFunction(value);

          isHydrationEnabled && !hydrationFinished && (wasHydrated ||= isFn);

          useImmediateEffect(() => {
            const propertyValue = isFn ? value() : value;

            if (isHydrationEnabled && !hydrationFinished) return;

            node.style.setProperty(name, propertyValue);
          });
        });
      else if (AttributesToProperties[tag]?.includes(name)) {
        isHydrationEnabled && !hydrationFinished && (wasHydrated = true);

        const get = isFunction(value) ? value : () => value;

        useImmediateEffect(() => {
          node[name] = get();
        });
      } else {
        const isFn = isFunction(value);

        isHydrationEnabled && !hydrationFinished && (wasHydrated ||= isFn);

        useImmediateEffect(() => {
          const result = isFn ? value() : value;

          if (isHydrationEnabled && !hydrationFinished) return;

          typeof result === "boolean"
            ? result
              ? node.setAttribute(name, "")
              : node.removeAttribute(name)
            : node.setAttribute(name, result);
        });
      }
    });

    isHydrationEnabled && !hydrationFinished && !wasHydrated && hydrationId--;

    renderChildren(node, children);

    ref?.(node);

    return node;
  }

  return useFree(() => tag({ ref, children, ...attributes }));
};

const createFragment = (children) => {
  const fragment = Object.assign(document.createDocumentFragment(), {
    __nodes: [],
  });

  renderChildren(fragment, children);

  return fragment;
};

export const render = (element) =>
  element instanceof Node
    ? element
    : isJSXCoreElement(element)
    ? element.tag === "fragment"
      ? createFragment(element.children)
      : render(createElement(element))
    : isFunction(element) || Array.isArray(element)
    ? createFragment(element)
    : document.createTextNode(element ?? "");

export const hydrate = (element, root = document.documentElement) => {
  if (isHydrationEnabled) {
    if (element == null) return;

    const isTopLevel = hydrationFinished == null;

    hydrationFinished = false;

    if (isTopLevel) {
      const startBlockRe = /^\/\d+$/,
        endBlockRe = /^\d+\/$/;

      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT + NodeFilter.SHOW_COMMENT,
        (node) =>
          (node.nodeType === Node.COMMENT_NODE &&
            (startBlockRe.test(node.textContent) ||
              endBlockRe.test(node.textContent))) ||
          (node.nodeType === Node.ELEMENT_NODE && node.hasAttribute("data-he"))
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP
      );

      while (walker.nextNode()) {
        const node = walker.currentNode;

        switch (node.nodeType) {
          case Node.ELEMENT_NODE: {
            nodesToHydrate[node.getAttribute("data-he")] = node;
            node.removeAttribute("data-he");
            break;
          }
          case Node.COMMENT_NODE:
            nodesToHydrate[node.textContent] = node;
        }
      }
    }

    isJSXCoreElement(element)
      ? element.tag === "fragment"
        ? createFragment(element.children)
        : hydrate(createElement(element))
      : isFunction(element) || Array.isArray(element)
      ? createFragment(element)
      : null;

    if (isTopLevel) {
      hydrationId = 0;
      nodesToHydrate = null;
      hydrationFinished = true;
    }
  }
};
