import { runInContext } from "./state.js";
import { ensureArray, ensureFunction } from "./utils.js";
import {
  SVG_ELEMENTS,
  SVG_NAMESPACE,
  AttributesToProperties,
} from "./constants.js";

const flattenFragmentChildren = (node) =>
  node instanceof DocumentFragment
    ? [node.__first, ...node.__nodes.flatMap(flattenFragmentChildren)]
    : node;

const createNodeInjector = (to, holder) => (child) => {
  if (typeof child === "function")
    runInContext(function _self() {
      createNodeInjector(to, _self)(child());
    });
  else if (Array.isArray(child))
    createNodeInjector(to, holder)(Fragment({ children: child }));
  else {
    const next =
      child instanceof Node ? child : document.createTextNode(child ?? "");

    if (next instanceof DocumentFragment && !next.__nodes)
      Object.assign(next, {
        __first: next.childNodes.item(0),
        __nodes: Array.from(next.childNodes).slice(1),
      });

    if (to instanceof DocumentFragment) to.__nodes.push(next);

    if (holder?.__old) {
      if (holder.__old instanceof DocumentFragment) {
        holder.__old.append(
          ...holder.__old.__nodes.flatMap(flattenFragmentChildren)
        );
        holder.__old = holder.__old.__first;
      }

      holder.__old.replaceWith(next);
    } else to.append(next);

    holder && (holder.__old = next);
  }
};

const endsAt = (once, capture, passive, noPassive) =>
  0 +
  (once ? -4 : 0) +
  (capture ? -7 : 0) +
  (noPassive ? -9 : passive ? -7 : 0);

const objectWith = (property, value) => (value ? { [property]: value } : {});

const assignAttribute = (element, key, value, asProperties = []) => {
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
        ...objectWith("once", once),
        ...objectWith("capture", capture),
        ...objectWith("passive", noPassive ? false : passive),
      }
    );
  } else if (key === "style" && typeof value === "object")
    Object.entries(value ?? {}).forEach(([key, value]) => {
      const get = ensureFunction(value);

      runInContext(() => element.style.setProperty(key, get()));
    });
  else if (key === "class" && Array.isArray(value))
    value.forEach((name) =>
      typeof name === "string"
        ? element.classList.add(name)
        : Object.entries(name).forEach(([key, value]) => {
            const get = ensureFunction(value);

            runInContext(() =>
              element.classList[get() ? "add" : "remove"](key)
            );
          })
    );
  else if (asProperties.includes(key)) {
    const get = ensureFunction(value);

    runInContext(() => (element[key] = get()));
  } else {
    const get = ensureFunction(value);

    runInContext(() => {
      const result = get();

      typeof result === "boolean"
        ? result
          ? element.setAttribute(key, "")
          : element.removeAttribute(key)
        : element.setAttribute(key, result);
    });
  }
};

export const element = (tag, { ref, children, ...attributes } = {}) => {
  if (typeof tag === "string") {
    const node = SVG_ELEMENTS.has(tag)
      ? document.createElementNS(SVG_NAMESPACE, tag)
      : document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) =>
      assignAttribute(node, key, value, AttributesToProperties[tag])
    );

    ensureArray(children).forEach(createNodeInjector(node));

    ref && ref(node);

    return node;
  }

  return tag({ ref, children, ...attributes });
};

export { element as jsx, element as jsxs, element as jsxDEV };

export const Fragment = ({ children }) => {
  const __first = document.createTextNode("");

  const fragment = Object.assign(document.createDocumentFragment(), {
    __first,
    __nodes: [],
  });

  ensureArray(children).forEach(createNodeInjector(fragment));

  fragment.prepend(__first);

  return fragment;
};
