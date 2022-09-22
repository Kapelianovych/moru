import { context } from "./state.js";
import {
  SVG_ELEMENTS,
  SVG_NAMESPACE,
  AttributesToProperties,
} from "./constants.js";

const createNodeInjector = (to, holder) => (child) => {
  if (typeof child === "function") {
    context(function _self() {
      return createNodeInjector(to, _self)(child());
    });
  } else if (Array.isArray(child)) {
    createNodeInjector(to, holder)(Fragment({ children: child }));
  } else {
    const next =
      child instanceof Node ? child : document.createTextNode(child ?? "");

    if (holder?.__old) {
      if (holder.__old instanceof DocumentFragment) {
        holder.__old.append(...holder.__old.__nodes);
        holder.__old = holder.__old.__first;
      }

      holder.__old.replaceWith(next);
    } else {
      to.append(next);
    }

    holder && (holder.__old = next);
  }
};

const ensureFunction = (value) =>
  typeof value === "function" ? value : () => value;

const endsAt = (once, capture, passive, noPassive) =>
  0 +
  (once ? -4 : 0) +
  (capture ? -7 : 0) +
  (noPassive ? -9 : passive ? -7 : 0);

const objectWith = (property, value) =>
  value === null ? {} : { [property]: value };

const assignProperty = (element, key, value, toProperties = []) => {
  if (key.startsWith("on")) {
    const name = key.toLowerCase();

    const once = name.includes("once");
    const capture = name.includes("capture");
    const passive = name.includes("passive");
    const noPassive = name.includes("nopassive");

    element.addEventListener(
      name.slice(2, endsAt(once, capture, passive, noPassive) || name.length),
      value,
      {
        ...objectWith("once", once || null),
        ...objectWith("capture", capture || null),
        ...objectWith("passive", noPassive ? false : passive || null),
      }
    );
  } else if (key === "style" && typeof value === "object") {
    Object.entries(value ?? {}).forEach(([key, value]) => {
      if (key in element.style) {
        const get = ensureFunction(value);

        context(() => (element.style[key] = get()));
      }
    });
  } else if (key === "class" && Array.isArray(value)) {
    value.forEach((name) =>
      typeof name === "string"
        ? element.classList.add(name)
        : Object.entries(name).forEach(([key, value]) => {
            const get = ensureFunction(value);

            context(() => element.classList[get() ? "add" : "remove"](key));
          })
    );
  } else if (toProperties.includes(key)) {
    const get = ensureFunction(value);

    context(() => (element[key] = get()));
  } else {
    const get = ensureFunction(value);

    context(() => {
      const result = get();

      typeof result === "boolean"
        ? result
          ? element.setAttribute(key, "")
          : element.removeAttribute(key)
        : element.setAttribute(key, result);
    });
  }
};

export const element = (tag, properties, ...children) => {
  const { ref, ...elementProperties } = properties ?? {};

  if (typeof tag === "string") {
    const isSVG = SVG_ELEMENTS.has(tag);

    const node = isSVG
      ? document.createElementNS(SVG_NAMESPACE, tag)
      : document.createElement(tag);

    Object.entries(elementProperties).forEach(([key, value]) =>
      assignProperty(node, key, value, AttributesToProperties[tag])
    );

    children.forEach(createNodeInjector(node));

    ref && ref(node);

    return node;
  }

  return tag({ ref, children, ...elementProperties });
};

export const Fragment = ({ children }) => {
  const fragment = document.createDocumentFragment();

  children.forEach(createNodeInjector(fragment));

  const __nodes = Array.from(fragment.childNodes);

  const __first = document.createTextNode("");

  fragment.prepend(__first);

  return Object.assign(fragment, {
    __first,
    __nodes,
  });
};
